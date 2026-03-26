import { useState, useEffect, useRef } from 'react';
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
import { formatDuration, formatCost, formatTokens, timeAgo } from '@/lib/utils';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';
import type { RunDetail, RunStageEntry } from '@/types/api';

// ---------------------------------------------------------------------------
// Swipe hook — returns touch handlers and current translate offset
// ---------------------------------------------------------------------------
interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  /** Current vertical drag offset in px (for swipe-down-to-dismiss) */
  dragY: number;
}

function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipedDown,
  threshold = 60,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipedDown?: () => void;
  threshold?: number;
}): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const [dragY, setDragY] = useState(0);

  const handlers: SwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
      setDragY(0);
    },
    onTouchMove: (e: React.TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
      const dy = touchEndY.current - startY.current;
      if (dy > 0) setDragY(dy);
    },
    onTouchEnd: () => {
      const dx = startX.current - touchEndX.current;
      const dy = startY.current - touchEndY.current; // negative = swipe down

      // Prioritise vertical dismiss gesture
      if (-dy > threshold * 1.5 && onSwipedDown) {
        onSwipedDown();
      } else if (Math.abs(dx) > Math.abs(-dy)) {
        // Horizontal swipe wins
        if (dx > threshold && onSwipeLeft) onSwipeLeft();
        if (dx < -threshold && onSwipeRight) onSwipeRight();
      }

      setDragY(0);
    },
    dragY,
  };

  return handlers;
}

// ---------------------------------------------------------------------------
// Completed view
// ---------------------------------------------------------------------------

export function Completed() {
  const {
    completedRuns,
    isLoading,
    lastRefreshed,
    isRefreshing,
    refresh,
    fetchAll,
    fetchArtifact,
  } = useStore();

  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'build'>('design');
  const [artifactCache, setArtifactCache] = useState<Record<string, string>>({});
  const [loadingArtifacts, setLoadingArtifacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset tab when a new run is opened
  useEffect(() => {
    if (selectedRun) setActiveTab('design');
  }, [selectedRun?.runId]);

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

  const getStagesByTeam = (run: RunDetail, team: string[]) =>
    run.stages.filter(s =>
      team.some(t => t.toLowerCase() === s.agent.toLowerCase())
    );

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
            <StatusBadge
              status={stage.status === 'completed' ? 'completed' : 'pending'}
              size="sm"
            />
          </div>
        }
      >
        <div className="space-y-4">
          {/* Agent info */}
          <div className="flex items-center gap-3">
            <AgentAvatar agent={stage.agent} size="sm" />
            <div>
              <div className="text-sm text-text-primary capitalize">{stage.agent}</div>
              <div className="text-xs text-text-muted">{stage.provider}</div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Duration:</span>
              <span className="ml-2 text-text-primary">
                {stage.durationFormatted || formatDuration(stage.durationMs)}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Cost:</span>
              <span className="ml-2 text-text-primary">
                {formatCost(stage.premiumRequests ? stage.premiumRequests * 0.1 : null)}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Premium reqs:</span>
              <span className="ml-2 text-text-primary">
                {stage.premiumRequests ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Model:</span>
              <span className="ml-2 text-text-primary">{stage.model}</span>
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
                  Load artifact…
                </button>
              )}
            </div>
          )}
        </div>
      </Accordion>
    );
  };

  // -------------------------------------------------------------------------
  // Mobile swipe for overlay
  // -------------------------------------------------------------------------
  const swipe = useSwipe({
    onSwipeLeft: () => setActiveTab('build'),
    onSwipeRight: () => setActiveTab('design'),
    onSwipedDown: () => setSelectedRun(null),
  });

  // Compute total tokens (placeholder — not yet in data model)
  const getTotalTokens = (_run: RunDetail): number | null => null;

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
        /* BC-06-C1: scrollable list */
        <div className="space-y-3">
          {completedRuns.map((run) => {
            const totalTokens = getTotalTokens(run);
            return (
              <button
                key={run.runId}
                onClick={() => setSelectedRun(run)}
                className="w-full bg-bg-surface rounded-lg p-4 border border-bg-raised hover:border-accent-cyan transition-colors text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Title + project + date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary truncate">
                        {run.projectId}
                      </span>
                      <StatusBadge status="completed" size="sm" />
                    </div>
                    <div className="text-sm text-text-muted truncate">{run.runId}</div>
                    <div className="text-xs text-text-muted mt-1">
                      Completed {timeAgo(run.lastUpdated)}
                    </div>
                  </div>

                  {/* Summary metrics */}
                  <div className="flex flex-wrap gap-4 text-right sm:text-left">
                    <div>
                      <div className="text-xs text-text-muted">Duration</div>
                      <div className="font-mono text-sm text-text-primary">
                        {formatDuration(run.totalDurationMs)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Cost</div>
                      <div className="font-mono text-sm text-text-primary">
                        {formatCost(run.totalCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Tokens</div>
                      <div className="font-mono text-sm text-text-primary">
                        {totalTokens != null ? formatTokens(totalTokens) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Stages</div>
                      <div className="font-mono text-sm text-text-primary">
                        {run.stages.length}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* BC-06-C2a / BC-06-C2b: Detail Overlay                              */}
      {/* ------------------------------------------------------------------ */}
      <Overlay
        isOpen={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title={selectedRun ? `${selectedRun.projectId} — ${selectedRun.runId}` : ''}
      >
        {selectedRun && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex flex-wrap gap-6 p-4 bg-bg-raised rounded-lg">
              <div>
                <div className="text-sm text-text-muted">Total Duration</div>
                <div className="text-xl font-mono text-text-primary">
                  {formatDuration(selectedRun.totalDurationMs)}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Total Cost</div>
                <div className="text-xl font-mono text-text-primary">
                  {formatCost(selectedRun.totalCost)}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Total Tokens</div>
                <div className="text-xl font-mono text-text-primary">
                  {getTotalTokens(selectedRun) != null
                    ? formatTokens(getTotalTokens(selectedRun)!)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Stages</div>
                <div className="text-xl font-mono text-text-primary">
                  {selectedRun.stages.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Completed</div>
                <div className="text-sm text-text-primary">
                  {timeAgo(selectedRun.lastUpdated)}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* BC-06-C2b: Mobile — tab switcher + swipe gestures             */}
            {/* ------------------------------------------------------------ */}
            <div
              className="md:hidden"
              {...{
                onTouchStart: swipe.onTouchStart,
                onTouchMove: swipe.onTouchMove,
                onTouchEnd: swipe.onTouchEnd,
              }}
              style={{
                transform: swipe.dragY > 0 ? `translateY(${Math.min(swipe.dragY * 0.4, 80)}px)` : undefined,
                transition: swipe.dragY > 0 ? 'none' : 'transform 0.2s ease',
                opacity: swipe.dragY > 0 ? Math.max(1 - swipe.dragY / 300, 0.5) : 1,
              }}
            >
              {/* Tab bar */}
              <div className="flex border-b border-bg-raised mb-4">
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'design'
                      ? 'text-accent-amber border-b-2 border-accent-amber'
                      : 'text-text-muted'
                  }`}
                >
                  Design
                </button>
                <button
                  onClick={() => setActiveTab('build')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'build'
                      ? 'text-accent-cyan border-b-2 border-accent-cyan'
                      : 'text-text-muted'
                  }`}
                >
                  Build
                </button>
              </div>

              {/* Swipe hint */}
              <p className="text-xs text-text-muted text-center mb-3 select-none">
                Swipe ← → to switch tabs · Swipe ↓ to dismiss
              </p>

              {/* Stage list */}
              <div className="space-y-3">
                {activeTab === 'design'
                  ? getStagesByTeam(selectedRun, DESIGN_TEAM).map(s =>
                      renderStageAccordion(s, selectedRun)
                    )
                  : getStagesByTeam(selectedRun, BUILD_TEAM).map(s =>
                      renderStageAccordion(s, selectedRun)
                    )}
                {activeTab === 'design' &&
                  getStagesByTeam(selectedRun, DESIGN_TEAM).length === 0 && (
                    <p className="text-text-muted text-sm">No design stages</p>
                  )}
                {activeTab === 'build' &&
                  getStagesByTeam(selectedRun, BUILD_TEAM).length === 0 && (
                    <p className="text-text-muted text-sm">No build stages</p>
                  )}
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* BC-06-C2a: Desktop — two-column accordion layout              */}
            {/* ------------------------------------------------------------ */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {/* Design stages — left column */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <span className="w-2 h-2 bg-accent-amber rounded-full" />
                  Design Stages
                </h3>
                <div className="space-y-3">
                  {getStagesByTeam(selectedRun, DESIGN_TEAM).map(s =>
                    renderStageAccordion(s, selectedRun)
                  )}
                  {getStagesByTeam(selectedRun, DESIGN_TEAM).length === 0 && (
                    <p className="text-text-muted text-sm">No design stages</p>
                  )}
                </div>
              </div>

              {/* Build stages — right column */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
                  <span className="w-2 h-2 bg-accent-cyan rounded-full" />
                  Build Stages
                </h3>
                <div className="space-y-3">
                  {getStagesByTeam(selectedRun, BUILD_TEAM).map(s =>
                    renderStageAccordion(s, selectedRun)
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
