import { Router } from 'express';
import { listProjects, readStateYaml, readExecutionLog, readArtifactFile } from '../lib/fsReader';
import { calculateRunCost } from '../lib/costCalc';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projects = await listProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const state = await readStateYaml(req.params.id);
    res.json(state);
  } catch (error) {
    res.status(404).json({ error: 'Project not found' });
  }
});

router.get('/:id/runs/:runId', async (req, res) => {
  try {
    const log = await readExecutionLog(req.params.id, req.params.runId);
    const cost = calculateRunCost(log.stages);
    res.json({ ...log, totalCost: cost });
  } catch (error) {
    res.status(404).json({ error: 'Run not found' });
  }
});

router.get('/:id/runs/:runId/artifacts/:stage', async (req, res) => {
  try {
    const artifact = await readArtifactFile(req.params.id, req.params.runId, req.params.stage);
    res.json({ content: artifact });
  } catch (error) {
    res.status(404).json({ error: 'Artifact not found' });
  }
});

export default router;
