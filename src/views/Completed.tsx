import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { JobCard } from '@/components/ui/JobCard';

export function Completed() {
  const { completedRuns } = useStore();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Completed Runs</h1>
      
      {completedRuns.length === 0 ? (
        <EmptyState message="No completed runs yet" icon="✅" />
      ) : (
        <div className="space-y-6">
          {completedRuns.map((run) => (
            <div key={run.id} className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{run.projectId}</h3>
                  <p className="text-sm text-text-muted">
                    {new Date(run.startTime).toLocaleDateString()} - {run.endTime && new Date(run.endTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-accent-amber font-semibold">${run.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-text-muted">{run.stages.length} stages</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {run.stages.slice(0, 3).map((stage, idx) => (
                  <JobCard key={idx} job={stage} variant="compact" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TODO: Add filtering, sorting, detailed run views */}
    </div>
  );
}
