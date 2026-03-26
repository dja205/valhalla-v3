import type { StageStatus } from '@/types/api';

interface StatusBadgeProps {
  status: StageStatus;
}

const statusStyles = {
  pending: 'bg-text-muted/20 text-text-muted',
  running: 'bg-accent-amber/20 text-accent-amber',
  completed: 'bg-success/20 text-success',
  failed: 'bg-danger/20 text-danger',
  skipped: 'bg-text-muted/10 text-text-muted',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
