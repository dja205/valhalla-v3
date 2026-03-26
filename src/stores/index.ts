import { create } from 'zustand';
import type {
  ProjectSummary,
  RunDetail,
  AgentConfigResponse,
  LimitsSnapshot,
  DashboardData,
  AgentRuntimeStatus,
  AnalyticsData
} from '@/types/api';

interface StoreState {
  projects: ProjectSummary[];
  activeRun: RunDetail | null;
  completedRuns: RunDetail[];
  config: AgentConfigResponse | null;
  limits: LimitsSnapshot | null;
  agents: AgentRuntimeStatus[];
  analytics: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;

  fetchAll: () => Promise<void>;
  refresh: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  fetchArtifact: (projectId: string, runId: string, stage: string) => Promise<string | null>;
  fetchAnalytics: () => Promise<void>;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  projects: [],
  activeRun: null,
  completedRuns: [],
  config: null,
  limits: null,
  agents: [],
  analytics: null,
  isLoading: false,
  error: null,
  lastRefreshed: null,
  isRefreshing: false,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      // Primary: use the dashboard endpoint for efficiency
      const res = await fetch('/api/dashboard');

      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard: ${res.status}`);
      }

      const data: DashboardData = await res.json();

      set({
        projects: data.projects,
        activeRun: data.activeRun,
        completedRuns: data.completedRuns,
        config: data.config,
        limits: data.limits,
        isLoading: false,
        lastRefreshed: new Date()
      });

      // Fetch agents separately (non-blocking)
      fetch('/api/agents')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((agents: AgentRuntimeStatus[]) => set({ agents }))
        .catch(() => { /* agents fetch is best-effort */ });

    } catch (error) {
      console.error('Dashboard fetch error:', error);

      // Fallback: try individual endpoints
      try {
        const [projRes, agentsRes] = await Promise.allSettled([
          fetch('/api/projects'),
          fetch('/api/agents'),
        ]);

        const projects: ProjectSummary[] = projRes.status === 'fulfilled' && projRes.value.ok
          ? await projRes.value.json()
          : [];

        const agents: AgentRuntimeStatus[] = agentsRes.status === 'fulfilled' && agentsRes.value.ok
          ? await agentsRes.value.json()
          : [];

        set({
          projects,
          agents,
          isLoading: false,
          lastRefreshed: new Date(),
          error: 'Dashboard unavailable — using partial data',
        });
      } catch {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        });
      }
    }
  },

  refresh: async () => {
    set({ isRefreshing: true });
    await get().fetchAll();
    set({ isRefreshing: false });
  },

  startPolling: (intervalMs = 10000) => {
    get().stopPolling();
    get().fetchAll();
    pollingInterval = setInterval(() => {
      get().fetchAll();
    }, intervalMs);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },

  fetchArtifact: async (projectId: string, runId: string, stage: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/runs/${runId}/artifacts/${stage}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.content || null;
    } catch (error) {
      console.error('Artifact fetch error:', error);
      return null;
    }
  },

  fetchAnalytics: async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data: AnalyticsData = await res.json();
      set({ analytics: data });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  },
}));
