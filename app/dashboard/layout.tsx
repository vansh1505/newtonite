import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata = {
  title: 'Dashboard - Newtonite Ops',
  description: 'Operations and work-item management',
};

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('ops_user_id')?.value;

  if (!userId) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
