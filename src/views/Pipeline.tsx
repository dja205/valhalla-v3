import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PipelineStageCard } from '@/components/ui/PipelineStageCard';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';
import { stageRowVariants } from '@/lib/motion';
import type { RunDetail } from '@/types/api';

// ─── Phase header ─────────────────────────────────────────────────────────

interface PhaseHeaderProps {
  label: string;
  color: 'amber' | 'cyan';
  isLive: boolean;
  stageName?: string | null;
}

function PhaseHeader({ label, color, isLive, stageName }: PhaseHeaderProps) {
  const dotClass = isLive
    ? color === 'amber'
      ? 'bg-accent-amber motion-safe:animate-pulse'
      : 'bg-accent-cyan motion-safe:animate-pulse'
    : color === 'amber'
      ? 'bg-accent-amber/40'
      : 'bg-accent-cyan/40';

  const labelClass = color === 'amber' ? 'text-accent-amber' : 'text-accent-cyan';

  return (
    <div className="flex items-center gap-3 mb-5 px-4 md:px-0">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dotClass}`} />
      <h2 className="text-lg font-bold text-text-primary">{label}</h2>
      {isLive && stageName && (
        <span className={`text-sm font-medium ${labelClass} truncate`}>
          → {stageName}
        </span>
      )}
      {!isLive && (
        <span className="text-sm text-text-muted">(idle)</span>
      )}
    </div>
  );
}

// ─── Phase flow row ───────────────────────────────────────────────────────

interface PhaseFlowProps {
  agents: string[];
  run: RunDetail | null;
  phaseColor: 'amber' | 'cyan';
}

function PhaseFlow({ agents, run, phaseColor }: PhaseFlowProps) {
  const getStageForAgent = (agentName: string) => {
    if (!run) return undefined;
    return run.stages.find(s => s.agent.toLowerCase() === agentName.toLowerCase());
  };

  const isStageActive = (agentName: string) => {
    const stage = getStageForAgent(agentName);
    return stage?.status === 'in_progress';
  };

  return (
    // Horizontal scroll container with snap
    <div className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth"
         style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
      <motion.div
        className="flex gap-4"
        style={{ width: 'max-content' }}
        variants={stageRowVariants}
        initial="hidden"
        animate="visible"
      >
        {agents.map((agentName) => {
          const stage = getStageForAgent(agentName);
          const isActive = isStageActive(agentName);

          return (
            <div
              key={agentName}
              style={{ scrollSnapAlign: 'start' }}
            >
              <PipelineStageCard
                agentName={agentName}
                stage={stage}
                isActive={isActive}
                phaseColor={phaseColor}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Connector bar between phases ─────────────────────────────────────────

function PhaseSeparator() {
  return (
    <div className="relative flex items-center my-2">
      <div className="flex-1 h-px bg-bg-raised" />
      <span className="mx-4 text-xs text-text-muted font-medium px-2 py-1 rounded-full border border-bg-raised bg-bg-surface">
        ↓ Build Phase
      </span>
      <div className="flex-1 h-px bg-bg-raised" />
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────

function PipelineSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map(phase => (
        <section key={phase}>
          <div className="h-6 w-40 bg-bg-surface rounded mb-5 animate-pulse" />
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} variant="stage" />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Active run info bar ──────────────────────────────────────────────────

interface RunInfoBarProps {
  run: RunDetail;
}

function RunInfoBar({ run }: RunInfoBarProps) {
  const stagesTotal = run.stages.length;
  const stagesDone  = run.stages.filter(s => s.status === 'completed').length;
  const pct = stagesTotal > 0 ? Math.round((stagesDone / stagesTotal) * 100) : 0;

  return (
    <div className="bg-bg-surface rounded-xl p-4 border border-accent-amber/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-2 h-2 bg-accent-amber rounded-full motion-safe:animate-pulse flex-shrink-0" />
          <span className="font-semibold text-text-primary truncate">{run.projectId}</span>
          <span className="text-text-muted hidden sm:block">·</span>
          <span className="text-sm text-text-muted truncate hidden sm:block">{run.runId}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-muted">
            <span className="text-text-primary font-medium">{stagesDone}</span>/{stagesTotal} stages
          </span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-bg-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-amber rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-text-muted">{pct}%</span>
          </div>
        </div>
      </div>
      {run.currentStage && (
        <div className="mt-2 text-xs text-text-muted">
          Current stage: <span className="text-accent-amber capitalize">{run.currentStage}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────

export function Pipeline() {
  const {
    activeRun,
    isLoading,
    lastRefreshed,
    isRefreshing,
    refresh,
    fetchAll,
    startPolling,
    stopPolling,
  } = useStore();

  useEffect(() => {
    fetchAll();
    startPolling(10_000);
    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  // Which phase is currently live
  const designAgents = DESIGN_TEAM;
  const buildAgents  = BUILD_TEAM;

  const isDesignLive = activeRun
    ? designAgents.some(a => activeRun.stages.find(s => s.agent.toLowerCase() === a && s.status === 'in_progress'))
    : false;

  const isBuildLive = activeRun
    ? buildAgents.some(a => activeRun.stages.find(s => s.agent.toLowerCase() === a && s.status === 'in_progress'))
    : false;

  const activeStageName = activeRun?.currentStage ?? null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Pipeline</h1>
          <p className="text-sm text-text-muted mt-1">Two-phase delivery flow</p>
        </div>
        <RefreshControl
          lastRefreshed={lastRefreshed}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PipelineSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Active run info */}
            {activeRun && <RunInfoBar run={activeRun} />}

            {/* ── Design Phase ───────────────────────────────────── */}
            <section>
              <PhaseHeader
                label="Design Phase"
                color="amber"
                isLive={isDesignLive}
                stageName={isDesignLive ? activeStageName : null}
              />
              <PhaseFlow
                agents={designAgents}
                run={activeRun}
                phaseColor="amber"
              />
            </section>

            <PhaseSeparator />

            {/* ── Build Phase ────────────────────────────────────── */}
            <section>
              <PhaseHeader
                label="Build Phase"
                color="cyan"
                isLive={isBuildLive}
                stageName={isBuildLive ? activeStageName : null}
              />
              <PhaseFlow
                agents={buildAgents}
                run={activeRun}
                phaseColor="cyan"
              />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
