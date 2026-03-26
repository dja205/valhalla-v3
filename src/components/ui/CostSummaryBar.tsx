import { useStore } from '@/stores';

export function CostSummaryBar() {
  const { limits, activeRun } = useStore();

  if (!limits) return null;

  const claudePercent = (limits.claude.used / limits.claude.limit) * 100;
  const copilotPercent = (limits.copilot.used / limits.copilot.limit) * 100;

  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Active job info */}
        <div className="flex-1">
          {activeRun ? (
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-accent-amber rounded-full animate-pulse" />
              <span className="text-text-primary font-medium truncate">
                {activeRun.projectId}
              </span>
              <span className="text-text-muted text-sm">
                Stage: {activeRun.currentStage || 'Unknown'}
              </span>
            </div>
          ) : (
            <span className="text-text-muted">No active job</span>
          )}
        </div>
        
        {/* Usage bars - compact on mobile */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          <div className="w-full sm:w-32">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Claude</span>
              <span>{limits.claude.used}/{limits.claude.limit}</span>
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
          
          <div className="w-full sm:w-32">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Copilot</span>
              <span>{limits.copilot.used}/{limits.copilot.limit}</span>
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
