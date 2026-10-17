import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem, IWorkItem } from '@/models/WorkItem';
import { WorkItemEvent, IWorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser } from '@/lib/auth/session';
import { getWorkItemById, MOCK_ACTIVITIES } from '@/lib/mock-data';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  try {
    await connectToDatabase();

    const [item, events] = await Promise.all([
      WorkItem.findOne({ id }).lean<IWorkItem>(),
      WorkItemEvent.find({ workItemId: id }).sort({ timestamp: -1 }).lean<IWorkItemEvent[]>(),
    ]);

    if (!item) {
      const fallback = getWorkItemById(id);
      return NextResponse.json({
        item: fallback,
        events: MOCK_ACTIVITIES.filter((a) => a.targetId === id),
      });
    }

    return NextResponse.json({
      item,
      events,
    });
  } catch {
    const fallback = getWorkItemById(id);
    return NextResponse.json({
      item: fallback,
      events: MOCK_ACTIVITIES.filter((a) => a.targetId === id),
    });
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      version,
      title,
      description,
      reason,
      priority,
      team,
      assigneeName,
      status,
    } = body;

    // Check current item for Optimistic Concurrency Control (OCC)
    const current = await WorkItem.findOne({ id });
    if (!current) {
      return NextResponse.json({ error: `Work item ${id} not found` }, { status: 404 });
    }

    // OCC Check: Client submitted version must match database version
    if (typeof version === 'number' && current.version !== version) {
      // Record conflict attempt in event log for auditing
      await WorkItemEvent.create({
        id: `evt-${Date.now()}`,
        workItemId: id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        type: 'conflict_rejected',
        action: 'rejected stale edit due to concurrent modification on',
        target: `${id} (${current.title})`,
        details: {
          clientVersion: version,
          databaseVersion: current.version,
          attemptedBy: user.name,
        },
        timestamp: new Date(),
      });

      return NextResponse.json(
        {
          error:
            'Stale Data Conflict: Another operator modified this work item while you were viewing it. Please reload the latest changes before saving.',
          code: 'STALE_DATA_CONFLICT',
          clientVersion: version,
          currentVersion: current.version,
          currentData: current,
        },
        { status: 409 }
      );
    }

    // Build atomic update payload
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (reason) updates.reason = reason.trim();
    if (priority) {
      updates.priority = priority;
      updates.needsAttention = priority === 'urgent';
    }
    if (team) updates.team = team;
    if (status) updates.status = status;

    if (assigneeName !== undefined) {
      const isAssigned = assigneeName !== 'Unassigned';
      updates['assignee.name'] = assigneeName;
      updates['assignee.email'] = isAssigned
        ? `${assigneeName.toLowerCase().replace(' ', '.')}@newtonite.internal`
        : '';
      updates['assignee.avatarInitials'] = isAssigned
        ? assigneeName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'UA';
      if (!isAssigned) {
        updates.assigneeId = null;
        updates.claimedAt = null;
      }
    }

    // Atomically update and increment version
    const updated = await WorkItem.findOneAndUpdate(
      { id, version: current.version },
      {
        $set: updates,
        $inc: { version: 1 },
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json(
        {
          error: 'Concurrent modification conflict: Work item was updated right as you saved.',
          code: 'STALE_DATA_CONFLICT',
          currentVersion: current.version,
        },
        { status: 409 }
      );
    }

    // Record audit event
    await WorkItemEvent.create({
      id: `evt-${Date.now()}`,
      workItemId: id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      type: 'edited',
      action: 'updated work item fields on',
      target: `${id} (${updated.title})`,
      details: {
        newVersion: updated.version,
        changedFields: Object.keys(updates),
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Work item ${id} updated to version ${updated.version}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work item', details: String(error) },
      { status: 500 }
    );
  }
}
