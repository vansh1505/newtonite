'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboardIcon,
  InboxIcon,
  UserCheckIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  LogOutIcon,
  XIcon,
  LayersIcon,
} from '@/components/ui/Icons';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: 'rose' | 'amber' | 'slate';
  exact?: boolean;
  viewParam?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    name: 'All Work Items',
    href: '/dashboard/work-items',
    icon: InboxIcon,
    exact: true,
  },
  {
    name: 'Assigned to Me',
    href: '/dashboard/work-items?view=assigned',
    icon: UserCheckIcon,
    viewParam: 'assigned',
  },
  {
    name: 'Urgent & Unassigned',
    href: '/dashboard/work-items?view=urgent',
    icon: AlertCircleIcon,
    badge: 2,
    badgeVariant: 'rose',
    viewParam: 'urgent',
  },
  {
    name: 'Approvals',
    href: '/dashboard/approvals',
    icon: ShieldCheckIcon,
    badge: 3,
    badgeVariant: 'amber',
  },
  {
    name: 'Teams & Members',
    href: '/dashboard/teams',
    icon: UsersIcon,
  },
];

interface SidebarNavContentProps {
  onItemClick?: () => void;
}

function SidebarNavContent({ onItemClick }: SidebarNavContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const isItemActive = (item: NavItem) => {
    if (item.viewParam) {
      return pathname === '/dashboard/work-items' && currentView === item.viewParam;
    }
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (item.href === '/dashboard/work-items') {
      return pathname.startsWith('/dashboard/work-items') && !currentView;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isItemActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.name}</span>
            </div>
            {typeof item.badge === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  item.badgeVariant === 'rose'
                    ? 'bg-rose-100 text-rose-700'
                    : item.badgeVariant === 'amber'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-sm shadow-xs shrink-0">
              <LayersIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Newtonite Ops
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Work Control
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list with Suspense for useSearchParams */}
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-4 text-xs text-slate-400">Loading nav...</div>}>
            <SidebarNavContent onItemClick={onMobileClose} />
          </Suspense>
        </div>

        {/* User profile footer */}
        <SidebarUserFooter />
      </aside>
    </>
  );
}

function SidebarUserFooter() {
  const [user, setUser] = React.useState({
    name: 'Alex Rivera',
    role: 'Admin',
    team: 'Platform Ops',
  });

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center justify-between rounded-md p-2 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.role} • {user.team}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of Newtonite Ops"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
