import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { StageCard, PendingStageCard } from '@/components/ui/StageCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { DESIGN_TEAM, BUILD_TEAM } from '@/lib/agentMap';
import { stageTransition } from '@/lib/motion';

export function Pipeline() {
  const { 
    activeRun, 
    isLoading, 
    lastRefreshed, 
    isRefreshing, 
    refresh, 
    fetchAll, 
    startPolling, 
    stopPolling 
  } = useStore();

  useEffect(() => {
    fetchAll();
    startPolling(10000);
    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  // Get stages by agent, mapping execution-log entries
  const getStageForAgent = (agentName: string) => {
    if (!activeRun) return null;
    return activeRun.stages.find(s => s.agent.toLowerCase() === agentName.toLowerCase());
  };

  // Check if a stage is active (in_progress)
  const isStageActive = (agentName: string) => {
    const stage = getStageForAgent(agentName);
    return stage?.status === 'in_progress';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Pipeline</h1>
        <RefreshControl 
          lastRefreshed={lastRefreshed} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              <SkeletonCard variant="stage" />
              <SkeletonCard variant="stage" />
              <SkeletonCard variant="stage" />
            </div>
          </div>
        </div>
      ) : !activeRun ? (
        <div className="space-y-6">
          {/* Design Phase - Pending */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-accent-amber/50 rounded-full" />
              <h2 className="text-lg font-semibold text-text-primary">Design Phase</h2>
              <span className="text-sm text-text-muted">(No active run)</span>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4">
                {DESIGN_TEAM.map(agent => (
                  <PendingStageCard key={agent} agentName={agent} />
                ))}
              </div>
            </div>
          </section>

          {/* Build Phase - Pending */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-accent-cyan/50 rounded-full" />
              <h2 className="text-lg font-semibold text-text-primary">Build Phase</h2>
              <span className="text-sm text-text-muted">(No active run)</span>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4">
                {BUILD_TEAM.map(agent => (
                  <PendingStageCard key={agent} agentName={agent} />
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Run Info */}
          <div className="bg-bg-surface rounded-lg p-4 border border-accent-amber/50">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-accent-amber rounded-full animate-pulse" />
              <span className="font-medium text-text-primary">{activeRun.projectId}</span>
              <span className="text-text-muted">•</span>
              <span className="text-sm text-text-muted truncate">{activeRun.runId}</span>
            </div>
          </div>

          {/* Design Phase */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${
                DESIGN_TEAM.some(a => isStageActive(a)) 
                  ? 'bg-accent-amber animate-pulse' 
                  : 'bg-accent-amber/50'
              }`} />
              <h2 className="text-lg font-semibold text-text-primary">Design Phase</h2>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <AnimatePresence mode="popLayout">
                <motion.div 
                  className="flex gap-4"
                  variants={stageTransition}
                  initial="hidden"
                  animate="visible"
                >
                  {DESIGN_TEAM.map(agentName => {
                    const stage = getStageForAgent(agentName);
                    const isActive = isStageActive(agentName);
                    
                    if (stage) {
                      return (
                        <StageCard 
                          key={agentName} 
                          stage={stage} 
                          isActive={isActive}
                        />
                      );
                    }
                    return <PendingStageCard key={agentName} agentName={agentName} />;
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* Build Phase */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${
                BUILD_TEAM.some(a => isStageActive(a)) 
                  ? 'bg-accent-cyan animate-pulse' 
                  : 'bg-accent-cyan/50'
              }`} />
              <h2 className="text-lg font-semibold text-text-primary">Build Phase</h2>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <AnimatePresence mode="popLayout">
                <motion.div 
                  className="flex gap-4"
                  variants={stageTransition}
                  initial="hidden"
                  animate="visible"
                >
                  {BUILD_TEAM.map(agentName => {
                    const stage = getStageForAgent(agentName);
                    const isActive = isStageActive(agentName);
                    
                    if (stage) {
                      return (
                        <StageCard 
                          key={agentName} 
                          stage={stage} 
                          isActive={isActive}
                        />
                      );
                    }
                    return <PendingStageCard key={agentName} agentName={agentName} />;
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
