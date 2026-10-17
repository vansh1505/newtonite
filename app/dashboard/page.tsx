import React from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import connectToDatabase from '@/lib/db/mongodb';
import { WorkItem, IWorkItem } from '@/models/WorkItem';
import { ApprovalRequest } from '@/models/ApprovalRequest';
import { WorkItemEvent, IWorkItemEvent } from '@/models/WorkItemEvent';
import { getCurrentUser } from '@/lib/auth/session';
import {
  MOCK_WORK_ITEMS,
  MOCK_ACTIVITIES,
  MOCK_APPROVALS,
} from '@/lib/mock-data';
import {
  InboxIcon,
  ClockIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  PlusIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from '@/components/ui/Icons';

export const metadata = {
  title: 'Overview - Newtonite Ops',
};

export const instant = false;

export default async function DashboardOverviewPage() {
  const currentUser = await getCurrentUser();

  let openCount = MOCK_WORK_ITEMS.filter((i) => i.status === 'open').length;
  let inProgressCount = MOCK_WORK_ITEMS.filter((i) => i.status === 'in_progress').length;
  let urgentCount = MOCK_WORK_ITEMS.filter((i) => i.priority === 'urgent').length;
  let awaitingApprovalCount = MOCK_APPROVALS.filter((a) => a.status === 'pending').length;

  let needsAttentionItems = MOCK_WORK_ITEMS.filter((i) => i.needsAttention).slice(0, 3);
  let myWorkItems = MOCK_WORK_ITEMS.filter((i) => i.assignedToCurrentUser);
  let recentActivities = MOCK_ACTIVITIES;

  try {
    await connectToDatabase();

    const [openC, inProgC, urgC, appC, attentionDocs, myDocs, eventDocs] = await Promise.all([
      WorkItem.countDocuments({ status: 'open' }),
      WorkItem.countDocuments({ status: 'in_progress' }),
      WorkItem.countDocuments({ priority: 'urgent' }),
      ApprovalRequest.countDocuments({ status: 'pending' }),
      WorkItem.find({ needsAttention: true }).sort({ updatedAt: -1 }).limit(3).lean<IWorkItem[]>(),
      WorkItem.find({
        $or: [{ assigneeId: currentUser.id }, { 'assignee.name': currentUser.name }],
      })
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean<IWorkItem[]>(),
      WorkItemEvent.find({}).sort({ timestamp: -1 }).limit(5).lean<IWorkItemEvent[]>(),
    ]);

    openCount = openC;
    inProgressCount = inProgC;
    urgentCount = urgC;
    awaitingApprovalCount = appC;

    if (attentionDocs.length > 0) {
      needsAttentionItems = attentionDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        reason: doc.reason,
        priority: doc.priority,
        status: doc.status,
        team: doc.team,
        assignee: doc.assignee,
        createdAt: new Date(doc.createdAt).toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date(doc.updatedAt).toISOString().slice(0, 16).replace('T', ' '),
        needsAttention: doc.needsAttention,
      }));
    }

    if (myDocs.length > 0) {
      myWorkItems = myDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        reason: doc.reason,
        priority: doc.priority,
        status: doc.status,
        team: doc.team,
        assignee: doc.assignee,
        createdAt: new Date(doc.createdAt).toISOString().slice(0, 16).replace('T', ' '),
        updatedAt: new Date(doc.updatedAt).toISOString().slice(0, 16).replace('T', ' '),
      }));
    }

    if (eventDocs.length > 0) {
      recentActivities = eventDocs.map((evt) => ({
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
        type: 'status_change',
      }));
    }
  } catch {
    // Database connection fallback to mock data
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Operational Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operational dispatch, critical alerts, and work items for{' '}
            <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/work-items/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Work Item</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Open"
          value={openCount}
          subtext="In queue ready for triage"
          icon={<InboxIcon className="w-5 h-5 text-slate-400" />}
          href="/dashboard/work-items?status=open"
        />
        <MetricCard
          label="In Progress"
          value={inProgressCount}
          subtext="Active investigations"
          icon={<ClockIcon className="w-5 h-5 text-blue-500" />}
          accent="blue"
          href="/dashboard/work-items?status=in_progress"
        />
        <MetricCard
          label="Urgent"
          value={urgentCount}
          subtext="Immediate action required"
          icon={<AlertCircleIcon className="w-5 h-5 text-rose-500" />}
          accent="rose"
          href="/dashboard/work-items?view=urgent"
        />
        <MetricCard
          label="Awaiting Approval"
          value={awaitingApprovalCount}
          subtext="Manager sign-off required"
          icon={<ShieldCheckIcon className="w-5 h-5 text-amber-500" />}
          accent="amber"
          href="/dashboard/approvals"
        />
      </div>

      {/* Main Content Split: Needs Attention & My Work (Left) + Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention Section */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Needs Attention</h3>
                <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-medium">
                  {needsAttentionItems.length} items
                </span>
              </div>
              <Link
                href="/dashboard/work-items?view=urgent"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all urgent
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {needsAttentionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {item.id}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{item.team}</span>
                    </div>
                    <Link
                      href={`/dashboard/work-items/${item.id}`}
                      className="block text-sm font-medium text-slate-900 hover:text-blue-600 truncate"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {item.reason}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-700 font-medium">{item.assignee.name}</p>
                      <p className="text-[11px] text-slate-400">{item.updatedAt}</p>
                    </div>
                    <Link
                      href={`/dashboard/work-items/${item.id}`}
                      className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Work Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">My Work</h3>
                <p className="text-xs text-slate-500">Items assigned to {currentUser.name}</p>
              </div>
              <Link
                href="/dashboard/work-items?view=assigned"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all my work
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th scope="col" className="px-5 py-2.5">Title & ID</th>
                    <th scope="col" className="px-4 py-2.5">Priority</th>
                    <th scope="col" className="px-4 py-2.5">Status</th>
                    <th scope="col" className="px-4 py-2.5">Team</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myWorkItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-xs">
                        No work items currently assigned to {currentUser.name}.
                      </td>
                    </tr>
                  ) : (
                    myWorkItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-mono text-[11px] text-slate-400">{item.id}</div>
                          <Link
                            href={`/dashboard/work-items/${item.id}`}
                            className="font-medium text-slate-800 hover:text-blue-600 line-clamp-1"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {item.team}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <Link
                            href={`/dashboard/work-items/${item.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Live operational log and state transitions</p>
            </div>

            <div className="p-4 sm:p-5">
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {recentActivities.map((act) => (
                  <li key={act.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">{act.user}</span>{' '}
                      <span className="text-slate-600">{act.action}</span>{' '}
                      <Link
                        href={`/dashboard/work-items/${act.targetId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {act.target}
                      </Link>
                    </div>
                    <time className="text-[11px] text-slate-400 mt-0.5 block">
                      {act.timestamp}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Quick Ops Info Card */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Control Plane Status
            </h4>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span>Cluster Health</span>
                <span className="text-emerald-700 font-medium">Nominal (99.98%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span>Active Operator</span>
                <span className="font-medium text-slate-800">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Role & Team</span>
                <span className="font-mono text-slate-600">{currentUser.role} ({currentUser.team})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
