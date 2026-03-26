import { Router } from 'express';
import { listProjects, readProjectDetail, readRunDetail, readArtifactFile, listArtifacts } from '../lib/fsReader';
import { parseConfig } from '../lib/configParser';
import type { DashboardData, LimitsSnapshot } from '../../src/types/api';

const router = Router();

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const projects = await listProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /api/projects/:id - Get project detail
router.get('/:id', async (req, res) => {
  try {
    const project = await readProjectDetail(req.params.id);
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
  try {
    const runDetail = await readRunDetail(req.params.id, req.params.runId);
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
  try {
    const artifacts = await listArtifacts(req.params.id, req.params.runId);
    res.json({ artifacts });
  } catch (error) {
    console.error('Error listing artifacts:', error);
    res.status(500).json({ error: 'Failed to list artifacts' });
  }
});

// GET /api/projects/:id/runs/:runId/artifacts/:stage - Get artifact content
router.get('/:id/runs/:runId/artifacts/:stage', async (req, res) => {
  try {
    const content = await readArtifactFile(req.params.id, req.params.runId, req.params.stage);
    if (content === null) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    res.json({ content });
  } catch (error) {
    console.error('Error reading artifact:', error);
    res.status(404).json({ error: 'Artifact not found' });
  }
});

// GET /api/dashboard - Single endpoint for all dashboard data
router.get('/dashboard', async (_, res) => {
  try {
    const [projects, config] = await Promise.all([
      listProjects(),
      parseConfig(),
    ]);
    
    // Find active run
    let activeRun = null;
    const completedRuns = [];
    
    for (const project of projects) {
      // Active run: project.status === 'active' and has current_run
      if (project.status === 'active' && project.currentRun) {
        const runDetail = await readRunDetail(project.projectId, project.currentRun);
        if (runDetail) {
          activeRun = runDetail;
        }
      }
      
      // Completed runs: all runs where status === 'completed'
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
    
    // Default limits (no real limit data exists yet)
    const limits: LimitsSnapshot = {
      claude: { used: 0, limit: 1000, resetAt: null },
      copilot: { used: 0, limit: 300, resetAt: null },
      lastUpdated: new Date().toISOString(),
    };
    
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

export default router;
