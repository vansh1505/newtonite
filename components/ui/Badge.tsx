import React from 'react';
import { Priority, WorkItemStatus } from '@/lib/mock-data';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'slate' | 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'slate', size = 'sm', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'bg-white text-slate-700 border-slate-300',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border tracking-wide uppercase font-mono ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkItemStatus | string }) {
  switch (status) {
    case 'open':
      return <Badge variant="slate">Open</Badge>;
    case 'in_progress':
      return <Badge variant="blue">In Progress</Badge>;
    case 'awaiting_approval':
    case 'pending':
      return <Badge variant="amber">Awaiting Approval</Badge>;
    case 'blocked':
      return <Badge variant="rose">Blocked</Badge>;
    case 'resolved':
    case 'approved':
      return <Badge variant="emerald">Resolved</Badge>;
    case 'rejected':
      return <Badge variant="rose">Rejected</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: Priority | string }) {
  switch (priority) {
    case 'urgent':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 uppercase font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          Urgent
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 uppercase font-mono">
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 uppercase font-mono">
          Medium
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500 uppercase font-mono">
          Low
        </span>
      );
    default:
      return <Badge variant="slate">{priority}</Badge>;
  }
}

export function RoleBadge({ role }: { role: 'Admin' | 'Manager' | 'Member' | string }) {
  switch (role) {
    case 'Admin':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border border-blue-200 bg-blue-50 text-blue-700">
          Admin
        </span>
      );
    case 'Manager':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border border-purple-200 bg-purple-50 text-purple-700">
          Manager
        </span>
      );
    case 'Member':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border border-slate-200 bg-slate-100 text-slate-600">
          Member
        </span>
      );
  }
}
