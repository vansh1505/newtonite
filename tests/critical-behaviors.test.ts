import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { WorkItem } from '@/models/WorkItem';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { IdempotencyRecord } from '@/models/IdempotencyRecord';
import { handleWithIdempotency } from '@/lib/idempotency';
import { validateStatusTransition } from '@/lib/workflow';
import { canApproveWorkItem, AuthContext } from '@/lib/auth/session';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}, 60000);

beforeEach(async () => {
  await WorkItem.deleteMany({});
  await ApprovalRequest.deleteMany({});
  await WorkItemEvent.deleteMany({});
  await IdempotencyRecord.deleteMany({});
});

describe('Critical Behavior 1: Atomic Claim & Race Condition Protection', () => {
  it('prevents two operators from claiming the same unassigned work item concurrently', async () => {
    // Setup unassigned urgent work item
    const item = await WorkItem.create({
      id: 'WI-RACE-01',
      title: 'Database connection pool saturation',
      description: 'Connection pool exhausted on replica 2',
      reason: 'Alert fired: connections > 95%',
      priority: 'urgent',
      status: 'open',
      team: 'Platform Ops',
      assignee: { name: 'Unassigned', email: '', avatarInitials: 'UA' },
      assigneeId: null,
      version: 1,
      needsAttention: true,
      requiresApproval: false,
    });

    const operatorA: AuthContext = {
      id: 'usr-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      role: 'Admin',
      team: 'Platform Ops',
    };

    const operatorB: AuthContext = {
      id: 'usr-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@newtonite.internal',
      role: 'Manager',
      team: 'Customer Support Ops',
    };

    // Atomic claim helper matching API implementation
    async function executeClaim(op: AuthContext) {
      const updated = await WorkItem.findOneAndUpdate(
        {
          id: item.id,
          $or: [{ assigneeId: null }, { 'assignee.name': 'Unassigned' }],
        },
        {
          $set: {
            assigneeId: op.id,
            assignee: {
              name: op.name,
              email: op.email,
              avatarInitials: op.name.slice(0, 2).toUpperCase(),
            },
            status: 'in_progress',
            claimedAt: new Date(),
          },
          $inc: { version: 1 },
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        const current = await WorkItem.findOne({ id: item.id });
        return { success: false, status: 409, currentAssignee: current?.assignee.name };
      }
      return { success: true, status: 200, item: updated };
    }

    // Execute both claims simultaneously
    const [resultA, resultB] = await Promise.all([
      executeClaim(operatorA),
      executeClaim(operatorB),
    ]);

    const successes = [resultA, resultB].filter((r) => r.success);
    const conflicts = [resultA, resultB].filter((r) => !r.success);

    // Exactly one must succeed, and exactly one must receive a 409 conflict
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].status).toBe(409);

    // Verify database state: version incremented by exactly 1, exactly one owner recorded
    const finalItem = await WorkItem.findOne({ id: item.id });
    expect(finalItem).not.toBeNull();
    expect(finalItem?.version).toBe(2);
    expect(['Alex Rivera', 'Sarah Chen']).toContain(finalItem?.assignee.name);
  });
});

describe('Critical Behavior 2: Optimistic Concurrency Control (OCC) / Stale Data Handling', () => {
  it('rejects an update if client submits an outdated version number', async () => {
    // Setup work item at version 1
    const item = await WorkItem.create({
      id: 'WI-OCC-01',
      title: 'Customer webhook timeouts',
      description: 'Webhook delivery failing',
      reason: 'Support escalation',
      priority: 'high',
      status: 'open',
      team: 'Customer Support Ops',
      assignee: { name: 'Sarah Chen', email: 'sarah@newtonite.internal', avatarInitials: 'SC' },
      assigneeId: 'usr-2',
      version: 1,
      needsAttention: false,
      requiresApproval: false,
    });

    // Operator A reads item at version 1 and updates priority to urgent -> bumps DB to version 2
    const opAUpdate = await WorkItem.findOneAndUpdate(
      { id: item.id, version: 1 },
      { $set: { priority: 'urgent', needsAttention: true }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );
    expect(opAUpdate?.version).toBe(2);

    // Operator B was viewing version 1 and attempts to save changes with clientVersion = 1
    const opBAttempt = await WorkItem.findOneAndUpdate(
      { id: item.id, version: 1 }, // Stale version check!
      { $set: { description: 'Operator B modified description' }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );

    // Operator B's update MUST be rejected because DB is now at version 2
    expect(opBAttempt).toBeNull();

    // Verify DB still holds Operator A's changes and version 2
    const current = await WorkItem.findOne({ id: item.id });
    expect(current?.version).toBe(2);
    expect(current?.priority).toBe('urgent');
    expect(current?.description).toBe('Webhook delivery failing');
  });
});

describe('Critical Behavior 3: Idempotency & Duplicate Operation Prevention', () => {
  it('deduplicates repeated requests with the same idempotency key', async () => {
    const idempotencyKey = 'idemp-req-unique-999';
    let executionCount = 0;

    const mockAction = async () => {
      executionCount++;
      return {
        status: 201,
        body: { id: 'WI-DEDUP-01', message: 'Item created' },
      };
    };

    // First request executes primary logic
    const firstResponse = await handleWithIdempotency(idempotencyKey, '/api/work-items', mockAction);
    const firstBody = await firstResponse.json();
    expect(firstResponse.status).toBe(201);
    expect(firstBody.id).toBe('WI-DEDUP-01');
    expect(executionCount).toBe(1);

    // Second repeated request with identical key (simulating network retry or double-click)
    const secondResponse = await handleWithIdempotency(idempotencyKey, '/api/work-items', mockAction);
    const secondBody = await secondResponse.json();
    expect(secondResponse.status).toBe(201);
    expect(secondBody.id).toBe('WI-DEDUP-01');
    expect(secondResponse.headers.get('X-Idempotent-Replay')).toBe('true');

    // The handler must NOT have executed a second time
    expect(executionCount).toBe(1);
  });
});

describe('Critical Behavior 4: Workflow State Machine Rule Enforcement', () => {
  const memberUser: AuthContext = {
    id: 'usr-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@newtonite.internal',
    role: 'Member',
    team: 'Infrastructure',
  };

  const adminUser: AuthContext = {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@newtonite.internal',
    role: 'Admin',
    team: 'Platform Ops',
  };

  it('rejects jumping from open directly to resolved without investigation', () => {
    const check = validateStatusTransition('open', 'resolved', false, memberUser);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('Invalid state transition');
  });

  it('blocks resolving an item in awaiting_approval if signoff is not granted', () => {
    const check = validateStatusTransition('awaiting_approval', 'resolved', false, memberUser);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('Governance policy');
  });

  it('permits resolving an item in awaiting_approval once signoff is approved', () => {
    const check = validateStatusTransition('awaiting_approval', 'resolved', true, memberUser);
    expect(check.valid).toBe(true);
  });

  it('forbids a regular Member from reopening a resolved work item', () => {
    const check = validateStatusTransition('resolved', 'in_progress', false, memberUser);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('Authorization restriction');
  });

  it('permits an Admin to reopen a resolved work item', () => {
    const check = validateStatusTransition('resolved', 'in_progress', false, adminUser);
    expect(check.valid).toBe(true);
  });
});

describe('Critical Behavior 5: Resource-Level Role-Based Authorization', () => {
  it('forbids a Member from approving governance sign-offs', () => {
    const member: AuthContext = {
      id: 'usr-4',
      name: 'Marcus Vance',
      email: 'marcus.vance@newtonite.internal',
      role: 'Member',
      team: 'Infrastructure',
    };
    expect(canApproveWorkItem(member)).toBe(false);
  });

  it('permits Managers and Admins to approve governance sign-offs', () => {
    const manager: AuthContext = {
      id: 'usr-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@newtonite.internal',
      role: 'Manager',
      team: 'Customer Support Ops',
    };
    const admin: AuthContext = {
      id: 'usr-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      role: 'Admin',
      team: 'Platform Ops',
    };

    expect(canApproveWorkItem(manager)).toBe(true);
    expect(canApproveWorkItem(admin)).toBe(true);
  });
});
