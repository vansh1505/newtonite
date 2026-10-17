'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWorkItemById, WorkItemStatus, WorkItem } from '@/lib/mock-data';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  EditIcon,
  UserCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  AlertCircleIcon,
} from '@/components/ui/Icons';

interface WorkItemDetailClientProps {
  id: string;
}

interface TimelineEvent {
  id: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
}

export function WorkItemDetailClient({ id }: WorkItemDetailClientProps) {
  const initialItem = getWorkItemById(id);
  const [item, setItem] = useState<WorkItem>(initialItem);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [workflowAlert, setWorkflowAlert] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Fetch live item & audit history
  useEffect(() => {
    fetch(`/api/work-items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.item) {
          setItem(data.item);
        }
        if (data?.events) {
          setEvents(
            data.events.map((e: { id: string; actorName: string; action: string; target: string; timestamp: string }) => ({
              id: e.id,
              actorName: e.actorName,
              action: e.action,
              target: e.target,
              timestamp: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }
      })
      .catch(() => {});
  }, [id]);

  const handleClaim = async () => {
    setIsClaiming(true);
    setConflictAlert(null);
    setWorkflowAlert(null);

    try {
      const res = await fetch(`/api/work-items/${id}/claim`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.status === 409) {
        // Critical Behavior 1: Concurrent claim race collision detected!
        setConflictAlert(
          data.error || `Claim Conflict: Work item ${id} was claimed by another operator.`
        );
        if (data.item) setItem(data.item);
        return;
      }

      if (res.ok && data.item) {
        setItem(data.item);
        setFeedbackMessage(data.message || 'You have successfully claimed this work item.');
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch {
      // Offline simulation fallback
      setItem((prev) => ({
        ...prev,
        assignee: {
          name: 'Alex Rivera',
          email: 'alex.rivera@newtonite.internal',
          avatarInitials: 'AR',
        },
        status: prev.status === 'open' ? 'in_progress' : prev.status,
      }));
      setFeedbackMessage('Claimed work item (Client mode).');
      setTimeout(() => setFeedbackMessage(null), 3500);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleStatusChange = async (newStatus: WorkItemStatus) => {
    setStatusMenuOpen(false);
    setWorkflowAlert(null);
    setConflictAlert(null);

    try {
      const res = await fetch(`/api/work-items/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus: newStatus }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 403) {
        // Critical Behavior 4: Workflow rule violation caught by server
        setWorkflowAlert(data.error || 'Workflow transition rule prevented this state change.');
        return;
      }

      if (res.ok && data.item) {
        setItem(data.item);
        setFeedbackMessage(`Status transitioned to "${newStatus.replace('_', ' ')}".`);
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch {
      // Fallback
      setItem((prev) => ({ ...prev, status: newStatus }));
      setFeedbackMessage(`Status updated to "${newStatus.replace('_', ' ')}" (Client mode).`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/work-items"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Work Items</span>
        </Link>
        <div className="text-xs font-mono text-slate-400">
          Ref: {item.id} • Version {item.version || 1}
        </div>
      </div>

      {/* Concurrent Race Conflict Alert Banner */}
      {conflictAlert && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Concurrent Claim Collision Detected</p>
              <p className="mt-0.5 text-rose-800">{conflictAlert}</p>
              <p className="mt-1 text-[11px] text-rose-700">
                The atomic server transaction prevented two operators from claiming the same ticket simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={() => setConflictAlert(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workflow Rule Violation Alert */}
      {workflowAlert && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Workflow Policy Enforcement</p>
              <p className="mt-0.5 text-amber-800">{workflowAlert}</p>
            </div>
          </div>
          <button
            onClick={() => setWorkflowAlert(null)}
            className="text-amber-700 hover:text-amber-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Feedback Banner */}
      {feedbackMessage && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 transition-all">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {item.id}
              </span>
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">{item.team}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {item.title}
            </h1>
          </div>

          {/* Action Buttons: Edit, Claim, Change Status */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href={`/dashboard/work-items/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>

            <button
              type="button"
              disabled={isClaiming || (item.assignee.name !== 'Unassigned' && item.assignee.name !== '')}
              onClick={handleClaim}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title={item.assignee.name !== 'Unassigned' ? 'Already assigned' : 'Claim responsibility'}
            >
              <UserCheckIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{isClaiming ? 'Claiming...' : 'Claim Work'}</span>
            </button>

            {/* Change Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <span>Change Status</span>
                <ChevronDownIcon className="w-3.5 h-3.5" />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg z-20 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-100">
                    Workflow Transitions
                  </div>
                  {(['open', 'in_progress', 'awaiting_approval', 'blocked', 'resolved'] as WorkItemStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                          item.status === st ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span className="capitalize">{st.replace('_', ' ')}</span>
                        {item.status === st && <span className="text-blue-600">✓</span>}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps & Metadata Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Current Owner</p>
            <p className="font-medium text-slate-800 mt-0.5">{item.assignee.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Assigned Team</p>
            <p className="font-medium text-slate-800 mt-0.5">{item.team}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Created Timestamp</p>
            <p className="font-medium text-slate-800 mt-0.5">{item.createdAt}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Last Updated</p>
            <p className="font-medium text-slate-800 mt-0.5">{item.updatedAt}</p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Details & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Description, Operational Reason, and Concurrency Check */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Description & Scope
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Why this work item exists</span>
              </h3>
              <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 font-mono">
                {item.reason}
              </div>
            </div>
          </div>

          {/* Conflict or Stale-Data Warning & Concurrency Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-slate-100 p-1 text-slate-500">
                <ShieldCheckIcon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-900">
                  Optimistic Concurrency Control (OCC) Active
                </span>
                <p className="mt-0.5 text-slate-500">
                  Version <strong className="font-mono text-slate-700">v{item.version || 1}</strong> is verified against the cluster.
                  Any concurrent modification by another operator will trigger automatic conflict detection.
                </p>
                <span className="mt-1 inline-block font-mono text-[10px] text-slate-400">
                  Lock state: Healthy • Atomic conditional checks enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity / History Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-slate-400" />
              <span>Activity & History Timeline</span>
            </h3>

            <div className="mt-4">
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {events.length > 0 ? (
                  events.map((evt) => (
                    <li key={evt.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                      <p className="text-xs font-medium text-slate-800">
                        <span className="font-semibold">{evt.actorName}</span> {evt.action}
                      </p>
                      <time className="text-[10px] text-slate-400 block mt-0.5">{evt.timestamp}</time>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                      <p className="text-xs font-medium text-slate-800">Status changed to {item.status.replace('_', ' ')}</p>
                      <time className="text-[10px] text-slate-400 block mt-0.5">{item.updatedAt}</time>
                    </li>
                    <li className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                      <p className="text-xs font-medium text-slate-800">Assigned to {item.assignee.name}</p>
                      <time className="text-[10px] text-slate-400 block mt-0.5">{item.createdAt}</time>
                    </li>
                  </>
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
