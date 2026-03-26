import { useState, useEffect } from 'react';
import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { Accordion } from '@/components/ui/Accordion';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils';

export function Backlog() {
  const { projects, isLoading, lastRefreshed, isRefreshing, refresh, fetchAll, fetchArtifact } = useStore();
  const [artifactCache, setArtifactCache] = useState<Record<string, string>>({});
  const [loadingArtifacts, setLoadingArtifacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const awaitingProjects = projects.filter(p => p.status === 'awaiting_review');

  const loadArtifact = async (projectId: string, runId: string) => {
    const key = `${projectId}/${runId}`;
    if (artifactCache[key] || loadingArtifacts.has(key)) return;
    
    setLoadingArtifacts(prev => new Set(prev).add(key));
    const content = await fetchArtifact(projectId, runId, '00');
    setLoadingArtifacts(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    
    if (content) {
      setArtifactCache(prev => ({ ...prev, [key]: content }));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Backlog</h1>
          <p className="text-text-muted text-sm mt-1">
            {awaitingProjects.length} project{awaitingProjects.length !== 1 ? 's' : ''} awaiting review
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
        </div>
      ) : awaitingProjects.length === 0 ? (
        <EmptyState message="No projects awaiting review" icon="📋" />
      ) : (
        <div className="space-y-4">
          {awaitingProjects.map((project) => {
            const latestRun = project.runs[0];
            const key = latestRun ? `${project.projectId}/${latestRun.runId}` : null;
            const artifact = key ? artifactCache[key] : null;
            const isLoadingArtifact = key ? loadingArtifacts.has(key) : false;

            return (
              <div 
                key={project.projectId} 
                className="bg-bg-surface rounded-lg border border-bg-raised overflow-hidden"
              >
                <Accordion
                  title={project.description || project.projectId}
                  subtitle={latestRun ? timeAgo(latestRun.created) : ''}
                  badge={<StatusBadge status="awaiting_review" size="sm" />}
                  defaultOpen={false}
                >
                  <div className="space-y-4">
                    {/* Project info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Project ID:</span>
                        <span className="ml-2 text-text-primary font-mono">{project.projectId}</span>
                      </div>
                      {latestRun && (
                        <div>
                          <span className="text-text-muted">Run ID:</span>
                          <span className="ml-2 text-text-primary font-mono truncate">{latestRun.runId}</span>
                        </div>
                      )}
                    </div>

                    {/* Request artifact */}
                    {latestRun && (
                      <div className="border-t border-bg-raised pt-4">
                        <h4 className="text-sm font-medium text-text-muted mb-2">Request</h4>
                        {artifact ? (
                          <MarkdownRenderer content={artifact} />
                        ) : isLoadingArtifact ? (
                          <div className="animate-pulse bg-bg-raised rounded h-32" />
                        ) : (
                          <button
                            onClick={() => loadArtifact(project.projectId, latestRun.runId)}
                            className="text-accent-cyan hover:text-accent-cyan/80 text-sm"
                          >
                            Load request details...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Accordion>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
