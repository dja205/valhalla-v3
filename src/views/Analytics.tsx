import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/stores';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshControl } from '@/components/ui/RefreshControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatDuration } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────
// Shared chart theme
// ────────────────────────────────────────────────────────────────
const CHART = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#21262d',
  gridStroke: '#21262d',
  tickFill: '#8b949e',
  labelFill: '#e6edf3',
  amber: '#f0a040',
  cyan: '#58a6ff',
  green: '#3fb950',
  red: '#f85149',
  purple: '#bc8cff',
  orange: '#ffa657',
  teal: '#39d353',
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: CHART.surface,
    border: `1px solid ${CHART.border}`,
    borderRadius: '8px',
  },
  labelStyle: { color: CHART.labelFill },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

const axisProps = {
  tick: { fill: CHART.tickFill, fontSize: 11 },
  tickLine: { stroke: CHART.tickFill },
  axisLine: { stroke: CHART.border },
};

// ────────────────────────────────────────────────────────────────
// Limits tracker helpers
// ────────────────────────────────────────────────────────────────
function limitColour(pct: number) {
  if (pct >= 80) return 'bg-status-failed';
  if (pct >= 50) return 'bg-accent-amber';
  return 'bg-success';
}

function limitTextColour(pct: number) {
  if (pct >= 80) return 'text-status-failed';
  if (pct >= 50) return 'text-accent-amber';
  return 'text-success';
}

function burnRateLabel(used: number, limit: number, resetAt: string | null): string {
  if (used === 0 || limit === 0) return '';
  if (!resetAt) {
    // Estimate days to limit at flat rate assumption (30 days)
    const dailyRate = used / 30;
    if (dailyRate <= 0) return '';
    const daysLeft = Math.floor((limit - used) / dailyRate);
    return daysLeft <= 0
      ? 'Limit reached at current rate'
      : `At current rate, limit in ~${daysLeft}d`;
  }
  const msLeft = new Date(resetAt).getTime() - Date.now();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  if (daysLeft <= 0) return 'Reset overdue';
  const dailyRate = used / (30 - daysLeft); // rough
  if (dailyRate <= 0) return '';
  const daysToLimit = (limit - used) / dailyRate;
  if (daysToLimit < daysLeft) {
    return `⚠ Hit limit in ~${Math.max(0, Math.floor(daysToLimit))}d (resets in ${Math.ceil(daysLeft)}d)`;
  }
  return `On track — resets in ${Math.ceil(daysLeft)}d`;
}

function resetLabel(resetAt: string | null): string {
  if (!resetAt) return '';
  const d = new Date(resetAt);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return 'Reset overdue';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `Resets in ${days}d ${hrs}h`;
  return `Resets in ${hrs}h`;
}

interface LimitsTrackerProps {
  limits: {
    claude: { used: number; limit: number; resetAt: string | null };
    copilot: { used: number; limit: number; resetAt: string | null };
    lastUpdated: string;
  };
}

function LimitsTracker({ limits }: LimitsTrackerProps) {
  const entries = [
    { label: 'Claude API', icon: '🤖', ...limits.claude },
    { label: 'GitHub Copilot', icon: '🐙', ...limits.copilot },
  ];

  return (
    <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
      <h3 className="text-lg font-semibold text-text-primary mb-4">API Limits</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {entries.map(entry => {
          const pct = entry.limit > 0 ? Math.min(100, (entry.used / entry.limit) * 100) : 0;
          const burn = burnRateLabel(entry.used, entry.limit, entry.resetAt);
          const reset = resetLabel(entry.resetAt);
          return (
            <div key={entry.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  {entry.icon} {entry.label}
                </span>
                <span className={`text-sm font-bold ${limitTextColour(pct)}`}>
                  {entry.used.toLocaleString()} / {entry.limit.toLocaleString()}
                </span>
              </div>

              {/* Track */}
              <div className="w-full bg-bg-base rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${limitColour(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Labels row */}
              <div className="flex justify-between text-xs">
                <span className={limitTextColour(pct)}>{pct.toFixed(1)}% used</span>
                {reset && <span className="text-text-muted">{reset}</span>}
              </div>

              {/* Burn rate projection */}
              {burn && (
                <p className={`text-xs ${pct >= 80 ? 'text-status-failed' : 'text-text-muted'}`}>
                  {burn}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted mt-4">
        Last updated: {new Date(limits.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Analytics view
// ────────────────────────────────────────────────────────────────
export function Analytics() {
  const {
    completedRuns,
    limits,
    analytics,
    isLoading,
    lastRefreshed,
    isRefreshing,
    refresh,
    fetchAll,
    fetchAnalytics,
  } = useStore();

  const [timeGranularity, setTimeGranularity] = useState<'daily' | 'weekly'>('daily');
  const [timeMetric, setTimeMetric] = useState<'premiumRequests' | 'stageCount'>('premiumRequests');

  useEffect(() => {
    fetchAll();
    fetchAnalytics();
  }, [fetchAll, fetchAnalytics]);

  // Summary stats from completed runs
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

  const timeSeries = analytics
    ? (timeGranularity === 'daily' ? analytics.timeSeries : analytics.weeklySeries)
    : [];

  const hasAnalytics = !!analytics && analytics.meta.totalEntries > 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Analytics</h1>
        <RefreshControl
          lastRefreshed={lastRefreshed}
          isRefreshing={isRefreshing}
          onRefresh={() => { refresh(); fetchAnalytics(); }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} variant="stage" />)}
        </div>
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Completed Runs" value={stats.totalRuns} />
            <StatCard label="Total Stages" value={stats.totalStages} colour="text-accent-cyan" />
            <StatCard label="Avg Run Duration" value={formatDuration(stats.avgDuration)} />
            <StatCard
              label="Total Cost"
              value={stats.totalCost > 0 ? `$${stats.totalCost.toFixed(2)}` : '—'}
              colour="text-accent-amber"
            />
          </div>

          {/* ── Limits Tracker ── */}
          {limits && <LimitsTracker limits={limits} />}

          {/* ── Cost Time-Series ── */}
          <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Premium Requests Over Time</h3>
              <div className="flex items-center gap-2">
                {/* Granularity toggle */}
                <ToggleGroup
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                  value={timeGranularity}
                  onChange={v => setTimeGranularity(v as 'daily' | 'weekly')}
                />
                {/* Metric toggle */}
                <ToggleGroup
                  options={[
                    { value: 'premiumRequests', label: 'Requests' },
                    { value: 'stageCount', label: 'Stages' },
                  ]}
                  value={timeMetric}
                  onChange={v => setTimeMetric(v as 'premiumRequests' | 'stageCount')}
                />
              </div>
            </div>

            <div className="h-64">
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries} barSize={timeGranularity === 'daily' ? 10 : 20}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} vertical={false} />
                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number) => [
                        value,
                        timeMetric === 'premiumRequests' ? 'Premium Requests' : 'Stages',
                      ]}
                    />
                    <Bar dataKey={timeMetric} radius={[3, 3, 0, 0]}>
                      {timeSeries.map((_, i) => (
                        <Cell key={i} fill={CHART.amber} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No time-series data yet" icon="📈" />
              )}
            </div>
          </div>

          {/* ── Cost Breakdown Charts ── */}
          {analytics && (
            <div className="grid gap-6 lg:grid-cols-3">
              <BreakdownChart
                title="By Project"
                data={analytics.breakdowns.byProject.map(d => ({
                  name: d.project,
                  value: d.durationMs,
                }))}
                colour={CHART.cyan}
                formatter={(v: number) => [formatDuration(v), 'Total Duration']}
              />
              <BreakdownChart
                title="By Agent"
                data={analytics.breakdowns.byAgent.map(d => ({
                  name: d.agent,
                  value: d.durationMs,
                }))}
                colour={CHART.purple}
                formatter={(v: number) => [formatDuration(v), 'Total Duration']}
              />
              <BreakdownChart
                title="By Model Tier"
                data={analytics.breakdowns.byModelTier.map(d => ({
                  name: d.tier,
                  value: d.durationMs,
                }))}
                colour={CHART.orange}
                formatter={(v: number) => [formatDuration(v), 'Total Duration']}
              />
            </div>
          )}

          {/* ── Performance Dashboard ── */}
          {hasAnalytics ? (
            <div className="space-y-6">
              {/* Agent performance bar chart */}
              <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Avg Stage Duration per Agent
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics!.performance.agentPerformance.slice(0, 12)}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} horizontal={false} />
                      <XAxis
                        type="number"
                        {...axisProps}
                        tickFormatter={(v: number) => formatDuration(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="agent"
                        {...axisProps}
                        width={80}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                      />
                      <Bar dataKey="avgDurationMs" radius={[0, 4, 4, 0]}>
                        {analytics!.performance.agentPerformance.slice(0, 12).map((_, i) => (
                          <Cell key={i} fill={CHART.cyan} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Success / Failure rates & Job completion over time */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Success rates */}
                <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Success Rate per Agent
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics!.performance.agentPerformance.slice(0, 10)}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} horizontal={false} />
                        <XAxis
                          type="number"
                          {...axisProps}
                          domain={[0, 100]}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="agent"
                          {...axisProps}
                          width={80}
                        />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(value: number, name: string) => [
                            name === 'successRate' ? `${value}%` : value,
                            name === 'successRate' ? 'Success Rate' : name,
                          ]}
                        />
                        <Legend
                          wrapperStyle={{ color: CHART.tickFill, fontSize: 11 }}
                        />
                        <Bar dataKey="successRate" name="Success %" radius={[0, 4, 4, 0]}>
                          {analytics!.performance.agentPerformance.slice(0, 10).map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.successRate >= 80 ? CHART.green : entry.successRate >= 50 ? CHART.amber : CHART.red}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Job completion over time */}
                <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Avg Job Completion Time
                  </h3>
                  <div className="h-64">
                    {analytics!.performance.jobCompletionOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics!.performance.jobCompletionOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} />
                          <XAxis dataKey="label" {...axisProps} />
                          <YAxis
                            {...axisProps}
                            tickFormatter={(v: number) => formatDuration(v)}
                          />
                          <Tooltip
                            {...tooltipStyle}
                            formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                          />
                          <Line
                            type="monotone"
                            dataKey="avgDurationMs"
                            stroke={CHART.amber}
                            strokeWidth={2}
                            dot={{ fill: CHART.amber, r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No job completion data yet" icon="⏱️" />
                    )}
                  </div>
                </div>
              </div>

              {/* Design vs Build */}
              <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Design Phase vs Build Phase
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics!.performance.designVsBuild}
                      barCategoryGap="40%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} vertical={false} />
                      <XAxis dataKey="phase" {...axisProps} />
                      <YAxis
                        {...axisProps}
                        yAxisId="duration"
                        orientation="left"
                        tickFormatter={(v: number) => formatDuration(v)}
                      />
                      <YAxis
                        {...axisProps}
                        yAxisId="stages"
                        orientation="right"
                        allowDecimals={false}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(value: number, name: string) => {
                          if (name === 'avgDurationMs') return [formatDuration(value), 'Avg Stage Duration'];
                          if (name === 'totalDurationMs') return [formatDuration(value), 'Total Duration'];
                          return [value, 'Stage Count'];
                        }}
                      />
                      <Legend wrapperStyle={{ color: CHART.tickFill, fontSize: 11 }} />
                      <Bar yAxisId="duration" dataKey="avgDurationMs" name="Avg Duration" radius={[4, 4, 0, 0]}>
                        {analytics!.performance.designVsBuild.map((entry, i) => (
                          <Cell key={i} fill={entry.phase === 'design' ? CHART.purple : CHART.cyan} />
                        ))}
                      </Bar>
                      <Bar yAxisId="stages" dataKey="stageCount" name="Stage Count" radius={[4, 4, 0, 0]} fill={CHART.teal} opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-surface rounded-lg p-8 border border-bg-raised">
              <EmptyState message="Run some jobs to see performance analytics" icon="📊" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Small shared components
// ────────────────────────────────────────────────────────────────
function StatCard({ label, value, colour }: { label: string; value: string | number; colour?: string }) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="text-sm text-text-muted mb-1">{label}</div>
      <div className={`text-3xl font-bold ${colour ?? 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-bg-raised">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-accent-cyan text-bg-base'
              : 'bg-bg-surface text-text-muted hover:text-text-primary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BreakdownChart({
  title,
  data,
  colour,
  formatter,
}: {
  title: string;
  data: { name: string; value: number }[];
  colour: string;
  formatter: (v: number, name: string) => [string, string];
}) {
  const display = data.slice(0, 8);
  return (
    <div className="bg-bg-surface rounded-lg p-5 border border-bg-raised">
      <h3 className="text-base font-semibold text-text-primary mb-4">{title}</h3>
      <div className="h-56">
        {display.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={display} layout="vertical" margin={{ left: 5, right: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridStroke} horizontal={false} />
              <XAxis
                type="number"
                {...axisProps}
                tickFormatter={(v: number) => formatter(v, 'value')[0]}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                width={80}
                tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 11) + '…' : v)}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={formatter}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {display.map((_, i) => (
                  <Cell key={i} fill={colour} opacity={1 - i * 0.07} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No data" icon="📊" />
        )}
      </div>
    </div>
  );
}
