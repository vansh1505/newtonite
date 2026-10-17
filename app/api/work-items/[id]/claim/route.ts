import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem } from '@/models/WorkItem';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser } from '@/lib/auth/session';

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    await connectToDatabase();

    // Check if the work item exists
    const current = await WorkItem.findOne({ id });
    if (!current) {
      return NextResponse.json({ error: `Work item ${id} not found` }, { status: 404 });
    }

    // Check if it is already claimed by the same user
    if (current.assigneeId === user.id) {
      return NextResponse.json({
        success: true,
        item: current,
        message: 'You already own this work item.',
      });
    }

    // Atomic conditional claim: only succeeds if assigneeId is null or Unassigned
    const updated = await WorkItem.findOneAndUpdate(
      {
        id,
        $or: [{ assigneeId: null }, { 'assignee.name': 'Unassigned' }],
      },
      {
        $set: {
          assigneeId: user.id,
          assignee: {
            name: user.name,
            email: user.email,
            avatarInitials: user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          },
          status: current.status === 'open' ? 'in_progress' : current.status,
          claimedAt: new Date(),
          updatedAt: new Date(),
        },
        $inc: { version: 1 },
      },
      { returnDocument: 'after' }
    );

    // If update returned null, another user raced and claimed it first!
    if (!updated) {
      const refreshed = await WorkItem.findOne({ id });

      // Audit conflict in event timeline
      await WorkItemEvent.create({
        id: `evt-${Date.now()}`,
        workItemId: id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        type: 'conflict_rejected',
        action: 'claim collision: attempted to claim already claimed item',
        target: `${id} (Owned by ${refreshed?.assignee.name})`,
        details: {
          racedWith: refreshed?.assignee.name,
          attemptedBy: user.name,
        },
        timestamp: new Date(),
      });

      return NextResponse.json(
        {
          error: `Claim Conflict: Work item ${id} was already claimed by ${refreshed?.assignee.name || 'another operator'}.`,
          code: 'CLAIM_RACE_LOST',
          currentAssignee: refreshed?.assignee.name,
          claimedAt: refreshed?.claimedAt,
          item: refreshed,
        },
        { status: 409 }
      );
    }

    // Record successful claim audit event
    await WorkItemEvent.create({
      id: `evt-${Date.now()}`,
      workItemId: id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      type: 'claimed',
      action: 'claimed ownership of',
      target: `${id} (${updated.title})`,
      details: {
        previousAssignee: current.assignee.name,
        newAssignee: user.name,
        newVersion: updated.version,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Work item ${id} successfully claimed by ${user.name}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to claim work item', details: String(error) },
      { status: 500 }
    );
  }
}
