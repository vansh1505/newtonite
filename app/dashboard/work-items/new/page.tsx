import React from 'react';
import { WorkItemForm } from '@/components/work-items/WorkItemForm';

export const metadata = {
  title: 'Create Work Item - Newtonite Ops',
  description: 'Create and dispatch a new operational work item',
};

export default function NewWorkItemPage() {
  return <WorkItemForm mode="create" cancelHref="/dashboard/work-items" />;
}
