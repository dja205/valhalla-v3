import { useStore } from '@/stores';
import { formatCost } from '@/lib/utils';

export function CostSummaryBar() {
  const { limits, activeRun, completedRuns } = useStore();

  if (!limits) return null;

  const claudePercent = limits.claude.limit > 0
    ? (limits.claude.used / limits.claude.limit) * 100
    : 0;
  const copilotPercent = limits.copilot.limit > 0
    ? (limits.copilot.used / limits.copilot.limit) * 100
    : 0;

  // Estimated cost: sum completed runs + active run
  const estimatedCost =
    completedRuns.reduce((sum, r) => sum + (r.totalCost ?? 0), 0) +
    (activeRun?.totalCost ?? 0);

  // Total premium requests used today across all runs
  const totalPremiumReqs = limits.claude.used;

  return (
    <div className="bg-bg-surface rounded-lg p-3 md:p-4 border border-bg-raised">
      <div className="flex flex-wrap items-center gap-3 md:gap-6">
        {/* Active job pulse */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {activeRun ? (
            <>
              <span className="w-2 h-2 bg-accent-amber rounded-full animate-pulse flex-shrink-0" />
              <span className="text-text-primary font-medium truncate text-sm">
                {activeRun.projectId}
              </span>
              <span className="text-text-muted text-xs hidden sm:inline truncate">
                {activeRun.currentStage || 'unknown stage'}
              </span>
            </>
          ) : (
            <span className="text-text-muted text-sm">No active job</span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
          {/* Premium requests */}
          <div className="text-center">
            <div className="text-xs text-text-muted">Premium Reqs</div>
            <div className="text-sm font-mono text-text-primary">
              {totalPremiumReqs}
              <span className="text-text-muted text-xs">/{limits.claude.limit}</span>
            </div>
          </div>

          {/* Estimated cost */}
          <div className="text-center">
            <div className="text-xs text-text-muted">Est. Cost</div>
            <div className="text-sm font-mono text-text-primary">{formatCost(estimatedCost)}</div>
          </div>

          {/* Claude usage bar */}
          <div className="w-20 md:w-28">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Claude</span>
              <span className={claudePercent > 90 ? 'text-danger' : claudePercent > 70 ? 'text-accent-amber' : ''}>
                {Math.round(claudePercent)}%
              </span>
            </div>
            <div className="w-full bg-bg-base rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  claudePercent > 90 ? 'bg-danger' : claudePercent > 70 ? 'bg-accent-amber' : 'bg-success'
                }`}
                style={{ width: `${Math.min(claudePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Copilot usage bar */}
          <div className="w-20 md:w-28 hidden sm:block">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Copilot</span>
              <span className={copilotPercent > 90 ? 'text-danger' : copilotPercent > 70 ? 'text-accent-amber' : ''}>
                {Math.round(copilotPercent)}%
              </span>
            </div>
            <div className="w-full bg-bg-base rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  copilotPercent > 90 ? 'bg-danger' : copilotPercent > 70 ? 'bg-accent-amber' : 'bg-success'
                }`}
                style={{ width: `${Math.min(copilotPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
