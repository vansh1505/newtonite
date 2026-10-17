import React, { Suspense } from 'react';
import { WorkItemsView } from '@/components/work-items/WorkItemsView';

export const metadata = {
  title: 'Work Items - Newtonite Ops',
  description: 'Manage and filter operational work items',
};

export default function WorkItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading work items...
        </div>
      }
    >
      <WorkItemsView />
    </Suspense>
  );
}
