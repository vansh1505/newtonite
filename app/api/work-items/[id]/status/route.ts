import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem, WorkItemStatus } from '@/models/WorkItem';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { getCurrentUser } from '@/lib/auth/session';
import { validateStatusTransition } from '@/lib/workflow';

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    await connectToDatabase();
    const body = await request.json();
    const { targetStatus, reason } = body as { targetStatus: WorkItemStatus; reason?: string };

    if (!targetStatus) {
      return NextResponse.json({ error: 'targetStatus is required' }, { status: 400 });
    }

    const current = await WorkItem.findOne({ id });
    if (!current) {
      return NextResponse.json({ error: `Work item ${id} not found` }, { status: 404 });
    }

    // Check if an approved sign-off exists for this item
    const approvedRequest = await ApprovalRequest.findOne({
      workItemId: id,
      status: 'approved',
    });

    const validation = validateStatusTransition(
      current.status,
      targetStatus,
      Boolean(approvedRequest),
      user
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.reason,
          code: 'WORKFLOW_VIOLATION',
          currentStatus: current.status,
          targetStatus,
        },
        { status: 400 }
      );
    }

    // If moving to awaiting_approval, generate an approval request
    if (targetStatus === 'awaiting_approval') {
      const existingPending = await ApprovalRequest.findOne({
        workItemId: id,
        status: 'pending',
      });

      if (!existingPending) {
        await ApprovalRequest.create({
          id: `APP-${Date.now().toString().slice(-4)}`,
          workItemId: id,
          workItemTitle: current.title,
          requestedBy: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
          team: current.team,
          requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'pending',
          type: reason || 'Operational Status Sign-off',
          impactLevel: current.priority === 'urgent' ? 'High' : 'Medium',
        });
      }
    }

    // Update work item status and increment version
    const updated = await WorkItem.findOneAndUpdate(
      { id, version: current.version },
      {
        $set: {
          status: targetStatus,
          updatedAt: new Date(),
          needsAttention: targetStatus === 'awaiting_approval' || current.priority === 'urgent',
        },
        $inc: { version: 1 },
      },
      { returnDocument: 'after' }
    );

    // Audit the transition
    await WorkItemEvent.create({
      id: `evt-${Date.now()}`,
      workItemId: id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      type: 'status_change',
      action: `transitioned status from ${current.status} to ${targetStatus} on`,
      target: `${id} (${current.title})`,
      details: {
        previousStatus: current.status,
        newStatus: targetStatus,
        reason: reason || 'Direct operator action',
        newVersion: updated?.version,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Status moved to ${targetStatus}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update status', details: String(error) },
      { status: 500 }
    );
  }
}
