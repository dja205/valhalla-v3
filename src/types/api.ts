export interface ProjectSummary {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'pending';
  currentStage?: string;
  activeAgents: number;
  totalCost: number;
  lastUpdated: string;
}

export interface RunDetail {
  id: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  stages: RunStageEntry[];
  totalCost: number;
  totalDuration: number;
}

export interface RunStageEntry {
  stage: string;
  agent: string;
  status: StageStatus;
  startTime?: string;
  endTime?: string;
  cost?: number;
  tokensUsed?: number;
  model?: string;
  artifacts?: string[];
}

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type AgentStatus = 'idle' | 'active' | 'completed' | 'error';

export interface AgentConfig {
  name: string;
  role: string;
  team: 'design' | 'build' | 'cross-cutting';
  model: string;
  enabled: boolean;
}

export interface LimitsSnapshot {
  maxCostPerRun: number;
  maxTokensPerStage: number;
  maxDurationMinutes: number;
  currentSpend: number;
  projectedSpend: number;
  burnRate: number;
}
