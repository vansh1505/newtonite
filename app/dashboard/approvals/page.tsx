import React from 'react';
import { ApprovalsView } from '@/components/approvals/ApprovalsView';

export const metadata = {
  title: 'Approvals - Newtonite Ops',
  description: 'Operational change management and approvals',
};

export default function ApprovalsPage() {
  return <ApprovalsView />;
}
