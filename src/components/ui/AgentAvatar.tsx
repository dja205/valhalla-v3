import { AGENT_AVATAR_MAP } from '@/lib/agentMap';
import type { AgentStatus } from '@/types/api';

interface AgentAvatarProps {
  agent: string;
  size?: 'sm' | 'md' | 'lg';
  status?: AgentStatus;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const statusColors = {
  idle: 'ring-text-muted',
  active: 'ring-accent-amber',
  completed: 'ring-success',
  error: 'ring-danger',
};

export function AgentAvatar({ agent, size = 'md', status }: AgentAvatarProps) {
  const avatarPath = AGENT_AVATAR_MAP[agent.toLowerCase()] || '/img/agents/default.PNG';
  const ringColor = status ? statusColors[status] : 'ring-transparent';

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ${ringColor}`}>
      <img 
        src={avatarPath} 
        alt={agent} 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
