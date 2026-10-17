import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { WorkItem } from '@/models/WorkItem';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { hashPassword } from '@/lib/auth/password';

export const SEED_USERS = [
  {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@newtonite.internal',
    password: hashPassword('password123'),
    role: 'Admin',
    team: 'Platform Ops',
    status: 'Active',
    avatarInitials: 'AR',
  },
  {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@newtonite.internal',
    password: hashPassword('password123'),
    role: 'Manager',
    team: 'Customer Support Ops',
    status: 'Active',
    avatarInitials: 'SC',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@newtonite.internal',
    password: hashPassword('password123'),
    role: 'Manager',
    team: 'Security & Compliance',
    status: 'Active',
    avatarInitials: 'ER',
  },
  {
    id: 'usr-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@newtonite.internal',
    password: hashPassword('password123'),
    role: 'Member',
    team: 'Infrastructure',
    status: 'Active',
    avatarInitials: 'MV',
  },
  {
    id: 'usr-5',
    name: 'David Kim',
    email: 'david.kim@newtonite.internal',
    password: hashPassword('password123'),
    role: 'Manager',
    team: 'Billing & Finance Ops',
    status: 'Active',
    avatarInitials: 'DK',
  },
  {
    id: 'usr-6',
    name: 'Rachel Adams',
    email: 'rachel.adams@newtonite.internal',
    password: hashPassword('password123'),
    team: 'Platform Ops',
    role: 'Member',
    status: 'Active',
    avatarInitials: 'RA',
  },
  {
    id: 'usr-7',
    name: 'Liam Patel',
    email: 'liam.patel@newtonite.internal',
    password: hashPassword('password123'),
    team: 'Customer Support Ops',
    role: 'Member',
    status: 'On Leave',
    avatarInitials: 'LP',
  },
  {
    id: 'usr-8',
    name: 'Tanya Gomez',
    email: 'tanya.gomez@newtonite.internal',
    password: hashPassword('password123'),
    team: 'Security & Compliance',
    role: 'Member',
    status: 'Active',
    avatarInitials: 'TG',
  },
];

export const SEED_TEAMS = [
  {
    id: 'team-platform',
    name: 'Platform Ops',
    lead: 'Alex Rivera',
    memberCount: 8,
    openItemsCount: 14,
    description: 'Core runtime stability, cluster maintenance, and deployment pipelines.',
  },
  {
    id: 'team-security',
    name: 'Security & Compliance',
    lead: 'Elena Rostova',
    memberCount: 5,
    openItemsCount: 6,
    description: 'Vulnerability assessment, policy enforcement, and audit readiness.',
  },
  {
    id: 'team-support',
    name: 'Customer Support Ops',
    lead: 'Sarah Chen',
    memberCount: 12,
    openItemsCount: 19,
    description: 'Tier-2 and Tier-3 ticket escalation and client anomaly triage.',
  },
  {
    id: 'team-billing',
    name: 'Billing & Finance Ops',
    lead: 'David Kim',
    memberCount: 4,
    openItemsCount: 5,
    description: 'Payment reconciliation, invoice anomaly audits, and ledger balance.',
  },
  {
    id: 'team-infra',
    name: 'Infrastructure',
    lead: 'Marcus Vance',
    memberCount: 6,
    openItemsCount: 8,
    description: 'Cloud network routing, DB sharding, and edge compute capacity.',
  },
];

export const SEED_WORK_ITEMS = [
  {
    id: 'WI-1042',
    title: 'Database index rebuild on primary transaction cluster',
    description: 'Post-migration query degradation detected on postgres-main-02. Vacuum and full index rebuild required during maintenance window.',
    reason: 'Alert triggered: P99 latency on checkout queries exceeded SLA threshold of 250ms for 3 consecutive intervals.',
    priority: 'urgent',
    status: 'in_progress',
    team: 'Platform Ops',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    assigneeId: 'usr-1',
    claimedAt: new Date('2026-10-17T14:30:00Z'),
    version: 1,
    needsAttention: true,
    requiresApproval: true,
  },
  {
    id: 'WI-1043',
    title: 'Enterprise webhook delivery failures for tenant Acrolinx',
    description: 'Outbound webhook events failing with TLS handshake timeout. Requires investigation of egress proxy cert pinning.',
    reason: 'Reported by account manager: Acrolinx webhook endpoint is dropping 42% of order sync events.',
    priority: 'urgent',
    status: 'open',
    team: 'Customer Support Ops',
    assignee: {
      name: 'Unassigned',
      email: '',
      avatarInitials: 'UA',
    },
    assigneeId: null,
    claimedAt: null,
    version: 1,
    needsAttention: true,
    requiresApproval: false,
  },
  {
    id: 'WI-1044',
    title: 'TLS wildcard certificate renewal for api.newtonite.internal',
    description: 'Existing wildcard cert expires in 9 days. Need manual key issuance approval and distribution across edge ingress proxies.',
    reason: 'Automated certificate lifecycle check raised warning expiring within 14 days.',
    priority: 'high',
    status: 'awaiting_approval',
    team: 'Security & Compliance',
    assignee: {
      name: 'Elena Rostova',
      email: 'elena.rostova@newtonite.internal',
      avatarInitials: 'ER',
    },
    assigneeId: 'usr-3',
    claimedAt: new Date('2026-10-17T13:30:00Z'),
    version: 1,
    needsAttention: true,
    requiresApproval: true,
  },
  {
    id: 'WI-1045',
    title: 'Billing invoice discrepancy audit for Q3 enterprise accounts',
    description: 'Monthly tax calculation rounding discrepancy between Stripe webhooks and NetSuite general ledger.',
    reason: 'Finance quarterly reconciliation flagged $1,420 delta in recurring enterprise subscription taxes.',
    priority: 'medium',
    status: 'in_progress',
    team: 'Billing & Finance Ops',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    assigneeId: 'usr-1',
    claimedAt: new Date('2026-10-17T11:30:00Z'),
    version: 1,
    needsAttention: false,
    requiresApproval: false,
  },
  {
    id: 'WI-1046',
    title: 'Rate limiting threshold update for v2 ingestion endpoints',
    description: 'Adjust tier-1 API consumer token bucket from 2,000 req/min to 3,500 req/min to accommodate traffic spike.',
    reason: 'Enterprise partner data ingestion job throttled during peak daily sync windows.',
    priority: 'medium',
    status: 'open',
    team: 'Platform Ops',
    assignee: {
      name: 'Rachel Adams',
      email: 'rachel.adams@newtonite.internal',
      avatarInitials: 'RA',
    },
    assigneeId: 'usr-6',
    claimedAt: new Date('2026-10-17T08:00:00Z'),
    version: 1,
    needsAttention: false,
    requiresApproval: false,
  },
  {
    id: 'WI-1047',
    title: 'Migrate legacy worker queues to unified event bus',
    description: 'Decommission Redis Celery workers and route background jobs through Kafka partition topic ops.tasks.v1.',
    reason: 'Technical debt reduction project to eliminate Redis memory bloat and job loss during restarts.',
    priority: 'low',
    status: 'blocked',
    team: 'Infrastructure',
    assignee: {
      name: 'Marcus Vance',
      email: 'marcus.vance@newtonite.internal',
      avatarInitials: 'MV',
    },
    assigneeId: 'usr-4',
    claimedAt: new Date('2026-10-16T18:00:00Z'),
    version: 1,
    needsAttention: false,
    requiresApproval: false,
  },
  {
    id: 'WI-1048',
    title: 'Permission elevation audit for staging database access',
    description: 'Temporary DB access requested by contractor for analytics query optimization.',
    reason: 'Access request requires Manager signoff and automatic 48-hour expiration policy verification.',
    priority: 'high',
    status: 'awaiting_approval',
    team: 'Security & Compliance',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    assigneeId: 'usr-1',
    claimedAt: new Date('2026-10-17T06:00:00Z'),
    version: 1,
    needsAttention: true,
    requiresApproval: true,
  },
  {
    id: 'WI-1049',
    title: 'Security patch deployment on payment gateway nodes',
    description: 'Apply OpenSSL upstream CVE patch and verify non-disruptive rolling restart across proxy tier.',
    reason: 'Vendor security advisory CVE-2026-3819 severity rating High.',
    priority: 'urgent',
    status: 'open',
    team: 'Security & Compliance',
    assignee: {
      name: 'Unassigned',
      email: '',
      avatarInitials: 'UA',
    },
    assigneeId: null,
    claimedAt: null,
    version: 1,
    needsAttention: true,
    requiresApproval: false,
  },
];

export const SEED_APPROVALS = [
  {
    id: 'APP-501',
    workItemId: 'WI-1044',
    workItemTitle: 'TLS wildcard certificate renewal for api.newtonite.internal',
    requestedBy: {
      name: 'Elena Rostova',
      email: 'elena.rostova@newtonite.internal',
      role: 'Security Manager',
    },
    team: 'Security & Compliance',
    requestDate: '2026-10-17 15:30',
    status: 'pending',
    type: 'Cert Renewal / Root Auth',
    impactLevel: 'High',
  },
  {
    id: 'APP-502',
    workItemId: 'WI-1048',
    workItemTitle: 'Permission elevation audit for staging database access',
    requestedBy: {
      name: 'Tanya Gomez',
      email: 'tanya.gomez@newtonite.internal',
      role: 'Security Analyst',
    },
    team: 'Security & Compliance',
    requestDate: '2026-10-17 09:30',
    status: 'pending',
    type: 'Access Elevation',
    impactLevel: 'Medium',
  },
  {
    id: 'APP-503',
    workItemId: 'WI-1042',
    workItemTitle: 'Database index rebuild on primary transaction cluster',
    requestedBy: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      role: 'Platform Ops Admin',
    },
    team: 'Platform Ops',
    requestDate: '2026-10-16 20:15',
    status: 'pending',
    type: 'Maintenance Window Outage',
    impactLevel: 'High',
  },
];

export const SEED_EVENTS = [
  {
    id: 'evt-1',
    workItemId: 'WI-1042',
    actorName: 'Alex Rivera',
    actorEmail: 'alex.rivera@newtonite.internal',
    actorRole: 'Admin',
    type: 'status_change',
    action: 'changed status to In Progress on',
    target: 'WI-1042 (Database index rebuild)',
    details: { previousStatus: 'open', newStatus: 'in_progress' },
    timestamp: new Date('2026-10-17T15:12:00Z'),
  },
  {
    id: 'evt-2',
    workItemId: 'WI-1043',
    actorName: 'Sarah Chen',
    actorEmail: 'sarah.chen@newtonite.internal',
    actorRole: 'Manager',
    type: 'priority_change',
    action: 'flagged as Urgent',
    target: 'WI-1043 (Acrolinx webhook failures)',
    details: { priority: 'urgent' },
    timestamp: new Date('2026-10-17T14:30:00Z'),
  },
  {
    id: 'evt-3',
    workItemId: 'WI-1044',
    actorName: 'Elena Rostova',
    actorEmail: 'elena.rostova@newtonite.internal',
    actorRole: 'Manager',
    type: 'created',
    action: 'submitted approval request for',
    target: 'WI-1044 (TLS wildcard certificate renewal)',
    details: { requestId: 'APP-501' },
    timestamp: new Date('2026-10-17T13:30:00Z'),
  },
];

import mongoose from 'mongoose';

let isSeeding = false;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isSeeding) return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (!mongoose.connection || mongoose.connection.readyState < 1) return;
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    isSeeding = true;
    console.log('[Auto-Seed] Empty database detected. Seeding Newtonite Ops default dataset...');

    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      WorkItem.deleteMany({}),
      ApprovalRequest.deleteMany({}),
      WorkItemEvent.deleteMany({}),
    ]);

    await Promise.all([
      User.insertMany(SEED_USERS),
      Team.insertMany(SEED_TEAMS),
      WorkItem.insertMany(SEED_WORK_ITEMS),
      ApprovalRequest.insertMany(SEED_APPROVALS),
      WorkItemEvent.insertMany(SEED_EVENTS),
    ]);

    console.log('[Auto-Seed] Database successfully seeded with default operators, teams, and work items.');
  } catch (err) {
    console.warn('[Auto-Seed] Auto-seed skipped or failed:', err);
  } finally {
    isSeeding = false;
  }
}
