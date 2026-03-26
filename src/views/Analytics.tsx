import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';

export function Analytics() {
  const { projects, limits } = useStore();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="text-sm text-text-muted mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-text-primary">{projects.length}</div>
        </div>
        
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="text-sm text-text-muted mb-1">Active Projects</div>
          <div className="text-2xl font-bold text-accent-amber">
            {projects.filter(p => p.status === 'active').length}
          </div>
        </div>
        
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="text-sm text-text-muted mb-1">Total Spend</div>
          <div className="text-2xl font-bold text-accent-cyan">
            ${projects.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
          </div>
        </div>
        
        <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
          <div className="text-sm text-text-muted mb-1">Burn Rate</div>
          <div className="text-2xl font-bold text-text-primary">
            {limits ? `$${limits.burnRate.toFixed(2)}/min` : 'N/A'}
          </div>
        </div>
      </div>

      <EmptyState message="Charts and detailed analytics coming soon" icon="📊" />
      
      {/* TODO: Add charts using recharts: cost over time, agent utilization, stage duration trends */}
    </div>
  );
}
