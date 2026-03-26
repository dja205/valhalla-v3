import { AgentAvatar } from './AgentAvatar';
import type { AgentStatus } from '@/types/api';

interface AgentCardProps {
  agentName: string;
  status: AgentStatus;
}

export function AgentCard({ agentName, status }: AgentCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised hover:border-accent-cyan transition-colors">
      <div className="flex flex-col items-center text-center gap-2">
        <AgentAvatar agent={agentName} size="lg" status={status} />
        <div className="font-medium text-text-primary capitalize">{agentName}</div>
        <div className="text-xs text-text-muted capitalize">{status}</div>
      </div>
    </div>
  );
}
