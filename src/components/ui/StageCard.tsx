import { useState, useEffect } from 'react';
import type { RunStageEntry } from '@/types/api';
import { StatusBadge } from './StatusBadge';
import { AgentAvatar } from './AgentAvatar';
import { ModelBadge } from './ModelBadge';
import { formatDuration, formatCost } from '@/lib/utils';

interface StageCardProps {
  stage: RunStageEntry;
  isActive?: boolean;
  isPending?: boolean;
}

export function StageCard({ stage, isActive = false, isPending = false }: StageCardProps) {
  const [elapsedMs, setElapsedMs] = useState(stage.durationMs || 0);
  
  // Live timer for in_progress stages
  useEffect(() => {
    if (!isActive || stage.status !== 'in_progress') return;
    
    const startTime = new Date(stage.startedAt).getTime();
    
    const updateElapsed = () => {
      setElapsedMs(Date.now() - startTime);
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isActive, stage.status, stage.startedAt]);
  
  const status = stage.status === 'completed' ? 'completed' : 
                 stage.status === 'in_progress' ? 'in_progress' : 'pending';
  
  const agentStatus = isActive ? 'working' : isPending ? 'idle' : 'idle';
  
  const borderClass = isActive 
    ? 'border-accent-amber shadow-[0_0_16px_rgba(240,160,64,0.4)]'
    : stage.status === 'completed' 
      ? 'border-success/50' 
      : 'border-bg-raised';

  return (
    <div className={`bg-bg-surface rounded-lg p-4 border-2 ${borderClass} min-w-[200px] flex-shrink-0`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AgentAvatar agent={stage.agent} size="md" status={agentStatus} />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-amber rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="font-semibold text-text-primary capitalize">{stage.stage}</div>
            <div className="text-sm text-text-muted capitalize">{stage.agent}</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <StatusBadge status={status} size="sm" />
        <ModelBadge model={stage.model} />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Duration</span>
        <span className={`font-mono ${isActive ? 'text-accent-amber' : 'text-text-primary'}`}>
          {isActive ? formatDuration(elapsedMs) : stage.durationFormatted || formatDuration(stage.durationMs)}
        </span>
      </div>
      
      <div className="flex justify-between text-sm mt-1">
        <span className="text-text-muted">Cost</span>
        <span className="text-text-primary">{formatCost(stage.premiumRequests ? stage.premiumRequests * 0.10 : null)}</span>
      </div>
    </div>
  );
}

// Pending stage placeholder
interface PendingStageCardProps {
  agentName: string;
}

export function PendingStageCard({ agentName }: PendingStageCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised min-w-[200px] flex-shrink-0 opacity-60">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AgentAvatar agent={agentName} size="md" status="idle" />
          <div>
            <div className="font-semibold text-text-muted capitalize">{agentName}</div>
            <div className="text-sm text-text-muted">Pending</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <StatusBadge status="pending" size="sm" />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Duration</span>
        <span className="text-text-muted">—</span>
      </div>
      
      <div className="flex justify-between text-sm mt-1">
        <span className="text-text-muted">Cost</span>
        <span className="text-text-muted">—</span>
      </div>
    </div>
  );
}
