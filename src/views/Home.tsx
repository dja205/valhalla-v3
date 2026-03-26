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
import { DESIGN_TEAM, BUILD_TEAM, DESIGN_ORCHESTRATOR, BUILD_ORCHESTRATOR, normalizeAgentName } from '@/lib/agentMap';
import { formatDuration, formatCost } from '@/lib/utils';
import type { AgentStatus, AgentInfo } from '@/types/api';

const PIPELINE_STAGES = [
  { key: 'request', abbr: 'req' },
  { key: 'architecture', abbr: 'arch' },
  { key: 'ux-design', abbr: 'ux' },
  { key: 'spec', abbr: 'spec' },
  { key: 'tasks', abbr: 'tasks' },
  { key: 'implementation', abbr: 'impl' },
  { key: 'review', abbr: 'review' },
  { key: 'qa', abbr: 'qa' },
  { key: 'release', abbr: 'rel' },
] as const;

function StagePipeline({ stagesCompleted, currentStage }: { stagesCompleted: string[]; currentStage: string | null }) {
  const completedSet = new Set(stagesCompleted);

  return (
    <div className="mt-4 pt-4 border-t border-bg-raised overflow-x-auto">
      <div className="flex flex-nowrap gap-3 min-w-max">
        {PIPELINE_STAGES.map(({ key, abbr }, i) => {
          const isDone = completedSet.has(key);
          const isCurrent = currentStage === key;
          return (
            <div key={key} className="flex items-center gap-1.5">
              {i > 0 && (
                <div className={`w-4 h-px ${isDone ? 'bg-success' : 'bg-bg-raised'}`} />
              )}
              <div className="flex flex-col items-center gap-1">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-[10px] text-bg-base font-bold">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <span className="w-5 h-5 rounded-full bg-accent-amber animate-pulse" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-text-muted" />
                )}
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isDone ? 'text-success' : isCurrent ? 'text-accent-amber' : 'text-text-muted'
                }`}>
                  {abbr}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Horizontal-scrolling agent panel (mobile) / grid (desktop) */
function AgentTeamPanel({
  title,
  accentClass,
  agents,
  getStatus,
  getStage,
  getModel,
  orchestrator,
}: {
  title: string;
  accentClass: string;
  agents: string[];
  getStatus: (name: string) => AgentStatus;
  getStage: (name: string) => string | undefined;
  getModel: (name: string) => string | undefined;
  orchestrator: string;
}) {
  const allAgents = [orchestrator, ...agents];

  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 ${accentClass} rounded-full`} />
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      {/* Mobile: horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:hidden">
        {allAgents.map(agent => (
          <div key={agent} className="flex-shrink-0 snap-start w-28">
            <AgentCard
              agentName={agent}
              status={getStatus(agent)}
              currentStage={getStage(agent)}
              model={getModel(agent)}
            />
          </div>
        ))}
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-3">
        {allAgents.map(agent => (
          <AgentCard
            key={agent}
            agentName={agent}
            status={getStatus(agent)}
            currentStage={getStage(agent)}
            model={getModel(agent)}
          />
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const {
    projects,
    activeRun,
    completedRuns,
    config,
    isLoading,
    error,
    lastRefreshed,
    isRefreshing,
    fetchAll,
    refresh,
    startPolling,
    stopPolling,
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

  // Build agent info lookup from config
  const agentInfoMap: Record<string, AgentInfo> = {};
  if (config?.agents) {
    for (const a of config.agents) {
      agentInfoMap[a.name.toLowerCase()] = a;
    }
  }

  const getStatus = (agentName: string): AgentStatus => {
    if (!activeRun) return 'idle';
    const activeStage = activeRun.stages.find(s => s.status === 'in_progress');
    if (activeStage && activeStage.agent.toLowerCase() === agentName.toLowerCase()) {
      return 'working';
    }
    return 'idle';
  };

  const getStage = (agentName: string): string | undefined => {
    return activeRun?.stages.find(
      s => s.agent.toLowerCase() === agentName && s.status === 'in_progress'
    )?.stage;
  };

  const getModel = (agentName: string): string | undefined => {
    return agentInfoMap[agentName.toLowerCase()]?.model;
  };

  const getCurrentPhase = (): 'backlog' | 'design' | 'build' | 'complete' | null => {
    if (!activeRun) return null;
    const activeStage = activeRun.stages.find(s => s.status === 'in_progress');
    if (!activeStage) return null;
    const normalized = normalizeAgentName(activeStage.agent);
    if (normalized === DESIGN_ORCHESTRATOR || DESIGN_TEAM.includes(normalized)) return 'design';
    if (normalized === BUILD_ORCHESTRATOR || BUILD_TEAM.includes(normalized)) return 'build';
    return null;
  };

  const backlogCount = projects.filter(
    p => p.status === 'awaiting_review' || p.runs.some(r => r.currentStage === 'request')
  ).length;
  
  // Count projects actively in design phase
  const designCount = projects.filter(p => {
    if (p.status !== 'active') return false;
    const currentRun = p.runs.find(r => r.runId === p.currentRun);
    if (!currentRun?.currentStage) return false;
    // Design stages: request, architecture, ux-design, spec
    const designStages = ['request', 'architecture', 'ux-design', 'spec'];
    return designStages.includes(currentRun.currentStage);
  }).length;
  
  // Count projects actively in build phase
  const buildCount = projects.filter(p => {
    if (p.status !== 'active') return false;
    const currentRun = p.runs.find(r => r.runId === p.currentRun);
    if (!currentRun?.currentStage) return false;
    // Build stages: tasks, implementation, review, qa, release
    const buildStages = ['tasks', 'implementation', 'review', 'qa', 'release'];
    return buildStages.includes(currentRun.currentStage);
  }).length;

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

      {/* Sticky Cost/Limits Header */}
      <div className="sticky top-0 z-20">
        <CostSummaryBar />
      </div>

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
                Current Stage:{' '}
                <span className="text-accent-amber font-medium capitalize">
                  {activeRun.currentStage || 'Unknown'}
                </span>
              </div>
              {(() => {
                const inProgressStage = activeRun.stages.find(s => s.status === 'in_progress');
                return inProgressStage ? (
                  <div className="text-text-muted text-sm mt-1">
                    Agent:{' '}
                    <span className="text-accent-cyan font-medium capitalize">
                      {inProgressStage.agent}
                    </span>
                  </div>
                ) : null;
              })()}
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
          <StagePipeline
            stagesCompleted={activeRun.stagesCompleted}
            currentStage={activeRun.currentStage}
          />
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
        designCount={designCount}
        buildCount={buildCount}
        completeCount={completedRuns.length}
      />

      {/* Agent Team Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentTeamPanel
          title="Design Team"
          accentClass="bg-accent-amber"
          orchestrator={DESIGN_ORCHESTRATOR}
          agents={DESIGN_TEAM}
          getStatus={getStatus}
          getStage={getStage}
          getModel={getModel}
        />
        <AgentTeamPanel
          title="Build Team"
          accentClass="bg-accent-cyan"
          orchestrator={BUILD_ORCHESTRATOR}
          agents={BUILD_TEAM}
          getStatus={getStatus}
          getStage={getStage}
          getModel={getModel}
        />
      </div>
    </div>
  );
}
