import { useState, useEffect } from 'react';
import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Overlay } from '@/components/ui/Overlay';
import { Accordion } from '@/components/ui/Accordion';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { formatDuration, formatCost, timeAgo } from '@/lib/utils';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';
import type { RunDetail, RunStageEntry } from '@/types/api';

export function Completed() {
  const { 
    completedRuns, 
    isLoading, 
    lastRefreshed, 
    isRefreshing, 
    refresh, 
    fetchAll,
    fetchArtifact 
  } = useStore();
  
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'build'>('design');
  const [artifactCache, setArtifactCache] = useState<Record<string, string>>({});
  const [loadingArtifacts, setLoadingArtifacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const loadArtifact = async (projectId: string, runId: string, stagePrefix: string) => {
    const key = `${projectId}/${runId}/${stagePrefix}`;
    if (artifactCache[key] || loadingArtifacts.has(key)) return;
    
    setLoadingArtifacts(prev => new Set(prev).add(key));
    const content = await fetchArtifact(projectId, runId, stagePrefix);
    setLoadingArtifacts(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    
    if (content) {
      setArtifactCache(prev => ({ ...prev, [key]: content }));
    }
  };

  const getStagesByTeam = (run: RunDetail, team: string[]) => {
    return run.stages.filter(s => 
      team.some(t => t.toLowerCase() === s.agent.toLowerCase())
    );
  };

  const renderStageAccordion = (stage: RunStageEntry, run: RunDetail) => {
    const stageNum = stage.stage.match(/^\d+/)?.[0] || '';
    const key = `${run.projectId}/${run.runId}/${stageNum}`;
    const artifact = artifactCache[key];
    const isLoadingArtifact = loadingArtifacts.has(key);

    return (
      <Accordion
        key={stage.stage}
        title={stage.stage}
        subtitle={stage.durationFormatted || formatDuration(stage.durationMs)}
        badge={
          <div className="flex items-center gap-2">
            <ModelBadge model={stage.model} />
            <StatusBadge status={stage.status === 'completed' ? 'completed' : 'pending'} size="sm" />
          </div>
        }
      >
        <div className="space-y-4">
          {/* Stage info */}
          <div className="flex items-center gap-3">
            <AgentAvatar agent={stage.agent} size="sm" />
            <div>
              <div className="text-sm text-text-primary capitalize">{stage.agent}</div>
              <div className="text-xs text-text-muted">{stage.provider}</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Duration:</span>
              <span className="ml-2 text-text-primary">{stage.durationFormatted || formatDuration(stage.durationMs)}</span>
            </div>
            <div>
              <span className="text-text-muted">Cost:</span>
              <span className="ml-2 text-text-primary">{formatCost(stage.premiumRequests ? stage.premiumRequests * 0.10 : null)}</span>
            </div>
          </div>

          {/* Summary excerpt */}
          {stage.summaryExcerpt && (
            <div className="text-sm text-text-muted border-l-2 border-bg-raised pl-3">
              {stage.summaryExcerpt}
            </div>
          )}

          {/* Artifact */}
          {stageNum && (
            <div className="border-t border-bg-raised pt-4">
              {artifact ? (
                <MarkdownRenderer content={artifact} />
              ) : isLoadingArtifact ? (
                <div className="animate-pulse bg-bg-raised rounded h-24" />
              ) : (
                <button
                  onClick={() => loadArtifact(run.projectId, run.runId, stageNum)}
                  className="text-accent-cyan hover:text-accent-cyan/80 text-sm"
                >
                  Load artifact...
                </button>
              )}
            </div>
          )}
        </div>
      </Accordion>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Completed Runs</h1>
          <p className="text-text-muted text-sm mt-1">
            {completedRuns.length} completed run{completedRuns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <RefreshControl 
          lastRefreshed={lastRefreshed} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard variant="job" />
          <SkeletonCard variant="job" />
          <SkeletonCard variant="job" />
        </div>
      ) : completedRuns.length === 0 ? (
        <EmptyState message="No completed runs yet" icon="✅" />
      ) : (
        <div className="space-y-3">
          {completedRuns.map((run) => (
            <button
              key={run.runId}
              onClick={() => setSelectedRun(run)}
              className="w-full bg-bg-surface rounded-lg p-4 border border-bg-raised hover:border-accent-cyan transition-colors text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary truncate">{run.projectId}</span>
                    <StatusBadge status="completed" size="sm" />
                  </div>
                  <div className="text-sm text-text-muted truncate">{run.runId}</div>
                  <div className="text-xs text-text-muted mt-1">{timeAgo(run.lastUpdated)}</div>
                </div>
                <div className="flex gap-6 text-right sm:text-left">
                  <div>
                    <div className="text-xs text-text-muted">Duration</div>
                    <div className="font-mono text-text-primary">{formatDuration(run.totalDurationMs)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Cost</div>
                    <div className="font-mono text-text-primary">{formatCost(run.totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Stages</div>
                    <div className="font-mono text-text-primary">{run.stages.length}</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Job Detail Overlay */}
      <Overlay
        isOpen={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title={selectedRun ? `${selectedRun.projectId} — ${selectedRun.runId}` : ''}
      >
        {selectedRun && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="flex flex-wrap gap-6 p-4 bg-bg-raised rounded-lg">
              <div>
                <div className="text-sm text-text-muted">Total Duration</div>
                <div className="text-xl font-mono text-text-primary">{formatDuration(selectedRun.totalDurationMs)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Total Cost</div>
                <div className="text-xl font-mono text-text-primary">{formatCost(selectedRun.totalCost)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Stages</div>
                <div className="text-xl font-mono text-text-primary">{selectedRun.stages.length}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Completed</div>
                <div className="text-sm text-text-primary">{timeAgo(selectedRun.lastUpdated)}</div>
              </div>
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden flex border-b border-bg-raised">
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'design' 
                    ? 'text-accent-amber border-b-2 border-accent-amber' 
                    : 'text-text-muted'
                }`}
              >
                Design Stages
              </button>
              <button
                onClick={() => setActiveTab('build')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'build' 
                    ? 'text-accent-cyan border-b-2 border-accent-cyan' 
                    : 'text-text-muted'
                }`}
              >
                Build Stages
              </button>
            </div>

            {/* Mobile: single column based on tab */}
            <div className="md:hidden space-y-3">
              {activeTab === 'design' 
                ? getStagesByTeam(selectedRun, DESIGN_TEAM).map(stage => 
                    renderStageAccordion(stage, selectedRun)
                  )
                : getStagesByTeam(selectedRun, BUILD_TEAM).map(stage => 
                    renderStageAccordion(stage, selectedRun)
                  )
              }
            </div>

            {/* Desktop: two columns */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {/* Design Stages */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <span className="w-2 h-2 bg-accent-amber rounded-full" />
                  Design Stages
                </h3>
                <div className="space-y-3">
                  {getStagesByTeam(selectedRun, DESIGN_TEAM).map(stage => 
                    renderStageAccordion(stage, selectedRun)
                  )}
                  {getStagesByTeam(selectedRun, DESIGN_TEAM).length === 0 && (
                    <p className="text-text-muted text-sm">No design stages</p>
                  )}
                </div>
              </div>

              {/* Build Stages */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <span className="w-2 h-2 bg-accent-cyan rounded-full" />
                  Build Stages
                </h3>
                <div className="space-y-3">
                  {getStagesByTeam(selectedRun, BUILD_TEAM).map(stage => 
                    renderStageAccordion(stage, selectedRun)
                  )}
                  {getStagesByTeam(selectedRun, BUILD_TEAM).length === 0 && (
                    <p className="text-text-muted text-sm">No build stages</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
}
