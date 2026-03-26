export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatCost(cost: number | null | undefined): string {
  if (cost == null || cost === 0) return '—';
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(tokens: number | null | undefined): string {
  if (tokens == null) return '0';
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

export function formatPremiumRequests(requests: number | null | undefined): string {
  if (requests == null) return '—';
  return requests.toString();
}

export function timeAgo(date: Date | string | null): string {
  if (!date) return 'Never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const ms = Date.now() - d.getTime();
  
  if (ms < 1000) return 'Just now';
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export function shortenModel(model: string): string {
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return model.split('-').pop() || model;
}

export function getModelTier(model: string): 'premium' | 'standard' | 'fast' {
  if (model.includes('opus')) return 'premium';
  if (model.includes('haiku')) return 'fast';
  return 'standard';
}
