import type { StageStatus, AgentStatus } from '@/types/api';

type BadgeStatus = StageStatus | AgentStatus | 'active' | 'awaiting_review';

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  // Stage statuses
  pending: 'bg-text-muted/20 text-text-muted',
  in_progress: 'bg-accent-amber/20 text-accent-amber',
  completed: 'bg-success/20 text-success',
  failed: 'bg-danger/20 text-danger',
  blocked: 'bg-danger/20 text-danger',
  // Agent statuses
  idle: 'bg-text-muted/20 text-text-muted',
  working: 'bg-accent-amber/20 text-accent-amber',
  // Project statuses
  active: 'bg-accent-amber/20 text-accent-amber',
  awaiting_review: 'bg-accent-cyan/20 text-accent-cyan',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  blocked: 'Blocked',
  idle: 'Idle',
  working: 'Working',
  active: 'Active',
  awaiting_review: 'Awaiting Review',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;
  const label = statusLabels[status] || status;
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';
  
  return (
    <span className={`${sizeClass} rounded font-medium ${style}`}>
      {label}
    </span>
  );
}
