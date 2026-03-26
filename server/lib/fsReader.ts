import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { cache } from './cache';
import type { ProjectSummary, RunSummary, RunDetail, RunStageEntry, LimitsSnapshot } from '../../src/types/api';

const PORTFOLIO_PATH = process.env.PORTFOLIO_PATH || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/portfolio/projects');

const LIMITS_FILE = process.env.LIMITS_FILE || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/data/limits-snapshot.json');

const CACHE_TTL = 10000; // 10 seconds

interface StateYaml {
  project_id: string;
  description: string;
  status: string;
  current_run: string | null;
  runs: Array<{
    run_id: string;
    project_id: string;
    status: string;
    current_stage: string | null;
    stages_completed: string[];
    created: string;
    last_updated: string;
    metadata?: Record<string, unknown>;
  }>;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const cacheKey = 'projects';
  const cached = cache.get<ProjectSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const dirs = await fs.readdir(PORTFOLIO_PATH);
    const projects: ProjectSummary[] = [];
    
    for (const dir of dirs) {
      const projectPath = path.join(PORTFOLIO_PATH, dir);
      const stat = await fs.stat(projectPath);
      
      if (stat.isDirectory()) {
        try {
          const statePath = path.join(projectPath, 'state.yaml');
          const stateContent = await fs.readFile(statePath, 'utf-8');
          const state = yaml.load(stateContent) as StateYaml;
          
          const runs: RunSummary[] = (state.runs || []).map(r => ({
            runId: r.run_id,
            status: r.status,
            currentStage: r.current_stage || null,
            stagesCompleted: r.stages_completed || [],
            created: r.created,
            lastUpdated: r.last_updated,
          }));
          
          projects.push({
            projectId: state.project_id || dir,
            description: state.description || '',
            status: (state.status as ProjectSummary['status']) || 'completed',
            currentRun: state.current_run || null,
            lastUpdated: stat.mtime.toISOString(),
            runs,
          });
        } catch {
          // Skip projects without valid state.yaml
        }
      }
    }
    
    cache.set(cacheKey, projects, CACHE_TTL);
    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

export async function readProjectDetail(projectId: string): Promise<ProjectSummary | null> {
  const cacheKey = `project:${projectId}`;
  const cached = cache.get<ProjectSummary>(cacheKey);
  if (cached) return cached;

  try {
    const statePath = path.join(PORTFOLIO_PATH, projectId, 'state.yaml');
    const stateContent = await fs.readFile(statePath, 'utf-8');
    const state = yaml.load(stateContent) as StateYaml;
    const stat = await fs.stat(statePath);
    
    const runs: RunSummary[] = (state.runs || []).map(r => ({
      runId: r.run_id,
      status: r.status,
      currentStage: r.current_stage || null,
      stagesCompleted: r.stages_completed || [],
      created: r.created,
      lastUpdated: r.last_updated,
    }));
    
    const result: ProjectSummary = {
      projectId: state.project_id || projectId,
      description: state.description || '',
      status: (state.status as ProjectSummary['status']) || 'completed',
      currentRun: state.current_run || null,
      lastUpdated: stat.mtime.toISOString(),
      runs,
    };

    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error reading project:', error);
    return null;
  }
}

export async function readStateYaml(projectId: string): Promise<StateYaml | null> {
  try {
    const statePath = path.join(PORTFOLIO_PATH, projectId, 'state.yaml');
    const content = await fs.readFile(statePath, 'utf-8');
    return yaml.load(content) as StateYaml;
  } catch (error) {
    console.error('Error reading state.yaml:', error);
    return null;
  }
}

export async function readExecutionLog(projectId: string, runId: string): Promise<RunStageEntry[]> {
  const cacheKey = `execlog:${projectId}:${runId}`;
  const cached = cache.get<RunStageEntry[]>(cacheKey);
  if (cached) return cached;

  try {
    const logPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId, 'execution-log.json');
    const content = await fs.readFile(logPath, 'utf-8');
    const stages = JSON.parse(content) as RunStageEntry[];
    cache.set(cacheKey, stages, CACHE_TTL);
    return stages;
  } catch (error) {
    console.error('Error reading execution log:', error);
    return [];
  }
}

export async function readRunDetail(projectId: string, runId: string): Promise<RunDetail | null> {
  const cacheKey = `run:${projectId}:${runId}`;
  const cached = cache.get<RunDetail>(cacheKey);
  if (cached) return cached;

  try {
    const state = await readStateYaml(projectId);
    if (!state) return null;
    
    const runMeta = state.runs?.find(r => r.run_id === runId);
    if (!runMeta) return null;
    
    const stages = await readExecutionLog(projectId, runId);
    
    const totalDurationMs = stages.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    // Check if ANY stage has premiumRequests data - if all are null, cost is unknown
    const hasAnyPremiumData = stages.some(s => s.premiumRequests !== null && s.premiumRequests !== undefined);
    const totalCost = hasAnyPremiumData
      ? stages.reduce((sum, s) => sum + ((s.premiumRequests ?? 0) * 0.10), 0)
      : null;  // null indicates unknown/unavailable cost data
    
    const result: RunDetail = {
      runId: runMeta.run_id,
      projectId: state.project_id,
      status: runMeta.status,
      currentStage: runMeta.current_stage || null,
      stagesCompleted: runMeta.stages_completed || [],
      stages,
      created: runMeta.created,
      lastUpdated: runMeta.last_updated,
      metadata: runMeta.metadata,
      totalCost,
      totalDurationMs,
    };

    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error reading run detail:', error);
    return null;
  }
}

export async function listArtifacts(projectId: string, runId: string): Promise<string[]> {
  const cacheKey = `artifacts:${projectId}:${runId}`;
  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const runPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId);
    const files = await fs.readdir(runPath);
    const artifacts = files.filter(f => /^\d{2}-.*\.md$/.test(f));
    cache.set(cacheKey, artifacts, CACHE_TTL);
    return artifacts;
  } catch (error) {
    console.error('Error listing artifacts:', error);
    return [];
  }
}

export async function readArtifactFile(projectId: string, runId: string, stagePrefix: string): Promise<string | null> {
  try {
    const runPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId);
    const files = await fs.readdir(runPath);
    
    const matchingFile = files.find(f => f.startsWith(stagePrefix) && f.endsWith('.md'));
    
    if (!matchingFile) {
      return null;
    }
    
    const artifactPath = path.join(runPath, matchingFile);
    const content = await fs.readFile(artifactPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading artifact:', error);
    return null;
  }
}

export async function readLimitsSnapshot(): Promise<LimitsSnapshot> {
  const cacheKey = 'limits';
  const cached = cache.get<LimitsSnapshot>(cacheKey);
  if (cached) return cached;

  const defaults: LimitsSnapshot = {
    claude: { used: 0, limit: 1000, resetAt: null },
    copilot: { used: 0, limit: 300, resetAt: null },
    lastUpdated: new Date().toISOString(),
  };

  try {
    const content = await fs.readFile(LIMITS_FILE, 'utf-8');
    const limits = JSON.parse(content) as LimitsSnapshot;
    cache.set(cacheKey, limits, 30000); // 30s TTL for limits
    return limits;
  } catch {
    cache.set(cacheKey, defaults, 30000);
    return defaults;
  }
}
