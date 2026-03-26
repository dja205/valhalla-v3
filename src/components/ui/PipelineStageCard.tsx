import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RunStageEntry } from '@/types/api';
import { AgentAvatar } from './AgentAvatar';
import { StatusBadge } from './StatusBadge';
import { ModelBadge } from './ModelBadge';
import { STAGE_NAME_MAP } from '@/lib/agentMap';
import { formatDuration, formatCost } from '@/lib/utils';
import { pipelineStageVariants, jobCardVariants } from '@/lib/motion';

// ────────────────────────────────────────────────────────────────────────────
// Active stage pulsing glow (respects prefers-reduced-motion via CSS)
// ────────────────────────────────────────────────────────────────────────────
const AMBER_GLOW = '0 0 0 2px #f0a04088, 0 0 20px 4px #f0a04044';
const CYAN_GLOW  = '0 0 0 2px #58a6ff88, 0 0 20px 4px #58a6ff44';

interface PipelineStageCardProps {
  agentName: string;
  stage?: RunStageEntry;
  isActive?: boolean;
  phaseColor?: 'amber' | 'cyan';
}

export function PipelineStageCard({
  agentName,
  stage,
  isActive = false,
  phaseColor = 'amber',
}: PipelineStageCardProps) {
  const [elapsedMs, setElapsedMs] = useState(stage?.durationMs ?? 0);
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  // Live timer for in_progress stages
  useEffect(() => {
    if (!isActive || stage?.status !== 'in_progress') return;
    const startTime = new Date(stage.startedAt).getTime();
    const update = () => setElapsedMs(Date.now() - startTime);
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isActive, stage?.status, stage?.startedAt]);

  // Pulse glow animation (manual JS fallback — CSS handles prefers-reduced-motion)
  useEffect(() => {
    if (!isActive) return;
    let frame = 0;
    let raf: number;
    const animate = () => {
      frame++;
      // 2-second cycle (120 frames @ 60fps)
      setGlowIntensity(0.3 + 0.7 * (0.5 + 0.5 * Math.sin((frame / 120) * Math.PI * 2)));
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  const isCompleted = stage?.status === 'completed';
  const isPending = !stage;
  const stageName = STAGE_NAME_MAP[agentName.toLowerCase()] ?? agentName;

  // Border + glow styling
  const glowStyle = isActive
    ? {
        boxShadow: phaseColor === 'amber'
          ? AMBER_GLOW.replace(/88/g, Math.round(glowIntensity * 0xff).toString(16).padStart(2, '0'))
          : CYAN_GLOW.replace(/88/g, Math.round(glowIntensity * 0xff).toString(16).padStart(2, '0')),
        transition: 'box-shadow 0.1s ease-in-out',
      }
    : {};

  const borderClass = isActive
    ? phaseColor === 'amber' ? 'border-accent-amber' : 'border-accent-cyan'
    : isCompleted
      ? 'border-success/40'
      : 'border-bg-raised';

  const agentStatus = isActive ? 'working' : isPending ? 'idle' : 'idle';

  // Cost: use premiumRequests if available, else show —
  const cost = stage?.premiumRequests != null ? stage.premiumRequests * 0.10 : null;

  return (
    <motion.div
      variants={pipelineStageVariants}
      className={`
        relative bg-bg-surface rounded-xl border-2 ${borderClass}
        min-w-[200px] max-w-[220px] flex-shrink-0 flex flex-col
        ${isPending ? 'opacity-50' : ''}
      `}
      style={glowStyle}
    >
      {/* Active badge */}
      {isActive && (
        <span className={`
          absolute -top-2 left-4 text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${phaseColor === 'amber' ? 'bg-accent-amber text-bg-base' : 'bg-accent-cyan text-bg-base'}
        `}>
          ACTIVE
        </span>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Agent header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <AgentAvatar agent={agentName} size="md" status={agentStatus} />
            {isActive && (
              <span className={`
                absolute -top-1 -right-1 w-3 h-3 rounded-full
                ${phaseColor === 'amber' ? 'bg-accent-amber' : 'bg-accent-cyan'}
                motion-safe:animate-ping
              `} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary capitalize truncate">
              {stageName}
            </div>
            <div className="text-xs text-text-muted capitalize truncate">{agentName}</div>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between gap-1">
          <StatusBadge
            status={
              isActive ? 'in_progress'
              : isCompleted ? 'completed'
              : 'pending'
            }
            size="sm"
          />
          {stage?.model && <ModelBadge model={stage.model} />}
        </div>

        {/* Metrics */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Duration</span>
            <span className={`font-mono text-xs ${isActive ? (phaseColor === 'amber' ? 'text-accent-amber' : 'text-accent-cyan') : 'text-text-primary'}`}>
              {isPending ? '—' : isActive ? formatDuration(elapsedMs) : (stage?.durationFormatted || formatDuration(stage?.durationMs ?? 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Cost</span>
            <span className="text-text-primary text-xs">
              {isPending ? '—' : formatCost(cost)}
            </span>
          </div>
        </div>

        {/* Job card — shown when there's a stage entry */}
        <AnimatePresence mode="popLayout">
          {stage && (
            <motion.div
              key={`job-${agentName}`}
              variants={jobCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-1"
            >
              <PipelineJobCard stage={stage} phaseColor={phaseColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Compact job card shown within a stage card
// ────────────────────────────────────────────────────────────────────────────
interface PipelineJobCardProps {
  stage: RunStageEntry;
  phaseColor?: 'amber' | 'cyan';
}

function PipelineJobCard({ stage, phaseColor = 'amber' }: PipelineJobCardProps) {
  const isActive = stage.status === 'in_progress';
  const accentClass = phaseColor === 'amber' ? 'text-accent-amber' : 'text-accent-cyan';
  const borderClass = phaseColor === 'amber' ? 'border-accent-amber/20' : 'border-accent-cyan/20';

  return (
    <div className={`rounded-lg bg-bg-raised border ${borderClass} p-2.5 space-y-1`}>
      {/* Title line */}
      <div className={`text-xs font-semibold ${accentClass} capitalize truncate`}>
        {stage.stage}
      </div>

      {/* Summary excerpt */}
      {stage.summaryExcerpt && (
        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
          {stage.summaryExcerpt}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {stage.changedFiles.length > 0 && (
          <span className="text-[10px] text-text-muted">
            {stage.changedFiles.length} file{stage.changedFiles.length !== 1 ? 's' : ''}
          </span>
        )}
        {isActive && (
          <span className={`text-[10px] font-medium ${accentClass} flex items-center gap-1`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${phaseColor === 'amber' ? 'bg-accent-amber' : 'bg-accent-cyan'} motion-safe:animate-pulse`} />
            running
          </span>
        )}
        {stage.requiresChanges && (
          <span className="text-[10px] text-danger">needs review</span>
        )}
      </div>
    </div>
  );
}
