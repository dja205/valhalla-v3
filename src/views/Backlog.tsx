import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Overlay } from '@/components/ui/Overlay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils';
import type { ProjectSummary, RunSummary } from '@/types/api';

interface BacklogItem {
  project: ProjectSummary;
  run: RunSummary;
  issueNumber: string | null;
}

/** Parse issue number from run ID like "2025-01-15-feat-BC-03" → "BC-03" */
function parseIssueNumber(runId: string): string | null {
  const match = runId.match(/([A-Z]+-\d+(?:-[A-Z]\d+)?)/);
  return match ? match[1] : null;
}

export function Backlog() {
  const {
    projects,
    isLoading,
    lastRefreshed,
    isRefreshing,
    refresh,
    fetchAll,
    fetchArtifact,
  } = useStore();

  const [artifactCache, setArtifactCache] = useState<Record<string, string>>({});
  const [loadingArtifacts, setLoadingArtifacts] = useState<Set<string>>(new Set());
  const [overlayItem, setOverlayItem] = useState<BacklogItem | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Pull-to-refresh: track touch start position
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Build backlog items: projects awaiting_review OR any run at 'request' stage
  const backlogItems: BacklogItem[] = [];
  for (const project of projects) {
    if (project.status === 'awaiting_review') {
      const run = project.runs[0];
      if (run) {
        backlogItems.push({
          project,
          run,
          issueNumber: parseIssueNumber(run.runId),
        });
      }
    } else {
      // Check for runs in 'request' stage
      const requestRun = project.runs.find(r => r.currentStage === 'request');
      if (requestRun) {
        backlogItems.push({
          project,
          run: requestRun,
          issueNumber: parseIssueNumber(requestRun.runId),
        });
      }
    }
  }

  const loadArtifact = useCallback(
    async (projectId: string, runId: string) => {
      const key = `${projectId}/${runId}`;
      if (artifactCache[key] || loadingArtifacts.has(key)) return;

      setLoadingArtifacts(prev => new Set(prev).add(key));
      const content = await fetchArtifact(projectId, runId, '00-request');
      setLoadingArtifacts(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (content) {
        setArtifactCache(prev => ({ ...prev, [key]: content }));
      }
    },
    [artifactCache, loadingArtifacts, fetchArtifact]
  );

  const openOverlay = async (item: BacklogItem) => {
    setOverlayItem(item);
    setIsOverlayOpen(true);
    // Pre-load artifact
    await loadArtifact(item.project.projectId, item.run.runId);
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    // Keep item mounted until animation completes
    setTimeout(() => setOverlayItem(null), 300);
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const dist = e.touches[0].clientY - touchStartY;
    if (dist > 0) setPullDistance(Math.min(dist, PULL_THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      await refresh();
    }
    setTouchStartY(null);
    setPullDistance(0);
  };

  const overlayArtifact = overlayItem
    ? artifactCache[`${overlayItem.project.projectId}/${overlayItem.run.runId}`]
    : null;
  const overlayLoading = overlayItem
    ? loadingArtifacts.has(`${overlayItem.project.projectId}/${overlayItem.run.runId}`)
    : false;

  return (
    <div
      className="p-4 md:p-6 space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="flex justify-center items-center text-text-muted text-sm transition-all"
          style={{ height: pullDistance * 0.5 }}
        >
          {pullDistance >= PULL_THRESHOLD ? '↑ Release to refresh' : '↓ Pull to refresh'}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Backlog</h1>
          <p className="text-text-muted text-sm mt-1">
            {backlogItems.length} item{backlogItems.length !== 1 ? 's' : ''} queued
          </p>
        </div>
        <RefreshControl
          lastRefreshed={lastRefreshed}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard variant="job" />
          <SkeletonCard variant="job" />
          <SkeletonCard variant="job" />
        </div>
      ) : backlogItems.length === 0 ? (
        <EmptyState message="No items in backlog" icon="📋" />
      ) : (
        <div className="space-y-3">
          {backlogItems.map(item => (
            <button
              key={`${item.project.projectId}/${item.run.runId}`}
              onClick={() => openOverlay(item)}
              className="w-full text-left bg-bg-surface rounded-lg border border-bg-raised p-4 hover:border-accent-cyan/60 transition-all group focus:outline-none focus:ring-2 focus:ring-accent-cyan"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="font-semibold text-text-primary group-hover:text-accent-cyan transition-colors truncate">
                    {item.project.description || item.project.projectId}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-text-muted">
                    {item.issueNumber && (
                      <span className="font-mono bg-bg-raised px-1.5 py-0.5 rounded text-accent-cyan">
                        {item.issueNumber}
                      </span>
                    )}
                    <span className="font-mono truncate max-w-[160px]">{item.project.projectId}</span>
                    <span>·</span>
                    <span>{timeAgo(item.run.created)}</span>
                  </div>
                </div>

                {/* Status + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={item.project.status} size="sm" />
                  <svg
                    className="w-4 h-4 text-text-muted group-hover:text-accent-cyan transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full-screen overlay for request markdown */}
      {overlayItem && (
        <Overlay
          isOpen={isOverlayOpen}
          onClose={closeOverlay}
          title={overlayItem.project.description || overlayItem.project.projectId}
        >
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-text-muted">
            {overlayItem.issueNumber && (
              <span className="font-mono bg-bg-raised px-2 py-1 rounded text-accent-cyan text-xs">
                {overlayItem.issueNumber}
              </span>
            )}
            <span className="font-mono">{overlayItem.project.projectId}</span>
            <StatusBadge status={overlayItem.project.status} size="sm" />
            <span>{timeAgo(overlayItem.run.created)}</span>
          </div>

          {/* Request markdown */}
          {overlayLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-bg-raised rounded h-6 w-3/4" />
              <div className="animate-pulse bg-bg-raised rounded h-4 w-full" />
              <div className="animate-pulse bg-bg-raised rounded h-4 w-5/6" />
              <div className="animate-pulse bg-bg-raised rounded h-4 w-full" />
              <div className="animate-pulse bg-bg-raised rounded h-4 w-2/3" />
            </div>
          ) : overlayArtifact ? (
            <MarkdownRenderer content={overlayArtifact} />
          ) : (
            <EmptyState message="Request document not found" icon="📄" />
          )}
        </Overlay>
      )}
    </div>
  );
}
