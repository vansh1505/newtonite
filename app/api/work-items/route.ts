import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem, IWorkItem } from '@/models/WorkItem';
import { WorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser } from '@/lib/auth/session';
import { handleWithIdempotency } from '@/lib/idempotency';
import { MOCK_WORK_ITEMS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const team = searchParams.get('team');
  const assignee = searchParams.get('assignee');
  const view = searchParams.get('view');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '15', 10)));

  const currentUser = await getCurrentUser();

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    // Preset views
    if (view === 'assigned') {
      filter['assignee.name'] = currentUser.name;
    } else if (view === 'urgent') {
      filter.priority = 'urgent';
      filter.assigneeId = null;
    }

    // Explicit query filters
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (team && team !== 'all') {
      filter.team = team;
    }
    if (assignee && assignee !== 'all') {
      if (assignee === 'Unassigned') {
        filter.assigneeId = null;
      } else {
        filter['assignee.name'] = assignee;
      }
    }

    // Text search
    if (q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { id: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WorkItem.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean<IWorkItem[]>(),
      WorkItem.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch {
    // Graceful fallback to in-memory mock if DB not yet started
    let items = [...MOCK_WORK_ITEMS];
    if (view === 'assigned') {
      items = items.filter((i) => i.assignedToCurrentUser);
    } else if (view === 'urgent') {
      items = items.filter((i) => i.priority === 'urgent' && i.assignee.name === 'Unassigned');
    }
    if (status && status !== 'all') items = items.filter((i) => i.status === status);
    if (priority && priority !== 'all') items = items.filter((i) => i.priority === priority);
    if (team && team !== 'all') items = items.filter((i) => i.team === team);
    if (assignee && assignee !== 'all') {
      items = items.filter((i) => i.assignee.name === assignee);
    }
    if (q.trim()) {
      const query = q.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.id.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    });
  }
}

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key');
  const user = await getCurrentUser();

  return handleWithIdempotency(idempotencyKey, '/api/work-items', async () => {
    await connectToDatabase();
    const body = await request.json();

    const {
      title,
      description,
      reason,
      priority = 'medium',
      team = 'Platform Ops',
      assigneeName = 'Unassigned',
      status = 'open',
    } = body;

    if (!title || !description || !reason) {
      return {
        status: 400,
        body: { error: 'Validation failed: title, description, and reason are required' },
      };
    }

    // Generate readable ID
    const count = await WorkItem.countDocuments({});
    const newId = `WI-${1050 + count}`;

    const isUrgent = priority === 'urgent';
    const isAssigned = assigneeName !== 'Unassigned';

    const workItem = await WorkItem.create({
      id: newId,
      title: title.trim(),
      description: description.trim(),
      reason: reason.trim(),
      priority,
      status,
      team,
      assignee: {
        name: assigneeName,
        email: isAssigned ? `${assigneeName.toLowerCase().replace(' ', '.')}@newtonite.internal` : '',
        avatarInitials: isAssigned
          ? assigneeName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'UA',
      },
      assigneeId: isAssigned ? user.id : null,
      claimedAt: isAssigned ? new Date() : null,
      version: 1,
      idempotencyKey: idempotencyKey || null,
      needsAttention: isUrgent,
      requiresApproval: false,
    });

    // Record audit event
    await WorkItemEvent.create({
      id: `evt-${Date.now()}`,
      workItemId: newId,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      type: 'created',
      action: 'created work item',
      target: `${newId} (${workItem.title})`,
      details: { priority, team, status, assignee: assigneeName },
      timestamp: new Date(),
    });

    return {
      status: 201,
      body: {
        success: true,
        item: workItem,
        message: `Work item ${newId} created successfully`,
      },
    };
  });
}
