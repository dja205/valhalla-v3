import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { AgentInfo, AgentConfigResponse } from '../../src/types/api';

// Hardcoded team arrays (matching src/lib/agentMap.ts)
const DESIGN_TEAM = ['loki', 'mimir', 'baldr', 'ratatoskr', 'sleipnir', 'freya', 'brokk', 'sindri', 'heimdall'];
const BUILD_TEAM = ['thor', 'ymir', 'modi', 'magni', 'tyr', 'valkyrie', 'jormungandr', 'fenrir', 'surtr', 'hel'];

const CONFIG_PATH = process.env.CONFIG_PATH || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/odinclaw.config.yaml');

interface OdinclawConfig {
  agents?: Record<string, {
    model?: string;
    provider?: string;
    role?: string;
    enabled?: boolean;
  }>;
}

export async function parseConfig(): Promise<AgentConfigResponse> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = yaml.load(content) as OdinclawConfig;
    
    const agents: AgentInfo[] = [];
    
    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        const team = DESIGN_TEAM.includes(agentName) 
          ? 'design' 
          : BUILD_TEAM.includes(agentName) 
            ? 'build' 
            : 'cross-cutting';
        
        agents.push({
          name: agentName,
          model: agentConfig.model || 'claude-sonnet-4',
          provider: agentConfig.provider || 'copilot',
          team,
        });
      }
    }
    
    // Ensure all team members are represented even if not in config
    for (const agentName of [...DESIGN_TEAM, ...BUILD_TEAM]) {
      if (!agents.find(a => a.name === agentName)) {
        const team = DESIGN_TEAM.includes(agentName) ? 'design' : 'build';
        agents.push({
          name: agentName,
          model: 'claude-sonnet-4',
          provider: 'copilot',
          team,
        });
      }
    }
    
    return {
      agents,
      designTeam: DESIGN_TEAM,
      buildTeam: BUILD_TEAM,
    };
  } catch (error) {
    console.error('Error parsing config:', error);
    // Return defaults
    return {
      agents: [...DESIGN_TEAM, ...BUILD_TEAM].map(name => ({
        name,
        model: 'claude-sonnet-4',
        provider: 'copilot',
        team: DESIGN_TEAM.includes(name) ? 'design' as const : 'build' as const,
      })),
      designTeam: DESIGN_TEAM,
      buildTeam: BUILD_TEAM,
    };
  }
}
