'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_APPROVALS, ApprovalItem } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
} from '@/components/ui/Icons';

export function ApprovalsView() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(MOCK_APPROVALS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forceEmptyState, setForceEmptyState] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/approvals?status=all')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.approvals && data.approvals.length > 0) {
          setApprovals(data.approvals);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const displayedApprovals = forceEmptyState ? [] : pendingApprovals;

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setAuthError(null);
    setToastMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: action }),
      });
      const data = await res.json();

      if (res.status === 403) {
        // Critical Behavior 4: Resource-level authorization rejected!
        setAuthError(
          data.error || 'Authorization Denied: Your current role cannot approve this request.'
        );
        return;
      }

      if (res.ok) {
        setApprovals((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: action } : item))
        );
        setToastMessage(data.message || `Approval request ${id} was ${action}.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setAuthError(data.error || `Failed to ${action} request`);
      }
    } catch {
      // Offline simulation
      setApprovals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action } : item))
      );
      setToastMessage(`Request ${id} was ${action} (Client mode).`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  const handleResetApprovals = () => {
    setApprovals(MOCK_APPROVALS);
    setForceEmptyState(false);
    setAuthError(null);
    setToastMessage('Reset approvals to initial mock state.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Approvals & Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review and sign off on high-impact infrastructure changes, access elevation, and maintenance windows.
          </p>
        </div>

        {/* View mode toggle to easily review empty state */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForceEmptyState(!forceEmptyState)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              forceEmptyState
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {forceEmptyState ? 'Viewing Empty State Demo' : 'Simulate Empty State'}
          </button>

          {(forceEmptyState || pendingApprovals.length === 0) && (
            <button
              type="button"
              onClick={handleResetApprovals}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset Mock Data
            </button>
          )}
        </div>
      </div>

      {/* Role Authorization Error Alert */}
      {authError && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Resource-Level Authorization Enforced</p>
              <p className="mt-0.5 text-rose-800">{authError}</p>
              <p className="mt-1 text-[11px] text-rose-700">
                Switch active operator in the top right to an Admin (Alex Rivera) or Manager (Sarah Chen) to approve.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-blue-700 hover:text-blue-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Pending Approvals</h3>
            <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-medium">
              {displayedApprovals.length} pending
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Authorization: Manager or Admin signoff required
          </div>
        </div>

        {displayedApprovals.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">All approvals cleared</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              There are no pending sign-offs or elevation requests awaiting your review right now.
            </p>
            {forceEmptyState ? (
              <button
                type="button"
                onClick={() => setForceEmptyState(false)}
                className="mt-4 inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Exit Empty State Demo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetApprovals}
                className="mt-4 inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Reload Mock Requests
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th scope="col" className="px-5 py-3">Work Item</th>
                  <th scope="col" className="px-4 py-3">Requested By</th>
                  <th scope="col" className="px-4 py-3">Team</th>
                  <th scope="col" className="px-4 py-3">Request Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-400">
                          {item.id}
                        </span>
                        <span className="rounded bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 font-medium">
                          {item.type}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/work-items/${item.workItemId}`}
                        className="block font-medium text-slate-900 hover:text-blue-600 truncate mt-0.5"
                      >
                        {item.workItemTitle}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{item.requestedBy.name}</p>
                      <p className="text-[11px] text-slate-400">{item.requestedBy.role}</p>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {item.team}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {item.requestDate}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAction(item.id, 'approved')}
                        className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                        title="Approve request"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAction(item.id, 'rejected')}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-50 transition-colors"
                        title="Reject request"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
