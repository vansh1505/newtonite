import { WorkItemStatus } from '@/models/WorkItem';
import { AuthContext } from '@/lib/auth/session';

export interface TransitionResult {
  valid: boolean;
  reason?: string;
}

const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  open: ['in_progress', 'blocked', 'awaiting_approval'],
  in_progress: ['open', 'blocked', 'awaiting_approval', 'resolved'],
  blocked: ['open', 'in_progress'],
  awaiting_approval: ['in_progress', 'resolved'],
  resolved: ['in_progress'],
};

export function validateStatusTransition(
  currentStatus: WorkItemStatus,
  targetStatus: WorkItemStatus,
  hasApprovedRequest: boolean,
  user: AuthContext
): TransitionResult {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Invalid state transition: Cannot move directly from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  // If item is awaiting approval and trying to resolve, check approval signoff
  if (currentStatus === 'awaiting_approval' && targetStatus === 'resolved') {
    if (!hasApprovedRequest) {
      return {
        valid: false,
        reason: 'Governance policy: Cannot resolve work item while approval is still pending or absent.',
      };
    }
  }

  // If reopening a resolved item, ensure user has managerial or admin authority
  if (currentStatus === 'resolved' && targetStatus === 'in_progress') {
    if (user.role !== 'Admin' && user.role !== 'Manager') {
      return {
        valid: false,
        reason: 'Authorization restriction: Only an Admin or Manager can reopen a resolved operational work item.',
      };
    }
  }

  return { valid: true };
}
