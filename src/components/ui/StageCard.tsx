import type { RunStageEntry, StageStatus } from '@/types/api';
import { StatusBadge } from './StatusBadge';
import { AgentAvatar } from './AgentAvatar';

interface StageCardProps {
  stage: RunStageEntry;
  stageStatus: StageStatus;
}

export function StageCard({ stage, stageStatus }: StageCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AgentAvatar agent={stage.agent} size="md" />
          <div>
            <div className="font-semibold text-text-primary">{stage.stage}</div>
            <div className="text-sm text-text-muted">{stage.agent}</div>
          </div>
        </div>
        <StatusBadge status={stageStatus} />
      </div>
      
      {/* TODO: Add stage details, metrics, timeline */}
    </div>
  );
}
