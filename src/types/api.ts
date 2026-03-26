// Project and Run types matching real state.yaml format
export interface ProjectSummary {
  projectId: string;
  description: string;
  status: 'active' | 'awaiting_review' | 'blocked' | 'completed';
  currentRun: string | null;
  lastUpdated: string;
  runs: RunSummary[];
}

export interface RunSummary {
  runId: string;
  status: string;
  currentStage: string | null;
  stagesCompleted: string[];
  created: string;
  lastUpdated: string;
}

// Execution log entry matching execution-log.json format
export interface RunStageEntry {
  stage: string;
  agent: string;
  model: string;
  provider: string;
  status: 'completed' | 'in_progress' | string;
  requiresChanges: boolean;
  rejected: boolean;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  durationFormatted: string;
  premiumRequests: number | null;  // always null currently
  changedFiles: string[];
  summaryExcerpt: string;
}

export interface RunDetail {
  runId: string;
  projectId: string;
  status: string;
  currentStage: string | null;
  stagesCompleted: string[];
  stages: RunStageEntry[];
  created: string;
  lastUpdated: string;
  metadata?: Record<string, unknown>;
  totalCost: number;
  totalDurationMs: number;
}

export interface AgentInfo {
  name: string;
  model: string;
  provider: string;
  team: 'design' | 'build' | 'cross-cutting';
}

export interface AgentConfigResponse {
  agents: AgentInfo[];
  designTeam: string[];
  buildTeam: string[];
}

export interface LimitsSnapshot {
  claude: { used: number; limit: number; resetAt: string | null };
  copilot: { used: number; limit: number; resetAt: string | null };
  lastUpdated: string;
}

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
export type AgentStatus = 'idle' | 'working' | 'blocked';

export interface AgentRuntimeStatus {
  name: string;
  status: AgentStatus;
  currentJob: string | null;
  currentStage: string | null;
}

export interface DashboardData {
  projects: ProjectSummary[];
  activeRun: RunDetail | null;
  completedRuns: RunDetail[];
  config: AgentConfigResponse;
  limits: LimitsSnapshot;
}
