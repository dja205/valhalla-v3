import { Router } from 'express';
import { listProjects, readExecutionLog, readStateYaml } from '../lib/fsReader';

const router = Router();

const DESIGN_TEAM = ['mimir', 'baldr', 'ratatoskr', 'sleipnir', 'freya', 'brokk', 'sindri', 'heimdall'];

function normalizeAgentName(agent: string): string {
  return agent.toLowerCase().replace(/[^a-z]/g, '');
}

function getModelTier(model: string): 'opus' | 'sonnet' | 'haiku' | 'other' {
  if (model.includes('opus')) return 'opus';
  if (model.includes('haiku')) return 'haiku';
  if (model.includes('sonnet')) return 'sonnet';
  return 'other';
}

function dateKey(isoString: string): string {
  return isoString.slice(0, 10); // YYYY-MM-DD
}

// GET /api/analytics - Full analytics payload
router.get('/', async (_req, res) => {
  try {
    const projects = await listProjects();

    // Collect all stage entries with project/date context
    interface EnrichedEntry {
      projectId: string;
      runId: string;
      date: string; // YYYY-MM-DD
      agent: string;
      model: string;
      modelTier: 'opus' | 'sonnet' | 'haiku' | 'other';
      phase: 'design' | 'build';
      durationMs: number;
      premiumRequests: number;
      status: string;
      requiresChanges: boolean;
      rejected: boolean;
    }

    const allEntries: EnrichedEntry[] = [];

    for (const project of projects) {
      const state = await readStateYaml(project.projectId);
      if (!state) continue;

      for (const run of project.runs) {
        const stages = await readExecutionLog(project.projectId, run.runId);
        const runDate = run.created ? dateKey(run.created) : '2025-01-01';

        for (const stage of stages) {
          const isDesign = DESIGN_TEAM.includes(normalizeAgentName(stage.agent ?? ''));
          allEntries.push({
            projectId: project.projectId,
            runId: run.runId,
            date: stage.startedAt ? dateKey(stage.startedAt) : runDate,
            agent: stage.agent || 'unknown',
            model: stage.model || 'unknown',
            modelTier: getModelTier(stage.model || ''),
            phase: isDesign ? 'design' : 'build',
            durationMs: stage.durationMs || 0,
            premiumRequests: stage.premiumRequests ?? 0,
            status: stage.status || 'unknown',
            requiresChanges: stage.requiresChanges || false,
            rejected: stage.rejected || false,
          });
        }
      }
    }

    // --- Time series (last 30 days) ---
    const today = new Date();
    const days30: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days30.push(d.toISOString().slice(0, 10));
    }

    const timeSeriesMap: Record<string, { premiumRequests: number; durationMs: number; stageCount: number }> = {};
    for (const day of days30) {
      timeSeriesMap[day] = { premiumRequests: 0, durationMs: 0, stageCount: 0 };
    }

    for (const entry of allEntries) {
      if (timeSeriesMap[entry.date] !== undefined) {
        timeSeriesMap[entry.date].premiumRequests += entry.premiumRequests;
        timeSeriesMap[entry.date].durationMs += entry.durationMs;
        timeSeriesMap[entry.date].stageCount += 1;
      }
    }

    const timeSeries = days30.map(date => ({
      date,
      label: date.slice(5), // MM-DD
      premiumRequests: timeSeriesMap[date].premiumRequests,
      durationMs: timeSeriesMap[date].durationMs,
      stageCount: timeSeriesMap[date].stageCount,
    }));

    // Weekly rollup
    const weeklyMap: Record<string, { premiumRequests: number; durationMs: number; stageCount: number }> = {};
    for (const entry of timeSeries) {
      const d = new Date(entry.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday of that week
      const wk = weekStart.toISOString().slice(0, 10);
      if (!weeklyMap[wk]) weeklyMap[wk] = { premiumRequests: 0, durationMs: 0, stageCount: 0 };
      weeklyMap[wk].premiumRequests += entry.premiumRequests;
      weeklyMap[wk].durationMs += entry.durationMs;
      weeklyMap[wk].stageCount += entry.stageCount;
    }
    const weeklySeries = Object.entries(weeklyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        label: `w/${date.slice(5)}`,
        ...data,
      }));

    // --- Breakdowns ---
    const byProjectMap: Record<string, { premiumRequests: number; durationMs: number; stageCount: number }> = {};
    const byAgentMap: Record<string, { premiumRequests: number; durationMs: number; stageCount: number }> = {};
    const byModelTierMap: Record<string, { premiumRequests: number; durationMs: number; stageCount: number }> = {};

    for (const entry of allEntries) {
      // by project
      if (!byProjectMap[entry.projectId]) byProjectMap[entry.projectId] = { premiumRequests: 0, durationMs: 0, stageCount: 0 };
      byProjectMap[entry.projectId].premiumRequests += entry.premiumRequests;
      byProjectMap[entry.projectId].durationMs += entry.durationMs;
      byProjectMap[entry.projectId].stageCount += 1;

      // by agent
      if (!byAgentMap[entry.agent]) byAgentMap[entry.agent] = { premiumRequests: 0, durationMs: 0, stageCount: 0 };
      byAgentMap[entry.agent].premiumRequests += entry.premiumRequests;
      byAgentMap[entry.agent].durationMs += entry.durationMs;
      byAgentMap[entry.agent].stageCount += 1;

      // by model tier
      if (!byModelTierMap[entry.modelTier]) byModelTierMap[entry.modelTier] = { premiumRequests: 0, durationMs: 0, stageCount: 0 };
      byModelTierMap[entry.modelTier].premiumRequests += entry.premiumRequests;
      byModelTierMap[entry.modelTier].durationMs += entry.durationMs;
      byModelTierMap[entry.modelTier].stageCount += 1;
    }

    const sortByDuration = (a: { durationMs: number }, b: { durationMs: number }) => b.durationMs - a.durationMs;

    const breakdowns = {
      byProject: Object.entries(byProjectMap)
        .map(([project, data]) => ({ project, ...data }))
        .sort(sortByDuration)
        .slice(0, 20),
      byAgent: Object.entries(byAgentMap)
        .map(([agent, data]) => ({ agent, ...data }))
        .sort(sortByDuration)
        .slice(0, 20),
      byModelTier: Object.entries(byModelTierMap)
        .map(([tier, data]) => ({ tier, ...data }))
        .sort(sortByDuration),
    };

    // --- Performance ---
    const agentPerfMap: Record<string, { durations: number[]; success: number; failed: number; retried: number }> = {};
    for (const entry of allEntries) {
      if (!agentPerfMap[entry.agent]) agentPerfMap[entry.agent] = { durations: [], success: 0, failed: 0, retried: 0 };
      agentPerfMap[entry.agent].durations.push(entry.durationMs);
      if (entry.status === 'completed' && !entry.requiresChanges && !entry.rejected) {
        agentPerfMap[entry.agent].success += 1;
      } else if (entry.rejected) {
        agentPerfMap[entry.agent].failed += 1;
      } else if (entry.requiresChanges) {
        agentPerfMap[entry.agent].retried += 1;
      } else {
        agentPerfMap[entry.agent].success += 1;
      }
    }

    const agentPerformance = Object.entries(agentPerfMap).map(([agent, data]) => ({
      agent,
      avgDurationMs: data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0,
      totalStages: data.durations.length,
      success: data.success,
      failed: data.failed,
      retried: data.retried,
      successRate: data.durations.length > 0
        ? Math.round((data.success / data.durations.length) * 100)
        : 0,
    })).sort((a, b) => b.avgDurationMs - a.avgDurationMs);

    // Job completion over time (per run)
    interface RunRecord { date: string; durationMs: number }
    const runCompletionMap: Record<string, RunRecord> = {};
    for (const project of projects) {
      for (const run of project.runs) {
        if (run.status === 'completed') {
          const stages = await readExecutionLog(project.projectId, run.runId);
          const totalDuration = stages.reduce((s, e) => s + (e.durationMs || 0), 0);
          const runDate = run.created ? dateKey(run.created) : '2025-01-01';
          const key = `${runDate}:${run.runId}`;
          runCompletionMap[key] = { date: runDate, durationMs: totalDuration };
        }
      }
    }

    // Group by date, average
    const jobDateMap: Record<string, { total: number; count: number }> = {};
    for (const rec of Object.values(runCompletionMap)) {
      if (!jobDateMap[rec.date]) jobDateMap[rec.date] = { total: 0, count: 0 };
      jobDateMap[rec.date].total += rec.durationMs;
      jobDateMap[rec.date].count += 1;
    }
    const jobCompletionOverTime = Object.entries(jobDateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, data]) => ({
        date,
        label: date.slice(5),
        avgDurationMs: Math.round(data.total / data.count),
        jobCount: data.count,
      }));

    // Design vs Build comparison
    const designEntries = allEntries.filter(e => e.phase === 'design');
    const buildEntries = allEntries.filter(e => e.phase === 'build');

    const designVsBuild = [
      {
        phase: 'design' as const,
        avgDurationMs: designEntries.length > 0
          ? Math.round(designEntries.reduce((s, e) => s + e.durationMs, 0) / designEntries.length)
          : 0,
        totalDurationMs: designEntries.reduce((s, e) => s + e.durationMs, 0),
        stageCount: designEntries.length,
      },
      {
        phase: 'build' as const,
        avgDurationMs: buildEntries.length > 0
          ? Math.round(buildEntries.reduce((s, e) => s + e.durationMs, 0) / buildEntries.length)
          : 0,
        totalDurationMs: buildEntries.reduce((s, e) => s + e.durationMs, 0),
        stageCount: buildEntries.length,
      },
    ];

    res.json({
      timeSeries,
      weeklySeries,
      breakdowns,
      performance: {
        agentPerformance,
        jobCompletionOverTime,
        designVsBuild,
      },
      meta: {
        totalEntries: allEntries.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
