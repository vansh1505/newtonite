'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MOCK_TEAMS,
  MOCK_TEAM_MEMBERS,
  WorkItem,
  Priority,
  WorkItemStatus,
} from '@/lib/mock-data';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from '@/components/ui/Icons';

interface WorkItemFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<WorkItem> & { version?: number };
  itemId?: string;
  cancelHref?: string;
}

export function WorkItemForm({
  mode,
  initialData,
  itemId,
  cancelHref = '/dashboard/work-items',
}: WorkItemFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [reason, setReason] = useState(initialData?.reason || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [team, setTeam] = useState(initialData?.team || 'Platform Ops');
  const [assigneeName, setAssigneeName] = useState(initialData?.assignee?.name || 'Alex Rivera');
  const [status, setStatus] = useState<WorkItemStatus>(initialData?.status || 'open');
  const [version, setVersion] = useState<number>(initialData?.version || 1);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [staleConflict, setStaleConflict] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!reason.trim()) newErrors.reason = 'Operational justification ("Why this exists") is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setStaleConflict(null);

    try {
      if (mode === 'create') {
        // Critical Behavior 3: Generate client Idempotency Key to prevent duplicate submissions
        const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const res = await fetch('/api/work-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            title,
            description,
            reason,
            priority,
            team,
            assigneeName,
            status,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setSubmittedMessage(`Work item ${data.item?.id || ''} created successfully! Redirecting...`);
          setTimeout(() => router.push('/dashboard/work-items'), 1200);
        } else {
          setErrors({ submit: data.error || 'Failed to create work item' });
        }
      } else if (mode === 'edit' && itemId) {
        // Critical Behavior 2: Optimistic Concurrency Control (OCC) with version check
        const res = await fetch(`/api/work-items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version,
            title,
            description,
            reason,
            priority,
            team,
            assigneeName,
            status,
          }),
        });

        const data = await res.json();

        if (res.status === 409) {
          // Stale data conflict detected!
          setStaleConflict(
            data.error ||
              'Stale Data Conflict: Another operator modified this work item while you were viewing it.'
          );
          if (data.currentVersion) {
            setVersion(data.currentVersion);
          }
          return;
        }

        if (res.ok) {
          setSubmittedMessage(`Work item ${itemId} updated successfully! Redirecting...`);
          setTimeout(() => router.push(`/dashboard/work-items/${itemId}`), 1200);
        } else {
          setErrors({ submit: data.error || 'Failed to save changes' });
        }
      }
    } catch {
      // Offline fallback
      setSubmittedMessage(
        mode === 'create'
          ? 'Work item created (Client simulated).'
          : `Work item ${itemId || ''} updated (Client simulated).`
      );
      setTimeout(() => {
        router.push(mode === 'edit' && itemId ? `/dashboard/work-items/${itemId}` : '/dashboard/work-items');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReloadLatest = async () => {
    if (!itemId) return;
    try {
      const res = await fetch(`/api/work-items/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setTitle(data.item.title);
          setDescription(data.item.description);
          setReason(data.item.reason);
          setPriority(data.item.priority);
          setTeam(data.item.team);
          setAssigneeName(data.item.assignee.name);
          setStatus(data.item.status);
          setVersion(data.item.version || 1);
          setStaleConflict(null);
        }
      }
    } catch {
      setStaleConflict(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <Link
          href={cancelHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>{mode === 'create' ? 'Back to Work Items' : `Back to ${itemId || 'Work Item'}`}</span>
        </Link>
        {itemId && (
          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Editing {itemId} (rev: v{version})
          </span>
        )}
      </div>

      {/* Stale Data Conflict Warning Banner */}
      {staleConflict && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Optimistic Concurrency Conflict (OCC)</p>
              <p className="mt-0.5 text-rose-800">{staleConflict}</p>
              <p className="mt-1 text-[11px] text-rose-700">
                To prevent accidental overwriting of another operator&apos;s updates, your changes were blocked.
              </p>
              <button
                type="button"
                onClick={handleReloadLatest}
                className="mt-2.5 inline-flex items-center rounded border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 shadow-xs hover:bg-rose-100"
              >
                Reload Latest Server State
              </button>
            </div>
          </div>
          <button
            onClick={() => setStaleConflict(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {mode === 'create' ? 'Create New Work Item' : `Edit Work Item: ${itemId || ''}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'create'
              ? 'Dispatch an operational task, incident follow-up, or infrastructure maintenance request.'
              : 'Modify scope, reason, priority or assignment for this operational task.'}
          </p>
        </div>

        {/* Success Feedback Banner */}
        {submittedMessage && (
          <div className="m-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submittedMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Database index rebuild on primary transaction cluster"
              className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                errors.title
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircleIcon className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Provide context, affected systems, impact analysis, or operational steps..."
              className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                errors.description
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircleIcon className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Why this work item exists */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Why this work item exists <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="e.g. Alert triggered: P99 latency exceeded SLA threshold of 250ms on shard 3..."
              className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                errors.reason
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Clear root cause, customer escalation reference, or monitoring alert ID.
            </p>
            {errors.reason && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircleIcon className="w-3.5 h-3.5" />
                {errors.reason}
              </p>
            )}
          </div>

          {/* Row: Priority, Team, Assignee, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Team */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Team <span className="text-rose-500">*</span>
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {MOCK_TEAMS.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee
              </label>
              <select
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Alex Rivera">Alex Rivera</option>
                {MOCK_TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Initial / Current Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'create' ? 'Initial Status' : 'Status'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkItemStatus)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_approval">Awaiting Approval</option>
                <option value="blocked">Blocked</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {errors.submit && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-200">
              {errors.submit}
            </p>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href={cancelHref}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'create'
                ? 'Create Work Item'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
