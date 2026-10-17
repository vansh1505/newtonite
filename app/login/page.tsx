'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircleIcon, CheckCircleIcon } from '@/components/ui/Icons';

const DEMO_ACCOUNTS = [
  { name: 'Alex Rivera', role: 'Admin', team: 'Platform Ops', email: 'alex.rivera@newtonite.internal' },
  { name: 'Sarah Chen', role: 'Manager', team: 'Customer Support Ops', email: 'sarah.chen@newtonite.internal' },
  { name: 'Marcus Vance', role: 'Member', team: 'Infrastructure', email: 'marcus.vance@newtonite.internal' },
];

function LoginFormContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Authentication failed' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Welcome back, ${data.user.name}! Redirecting to control plane...`);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch {
      setErrors({ general: 'Unable to connect to auth service. Please check MongoDB connection.' });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid work email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await performLogin(email, password);
  };

  const handleInstantDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    await performLogin(demoEmail, 'password123');
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Branding */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <img
              src="/logo.webp"
              alt="Newtonite"
              className="h-6 w-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Newtonite Ops
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Internal Operations & Work-Item Management Portal
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs">
        {successMessage && (
          <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errors.general && (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* 1-Click Instant Demo Login Section (Prominent) */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              1-Click Demo Login
            </p>
            <span className="text-[10px] text-blue-600 font-mono font-semibold">
              Instant Session
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleInstantDemoLogin(acc.email)}
                className="w-full text-left rounded-md border border-slate-200 bg-slate-50/80 p-2.5 text-xs hover:bg-blue-50 hover:border-blue-300 hover:shadow-2xs transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                      {acc.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        acc.role === 'Admin'
                          ? 'bg-blue-100 text-blue-800'
                          : acc.role === 'Manager'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">{acc.team}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  Sign in →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or sign in with credentials</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email || errors.general)
                  setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
              }}
              placeholder="alex.rivera@newtonite.internal"
              className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircleIcon className="w-3.5 h-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-slate-400">
                Default: password123
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password || errors.general)
                  setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
              }}
              placeholder="••••••••••••"
              className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircleIcon className="w-3.5 h-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Verifying credentials...' : 'Sign In with Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer Link to Register */}
      <div className="text-center text-xs text-slate-500">
        Need an operator account?{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Register
        </Link>
        {' '}&bull;{' '}
        <Link
          href="/"
          className="font-medium text-slate-600 hover:text-slate-800 hover:underline"
        >
          Return to Landing Page
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading auth portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
