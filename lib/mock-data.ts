export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type WorkItemStatus = 'open' | 'in_progress' | 'blocked' | 'awaiting_approval' | 'resolved';

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: Priority;
  status: WorkItemStatus;
  team: string;
  assignee: {
    name: string;
    email: string;
    avatarInitials: string;
  };
  createdAt: string;
  updatedAt: string;
  version?: number;
  needsAttention?: boolean;
  assignedToCurrentUser?: boolean;
}

export interface ApprovalItem {
  id: string;
  workItemId: string;
  workItemTitle: string;
  requestedBy: {
    name: string;
    email: string;
    role: string;
  };
  team: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  impactLevel: 'High' | 'Medium' | 'Low';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  team: string;
  role: 'Admin' | 'Manager' | 'Member';
  status: 'Active' | 'On Leave';
  avatarInitials: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  lead: string;
  memberCount: number;
  openItemsCount: number;
  description: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  avatarInitials: string;
  action: string;
  target: string;
  targetId: string;
  timestamp: string;
  type: 'status_change' | 'assignment' | 'comment' | 'created';
}

export const MOCK_TEAMS: TeamInfo[] = [
  {
    id: 'team-platform',
    name: 'Platform Ops',
    lead: 'Alex Rivera',
    memberCount: 8,
    openItemsCount: 14,
    description: 'Core runtime stability, cluster maintenance, and deployment pipelines.',
  },
  {
    id: 'team-security',
    name: 'Security & Compliance',
    lead: 'Elena Rostova',
    memberCount: 5,
    openItemsCount: 6,
    description: 'Vulnerability assessment, policy enforcement, and audit readiness.',
  },
  {
    id: 'team-support',
    name: 'Customer Support Ops',
    lead: 'Sarah Chen',
    memberCount: 12,
    openItemsCount: 19,
    description: 'Tier-2 and Tier-3 ticket escalation and client anomaly triage.',
  },
  {
    id: 'team-billing',
    name: 'Billing & Finance Ops',
    lead: 'David Kim',
    memberCount: 4,
    openItemsCount: 5,
    description: 'Payment reconciliation, invoice anomaly audits, and ledger balance.',
  },
  {
    id: 'team-infra',
    name: 'Infrastructure',
    lead: 'Marcus Vance',
    memberCount: 6,
    openItemsCount: 8,
    description: 'Cloud network routing, DB sharding, and edge compute capacity.',
  },
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@newtonite.internal',
    team: 'Platform Ops',
    role: 'Admin',
    status: 'Active',
    avatarInitials: 'AR',
  },
  {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@newtonite.internal',
    team: 'Customer Support Ops',
    role: 'Manager',
    status: 'Active',
    avatarInitials: 'SC',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@newtonite.internal',
    team: 'Security & Compliance',
    role: 'Manager',
    status: 'Active',
    avatarInitials: 'ER',
  },
  {
    id: 'usr-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@newtonite.internal',
    team: 'Infrastructure',
    role: 'Member',
    status: 'Active',
    avatarInitials: 'MV',
  },
  {
    id: 'usr-5',
    name: 'David Kim',
    email: 'david.kim@newtonite.internal',
    team: 'Billing & Finance Ops',
    role: 'Manager',
    status: 'Active',
    avatarInitials: 'DK',
  },
  {
    id: 'usr-6',
    name: 'Rachel Adams',
    email: 'rachel.adams@newtonite.internal',
    team: 'Platform Ops',
    role: 'Member',
    status: 'Active',
    avatarInitials: 'RA',
  },
  {
    id: 'usr-7',
    name: 'Liam Patel',
    email: 'liam.patel@newtonite.internal',
    team: 'Customer Support Ops',
    role: 'Member',
    status: 'On Leave',
    avatarInitials: 'LP',
  },
  {
    id: 'usr-8',
    name: 'Tanya Gomez',
    email: 'tanya.gomez@newtonite.internal',
    team: 'Security & Compliance',
    role: 'Member',
    status: 'Active',
    avatarInitials: 'TG',
  },
];

export const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: 'WI-1042',
    title: 'Database index rebuild on primary transaction cluster',
    description: 'Post-migration query degradation detected on postgres-main-02. Vacuum and full index rebuild required during maintenance window.',
    reason: 'Alert triggered: P99 latency on checkout queries exceeded SLA threshold of 250ms for 3 consecutive intervals.',
    priority: 'urgent',
    status: 'in_progress',
    team: 'Platform Ops',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    createdAt: '2026-10-15 08:30',
    updatedAt: '2026-10-17 19:45',
    needsAttention: true,
    assignedToCurrentUser: true,
  },
  {
    id: 'WI-1043',
    title: 'Enterprise webhook delivery failures for tenant Acrolinx',
    description: 'Outbound webhook events failing with TLS handshake timeout. Requires investigation of egress proxy cert pinning.',
    reason: 'Reported by account manager: Acrolinx webhook endpoint is dropping 42% of order sync events.',
    priority: 'urgent',
    status: 'open',
    team: 'Customer Support Ops',
    assignee: {
      name: 'Unassigned',
      email: '',
      avatarInitials: 'UA',
    },
    createdAt: '2026-10-16 11:20',
    updatedAt: '2026-10-17 18:10',
    needsAttention: true,
    assignedToCurrentUser: false,
  },
  {
    id: 'WI-1044',
    title: 'TLS wildcard certificate renewal for api.newtonite.internal',
    description: 'Existing wildcard cert expires in 9 days. Need manual key issuance approval and distribution across edge ingress proxies.',
    reason: 'Automated certificate lifecycle check raised warning expiring within 14 days.',
    priority: 'high',
    status: 'awaiting_approval',
    team: 'Security & Compliance',
    assignee: {
      name: 'Elena Rostova',
      email: 'elena.rostova@newtonite.internal',
      avatarInitials: 'ER',
    },
    createdAt: '2026-10-14 14:00',
    updatedAt: '2026-10-17 15:30',
    needsAttention: true,
    assignedToCurrentUser: false,
  },
  {
    id: 'WI-1045',
    title: 'Billing invoice discrepancy audit for Q3 enterprise accounts',
    description: 'Monthly tax calculation rounding discrepancy between Stripe webhooks and NetSuite general ledger.',
    reason: 'Finance quarterly reconciliation flagged $1,420 delta in recurring enterprise subscription taxes.',
    priority: 'medium',
    status: 'in_progress',
    team: 'Billing & Finance Ops',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    createdAt: '2026-10-12 09:15',
    updatedAt: '2026-10-17 14:00',
    needsAttention: false,
    assignedToCurrentUser: true,
  },
  {
    id: 'WI-1046',
    title: 'Rate limiting threshold update for v2 ingestion endpoints',
    description: 'Adjust tier-1 API consumer token bucket from 2,000 req/min to 3,500 req/min to accommodate traffic spike.',
    reason: 'Enterprise partner data ingestion job throttled during peak daily sync windows.',
    priority: 'medium',
    status: 'open',
    team: 'Platform Ops',
    assignee: {
      name: 'Rachel Adams',
      email: 'rachel.adams@newtonite.internal',
      avatarInitials: 'RA',
    },
    createdAt: '2026-10-16 16:40',
    updatedAt: '2026-10-17 12:15',
    needsAttention: false,
    assignedToCurrentUser: false,
  },
  {
    id: 'WI-1047',
    title: 'Migrate legacy worker queues to unified event bus',
    description: 'Decommission Redis Celery workers and route background jobs through Kafka partition topic ops.tasks.v1.',
    reason: 'Technical debt reduction project to eliminate Redis memory bloat and job loss during restarts.',
    priority: 'low',
    status: 'blocked',
    team: 'Infrastructure',
    assignee: {
      name: 'Marcus Vance',
      email: 'marcus.vance@newtonite.internal',
      avatarInitials: 'MV',
    },
    createdAt: '2026-10-10 10:00',
    updatedAt: '2026-10-17 10:20',
    needsAttention: false,
    assignedToCurrentUser: false,
  },
  {
    id: 'WI-1048',
    title: 'Permission elevation audit for staging database access',
    description: 'Temporary DB access requested by contractor for analytics query optimization.',
    reason: 'Access request requires Manager signoff and automatic 48-hour expiration policy verification.',
    priority: 'high',
    status: 'awaiting_approval',
    team: 'Security & Compliance',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    createdAt: '2026-10-17 07:10',
    updatedAt: '2026-10-17 09:30',
    needsAttention: true,
    assignedToCurrentUser: true,
  },
  {
    id: 'WI-1049',
    title: 'Security patch deployment on payment gateway nodes',
    description: 'Apply OpenSSL upstream CVE patch and verify non-disruptive rolling restart across proxy tier.',
    reason: 'Vendor security advisory CVE-2026-3819 severity rating High.',
    priority: 'urgent',
    status: 'open',
    team: 'Security & Compliance',
    assignee: {
      name: 'Unassigned',
      email: '',
      avatarInitials: 'UA',
    },
    createdAt: '2026-10-17 08:00',
    updatedAt: '2026-10-17 08:45',
    needsAttention: true,
    assignedToCurrentUser: false,
  },
];

export const MOCK_APPROVALS: ApprovalItem[] = [
  {
    id: 'APP-501',
    workItemId: 'WI-1044',
    workItemTitle: 'TLS wildcard certificate renewal for api.newtonite.internal',
    requestedBy: {
      name: 'Elena Rostova',
      email: 'elena.rostova@newtonite.internal',
      role: 'Security Manager',
    },
    team: 'Security & Compliance',
    requestDate: '2026-10-17 15:30',
    status: 'pending',
    type: 'Cert Renewal / Root Auth',
    impactLevel: 'High',
  },
  {
    id: 'APP-502',
    workItemId: 'WI-1048',
    workItemTitle: 'Permission elevation audit for staging database access',
    requestedBy: {
      name: 'Tanya Gomez',
      email: 'tanya.gomez@newtonite.internal',
      role: 'Security Analyst',
    },
    team: 'Security & Compliance',
    requestDate: '2026-10-17 09:30',
    status: 'pending',
    type: 'Access Elevation',
    impactLevel: 'Medium',
  },
  {
    id: 'APP-503',
    workItemId: 'WI-1042',
    workItemTitle: 'Database index rebuild on primary transaction cluster',
    requestedBy: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      role: 'Platform Ops Admin',
    },
    team: 'Platform Ops',
    requestDate: '2026-10-16 20:15',
    status: 'pending',
    type: 'Maintenance Window Outage',
    impactLevel: 'High',
  },
];

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    user: 'Alex Rivera',
    avatarInitials: 'AR',
    action: 'changed status to In Progress on',
    target: 'WI-1042 (Database index rebuild)',
    targetId: 'WI-1042',
    timestamp: '18 minutes ago',
    type: 'status_change',
  },
  {
    id: 'act-2',
    user: 'Sarah Chen',
    avatarInitials: 'SC',
    action: 'flagged as Urgent',
    target: 'WI-1043 (Acrolinx webhook failures)',
    targetId: 'WI-1043',
    timestamp: '1 hour ago',
    type: 'status_change',
  },
  {
    id: 'act-3',
    user: 'Elena Rostova',
    avatarInitials: 'ER',
    action: 'submitted approval request for',
    target: 'WI-1044 (TLS wildcard certificate renewal)',
    targetId: 'WI-1044',
    timestamp: '2 hours ago',
    type: 'assignment',
  },
  {
    id: 'act-4',
    user: 'Marcus Vance',
    avatarInitials: 'MV',
    action: 'marked as Blocked due to dependency',
    target: 'WI-1047 (Migrate legacy worker queues)',
    targetId: 'WI-1047',
    timestamp: '4 hours ago',
    type: 'status_change',
  },
  {
    id: 'act-5',
    user: 'David Kim',
    avatarInitials: 'DK',
    action: 'assigned to Alex Rivera',
    target: 'WI-1045 (Billing invoice discrepancy audit)',
    targetId: 'WI-1045',
    timestamp: '5 hours ago',
    type: 'assignment',
  },
];

export function getWorkItemById(id: string): WorkItem {
  const found = MOCK_WORK_ITEMS.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (found) return found;

  // Fallback realistic item for any requested ID
  return {
    id: id.toUpperCase(),
    title: `Operational Work Item ${id.toUpperCase()}`,
    description: 'Detailed scope, impact analysis, and operational checklist for this work item.',
    reason: 'Routine operational dispatch generated via Newtonite Ops control plane.',
    priority: 'medium',
    status: 'open',
    team: 'Platform Ops',
    assignee: {
      name: 'Alex Rivera',
      email: 'alex.rivera@newtonite.internal',
      avatarInitials: 'AR',
    },
    createdAt: '2026-10-16 10:00',
    updatedAt: '2026-10-17 18:30',
    needsAttention: false,
    assignedToCurrentUser: true,
  };
}
