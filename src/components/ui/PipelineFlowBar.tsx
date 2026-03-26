interface PipelineFlowBarProps {
  stages: string[];
  currentStage: string | null;
  jobCounts: Record<string, number>;
}

export function PipelineFlowBar({ stages, currentStage, jobCounts }: PipelineFlowBarProps) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex items-center gap-2 overflow-x-auto">
        {stages.map((stage, index) => {
          const isActive = stage === currentStage;
          const count = jobCounts[stage] || 0;
          
          return (
            <div key={stage} className="flex items-center">
              <div className={`
                px-4 py-2 rounded-lg whitespace-nowrap
                ${isActive ? 'bg-accent-amber text-bg-base font-semibold' : 'bg-bg-raised text-text-muted'}
              `}>
                {stage} {count > 0 && `(${count})`}
              </div>
              {index < stages.length - 1 && (
                <div className="mx-2 text-text-muted">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
