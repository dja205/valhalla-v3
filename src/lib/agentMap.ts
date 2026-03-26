/**
 * Normalizes agent names for reliable matching.
 * Strips all non-alphabetic characters and lowercases.
 * Examples: 'Mimir-v2' -> 'mimirv', 'thor_orchestrator' -> 'thororchestrator', 'MIMIR' -> 'mimir'
 */
export function normalizeAgentName(agent: string): string {
  return agent.toLowerCase().replace(/[^a-z]/g, '');
}

// Stage names for each agent in the pipeline
export const STAGE_NAME_MAP: Record<string, string> = {
  mimir: 'Architecture',
  baldr: 'UX Design',
  ratatoskr: 'System Map',
  sleipnir: 'Capability Slicing',
  freya: 'Discovery',
  brokk: 'Issues',
  sindri: 'Splitting',
  heimdall: 'Planning QA',
  ymir: 'Foundation',
  modi: 'Implementation',
  magni: 'Implementation',
  tyr: 'Code Review',
  valkyrie: 'Adversarial',
  jormungandr: 'Integration',
  fenrir: 'Resilience',
  surtr: 'Release',
  hel: 'Recovery',
};

export const AGENT_AVATAR_MAP: Record<string, string> = {
  loki: '/img/agents/loki.PNG',
  mimir: '/img/agents/mimir.PNG',
  baldr: '/img/agents/baldr.PNG',
  ratatoskr: '/img/agents/ratatoskr.PNG',
  sleipnir: '/img/agents/sleipnir.PNG',
  freya: '/img/agents/freya.PNG',
  heimdall: '/img/agents/heimdall.PNG',
  brokk: '/img/agents/brokk.PNG',
  sindri: '/img/agents/sindri.PNG',
  thor: '/img/agents/thor.PNG',
  ymir: '/img/agents/ymir.PNG',
  modi: '/img/agents/modi.PNG',
  magni: '/img/agents/magni.PNG',
  tyr: '/img/agents/tyr.PNG',
  valkyrie: '/img/agents/valkyrie.PNG',
  jormungandr: '/img/agents/jormungandr.PNG',
  fenrir: '/img/agents/fenrir.PNG',
  surtr: '/img/agents/surtr.PNG',
  hel: '/img/agents/hel.PNG',
};

// Design phase display order (loki is orchestrator)
export const DESIGN_TEAM = ['mimir', 'baldr', 'ratatoskr', 'sleipnir', 'freya', 'brokk', 'sindri', 'heimdall'];
export const DESIGN_ORCHESTRATOR = 'loki';

// Build phase display order (thor is orchestrator)
export const BUILD_TEAM = ['ymir', 'modi', 'magni', 'tyr', 'valkyrie', 'jormungandr', 'fenrir', 'surtr', 'hel'];
export const BUILD_ORCHESTRATOR = 'thor';

// All agents including orchestrators
export const ALL_DESIGN_AGENTS = ['loki', ...DESIGN_TEAM];
export const ALL_BUILD_AGENTS = ['thor', ...BUILD_TEAM];
