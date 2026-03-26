import { AgentAvatar } from './AgentAvatar';
import { StatusBadge } from './StatusBadge';
import type { AgentStatus } from '@/types/api';

interface AgentCardProps {
  agentName: string;
  status: AgentStatus;
  currentStage?: string | null;
}

export function AgentCard({ agentName, status, currentStage }: AgentCardProps) {
  const isWorking = status === 'working';
  
  return (
    <div className={`bg-bg-surface rounded-lg p-4 border transition-all ${
      isWorking 
        ? 'border-accent-amber shadow-[0_0_12px_rgba(240,160,64,0.3)]' 
        : 'border-bg-raised hover:border-accent-cyan'
    }`}>
      <div className="flex flex-col items-center text-center gap-2">
        <div className="relative">
          <AgentAvatar agent={agentName} size="lg" status={status} />
          {isWorking && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-amber rounded-full animate-pulse" />
          )}
        </div>
        <div className="font-medium text-text-primary capitalize">{agentName}</div>
        <StatusBadge status={status} size="sm" />
        {currentStage && (
          <div className="text-xs text-text-muted truncate max-w-full">
            {currentStage}
          </div>
        )}
      </div>
    </div>
  );
}
