import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';

export function Backlog() {
  const { projects } = useStore();
  
  const pendingProjects = projects.filter(p => p.status === 'pending');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Backlog</h1>
      
      {pendingProjects.length === 0 ? (
        <EmptyState message="No pending projects in backlog" icon="📋" />
      ) : (
        <div className="space-y-4">
          {pendingProjects.map((project) => (
            <div key={project.id} className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <h3 className="font-semibold text-text-primary mb-2">{project.name}</h3>
              <p className="text-sm text-text-muted">Waiting to be scheduled...</p>
            </div>
          ))}
        </div>
      )}
      
      {/* TODO: Add backlog queue, priority ordering, estimated start times */}
    </div>
  );
}
