import { AgentAvatar } from './AgentAvatar';
import { StatusBadge } from './StatusBadge';
import { ModelBadge } from './ModelBadge';
import type { AgentStatus } from '@/types/api';

interface AgentCardProps {
  agentName: string;
  status: AgentStatus;
  currentStage?: string | null;
  model?: string | null;
}

export function AgentCard({ agentName, status, currentStage, model }: AgentCardProps) {
  const isWorking = status === 'working';

  return (
    <div
      className={`bg-bg-raised rounded-lg p-3 border transition-all ${
        isWorking
          ? 'border-accent-amber shadow-[0_0_12px_rgba(240,160,64,0.4)] animate-pulse-border'
          : 'border-bg-raised hover:border-accent-cyan/50'
      }`}
    >
      <div className="flex flex-col items-center text-center gap-1.5">
        {/* Avatar with working pulse glow */}
        <div className={`relative ${isWorking ? 'drop-shadow-[0_0_6px_rgba(240,160,64,0.8)]' : ''}`}>
          <AgentAvatar agent={agentName} size="md" status={status} />
          {isWorking && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-amber rounded-full animate-pulse" />
          )}
        </div>

        {/* Name */}
        <div className="font-medium text-text-primary capitalize text-sm leading-tight">
          {agentName}
        </div>

        {/* Model badge */}
        {model && <ModelBadge model={model} />}

        {/* Status pill */}
        <StatusBadge status={status} size="sm" />

        {/* Current stage label */}
        {currentStage && (
          <div className="text-[10px] text-text-muted truncate max-w-full">{currentStage}</div>
        )}
      </div>
    </div>
  );
}
