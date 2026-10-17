import React from 'react';
import { WorkItemForm } from '@/components/work-items/WorkItemForm';
import { getWorkItemById } from '@/lib/mock-data';

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkItemPage({ params }: Props) {
  const { id } = await params;
  const item = getWorkItemById(id);

  return (
    <WorkItemForm
      mode="edit"
      itemId={id}
      initialData={item}
      cancelHref={`/dashboard/work-items/${id}`}
    />
  );
}
