import { useEffect, useMemo } from 'react';
import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDuration } from '@/lib/utils';

export function Analytics() {
  const { 
    completedRuns, 
    limits, 
    isLoading, 
    lastRefreshed, 
    isRefreshing, 
    refresh, 
    fetchAll 
  } = useStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Cost over time data (last 7 runs)
  const costOverTimeData = useMemo(() => {
    return completedRuns
      .slice(0, 7)
      .reverse()
      .map(run => ({
        name: run.runId.slice(0, 20),
        cost: run.totalCost,
        duration: run.totalDurationMs,
      }));
  }, [completedRuns]);

  // Average duration per agent
  const durationPerAgentData = useMemo(() => {
    const agentDurations: Record<string, { total: number; count: number }> = {};
    
    completedRuns.forEach(run => {
      run.stages.forEach(stage => {
        if (!agentDurations[stage.agent]) {
          agentDurations[stage.agent] = { total: 0, count: 0 };
        }
        agentDurations[stage.agent].total += stage.durationMs;
        agentDurations[stage.agent].count += 1;
      });
    });
    
    return Object.entries(agentDurations)
      .map(([agent, data]) => ({
        agent,
        avgDuration: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
  }, [completedRuns]);

  // Success stats
  const stats = useMemo(() => {
    const totalRuns = completedRuns.length;
    const totalStages = completedRuns.reduce((sum, run) => sum + run.stages.length, 0);
    const totalDuration = completedRuns.reduce((sum, run) => sum + run.totalDurationMs, 0);
    const totalCost = completedRuns.reduce((sum, run) => sum + run.totalCost, 0);
    
    return {
      totalRuns,
      totalStages,
      avgDuration: totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0,
      totalCost,
    };
  }, [completedRuns]);

  const chartColors = {
    cost: '#f0a040', // accent-amber
    duration: '#58a6ff', // accent-cyan
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Analytics</h1>
        <RefreshControl 
          lastRefreshed={lastRefreshed} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard variant="stage" />
          <SkeletonCard variant="stage" />
          <SkeletonCard variant="stage" />
          <SkeletonCard variant="stage" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <div className="text-sm text-text-muted mb-1">Completed Runs</div>
              <div className="text-3xl font-bold text-text-primary">{stats.totalRuns}</div>
            </div>
            
            <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <div className="text-sm text-text-muted mb-1">Total Stages</div>
              <div className="text-3xl font-bold text-accent-cyan">{stats.totalStages}</div>
            </div>
            
            <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <div className="text-sm text-text-muted mb-1">Avg Run Duration</div>
              <div className="text-3xl font-bold text-text-primary">
                {formatDuration(stats.avgDuration)}
              </div>
            </div>
            
            <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <div className="text-sm text-text-muted mb-1">Total Cost</div>
              <div className="text-3xl font-bold text-accent-amber">
                {stats.totalCost > 0 ? `$${stats.totalCost.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {completedRuns.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cost Over Time */}
              <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Cost Over Time</h3>
                {costOverTimeData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costOverTimeData}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#8b949e', fontSize: 10 }}
                          tickLine={{ stroke: '#8b949e' }}
                          axisLine={{ stroke: '#21262d' }}
                        />
                        <YAxis 
                          tick={{ fill: '#8b949e', fontSize: 12 }}
                          tickLine={{ stroke: '#8b949e' }}
                          axisLine={{ stroke: '#21262d' }}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#161b22', 
                            border: '1px solid #21262d',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#e6edf3' }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                        />
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                          {costOverTimeData.map((_, index) => (
                            <Cell key={index} fill={chartColors.cost} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No cost data available" icon="📊" />
                )}
              </div>

              {/* Duration Per Agent */}
              <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Avg Duration Per Agent</h3>
                {durationPerAgentData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={durationPerAgentData} layout="vertical">
                        <XAxis 
                          type="number"
                          tick={{ fill: '#8b949e', fontSize: 12 }}
                          tickLine={{ stroke: '#8b949e' }}
                          axisLine={{ stroke: '#21262d' }}
                          tickFormatter={(v) => formatDuration(v)}
                        />
                        <YAxis 
                          type="category"
                          dataKey="agent" 
                          tick={{ fill: '#8b949e', fontSize: 12 }}
                          tickLine={{ stroke: '#8b949e' }}
                          axisLine={{ stroke: '#21262d' }}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#161b22', 
                            border: '1px solid #21262d',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#e6edf3' }}
                          formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                        />
                        <Bar dataKey="avgDuration" radius={[0, 4, 4, 0]}>
                          {durationPerAgentData.map((_, index) => (
                            <Cell key={index} fill={chartColors.duration} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No duration data available" icon="⏱️" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-bg-surface rounded-lg p-8 border border-bg-raised">
              <EmptyState message="Complete some runs to see analytics" icon="📊" />
            </div>
          )}

          {/* Limits Tracker */}
          {limits && (
            <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
              <h3 className="text-lg font-semibold text-text-primary mb-4">API Limits</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <ProgressBar 
                  label="Claude API" 
                  value={limits.claude.used} 
                  max={limits.claude.limit}
                  burnRate={limits.claude.used > 0 ? `${(limits.claude.used / 24).toFixed(1)}/hr avg` : undefined}
                />
                <ProgressBar 
                  label="GitHub Copilot" 
                  value={limits.copilot.used} 
                  max={limits.copilot.limit}
                  burnRate={limits.copilot.used > 0 ? `${(limits.copilot.used / 24).toFixed(1)}/hr avg` : undefined}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
