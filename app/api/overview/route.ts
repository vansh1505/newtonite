import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem, IWorkItem } from '@/models/WorkItem';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { WorkItemEvent, IWorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser } from '@/lib/auth/session';
import { MOCK_WORK_ITEMS, MOCK_ACTIVITIES, MOCK_APPROVALS } from '@/lib/mock-data';

export async function GET() {
  const currentUser = await getCurrentUser();

  try {
    await connectToDatabase();

    const [
      openCount,
      inProgressCount,
      urgentCount,
      awaitingApprovalCount,
      needsAttentionDocs,
      myWorkDocs,
      recentEventDocs,
    ] = await Promise.all([
      WorkItem.countDocuments({ status: 'open' }),
      WorkItem.countDocuments({ status: 'in_progress' }),
      WorkItem.countDocuments({ priority: 'urgent' }),
      ApprovalRequest.countDocuments({ status: 'pending' }),
      WorkItem.find({ needsAttention: true }).sort({ updatedAt: -1 }).limit(5).lean<IWorkItem[]>(),
      WorkItem.find({ assigneeId: currentUser.id }).sort({ updatedAt: -1 }).limit(10).lean<IWorkItem[]>(),
      WorkItemEvent.find({}).sort({ timestamp: -1 }).limit(8).lean<IWorkItemEvent[]>(),
    ]);

    // Format events for client display
    const recentActivity = recentEventDocs.map((evt) => ({
      id: evt.id,
      user: evt.actorName,
      avatarInitials: evt.actorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      action: evt.action,
      target: evt.target,
      targetId: evt.workItemId,
      timestamp: new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: evt.type,
    }));

    return NextResponse.json({
      metrics: {
        openCount,
        inProgressCount,
        urgentCount,
        awaitingApprovalCount,
      },
      needsAttention: needsAttentionDocs,
      myWork: myWorkDocs,
      recentActivity,
      currentUser,
    });
  } catch {
    // If DB is offline, fallback to mock data
    return NextResponse.json({
      metrics: {
        openCount: MOCK_WORK_ITEMS.filter((i) => i.status === 'open').length,
        inProgressCount: MOCK_WORK_ITEMS.filter((i) => i.status === 'in_progress').length,
        urgentCount: MOCK_WORK_ITEMS.filter((i) => i.priority === 'urgent').length,
        awaitingApprovalCount: MOCK_APPROVALS.filter((a) => a.status === 'pending').length,
      },
      needsAttention: MOCK_WORK_ITEMS.filter((i) => i.needsAttention).slice(0, 3),
      myWork: MOCK_WORK_ITEMS.filter((i) => i.assignee.name === currentUser.name),
      recentActivity: MOCK_ACTIVITIES,
      currentUser,
    });
  }
}
