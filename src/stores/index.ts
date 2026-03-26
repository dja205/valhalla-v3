import { create } from 'zustand';
import type { 
  ProjectSummary, 
  RunDetail, 
  AgentConfigResponse, 
  LimitsSnapshot,
  DashboardData 
} from '@/types/api';

interface StoreState {
  projects: ProjectSummary[];
  activeRun: RunDetail | null;
  completedRuns: RunDetail[];
  config: AgentConfigResponse | null;
  limits: LimitsSnapshot | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  
  fetchAll: () => Promise<void>;
  refresh: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  fetchArtifact: (projectId: string, runId: string, stage: string) => Promise<string | null>;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  projects: [],
  activeRun: null,
  completedRuns: [],
  config: null,
  limits: null,
  isLoading: false,
  error: null,
  lastRefreshed: null,
  isRefreshing: false,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use the dashboard endpoint for efficiency
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
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      });
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
}));
