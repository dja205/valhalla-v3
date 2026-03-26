import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { DESIGN_TEAM, BUILD_TEAM } from '../../src/lib/agentMap';

const CONFIG_PATH = process.env.CONFIG_PATH || 
  path.join(process.env.HOME || '~', '.openclaw/odinclaw.config.yaml');

export async function parseConfig() {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = yaml.load(content) as any;
    
    const agents = [];
    
    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        const team = DESIGN_TEAM.includes(agentName) ? 'design' : 
                     BUILD_TEAM.includes(agentName) ? 'build' : 'cross-cutting';
        
        agents.push({
          name: agentName,
          role: (agentConfig as any).role || 'Unknown',
          team,
          model: (agentConfig as any).model || 'claude-sonnet-4',
          enabled: (agentConfig as any).enabled !== false,
        });
      }
    }
    
    return agents;
  } catch (error) {
    console.error('Error parsing config:', error);
    return [];
  }
}
