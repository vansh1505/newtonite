import React from 'react';
import { TeamsView } from '@/components/teams/TeamsView';

export const metadata = {
  title: 'Teams & Members - Newtonite Ops',
  description: 'Operations teams and access directory',
};

export default function TeamsPage() {
  return <TeamsView />;
}
