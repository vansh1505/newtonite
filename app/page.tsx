import React, { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import {
  ShieldCheckIcon,
  AlertCircleIcon,
  ClockIcon,
  InboxIcon,
  ChevronRightIcon,
  UsersIcon,
  CheckCircleIcon,
  LayersIcon,
} from '@/components/ui/Icons';
import { getSessionUser } from '@/lib/auth/session';

export const metadata = {
  title: 'Newtonite Ops - Mission-Critical Work-Item Control Plane',
  description: 'Internal operations, atomic claim dispatch, and optimistic concurrency management.',
};

async function HeaderUserNav() {
  await connection();
  const cookieStore = await cookies();
  const userId = cookieStore.get('ops_user_id')?.value;
  const user = userId ? await getSessionUser() : null;

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline-block text-xs text-slate-500">
          Signed in as <strong className="text-slate-800">{user.name}</strong>
        </span>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <span>Open Dashboard</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
      >
        <span>Launch Control Plane</span>
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </Link>
    </>
  );
}

function HeaderUserNavFallback() {
  return (
    <>
      <Link
        href="/login"
        className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
      >
        <span>Launch Control Plane</span>
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </Link>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top operational announcement banner */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-white">Cluster Active:</span>
            <span className="text-slate-300">Atomic Claims • OCC Concurrency • Real-Time Audit Engine</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Latency &lt; 25ms</span>
            <span>•</span>
            <span>MongoDB Connected</span>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-xs group-hover:bg-blue-700 transition-colors">
              <LayersIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Newtonite Ops
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block leading-none">
                Control Plane v2.4
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#guarantees" className="hover:text-blue-600 transition-colors">
              Core Guarantees
            </a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">
              Architecture
            </a>
            <a href="#teams" className="hover:text-blue-600 transition-colors">
              Operations Teams
            </a>
            <Link href="/dashboard/work-items" className="hover:text-blue-600 transition-colors">
              Work Items
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Suspense fallback={<HeaderUserNavFallback />}>
              <HeaderUserNav />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>Internal Engineering & Work-Item Management</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Operations Under Pressure.
                <span className="block text-blue-600 font-bold mt-1">
                  Engineered for Zero Data Loss.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Newtonite Ops is the internal work-item orchestrator built for high-concurrency dispatch. 
                Eliminate race conditions with atomic claims, protect stale updates with OCC versioning, 
                and enforce multi-tier approval governance before code hits production.
              </p>

              {/* CTA Group */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <span>Enter Control Plane</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Operator Login</span>
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span>Register Account</span>
                </Link>
              </div>

              {/* Quick Persona Access Pills */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Instant Access Demo Personas
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/login?email=alex.rivera@newtonite.internal"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 transition-colors shadow-2xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Alex Rivera (Admin)</span>
                  </Link>
                  <Link
                    href="/login?email=sarah.chen@newtonite.internal"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-purple-400 hover:bg-purple-50/50 transition-colors shadow-2xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-purple-600" />
                    <span>Sarah Chen (Manager)</span>
                  </Link>
                  <Link
                    href="/login?email=marcus.vance@newtonite.internal"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    <span>Marcus Vance (Member)</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Dashboard Mock Preview Card */}
            <div className="mt-12 max-w-5xl mx-auto rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-lg">
              <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                {/* Mock Window Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-mono text-[11px] text-slate-500">
                      newtonite-ops.internal/dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>OCC Guaranteed</span>
                  </div>
                </div>

                {/* Mock Top Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50">
                  <div className="bg-white rounded border border-slate-200 p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Open Work Items</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">8</p>
                    <span className="text-[10px] text-slate-500">Unassigned queue</span>
                  </div>
                  <div className="bg-white rounded border border-slate-200 p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">In Progress</span>
                    <p className="text-xl font-bold text-blue-600 mt-0.5">3</p>
                    <span className="text-[10px] text-slate-500">Active investigations</span>
                  </div>
                  <div className="bg-white rounded border border-slate-200 p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Urgent P0</span>
                    <p className="text-xl font-bold text-rose-600 mt-0.5">2</p>
                    <span className="text-[10px] text-slate-500">Requires triage</span>
                  </div>
                  <div className="bg-white rounded border border-slate-200 p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Awaiting Signoff</span>
                    <p className="text-xl font-bold text-amber-600 mt-0.5">3</p>
                    <span className="text-[10px] text-slate-500">Manager approval</span>
                  </div>
                </div>

                {/* Mock Live Triage Row */}
                <div className="border-t border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded border border-slate-200 bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-600">WI-1049</span>
                        <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase">Urgent</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">Open</span>
                        <span className="text-[11px] text-slate-500">Security & Compliance</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        Security patch deployment on payment gateway nodes (CVE-2026-3819)
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Version: 1</span>
                      <Link
                        href="/dashboard/work-items/WI-1049"
                        className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Claim & Triage →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Core Engineering Guarantees Section */}
        <section id="guarantees" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Operational Integrity
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                The 5 Critical Engineering Guarantees
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Designed to withstand high concurrency and network instability without state corruption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Pillar 1 */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                  <InboxIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Atomic Claim & Race Protection
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  When two operators click claim concurrently on the same urgent ticket, atomic MongoDB operations guarantee exactly one claim succeeds. The second operator receives an immediate 409 conflict, preventing double assignment.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Atomic findOneAndUpdate filter</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  2. Optimistic Concurrency Control
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Every work item maintains a monotonic integer version. If an operator submits edits against an outdated version, the mutation is rejected with 409 Conflict, safeguarding against silent overwrites.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Version increment check</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  3. Idempotent Deduplication
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Submitting requests with an <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">Idempotency-Key</code> header records the result hash. Repeated requests return the cached response, preventing duplicated state changes.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>TTL cache deduplication</span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                  <AlertCircleIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  4. Workflow State Machine Rules
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Work items must progress through valid states. Direct jumps from Open to Resolved without investigation are blocked. Resolved items can only be reopened by authorized Admins.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Enforced transition matrix</span>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  5. Resource-Level Authorization
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  High-impact items flagged for approval require dual sign-off. Members cannot approve signoffs; only designated Managers and Admins can approve or reject governance requests.
                </p>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Role: Admin | Manager gate</span>
                </div>
              </div>

              {/* Architecture Highlight */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 mb-3.5">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Immutable Audit Trail
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Every status update, assignment handoff, and approval decision writes an immutable event record for complete post-incident compliance audits.
                  </p>
                </div>
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Append-only event stream</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Operations Teams Grid */}
        <section id="teams" className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Organizational Dispatch
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                  Active Operations Squads
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Specialized squads managing infrastructure, security, runtime, and billing.
                </p>
              </div>
              <Link
                href="/dashboard/teams"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View team roster & roles</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: 'Platform Ops', lead: 'Alex Rivera', role: 'Admin', count: '14 Active Items' },
                { name: 'Security & Compliance', lead: 'Elena Rostova', role: 'Manager', count: '6 Active Items' },
                { name: 'Customer Support Ops', lead: 'Sarah Chen', role: 'Manager', count: '19 Active Items' },
                { name: 'Billing & Finance', lead: 'David Kim', role: 'Manager', count: '5 Active Items' },
                { name: 'Infrastructure', lead: 'Marcus Vance', role: 'Member', count: '8 Active Items' },
              ].map((t) => (
                <div key={t.name} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Lead: {t.lead} ({t.role})</p>
                  <p className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.5 inline-block mt-3">
                    {t.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 sm:py-20 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to coordinate critical operations?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Log in with your operator credentials or explore the control plane with 1-click demo personas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                Launch Dashboard
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-md border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white font-bold text-xs">
              N
            </div>
            <span className="font-semibold text-slate-700">Newtonite Ops Control Plane</span>
            <span>•</span>
            <span>Internal Platform Portal</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Overview
            </Link>
            <Link href="/dashboard/work-items" className="hover:text-blue-600 transition-colors">
              Work Items
            </Link>
            <Link href="/dashboard/approvals" className="hover:text-blue-600 transition-colors">
              Approvals
            </Link>
            <Link href="/dashboard/teams" className="hover:text-blue-600 transition-colors">
              Teams
            </Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
