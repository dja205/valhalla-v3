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

const sizePx = {
  sm: 32,
  md: 48,
  lg: 64,
};

export function AgentAvatar({ agent, size = 'md', status }: AgentAvatarProps) {
  const avatarPath = AGENT_AVATAR_MAP[agent.toLowerCase()] || '/img/agents/default.PNG';
  const initials = agent.slice(0, 2).toUpperCase();
  
  // Status ring styles
  const ringStyles = {
    idle: 'ring-text-muted/50',
    working: 'ring-accent-amber shadow-[0_0_12px_rgba(240,160,64,0.5)]',
    blocked: 'ring-danger shadow-[0_0_12px_rgba(248,81,73,0.5)]',
  };
  
  const ringColor = status ? ringStyles[status] : 'ring-transparent';

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ${ringColor} relative flex-shrink-0`}
      style={{ width: sizePx[size], height: sizePx[size] }}
    >
      <img 
        src={avatarPath} 
        alt={agent} 
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to initials on error
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden absolute inset-0 bg-bg-raised flex items-center justify-center text-text-primary font-bold text-sm">
        {initials}
      </div>
    </div>
  );
}
