import type { RunStageEntry } from '../../src/types/api';

const PREMIUM_REQUEST_COST = 0.10;

export function calculateStageCost(stage: RunStageEntry): number {
  if (stage.cost != null) return stage.cost;
  
  // Fallback: estimate based on premium requests if available
  const premiumRequests = (stage as any).premiumRequests || 0;
  return premiumRequests * PREMIUM_REQUEST_COST;
}

export function calculateRunCost(stages: RunStageEntry[]): number {
  return stages.reduce((total, stage) => {
    return total + calculateStageCost(stage);
  }, 0);
}
