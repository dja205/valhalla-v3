interface PipelineFlowBarProps {
  currentPhase: 'backlog' | 'design' | 'build' | 'complete' | null;
  backlogCount?: number;
  designCount?: number;
  buildCount?: number;
  completeCount?: number;
}

const phases = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'design', label: 'Design' },
  { key: 'build', label: 'Build' },
  { key: 'complete', label: 'Complete' },
] as const;

export function PipelineFlowBar({ 
  currentPhase, 
  backlogCount = 0, 
  designCount = 0, 
  buildCount = 0, 
  completeCount = 0 
}: PipelineFlowBarProps) {
  const counts: Record<string, number> = {
    backlog: backlogCount,
    design: designCount,
    build: buildCount,
    complete: completeCount,
  };
  
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {phases.map((phase, index) => {
          const isActive = phase.key === currentPhase;
          const count = counts[phase.key] || 0;
          
          return (
            <div key={phase.key} className="flex items-center">
              <div className={`
                relative px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm
                ${isActive 
                  ? 'bg-accent-amber text-bg-base font-semibold' 
                  : 'bg-bg-raised text-text-muted hover:text-text-primary'
                }
              `}>
                {isActive && (
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-accent-amber rounded-full animate-pulse" />
                )}
                <span className="hidden sm:inline">{phase.label}</span>
                <span className="sm:hidden">{phase.label.slice(0, 1)}</span>
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    isActive ? 'bg-bg-base/20' : 'bg-bg-base'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
              {index < phases.length - 1 && (
                <div className="mx-1 sm:mx-2 text-text-muted">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
