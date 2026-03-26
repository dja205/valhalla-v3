# 27 — Resilience Testing (Fenrir)

**Reviewer:** Fenrir  
**Date:** 2026-03-26  
**Build:** Run 8 — Final Review  

---

## Overall Verdict: ✅ PASS

The application is resilient across all tested failure scenarios. Filesystem failures, malformed data, network errors, and empty states all handled gracefully. No crashes. No unhandled promise rejections.

---

## 1. Empty Portfolio

**Scenario:** `PORTFOLIO_PATH` points to a directory with no projects (or doesn't exist).

**Server behaviour:**
```typescript
// listProjects()
const dirs = await fs.readdir(PORTFOLIO_PATH); // throws if doesn't exist
// caught by outer try/catch → returns []
```

**API response:** `GET /api/projects → []`

**Dashboard response:**
```json
{
  "projects": [],
  "activeRun": null,
  "completedRuns": [],
  "config": { ...defaults },
  "limits": { ...defaults }
}
```

**Frontend behaviour:**
- Home: shows `EmptyState` ("No active job running") + both agent team panels rendered with all agents idle ✅
- Backlog: shows `EmptyState` ("No items in backlog") ✅
- Pipeline: shows both phases with all agents idle ✅
- Completed: shows `EmptyState` ✅
- Analytics: shows empty charts (timeSeries all zeros) ✅

**Verdict:** ✅ Fully resilient. UI degrades gracefully with empty states.

---

## 2. Missing `execution-log.json`

**Scenario:** Project has `state.yaml` but run directory has no `execution-log.json`.

**Server behaviour:**
```typescript
// readExecutionLog()
const content = await fs.readFile(logPath, 'utf-8'); // throws ENOENT
// caught → returns []
```

**RunDetail shape:**
```json
{
  "stages": [],
  "totalDurationMs": 0,
  "totalCost": 0
}
```

**Frontend behaviour:**
- Home: run shows as active with 0 stages, cost $0.00, elapsed timer running ✅
- Pipeline: phase flows show all agents with no stage data (idle state) ✅
- Analytics: run excluded from breakdowns (no entries) ✅

**Verdict:** ✅ Handled. No crash. Displays as if run just started.

---

## 3. Malformed `state.yaml`

**Scenario:** `state.yaml` contains invalid YAML.

**Server behaviour:**
```typescript
const stateContent = await fs.readFile(statePath, 'utf-8');
const state = yaml.load(stateContent) as StateYaml; // throws on invalid YAML
// outer catch in listProjects: "Skip projects without valid state.yaml"
```

**Result:** Project silently skipped from list.

**Verdict:** ✅ Handled. Bad project doesn't poison the whole list.

**Edge case:** If YAML parses but is structurally invalid (e.g., missing fields), the `as StateYaml` cast doesn't validate — it just trusts the shape. Missing fields accessed via optional chaining (`state.runs || []`, `r.run_id`, etc.) → safe defaults.

---

## 4. Malformed `execution-log.json`

**Scenario:** `execution-log.json` contains invalid JSON or wrong shape.

```typescript
const stages = JSON.parse(content) as RunStageEntry[];
// If JSON.parse throws → outer catch → returns []
// If array but wrong shape → fields accessed with || 0, ??, etc.
```

- `stage.durationMs || 0` ✅
- `stage.premiumRequests ?? 0` ✅
- `stage.agent?.toLowerCase() ?? ''` ✅
- `stage.status || 'unknown'` ✅

**Verdict:** ✅ Handled. Invalid JSON → empty stages. Wrong shape → safe field access with defaults.

---

## 5. Missing `limits-snapshot.json`

**Server behaviour:**
```typescript
// readLimitsSnapshot
const content = await fs.readFile(LIMITS_FILE, 'utf-8'); // throws ENOENT
// catch → return defaults
```

**Default response:**
```json
{
  "claude": { "used": 0, "limit": 1000, "resetAt": null },
  "copilot": { "used": 0, "limit": 300, "resetAt": null },
  "lastUpdated": "<now>"
}
```

**Frontend:** `CostSummaryBar` shows 0/1000, 0/300. No crash. ✅

---

## 6. Missing `odinclaw.config.yaml`

**Server behaviour:**
```typescript
// parseConfig
const content = await fs.readFile(CONFIG_PATH, 'utf-8'); // throws
// catch → return hardcoded defaults for all 17 agents
```

**Verdict:** ✅ All agents present with default model `claude-sonnet-4` and provider `copilot`.

---

## 7. Network Errors (Client)

**Scenario:** Express server is down or unreachable.

**Store fallback chain:**
```typescript
// fetchAll()
try {
  const res = await fetch('/api/dashboard'); // fails → throws
} catch (error) {
  try {
    // fallback to individual endpoints
    const [projRes, agentsRes] = await Promise.allSettled([
      fetch('/api/projects'),
      fetch('/api/agents'),
    ]);
    // partial data with error message
  } catch {
    set({ error: error.message, isLoading: false });
  }
}
```

| Scenario | Behaviour |
|----------|-----------|
| Server completely down | Shows `ErrorBanner` with error message. Old data preserved in store. |
| Dashboard 500, others OK | Falls back, shows partial data with warning banner. |
| Dashboard OK, agents 500 | Agents show as empty (best-effort fetch). Dashboard data still displayed. |

**Polling behaviour:**
- Failed fetches don't stop polling — next interval tries again ✅
- Manual refresh button still available ✅

**Verdict:** ✅ Network errors are user-visible and non-fatal.

---

## 8. Partial/Corrupted Cache State

**Scenario:** Cache returns stale data while filesystem changes.

Cache TTLs:
- Projects: 10 seconds
- Config: 30 seconds
- Limits: 30 seconds

At 10-second polling interval, the effective staleness is at most 10 seconds (polling triggers fresh reads as cache expires). Data never served from cache older than 30 seconds in steady state.

**Verdict:** ✅ Acceptable staleness. No crash risk from stale cache data.

---

## 9. Concurrent Requests

**Scenario:** Multiple simultaneous requests for the same resource (e.g., dashboard + agents both triggered).

The cache prevents thundering herd on filesystem:
```typescript
const cached = cache.get<ProjectSummary[]>(cacheKey);
if (cached) return cached;
```

For concurrent requests that both miss cache simultaneously, they both read the filesystem independently — no coordination mechanism, but the result is idempotent. Both set the same data. No data corruption.

**Verdict:** ✅ No crash risk. Worst case: duplicate filesystem reads within a 10-second window.

---

## 10. Large Dataset Resilience

**Scenario:** Portfolio has 100+ projects, each with 50+ runs.

**Concerns:**
- `GET /api/dashboard` loads ALL projects, finds active runs, loads all completed run details. O(projects × runs) readdir calls.
- `GET /api/analytics` iterates all projects × all runs × all stages. No pagination.

For current OdinClaw scale (estimated 5-20 projects, 5-30 runs each), this is fine. At 100 projects × 30 runs × 10 stages = 30,000 stage entries in analytics — still manageable but response time would increase.

**Verdict:** ℹ️ Known limitation. Acceptable at current scale. Cache mitigates repeat hit cost.

---

## 11. React Error Boundary

`ErrorBoundary.tsx` wraps the router/app tree. Any unhandled React render error is caught and shows a fallback UI instead of a blank screen.

**Verdict:** ✅ Last line of defense for unexpected component crashes.

---

## Summary

| Failure Scenario | Handled? | UI Impact |
|-----------------|---------|----------|
| Empty portfolio | ✅ | EmptyState components |
| Missing execution-log.json | ✅ | Run shows with 0 stages |
| Malformed state.yaml | ✅ | Project silently skipped |
| Malformed execution-log.json | ✅ | Run shows with 0 stages |
| Missing limits file | ✅ | Default limits shown |
| Missing config file | ✅ | Default agents shown |
| Server down | ✅ | ErrorBanner + retry polling |
| Partial API failure | ✅ | Fallback to individual endpoints |
| Large dataset | ℹ️ | Acceptable at current scale |

The application handles all expected failure modes without crashing. Resilience is production-quality for a local internal tool.
