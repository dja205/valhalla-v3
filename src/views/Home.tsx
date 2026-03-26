import { useEffect } from 'react';
import { useStore } from '@/stores';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { CostSummaryBar } from '@/components/ui/CostSummaryBar';

export function Home() {
  const { projects, isLoading, error, lastRefreshed, isRefreshing, fetchAll, refresh, startPolling, stopPolling } = useStore();

  useEffect(() => {
    fetchAll();
    startPolling(5000);
    return () => stopPolling();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Valhalla V3</h1>
        <RefreshControl 
          lastRefreshed={lastRefreshed} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>

      {error && <ErrorBanner message={error} />}

      <CostSummaryBar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <SkeletonCard variant="stage" />
            <SkeletonCard variant="stage" />
            <SkeletonCard variant="stage" />
          </>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-bg-surface rounded-lg p-4 border border-bg-raised hover:border-accent-cyan transition-colors cursor-pointer">
              <h3 className="font-semibold text-text-primary mb-2">{project.name}</h3>
              <div className="text-sm text-text-muted space-y-1">
                <div>Status: <span className="text-text-primary">{project.status}</span></div>
                <div>Active Agents: <span className="text-text-primary">{project.activeAgents}</span></div>
                <div>Total Cost: <span className="text-accent-amber">${project.totalCost.toFixed(2)}</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TODO: Add active runs summary, recent activity, system health indicators */}
    </div>
  );
}
