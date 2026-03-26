import { motion } from 'framer-motion';
import { stageTransition } from '@/lib/motion';
import type { RunStageEntry } from '@/types/api';
import { AgentAvatar } from './AgentAvatar';
import { StatusBadge } from './StatusBadge';
import { formatDuration, formatCost } from '@/lib/utils';

interface JobCardProps {
  job: RunStageEntry;
  variant?: 'compact' | 'detailed';
}

export function JobCard({ job, variant = 'compact' }: JobCardProps) {
  return (
    <motion.div 
      variants={stageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-bg-surface rounded-lg p-4 border border-bg-raised"
    >
      <div className="flex items-center gap-3">
        <AgentAvatar 
          agent={job.agent} 
          size="sm" 
          status={job.status === 'running' ? 'active' : job.status === 'completed' ? 'completed' : 'idle'}
        />
        <div className="flex-1">
          <div className="font-medium text-text-primary">{job.stage}</div>
          <div className="text-sm text-text-muted">{job.agent}</div>
        </div>
        <StatusBadge status={job.status} />
      </div>
      
      {variant === 'detailed' && job.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-bg-raised text-sm text-text-muted">
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{formatDuration((new Date(job.endTime!).getTime() - new Date(job.startTime!).getTime()))}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Cost:</span>
            <span>{formatCost(job.cost)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
