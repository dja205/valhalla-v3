import { Router } from 'express';
import { listProjects, readRunDetail } from '../lib/fsReader';
import { parseConfig } from '../lib/configParser';
import type { AgentStatus } from '../../src/types/api';

const router = Router();

// Stage-to-agent mapping (canonical)
const STAGE_TO_AGENT: Record<string, string> = {
  request: 'odin',
  architecture: 'mimir',
  'ux-design': 'baldr',
  spec: 'brokk',
  tasks: 'sindri',
  implementation: 'modi',
  review: 'tyr',
  qa: 'jormungandr',
  release: 'surtr',
};

interface AgentWithStatus {
  name: string;
  model: string;
  provider: string;
  team: 'design' | 'build' | 'cross-cutting';
  status: AgentStatus;
  currentJob: string | null;
  currentStage: string | null;
}

// GET /api/agents — List all agents with current status derived from active runs
router.get('/', async (_req, res) => {
  try {
    const [config, projects] = await Promise.all([
      parseConfig(),
      listProjects(),
    ]);

    // Find active run and derive agent statuses
    const agentStatusMap = new Map<string, { status: AgentStatus; currentJob: string | null; currentStage: string | null }>();

    for (const project of projects) {
      if (project.status === 'active' && project.currentRun) {
        const runDetail = await readRunDetail(project.projectId, project.currentRun);
        if (!runDetail) continue;

        for (const stage of runDetail.stages) {
          const agentName = STAGE_TO_AGENT[stage.stage] || stage.agent;
          
          if (stage.status === 'in_progress') {
            agentStatusMap.set(agentName, {
              status: 'working',
              currentJob: project.currentRun,
              currentStage: stage.stage,
            });
          } else if (stage.status === 'blocked') {
            agentStatusMap.set(agentName, {
              status: 'blocked',
              currentJob: project.currentRun,
              currentStage: stage.stage,
            });
          }
        }
      }
    }

    // Build agent list with statuses
    const agents: AgentWithStatus[] = config.agents.map(agent => {
      const runtimeStatus = agentStatusMap.get(agent.name);
      return {
        name: agent.name,
        model: agent.model,
        provider: agent.provider,
        team: agent.team,
        status: runtimeStatus?.status ?? 'idle',
        currentJob: runtimeStatus?.currentJob ?? null,
        currentStage: runtimeStatus?.currentStage ?? null,
      };
    });

    res.json(agents);
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

export default router;
