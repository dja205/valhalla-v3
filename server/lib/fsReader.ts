import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { ProjectSummary, RunSummary, RunDetail, RunStageEntry } from '../../src/types/api';

const PORTFOLIO_PATH = process.env.PORTFOLIO_PATH || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/portfolio/projects');

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
        } catch (err) {
          // Skip projects without valid state.yaml
        }
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

export async function readProjectDetail(projectId: string): Promise<ProjectSummary | null> {
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
    
    return {
      projectId: state.project_id || projectId,
      description: state.description || '',
      status: (state.status as ProjectSummary['status']) || 'completed',
      currentRun: state.current_run || null,
      lastUpdated: stat.mtime.toISOString(),
      runs,
    };
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
  try {
    // execution-log.json is a JSON array (not YAML!)
    const logPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId, 'execution-log.json');
    const content = await fs.readFile(logPath, 'utf-8');
    const stages = JSON.parse(content) as RunStageEntry[];
    return stages;
  } catch (error) {
    console.error('Error reading execution log:', error);
    return [];
  }
}

export async function readRunDetail(projectId: string, runId: string): Promise<RunDetail | null> {
  try {
    const state = await readStateYaml(projectId);
    if (!state) return null;
    
    const runMeta = state.runs?.find(r => r.run_id === runId);
    if (!runMeta) return null;
    
    const stages = await readExecutionLog(projectId, runId);
    
    // Calculate totals from stages
    const totalDurationMs = stages.reduce((sum, s) => sum + (s.durationMs || 0), 0);
    const totalCost = stages.reduce((sum, s) => {
      // premiumRequests is always null currently, so cost is 0
      return sum + (s.premiumRequests ? s.premiumRequests * 0.10 : 0);
    }, 0);
    
    return {
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
  } catch (error) {
    console.error('Error reading run detail:', error);
    return null;
  }
}

export async function listArtifacts(projectId: string, runId: string): Promise<string[]> {
  try {
    const runPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId);
    const files = await fs.readdir(runPath);
    // Filter for artifact markdown files (e.g., 00-request.md, 03-architecture.md)
    return files.filter(f => /^\d{2}-.*\.md$/.test(f));
  } catch (error) {
    console.error('Error listing artifacts:', error);
    return [];
  }
}

export async function readArtifactFile(projectId: string, runId: string, stagePrefix: string): Promise<string | null> {
  try {
    const runPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId);
    const files = await fs.readdir(runPath);
    
    // Find file matching the prefix (e.g., '00' matches '00-request.md')
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
