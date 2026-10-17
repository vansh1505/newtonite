import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { WorkItem } from '@/models/WorkItem';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser, canApproveWorkItem } from '@/lib/auth/session';

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    await connectToDatabase();
    const body = await request.json();
    const { decision, reason } = body as { decision: 'approved' | 'rejected'; reason?: string };

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json(
        { error: 'Valid decision ("approved" or "rejected") is required' },
        { status: 400 }
      );
    }

    // 1. Resource-level Authorization Check: Only Admin or Manager can approve
    if (!canApproveWorkItem(user)) {
      return NextResponse.json(
        {
          error:
            'Authorization Error: Regular Members cannot sign off on operational approvals. Only Managers and Admins are permitted.',
          code: 'UNAUTHORIZED_ROLE',
          userRole: user.role,
        },
        { status: 403 }
      );
    }

    const approval = await ApprovalRequest.findOne({ id });
    if (!approval) {
      return NextResponse.json({ error: `Approval request ${id} not found` }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Request ${id} was already decided as ${approval.status}`,
          status: approval.status,
        },
        { status: 409 }
      );
    }

    // 2. Separation of Concerns Rule: Requester cannot approve their own request
    if (approval.requestedBy.email === user.email && user.role !== 'Admin') {
      return NextResponse.json(
        {
          error:
            'Separation of Concerns: Operators cannot sign off on their own elevation or maintenance requests.',
          code: 'SELF_APPROVAL_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Update approval status
    approval.status = decision;
    approval.decidedBy = {
      name: user.name,
      email: user.email,
      role: user.role,
    };
    approval.decidedAt = new Date();
    approval.decisionReason = reason || null;
    await approval.save();

    // If approved, update associated work item if it was blocked or awaiting approval
    if (decision === 'approved') {
      await WorkItem.findOneAndUpdate(
        { id: approval.workItemId, status: 'awaiting_approval' },
        {
          $set: { status: 'in_progress', updatedAt: new Date(), needsAttention: false },
          $inc: { version: 1 },
        }
      );
    }

    // Record audit event
    await WorkItemEvent.create({
      id: `evt-${Date.now()}`,
      workItemId: approval.workItemId,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      type: decision === 'approved' ? 'approved' : 'rejected',
      action: `${decision} request ${id} for`,
      target: `${approval.workItemId} (${approval.workItemTitle})`,
      details: {
        approvalId: id,
        decision,
        reason: reason || 'Approved via control plane',
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      approval,
      message: `Approval request ${id} was ${decision} by ${user.name}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record decision', details: String(error) },
      { status: 500 }
    );
  }
}
