import type { RunStageEntry } from '../../src/types/api';

const PREMIUM_REQUEST_COST = 0.10;

export function calculateStageCost(stage: RunStageEntry): number {
  // premiumRequests is always null currently
  if (stage.premiumRequests == null) return 0;
  return stage.premiumRequests * PREMIUM_REQUEST_COST;
}

export function calculateRunCost(stages: RunStageEntry[]): number {
  return stages.reduce((total, stage) => {
    return total + calculateStageCost(stage);
  }, 0);
}

export function calculateTotalDuration(stages: RunStageEntry[]): number {
  return stages.reduce((total, stage) => {
    return total + (stage.durationMs || 0);
  }, 0);
}
