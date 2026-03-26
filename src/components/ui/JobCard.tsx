import { motion } from 'framer-motion';
import { stageTransition } from '@/lib/motion';
import type { RunStageEntry, RunDetail } from '@/types/api';
import { AgentAvatar } from './AgentAvatar';
import { StatusBadge } from './StatusBadge';
import { ModelBadge } from './ModelBadge';
import { formatDuration, formatCost } from '@/lib/utils';

interface JobCardListProps {
  run: RunDetail;
  onClick?: () => void;
}

interface JobCardStageProps {
  stage: RunStageEntry;
  isActive?: boolean;
}

type JobCardProps = 
  | { variant: 'list'; run: RunDetail; onClick?: () => void }
  | { variant: 'stage'; stage: RunStageEntry; isActive?: boolean };

export function JobCard(props: JobCardProps) {
  if (props.variant === 'list') {
    return <JobCardList run={props.run} onClick={props.onClick} />;
  }
  return <JobCardStage stage={props.stage} isActive={props.isActive} />;
}

function JobCardList({ run, onClick }: JobCardListProps) {
  const statusMap: Record<string, 'completed' | 'in_progress' | 'pending'> = {
    completed: 'completed',
    active: 'in_progress',
    awaiting_review: 'pending',
    blocked: 'blocked' as 'pending',
  };
  
  return (
    <motion.div 
      variants={stageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      className="bg-bg-surface rounded-lg p-4 border border-bg-raised hover:border-accent-cyan transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary truncate">{run.projectId}</div>
          <div className="text-sm text-text-muted truncate">{run.runId}</div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={statusMap[run.status] || 'pending'} size="sm" />
          <div className="text-right">
            <div className="text-sm text-accent-amber font-medium">{formatCost(run.totalCost)}</div>
            <div className="text-xs text-text-muted">{formatDuration(run.totalDurationMs)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function JobCardStage({ stage, isActive }: JobCardStageProps) {
  const status = stage.status === 'completed' ? 'completed' : 
                 stage.status === 'in_progress' ? 'in_progress' : 'pending';
  const agentStatus = isActive ? 'working' : 'idle';
  
  return (
    <motion.div 
      variants={stageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`bg-bg-surface rounded-lg p-4 border ${
        isActive 
          ? 'border-accent-amber shadow-[0_0_12px_rgba(240,160,64,0.3)]' 
          : 'border-bg-raised'
      }`}
    >
      <div className="flex items-center gap-3">
        <AgentAvatar 
          agent={stage.agent} 
          size="sm" 
          status={agentStatus}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary capitalize">{stage.stage}</span>
            <ModelBadge model={stage.model} />
          </div>
          <div className="text-sm text-text-muted">{stage.agent}</div>
        </div>
        <div className="text-right">
          <StatusBadge status={status} size="sm" />
          <div className="text-xs text-text-muted mt-1">
            {stage.durationFormatted || formatDuration(stage.durationMs)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
