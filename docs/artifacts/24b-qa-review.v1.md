# 24b — QA Review
**Review Cycle:** 1
**Reviewer:** Frigg
**Date:** 2026-03-26
**Scope:** Full codebase — `server/` and `src/`

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 2     |
| P2       | 4     |
| P3       | 4     |

**Verdict: FAIL** (2 P1 findings)

---

## Findings

---

### [P1] Dashboard route is permanently shadowed — primary data endpoint always 404s

**Why it matters:**
The frontend's primary data source (`fetch('/api/dashboard')`) will always return 404 on a live server. The entire application degrades to a fallback that omits `activeRun`, `completedRuns`, `config`, and `limits` on every page load. No user will see correct data for the main dashboard view unless this is fixed.

**Evidence:**
`server/index.ts` lines 16–20 proxy the request:
```ts
app.get('/api/dashboard', async (req, res, next) => {
  req.url = '/dashboard';
  projectsRouter(req, res, next);
});
```
Inside `server/routes/projects.ts`, routes are registered in this order:
1. `router.get('/', ...)` — line 11
2. `router.get('/:id', ...)` — line 20  ← matches `'dashboard'` first
3. …(other `/:id/*` routes)…
4. `router.get('/dashboard', ...)` — line 80  ← never reached

Express matches routes in registration order. When `projectsRouter` receives `/dashboard`, it matches `/:id` with `id = 'dashboard'`, calls `readProjectDetail('dashboard')`, gets `null`, and returns `404 Project not found`. The actual `router.get('/dashboard', ...)` handler is unreachable via the proxy.

The store (`src/stores/index.ts` line 47) calls `fetch('/api/dashboard')`, catches the 404 as an error, then falls back to a partial fetch of `/api/projects` and `/api/agents` only — discarding `activeRun`, `completedRuns`, `config`, and `limits`.

**User impact:**
Home, Pipeline, Completed, and Analytics views will never receive activeRun, completedRuns, config, or limits data. CostSummaryBar shows "No active job" permanently. Agent panels show all agents idle permanently. Analytics shows no stats. The error banner shows "Dashboard unavailable — using partial data" on every load.

**Suggested fix:**
Register `/dashboard` before `/:id` in `projects.ts`, or — simpler — remove the proxy in `index.ts` entirely and mount the projects router directly: the `/api/projects/dashboard` path would then work, or register the `/dashboard` route as a standalone top-level route that calls the same handler directly.

---

### [P1] Path traversal via unsanitized `projectId` and `runId` URL parameters

**Why it matters:**
User-supplied route parameters are concatenated into filesystem paths with `path.join()` without any sanitization or bounds checking. `path.join()` resolves `..` segments. An attacker can escape `PORTFOLIO_PATH` and read arbitrary files accessible to the server process. CORS is wide-open (`app.use(cors())` with no origin restriction), so this is also reachable cross-origin from any web page in a browser.

**Evidence:**
`server/lib/fsReader.ts`:
- `readProjectDetail(projectId)` → `path.join(PORTFOLIO_PATH, projectId, 'state.yaml')`
- `readStateYaml(projectId)` → same
- `readExecutionLog(projectId, runId)` → `path.join(PORTFOLIO_PATH, projectId, 'runs', runId, 'execution-log.json')`
- `readRunDetail(projectId, runId)` → calls both above
- `listArtifacts(projectId, runId)` → `path.join(PORTFOLIO_PATH, projectId, 'runs', runId)`
- `readArtifactFile(projectId, runId, stagePrefix)` → `path.join(PORTFOLIO_PATH, projectId, 'runs', runId)` then reads the file

`server/routes/projects.ts`: `req.params.id` and `req.params.runId` are passed directly to these functions with no validation.

Concrete example: `GET /api/projects/..` → `path.join('/home/user/.openclaw/.../projects', '..', 'state.yaml')` resolves to the parent directory's `state.yaml`. With chained parameters, an attacker can walk the directory tree using multiple API calls. The JSON and YAML file contents are returned in API responses.

`server/index.ts` line 10: `app.use(cors())` — no origin restriction.

**User impact:**
Remote read of any file readable by the server process. In a local dev/ops context where this server runs with user-level filesystem access, this includes home-directory files, SSH keys, tokens, config files, and other workspace files. Cross-origin browsers could be directed to exfiltrate data via a malicious web page.

**Suggested fix:**
Validate that `projectId` and `runId` match a known safe pattern (e.g., `/^[a-zA-Z0-9_\-]+$/`) and reject any path that when resolved does not begin with `PORTFOLIO_PATH`. Example:
```ts
const resolved = path.resolve(PORTFOLIO_PATH, projectId);
if (!resolved.startsWith(path.resolve(PORTFOLIO_PATH) + path.sep)) {
  return res.status(400).json({ error: 'Invalid project id' });
}
```
Also scope CORS to `localhost` only (`cors({ origin: 'http://localhost:5173' })`).

---

### [P2] Cost metric permanently shows zero / "—" due to always-null `premiumRequests`

**Why it matters:**
`totalCost` is computed by multiplying `premiumRequests * 0.10`, but the type definition and inline comment explicitly state that `premiumRequests` is always null. Every cost display in the UI is permanently wrong.

**Evidence:**
`src/types/api.ts` line 27:
```ts
premiumRequests: number | null;  // always null currently
```
`server/lib/fsReader.ts` `readRunDetail()`:
```ts
const totalCost = stages.reduce((sum, s) => {
  return sum + (s.premiumRequests ? s.premiumRequests * 0.10 : 0);
}, 0);
```
Since `premiumRequests` is always `null` (falsy), `totalCost` is always `0`.

UI impact sites:
- `CostSummaryBar.tsx`: "Est. Cost" shows "—" for all runs
- `Analytics.tsx` StatCard "Total Cost": shows "—"
- `PipelineStageCard.tsx`: per-stage cost shows "—"
- `StageCard.tsx`: same

**User impact:**
The cost dashboard is permanently misleading — it silently shows $0 / "—" regardless of actual API usage. Operators cannot track spend from this dashboard.

**Suggested fix:**
If `premiumRequests` data is available in the execution log JSON but the field is misnamed or missing on the parsed object, fix the field mapping. If the data is genuinely unavailable, surface a clear "Cost tracking not yet available" message instead of implying $0 cost. Once the field carries real values, the existing multiplication formula is correct.

---

### [P2] `buildCount` hardcoded to `0` in `PipelineFlowBar` — Build phase count always wrong

**Why it matters:**
The Build phase in the pipeline flow indicator will always display 0 jobs, even when a build is actively running. This directly contradicts the "active run" hero card shown above it.

**Evidence:**
`src/views/Home.tsx`:
```tsx
<PipelineFlowBar
  currentPhase={getCurrentPhase()}
  backlogCount={backlogCount}
  designCount={activeCount}
  buildCount={0}           // ← hardcoded
  completeCount={completedRuns.length}
/>
```

**User impact:**
Pipeline flow bar Build badge always shows no count. When a build run is active, the bar shows "Design: 1, Build: 0" which is either wrong (if it's a build-phase run) or misleading (if it's design-phase). `activeCount` is reused for both `designCount` without distinguishing phase, compounding the issue.

**Suggested fix:**
Derive build and design counts from the active run's current stage phase. The `getCurrentPhase()` function already determines which phase the active run is in. Count active runs per phase rather than passing `activeCount` indiscriminately to `designCount` and hard-coding `buildCount=0`.

---

### [P2] Stale `activeRun`, `completedRuns`, `config`, and `limits` survive the dashboard fallback path

**Why it matters:**
When the dashboard endpoint fails (which happens on every request due to finding #1 above), the fallback fetches only projects and agents. It does not clear or update `activeRun`, `completedRuns`, `config`, or `limits`. If the store previously had data (e.g., from a short window where the server worked differently, or after a hot-reload), those stale values persist and are displayed as current. The error banner reads "Dashboard unavailable — using partial data" but there is no visual distinction between fresh and stale fields.

**Evidence:**
`src/stores/index.ts` fallback block (lines 65–80):
```ts
set({
  projects,
  agents,
  isLoading: false,
  lastRefreshed: new Date(),
  error: 'Dashboard unavailable — using partial data',
});
// activeRun, completedRuns, config, limits are NOT touched
```

**User impact:**
After a session where the dashboard was briefly working, a reload will show the old `activeRun` hero card and old completion counts alongside a dismissible error banner. The operator may act on stale run state (e.g., thinking a job is still active when it finished). `lastRefreshed` is updated to "now" even though the data is stale, making the timestamp misleading.

**Suggested fix:**
In the fallback path, explicitly null-out the fields that couldn't be refreshed:
```ts
set({
  projects,
  agents,
  activeRun: null,
  completedRuns: [],
  config: null,
  limits: null,
  ...
});
```
This gives an accurate, empty state rather than a misleading stale one.

---

### [P3] Burn rate projection divides by near-zero when limit was recently reset

**Why it matters:**
`burnRateLabel()` in `Analytics.tsx` produces nonsensical or Infinity values when a limit was reset recently (daysLeft ≈ 30), causing garbled text in the API Limits card.

**Evidence:**
`src/views/Analytics.tsx`:
```ts
const dailyRate = used / (30 - daysLeft); // rough
```
When `daysLeft` is 29 or 30 (a fresh reset), `30 - daysLeft` is 0 or 1. Division by zero produces `Infinity`; near-zero division produces thousands. The resulting `daysToLimit` and projection label will be either `Infinity`, `NaN`, or absurdly large numbers displayed to the user.

**User impact:**
API Limits section on Analytics shows garbage text such as "At current rate, limit in ~Infinityd" immediately after a reset. Only corrects itself after usage builds up over several days.

**Suggested fix:**
Guard against the near-zero denominator:
```ts
const elapsed = 30 - daysLeft;
if (elapsed < 1) return `On track — resets in ${Math.ceil(daysLeft)}d`;
const dailyRate = used / elapsed;
```

---

### [P3] Weekly analytics time-series only covers the last 30 days of data

**Why it matters:**
The weekly series rollup is computed from `timeSeries` (which is pre-filtered to the last 30 days) rather than from `allEntries`. Projects with runs older than 30 days are silently omitted from the weekly view.

**Evidence:**
`server/routes/analytics.ts`:
```ts
for (const entry of timeSeries) {   // ← timeSeries = last-30-days slice
  const d = new Date(entry.date);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - d.getDay());
  ...
  weeklyMap[wk].premiumRequests += entry.premiumRequests;
  ...
}
const weeklySeries = Object.entries(weeklyMap)...
```
`timeSeries` is populated only from `days30` (30 entries). Any `allEntries` data older than 30 days never enters the weekly map.

**User impact:**
Weekly chart appears to show "all-time weekly activity" but silently excludes history beyond the rolling 30-day window. Long-running projects will have incomplete weekly aggregations. The chart title "Premium Requests Over Time" implies historical completeness.

**Suggested fix:**
Build `weeklySeries` from `allEntries` directly (same pattern as the `timeSeries` daily map but with weekly keys), not from the already-windowed `timeSeries`.

---

### [P3] Analytics endpoint reads execution logs twice per completed run

**Why it matters:**
`readExecutionLog()` is called once in the main `allEntries` loop and again in the `jobCompletionOverTime` loop for every completed run. On a cold cache (or after the 10s TTL expires), this doubles file I/O for the entire execution history on every analytics request.

**Evidence:**
`server/routes/analytics.ts`:
- First pass (line ~65): `const stages = await readExecutionLog(project.projectId, run.runId)` — iterates all runs
- Second pass (line ~165): `const stages = await readExecutionLog(project.projectId, run.runId)` — iterates only completed runs

Cache TTL is 10 seconds (`CACHE_TTL = 10000` in `fsReader.ts`). An analytics request that lands just after expiry reads every log file twice.

**User impact:**
Analytics endpoint becomes noticeably slow on projects with many completed runs when the cache is cold. Not a crash, but degraded response time that could cause the chart to render blank before timing out on slow filesystems or large portfolios.

**Suggested fix:**
Collect `totalDuration` per run during the first `allEntries` pass and reuse the result for `jobCompletionOverTime`. Eliminates the second loop and second file read entirely.

---

## Evidence Index

| File | Key locations |
|------|---------------|
| `server/index.ts` | Lines 14–20 (dashboard proxy), Line 10 (CORS) |
| `server/routes/projects.ts` | Lines 11–84 (route ordering: `/:id` before `/dashboard`) |
| `server/lib/fsReader.ts` | `readProjectDetail`, `readRunDetail`, `readExecutionLog`, `listArtifacts`, `readArtifactFile` — all use `path.join` with unvalidated params |
| `src/types/api.ts` | Line 27 (`premiumRequests: number | null  // always null currently`) |
| `src/stores/index.ts` | Lines 47–80 (dashboard fetch + fallback — stale state) |
| `src/views/Home.tsx` | `PipelineFlowBar` call with `buildCount={0}` |
| `src/views/Analytics.tsx` | `burnRateLabel` function — divide-by-near-zero |
| `server/routes/analytics.ts` | Weekly rollup loop; duplicate `readExecutionLog` calls |
