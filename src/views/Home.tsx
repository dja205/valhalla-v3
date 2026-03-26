import { useEffect, useState } from 'react';
import { useStore } from '@/stores';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { CostSummaryBar } from '@/components/ui/CostSummaryBar';
import { AgentCard } from '@/components/ui/AgentCard';
import { PipelineFlowBar } from '@/components/ui/PipelineFlowBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';
import { formatDuration, formatCost } from '@/lib/utils';
import type { AgentStatus } from '@/types/api';

export function Home() {
  const { 
    projects, 
    activeRun, 
    completedRuns,
    isLoading, 
    error, 
    lastRefreshed, 
    isRefreshing, 
    fetchAll, 
    refresh, 
    startPolling, 
    stopPolling 
  } = useStore();

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    fetchAll();
    startPolling(10000);
    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  // Live elapsed time for active run
  useEffect(() => {
    if (!activeRun) {
      setElapsedMs(0);
      return;
    }
    
    const startTime = new Date(activeRun.created).getTime();
    const updateElapsed = () => setElapsedMs(Date.now() - startTime);
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeRun]);

  // Determine which agent is currently working based on activeRun stages
  const getAgentStatus = (agentName: string): AgentStatus => {
    if (!activeRun) return 'idle';
    const activeStage = activeRun.stages.find(s => s.status === 'in_progress');
    if (activeStage && activeStage.agent.toLowerCase() === agentName.toLowerCase()) {
      return 'working';
    }
    return 'idle';
  };

  // Determine current pipeline phase
  const getCurrentPhase = (): 'backlog' | 'design' | 'build' | 'complete' | null => {
    if (!activeRun) return null;
    const activeStage = activeRun.stages.find(s => s.status === 'in_progress');
    if (!activeStage) return null;
    
    if (DESIGN_TEAM.includes(activeStage.agent.toLowerCase())) return 'design';
    if (BUILD_TEAM.includes(activeStage.agent.toLowerCase())) return 'build';
    return null;
  };

  const backlogCount = projects.filter(p => p.status === 'awaiting_review').length;
  const activeCount = projects.filter(p => p.status === 'active').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Valhalla V3</h1>
        <RefreshControl 
          lastRefreshed={lastRefreshed} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Cost Summary Bar */}
      <CostSummaryBar />

      {/* Active Job Hero Card */}
      {isLoading ? (
        <SkeletonCard variant="stage" />
      ) : activeRun ? (
        <div className="bg-bg-surface rounded-lg p-6 border-2 border-accent-amber shadow-[0_0_24px_rgba(240,160,64,0.3)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 bg-accent-amber rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-text-primary truncate">
                  {activeRun.projectId}
                </h2>
                <StatusBadge status="active" size="sm" />
              </div>
              <div className="text-text-muted text-sm truncate mb-1">
                Run: {activeRun.runId}
              </div>
              <div className="text-text-muted text-sm">
                Current Stage: <span className="text-accent-amber font-medium capitalize">{activeRun.currentStage || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-sm text-text-muted">Elapsed</div>
                <div className="text-xl font-mono text-accent-amber">{formatDuration(elapsedMs)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Cost</div>
                <div className="text-xl font-mono text-text-primary">{formatCost(activeRun.totalCost)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface rounded-lg p-6 border border-bg-raised">
          <EmptyState message="No active job running" icon="💤" />
        </div>
      )}

      {/* Pipeline Flow Bar */}
      <PipelineFlowBar 
        currentPhase={getCurrentPhase()}
        backlogCount={backlogCount}
        designCount={activeCount}
        buildCount={0}
        completeCount={completedRuns.length}
      />

      {/* Agent Team Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design Team */}
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-accent-amber rounded-full" />
            <h3 className="text-lg font-semibold text-text-primary">Design Team</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DESIGN_TEAM.map(agent => (
              <AgentCard 
                key={agent} 
                agentName={agent} 
                status={getAgentStatus(agent)}
                currentStage={activeRun?.stages.find(s => s.agent.toLowerCase() === agent && s.status === 'in_progress')?.stage}
              />
            ))}
          </div>
        </div>

        {/* Build Team */}
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-accent-cyan rounded-full" />
            <h3 className="text-lg font-semibold text-text-primary">Build Team</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUILD_TEAM.map(agent => (
              <AgentCard 
                key={agent} 
                agentName={agent} 
                status={getAgentStatus(agent)}
                currentStage={activeRun?.stages.find(s => s.agent.toLowerCase() === agent && s.status === 'in_progress')?.stage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
