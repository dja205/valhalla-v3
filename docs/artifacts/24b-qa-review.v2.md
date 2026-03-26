# 24b — QA Review
**Review Cycle:** 2  
**Reviewer:** Frigg  
**Date:** 2026-03-26  
**Scope:** Full codebase — `server/` and `src/`  
**Previous version:** 24b-qa-review.v1.md

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 1     |
| P3       | 3     |

**Verdict: CONDITIONAL** (0 P1, 1 P2)

---

## Previous Findings Resolved (Cycle 1)

### ✅ [P1] Dashboard route shadowing — FIXED
The `/dashboard` route is now registered **before** `/:id` (line 26 vs line 77 in `projects.ts`). The proxy in `index.ts` now correctly reaches the dashboard handler. Verified route ordering is correct.

### ✅ [P1] Path traversal vulnerability — FIXED
`isValidPathSegment()` validation added (lines 9-11 in `projects.ts`). All route handlers now validate `projectId`, `runId`, and `stage` parameters before passing to fsReader functions. Validation rejects `..`, `/`, and `\` characters. CORS restricted to `localhost:5173` only (lines 13-16 in `index.ts`).

### ✅ [P2] Cost metric showing zero due to null premiumRequests — FIXED
`fsReader.ts` now checks if **any** stage has premium data. If all stages have `null` premiumRequests, `totalCost` is set to `null` (not `0`), and `formatCost()` in `utils.ts` displays `'N/A'` for null values (line 14). This correctly distinguishes "no cost data" from "$0.00".

### ✅ [P2] Hardcoded buildCount=0 in Home.tsx — FIXED
`Home.tsx` now counts active projects by phase. Design and build counts are computed from actual `currentStage` values (lines 198-216). `PipelineFlowBar` receives real counts (lines 298-300). No more hardcoded zeros.

### ✅ [P2] Stale activeRun/completedRuns in fallback — FIXED
Fallback path in `stores/index.ts` now explicitly clears dashboard-specific state: sets `activeRun: null`, `completedRuns: []`, `config: null`, `limits: null` (lines 98-101). Stale data no longer survives dashboard fetch failure.

### ✅ [P3] Burn rate divide-by-near-zero — FIXED
`Analytics.tsx` `burnRateLabel()` now guards against `elapsedDays <= 0` and returns early with a safe message: `"On track — resets in ${Math.ceil(daysLeft)}d"` (line 87). No more `Infinity` or garbage projections.

---

## Remaining Findings (Cycle 1)

### [P3] Weekly analytics time-series only covers last 30 days

**Status:** Still present — unchanged from Cycle 1.

**Why it matters:**  
The weekly series rollup is computed from `timeSeries` (which is pre-filtered to the last 30 days) rather than from `allEntries`. Projects with runs older than 30 days are silently omitted from the weekly view.

**Evidence:**  
`server/routes/analytics.ts` lines 101-118:
```ts
const weeklyMap: Record<string, ...> = {};
for (const entry of timeSeries) {   // ← timeSeries = last-30-days slice
  const d = new Date(entry.date);
  const weekStart = new Date(d);
  ...
  weeklyMap[wk].premiumRequests += entry.premiumRequests;
  ...
}
```
`timeSeries` is populated only from `days30` (30 entries, lines 71-98). Any `allEntries` data older than 30 days never enters the weekly map.

**User impact:**  
Weekly chart appears to show "all-time weekly activity" but silently excludes history beyond the rolling 30-day window. Long-running projects will have incomplete weekly aggregations.

**Suggested fix:**  
Build `weeklySeries` from `allEntries` directly (same pattern as the `timeSeries` daily map but with weekly keys), not from the already-windowed `timeSeries`.

---

### [P3] Analytics endpoint reads execution logs twice per completed run

**Status:** Still present — unchanged from Cycle 1.

**Why it matters:**  
`readExecutionLog()` is called once in the main `allEntries` loop and again in the `jobCompletionOverTime` loop for every completed run. On a cold cache (or after the 10s TTL expires), this doubles file I/O for the entire execution history on every analytics request.

**Evidence:**  
`server/routes/analytics.ts`:
- First pass (line 47): `const stages = await readExecutionLog(project.projectId, run.runId)` — iterates **all** runs
- Second pass (line 197): `const stages = await readExecutionLog(project.projectId, run.runId)` — iterates only **completed** runs

Cache TTL is 10 seconds (`CACHE_TTL = 10000` in `fsReader.ts`). An analytics request that lands just after expiry reads every log file twice.

**User impact:**  
Analytics endpoint becomes noticeably slow on projects with many completed runs when the cache is cold. Not a crash, but degraded response time that could cause the chart to render blank before timing out on slow filesystems or large portfolios.

**Suggested fix:**  
Collect `totalDuration` per run during the first `allEntries` pass and reuse the result for `jobCompletionOverTime`. Store the duration in a map keyed by `${projectId}:${runId}` and reference it in the second loop. Eliminates the second loop and second file read entirely.

---

## New Findings (Cycle 2)

### [P2] Design/build phase classification assumes complete agent name match

**Why it matters:**  
`Home.tsx` and `analytics.ts` determine phase membership by checking if `agent.toLowerCase()` is in `DESIGN_TEAM` or `BUILD_TEAM` arrays. If the execution log uses a slightly different agent name (e.g., `"Mimir-v2"` instead of `"mimir"`, or `"thor_orchestrator"` instead of `"thor"`), the phase classification silently fails. The stage is excluded from design/build counts, metrics, and `designVsBuild` comparisons, skewing all analytics.

**Evidence:**  
`Home.tsx` lines 189-191:
```tsx
const agentLower = activeStage.agent.toLowerCase();
if (agentLower === DESIGN_ORCHESTRATOR || DESIGN_TEAM.includes(agentLower)) return 'design';
if (agentLower === BUILD_ORCHESTRATOR || BUILD_TEAM.includes(agentLower)) return 'build';
```
`analytics.ts` line 51:
```ts
const isDesign = DESIGN_TEAM.includes(stage.agent?.toLowerCase() ?? '');
```
`agentMap.ts` defines exact strings like `'mimir'`, `'baldr'`, `'thor'`. If the actual execution log says `'Mimir'` or `'thor-orchestrator'`, the `includes()` check fails. The stage is then classified as null phase (in Home) or build phase by default (in analytics).

**User impact:**  
- **Home view:** `getCurrentPhase()` returns `null` when it should return `'design'` or `'build'`. Pipeline flow bar shows no active phase indicator.
- **Analytics:** `designVsBuild` comparison omits mismatched stages, showing incorrect averages and totals. Operators cannot trust design vs build metrics.
- **Silent failure:** No error is logged. The mismatch is invisible until operators notice the phase badge is missing or the design/build stats don't add up.

**Suggested fix:**  
Normalize agent names by stripping version suffixes and non-alphanumeric characters before comparison:
```ts
function normalizeAgentName(agent: string): string {
  return agent.toLowerCase().replace(/[^a-z]/g, '');
}
```
Then use `DESIGN_TEAM.includes(normalizeAgentName(stage.agent))`. Alternatively, use a prefix match: `DESIGN_TEAM.some(a => agentLower.startsWith(a))`. This tolerates real-world variation in agent naming.

---

### [P3] Cost summary bar includes completed runs but not historical runs beyond `completedRuns` slice

**Why it matters:**  
`CostSummaryBar.tsx` computes estimated cost by summing `completedRuns.reduce(...)` + `activeRun.totalCost`. However, `completedRuns` is populated only from projects in the current `listProjects()` result, which may not include all historical runs if projects have been archived or removed from the portfolio path. The cost display is labeled "Est. Cost" but is actually "Cost of visible runs in current portfolio state."

**Evidence:**  
`CostSummaryBar.tsx` lines 17-19:
```tsx
const estimatedCost =
  completedRuns.reduce((sum, r) => sum + (r.totalCost ?? 0), 0) +
  (activeRun?.totalCost ?? 0);
```
`completedRuns` is sourced from the dashboard endpoint, which iterates only `projects` returned by `listProjects()` (lines 46-53 in `projects.ts` route). If a project directory is moved or renamed, its runs are excluded from the cost sum.

**User impact:**  
Cost summary bar shows a lower total than actual spend if any historical runs are no longer visible in the portfolio. Operators may underestimate total cost when reviewing monthly spend.

**Suggested fix:**  
Either:
1. Add a clarifying label: "Est. Cost (visible runs)" to set expectations, or
2. Persist a global cost ledger (e.g., `cost-history.json`) that accumulates all runs and is never pruned. The summary bar would then read from the ledger, not just from `completedRuns`.

---

### [P3] Agent avatar status always shows "idle" for completed stages in pipeline view

**Why it matters:**  
`PipelineStageCard.tsx` derives `agentStatus` from `isActive`, `isPending`, or implicitly `'idle'` (line 78). Completed stages show `status='idle'` in the agent avatar, which is misleading — the agent is not "waiting for work" but rather "done with this stage." The avatar color implies availability when the agent has already finished.

**Evidence:**  
`PipelineStageCard.tsx` line 78:
```tsx
const agentStatus = isActive ? 'working' : isPending ? 'idle' : 'idle';
```
When `stage.status === 'completed'`, the ternary resolves to `'idle'`. The `AgentAvatar` component renders idle styling (gray border or muted color) for completed stages.

**User impact:**  
Pipeline view shows all completed stages with idle agent avatars, visually suggesting they are ready for work. Operators cannot distinguish between "not started" and "already finished" at a glance. This is a UX clarity issue, not a functional bug, but it reduces scanability of the pipeline.

**Suggested fix:**  
Add a fourth status option in the ternary:
```tsx
const agentStatus = isActive ? 'working' : isPending ? 'idle' : isCompleted ? 'completed' : 'idle';
```
Then extend `AgentAvatar` to accept `status='completed'` and render a success-colored border or checkmark overlay. This gives visual feedback that the stage is done, not waiting.

---

## Evidence Index

| File | Key locations |
|------|---------------|
| `server/routes/projects.ts` | Lines 9-11 (validation function), Line 26 (dashboard route before /:id), Lines 79, 97, 115, 130, 148 (validation calls) |
| `server/index.ts` | Lines 13-16 (CORS restricted to localhost) |
| `server/lib/fsReader.ts` | Lines 162-166 (`hasAnyPremiumData` check, `totalCost` can be null) |
| `src/lib/utils.ts` | Line 14 (`formatCost` returns 'N/A' for null) |
| `src/stores/index.ts` | Lines 98-101 (fallback clears stale dashboard state) |
| `src/views/Home.tsx` | Lines 198-216 (design/build count logic), Lines 189-191 (phase classification) |
| `src/views/Analytics.tsx` | Line 87 (burn rate guard), Line 51 (agent phase classification) |
| `server/routes/analytics.ts` | Lines 101-118 (weekly rollup from timeSeries), Lines 47 & 197 (duplicate readExecutionLog), Line 51 (DESIGN_TEAM includes check) |
| `src/components/ui/CostSummaryBar.tsx` | Lines 17-19 (cost sum from completedRuns only) |
| `src/components/ui/PipelineStageCard.tsx` | Line 78 (agentStatus ternary treats completed as idle) |

---

## Verdict Detail

**CONDITIONAL (0 P1, 1 P2)**

### What was fixed since Cycle 1:
- ✅ Both P1 security/correctness issues resolved
- ✅ All 3 P2 misleading-UI issues resolved
- ✅ 1/4 P3 issues resolved (burn rate divide-by-zero)

### What remains:
- 🟡 **1 P2** (new): Phase classification breaks on agent name variation — impacts Home phase badge and analytics design vs build metrics
- 🟡 **3 P3** (2 carried, 1 new): Weekly series 30-day limit, duplicate log reads, completed agent status display, cost summary scope

### Why CONDITIONAL:
The single P2 finding (agent name matching) is a data integrity issue that silently produces wrong metrics. It does not crash the system or expose security holes, but it does undermine trust in the analytics and phase indicators. Operators will see missing phase badges and incorrect design/build comparisons when agent names vary slightly from the hardcoded arrays.

### Recommendation:
Fix the P2 agent name matching issue before release. The P3 findings are performance/UX polish items that can be deferred to a future sprint without blocking deployment.

---

## Notes for Thor (Orchestrator)

1. **Agent name normalization** (P2) should be handled in a central utility function and reused in both Home and analytics. Consider adding a "canonical name" field to the agent config that maps variations to a standard identifier.

2. **Weekly analytics** and **duplicate log reads** (P3) are related — both involve analytics data collection. Consider batching these fixes together in a single analytics refactor pass.

3. **Cost summary scope** (P3) is a product decision: should cost tracking be portfolio-scoped (current) or global? If global is needed, a persistent ledger is the right fix. If portfolio-scoped is intentional, update the label to clarify.

4. **Pipeline completed status** (P3) is a small UX improvement that would improve scanability of the Pipeline view but is not critical for MVP.

---

**Cycle 2 review complete.**  
**Frigg, QA and Reliability Reviewer**  
**2026-03-26**
