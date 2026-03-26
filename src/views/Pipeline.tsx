import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { AgentCard } from '@/components/ui/AgentCard';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';

export function Pipeline() {
  const { activeRun } = useStore();

  if (!activeRun) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Pipeline</h1>
        <EmptyState message="No active runs in the pipeline" icon="🔄" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Pipeline</h1>
      
      <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Active Run: {activeRun.id}</h2>
        <div className="text-sm text-text-muted space-y-1">
          <div>Status: <span className="text-accent-amber">{activeRun.status}</span></div>
          <div>Started: <span className="text-text-primary">{new Date(activeRun.startTime).toLocaleString()}</span></div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Design Team</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {DESIGN_TEAM.map(agent => (
            <AgentCard key={agent} agentName={agent} status="idle" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Build Team</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {BUILD_TEAM.map(agent => (
            <AgentCard key={agent} agentName={agent} status="idle" />
          ))}
        </div>
      </div>

      {/* TODO: Add pipeline flow visualization, stage details, real-time updates */}
    </div>
  );
}
