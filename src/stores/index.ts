import { create } from 'zustand';
import type { ProjectSummary, RunDetail, AgentConfig, LimitsSnapshot } from '@/types/api';

interface StoreState {
  projects: ProjectSummary[];
  activeRun: RunDetail | null;
  completedRuns: RunDetail[];
  config: AgentConfig[];
  limits: LimitsSnapshot | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  
  fetchAll: () => Promise<void>;
  refresh: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useStore = create<StoreState>((set, get) => ({
  projects: [],
  activeRun: null,
  completedRuns: [],
  config: [],
  limits: null,
  isLoading: false,
  error: null,
  lastRefreshed: null,
  isRefreshing: false,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [projectsRes, configRes, limitsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/config'),
        fetch('/api/limits'),
      ]);

      if (!projectsRes.ok || !configRes.ok || !limitsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const projects = await projectsRes.json();
      const config = await configRes.json();
      const limits = await limitsRes.json();

      set({ 
        projects, 
        config, 
        limits, 
        isLoading: false, 
        lastRefreshed: new Date() 
      });
    } catch (error) {
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

  startPolling: (intervalMs = 5000) => {
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
}));
