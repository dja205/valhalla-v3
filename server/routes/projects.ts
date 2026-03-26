import { Router } from 'express';
import { listProjects, readProjectDetail, readRunDetail, readArtifactFile, listArtifacts, readLimitsSnapshot } from '../lib/fsReader';
import { parseConfig } from '../lib/configParser';
import type { DashboardData } from '../../src/types/api';

const router = Router();

// Validate path segments to prevent path traversal attacks
function isValidPathSegment(segment: string): boolean {
  return !!segment && !segment.includes('..') && !segment.includes('/') && !segment.includes('\\');
}

// GET /api/projects - List all projects
router.get('/', async (_req, res) => {
  try {
    const projects = await listProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /api/dashboard - Single endpoint for all dashboard data
// IMPORTANT: This must be before /:id to avoid route shadowing
router.get('/dashboard', async (_req, res) => {
  try {
    const [projects, config, limits] = await Promise.all([
      listProjects(),
      parseConfig(),
      readLimitsSnapshot(),
    ]);
    
    // Find active run
    let activeRun = null;
    const completedRuns = [];
    
    for (const project of projects) {
      if (project.status === 'active' && project.currentRun) {
        const runDetail = await readRunDetail(project.projectId, project.currentRun);
        if (runDetail) {
          activeRun = runDetail;
        }
      }
      
      for (const run of project.runs) {
        if (run.status === 'completed') {
          const runDetail = await readRunDetail(project.projectId, run.runId);
          if (runDetail) {
            completedRuns.push(runDetail);
          }
        }
      }
    }
    
    // Sort completed runs by lastUpdated descending
    completedRuns.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    
    const dashboard: DashboardData = {
      projects,
      activeRun,
      completedRuns,
      config,
      limits,
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error building dashboard:', error);
    res.status(500).json({ error: 'Failed to build dashboard' });
  }
});

// GET /api/projects/:id - Get project detail
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidPathSegment(id)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  try {
    const project = await readProjectDetail(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error reading project:', error);
    res.status(404).json({ error: 'Project not found' });
  }
});

// GET /api/projects/:id/runs/:runId - Get run detail
router.get('/:id/runs/:runId', async (req, res) => {
  const { id, runId } = req.params;
  if (!isValidPathSegment(id) || !isValidPathSegment(runId)) {
    return res.status(400).json({ error: 'Invalid project or run ID' });
  }
  try {
    const runDetail = await readRunDetail(id, runId);
    if (!runDetail) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json(runDetail);
  } catch (error) {
    console.error('Error reading run:', error);
    res.status(404).json({ error: 'Run not found' });
  }
});

// GET /api/projects/:id/runs/:runId/artifacts - List artifacts
router.get('/:id/runs/:runId/artifacts', async (req, res) => {
  const { id, runId } = req.params;
  if (!isValidPathSegment(id) || !isValidPathSegment(runId)) {
    return res.status(400).json({ error: 'Invalid project or run ID' });
  }
  try {
    const artifacts = await listArtifacts(id, runId);
    res.json({ artifacts });
  } catch (error) {
    console.error('Error listing artifacts:', error);
    res.status(500).json({ error: 'Failed to list artifacts' });
  }
});

// GET /api/projects/:id/runs/:runId/artifacts/:stage - Get artifact content (legacy path)
router.get('/:id/runs/:runId/artifacts/:stage', async (req, res) => {
  const { id, runId, stage } = req.params;
  if (!isValidPathSegment(id) || !isValidPathSegment(runId) || !isValidPathSegment(stage)) {
    return res.status(400).json({ error: 'Invalid project, run, or stage ID' });
  }
  try {
    const content = await readArtifactFile(id, runId, stage);
    if (content === null) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json({ content });
  } catch (error) {
    console.error('Error reading artifact:', error);
    res.status(404).json({ error: 'Artifact not found' });
  }
});

// GET /api/projects/:id/runs/:runId/stages/:stage/artifact - Get artifact (spec path)
router.get('/:id/runs/:runId/stages/:stage/artifact', async (req, res) => {
  const { id, runId, stage } = req.params;
  if (!isValidPathSegment(id) || !isValidPathSegment(runId) || !isValidPathSegment(stage)) {
    return res.status(400).json({ error: 'Invalid project, run, or stage ID' });
  }
  try {
    const content = await readArtifactFile(id, runId, stage);
    if (content === null) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json({ content });
  } catch (error) {
    console.error('Error reading artifact:', error);
    res.status(404).json({ error: 'Artifact not found' });
  }
});

export default router;
