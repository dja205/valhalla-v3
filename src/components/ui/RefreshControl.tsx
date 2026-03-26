import { formatDuration } from '@/lib/utils';

interface RefreshControlProps {
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshControl({ lastRefreshed, isRefreshing, onRefresh }: RefreshControlProps) {
  const getTimeSince = () => {
    if (!lastRefreshed) return 'Never';
    const ms = Date.now() - lastRefreshed.getTime();
    return formatDuration(ms) + ' ago';
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted">
        Last updated: {getTimeSince()}
      </span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="px-3 py-1 rounded bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 disabled:opacity-50 transition-colors"
      >
        {isRefreshing ? '↻ Refreshing...' : '↻ Refresh'}
      </button>
    </div>
  );
}
