import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const PORTFOLIO_PATH = process.env.PORTFOLIO_PATH || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/portfolio/projects');

export async function listProjects() {
  try {
    const dirs = await fs.readdir(PORTFOLIO_PATH);
    const projects = [];
    
    for (const dir of dirs) {
      const projectPath = path.join(PORTFOLIO_PATH, dir);
      const stat = await fs.stat(projectPath);
      
      if (stat.isDirectory()) {
        try {
          const statePath = path.join(projectPath, 'state.yaml');
          const stateContent = await fs.readFile(statePath, 'utf-8');
          const state = yaml.load(stateContent) as any;
          
          projects.push({
            id: dir,
            name: state.name || dir,
            status: state.status || 'pending',
            currentStage: state.currentStage,
            activeAgents: state.activeAgents || 0,
            totalCost: state.totalCost || 0,
            lastUpdated: stat.mtime.toISOString(),
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

export async function readStateYaml(projectId: string) {
  const statePath = path.join(PORTFOLIO_PATH, projectId, 'state.yaml');
  const content = await fs.readFile(statePath, 'utf-8');
  return yaml.load(content);
}

export async function readExecutionLog(projectId: string, runId: string) {
  const logPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId, 'execution.log.yaml');
  const content = await fs.readFile(logPath, 'utf-8');
  return yaml.load(content);
}

export async function readArtifactFile(projectId: string, runId: string, stage: string) {
  const artifactPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId, `${stage}.md`);
  const content = await fs.readFile(artifactPath, 'utf-8');
  return content;
}
