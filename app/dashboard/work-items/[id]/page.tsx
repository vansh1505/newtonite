import React from 'react';
import { WorkItemDetailClient } from '@/components/work-items/WorkItemDetailClient';

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkItemDetailPage({ params }: Props) {
  const { id } = await params;
  return <WorkItemDetailClient id={id} />;
}