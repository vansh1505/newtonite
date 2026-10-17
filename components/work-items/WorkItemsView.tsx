'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MOCK_WORK_ITEMS,
  MOCK_TEAMS,
  MOCK_TEAM_MEMBERS,
  WorkItem,
} from '@/lib/mock-data';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import {
  SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  XIcon,
} from '@/components/ui/Icons';

export function WorkItemsView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get('view');
  const statusParam = searchParams.get('status');

  const [searchQuery, setSearchQuery] = useState('');
  const [userStatusFilter, setStatusFilter] = useState<string | null>(null);
  const [userPriorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [userTeamFilter, setTeamFilter] = useState<string | null>(null);
  const [userAssigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  const statusFilter = userStatusFilter ?? (statusParam || 'all');
  const priorityFilter = userPriorityFilter ?? (viewParam === 'urgent' ? 'urgent' : 'all');
  const teamFilter = userTeamFilter ?? 'all';
  const assigneeFilter = userAssigneeFilter ?? (
    viewParam === 'assigned' ? 'Alex Rivera' : viewParam === 'urgent' ? 'Unassigned' : 'all'
  );

  const [page, setPage] = useState(1);
  const [dbItems, setDbItems] = useState<WorkItem[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch from API
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (teamFilter !== 'all') params.set('team', teamFilter);
      if (assigneeFilter !== 'all') params.set('assignee', assigneeFilter);
      if (viewParam) params.set('view', viewParam);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/work-items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDbItems(data.items);
        setTotalCount(data.total);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Fallback to client-side filtering if API unavailable
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, priorityFilter, teamFilter, assigneeFilter, viewParam, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Client-side fallback computation
  const clientFilteredItems = useMemo(() => {
    return MOCK_WORK_ITEMS.filter((item: WorkItem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDesc) return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (teamFilter !== 'all' && item.team !== teamFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'Unassigned') {
          if (item.assignee.name !== 'Unassigned') return false;
        } else if (item.assignee.name !== assigneeFilter) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, statusFilter, priorityFilter, teamFilter, assigneeFilter]);

  const itemsToDisplay = dbItems ?? clientFilteredItems;
  const countToDisplay = totalCount ?? itemsToDisplay.length;

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    teamFilter !== 'all' ||
    assigneeFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTeamFilter('all');
    setAssigneeFilter('all');
    setPage(1);
    router.push('/dashboard/work-items');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            All Work Items
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, triage, and track operational tasks across infrastructure, platform, and security.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/work-items/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Work Item</span>
          </Link>
        </div>
      </div>

      {/* Active View Quick Filter Indicator */}
      {viewParam && (
        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Active View:</span>
            <span>
              {viewParam === 'assigned'
                ? 'Assigned to Current Operator'
                : viewParam === 'urgent'
                ? 'Urgent & Unassigned Queue'
                : viewParam}
            </span>
          </div>
          <button
            onClick={resetFilters}
            className="text-blue-700 hover:text-blue-900 underline font-medium"
          >
            Clear view preset
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, ID (e.g. WI-1042), or keyword..."
              className="block w-full rounded-md border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quick Clear */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="blocked">Blocked</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {MOCK_TEAMS.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Assignee</label>
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Assignees</option>
              <option value="Alex Rivera">Alex Rivera</option>
              <option value="Unassigned">Unassigned</option>
              {MOCK_TEAM_MEMBERS.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Items Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-700">
            {loading ? (
              <span className="text-blue-600">Updating results...</span>
            ) : (
              <span>
                Showing <strong className="text-slate-900">{itemsToDisplay.length}</strong> of{' '}
                <strong className="text-slate-900">{countToDisplay}</strong> items
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to open details
          </div>
        </div>

        {itemsToDisplay.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <InboxIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No work items found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No tasks match your current search query or filter selection. Try adjusting or clearing filters.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th scope="col" className="px-5 py-3">Work Item</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Team</th>
                  <th scope="col" className="px-4 py-3">Assignee</th>
                  <th scope="col" className="px-4 py-3">Updated</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsToDisplay.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600">
                          {item.id}
                        </span>
                        {item.needsAttention && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Needs attention" />
                        )}
                      </div>
                      <Link
                        href={`/dashboard/work-items/${item.id}`}
                        className="block font-medium text-slate-900 hover:text-blue-600 truncate mt-0.5"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {item.team}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {item.assignee.avatarInitials || 'UA'}
                        </span>
                        <span className={`text-slate-700 ${item.assignee.name === 'Unassigned' ? 'italic text-slate-400' : ''}`}>
                          {item.assignee.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {item.updatedAt}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <Link
                        href={`/dashboard/work-items/${item.id}`}
                        className="inline-flex items-center rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination UI */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 py-1 font-mono text-xs text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
