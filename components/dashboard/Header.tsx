'use client';

import React, { useState, useEffect } from 'react';
import { MenuIcon, ChevronDownIcon } from '@/components/ui/Icons';
import { RoleBadge } from '@/components/ui/Badge';

interface HeaderProps {
  title?: string;
  description?: string;
  onOpenMobileMenu?: () => void;
  actions?: React.ReactNode;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Member';
  team: string;
}

const DEMO_OPERATORS: CurrentUser[] = [
  { id: 'usr-1', name: 'Alex Rivera', email: 'alex.rivera@newtonite.internal', role: 'Admin', team: 'Platform Ops' },
  { id: 'usr-2', name: 'Sarah Chen', email: 'sarah.chen@newtonite.internal', role: 'Manager', team: 'Customer Support Ops' },
  { id: 'usr-3', name: 'Elena Rostova', email: 'elena.rostova@newtonite.internal', role: 'Manager', team: 'Security & Compliance' },
  { id: 'usr-4', name: 'Marcus Vance', email: 'marcus.vance@newtonite.internal', role: 'Member', team: 'Infrastructure' },
];

export function Header({
  title,
  description,
  onOpenMobileMenu,
  actions,
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_OPERATORS[0]);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleSwitchUser = async (user: CurrentUser) => {
    try {
      await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setCurrentUser(user);
      setSwitcherOpen(false);
      window.location.reload();
    } catch {
      setCurrentUser(user);
      setSwitcherOpen(false);
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        )}

        {title && (
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="hidden sm:block truncate text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Global operational indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Ops Online</span>
        </div>

        {/* Interactive Operator Switcher */}
        <div className="relative border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-100 transition-colors text-left"
            title="Click to switch operator identity for concurrency & authorization testing"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ring-1 ring-blue-600/20 shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </p>
                <RoleBadge role={currentUser.role} />
              </div>
              <p className="text-[10px] text-slate-500">{currentUser.team}</p>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {switcherOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white py-2 shadow-xl z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900">Switch Active Operator</p>
                <p className="text-[11px] text-slate-500">
                  Simulate multi-user claims, concurrent edits, and permission checks.
                </p>
              </div>

              <div className="divide-y divide-slate-50 py-1">
                {DEMO_OPERATORS.map((op) => {
                  const isCurrent = op.id === currentUser.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => handleSwitchUser(op)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{op.name}</span>
                          <RoleBadge role={op.role} />
                        </div>
                        <p className="text-[10px] text-slate-400">{op.team}</p>
                      </div>
                      {isCurrent && <span className="text-blue-600 text-xs font-bold">✓ Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
