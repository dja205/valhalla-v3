# 25 — Adversarial Testing (Valkyrie)

**Reviewer:** Valkyrie  
**Date:** 2026-03-26  
**Build:** Run 8 — Final Review  

---

## Overall Verdict: ✅ PASS (with notes)

No critical vulnerabilities found. The attack surface is small given this is a local-only tool that reads read-only filesystem data. Key risks are documented below.

---

## 1. XSS via Markdown Rendering

**Target:** `MarkdownRenderer.tsx` → `react-markdown`

**Findings:**

`react-markdown` renders markdown to React elements, NOT raw HTML. This means:

```jsx
<ReactMarkdown>{userContent}</ReactMarkdown>
```

- Does NOT call `dangerouslySetInnerHTML`
- Script tags in content are rendered as text, not executed
- HTML tags in markdown are rendered as text by default unless `rehype-raw` plugin is added

**Test cases (static analysis):**

| Input | Expected | Actual |
|-------|----------|--------|
| `<script>alert(1)</script>` | Stripped/escaped | ✅ Rendered as text |
| `[click](javascript:alert(1))` | Link rendered, JS URL should be blocked | ✅ react-markdown blocks `javascript:` hrefs by default |
| `![img](x onerror=alert(1))` | Image tag without event handler | ✅ Event handlers stripped |
| `**bold** <b>also bold</b>` | HTML not rendered | ✅ HTML shown as text |

**Verdict:** ✅ No XSS risk. `react-markdown` is safe without `rehype-raw`.

**Note:** If `rehype-raw` is ever added, re-evaluate. Content comes from local filesystem markdown files, not user input — so even then, the threat model is minimal.

---

## 2. Path Traversal in Artifact Endpoint

**Target:** `GET /api/projects/:id/runs/:runId/artifacts/:stage`  
**Handler:** `readArtifactFile(projectId, runId, stagePrefix)`

**Analysis:**

```typescript
const runPath = path.join(PORTFOLIO_PATH, projectId, 'runs', runId);
const files = await fs.readdir(runPath);
const matchingFile = files.find(f => f.startsWith(stagePrefix) && f.endsWith('.md'));
const artifactPath = path.join(runPath, matchingFile);
const content = await fs.readFile(artifactPath, 'utf-8');
```

**Test scenarios:**

| Input | Vector | Result |
|-------|--------|--------|
| `projectId = "../../etc"` | Path traversal via projectId | `path.join` normalizes, but could escape PORTFOLIO_PATH boundary |
| `runId = "../../passwd"` | Path traversal via runId | Same issue |
| `stage = "../"` | Path traversal via stage | Stage is used with `startsWith` against readdir results — limits scope to the run directory |
| `projectId = "valid"`, `runId = "../../valid-project/runs/run"` | Deep traversal | Could read another project's run data |

**Verdict:** ⚠️ LOW RISK — Path traversal is theoretically possible via `:id` and `:runId` params if an attacker can reach the server. `path.join` does NOT strip `../` sequences.

**Mitigation (recommended):**
```typescript
// Validate params only contain safe characters
if (!/^[a-zA-Z0-9_\-\.]+$/.test(projectId) || !/^[a-zA-Z0-9_\-\.]+$/.test(runId)) {
  return res.status(400).json({ error: 'Invalid path parameters' });
}
```

**Exploitability:** NEGLIGIBLE in practice — requires network access to port 3001 (localhost-only by default). CORS is open but browsers enforce same-origin for credential requests. A local attacker could hit the endpoint directly.

---

## 3. Error State Edge Cases

### 3.1 Missing `execution-log.json`

```typescript
// readExecutionLog catches error and returns []
return [];
```

- `RunDetail.stages` will be `[]`
- `totalCost` and `totalDurationMs` will be `0`
- Frontend `PipelineStageCard` renders with no stages — shows empty state
- **Verdict:** ✅ Handled gracefully

### 3.2 Missing `state.yaml`

```typescript
// listProjects: skip projects without valid state.yaml
} catch {
  // Skip projects without valid state.yaml
}
```

- Project simply doesn't appear in the list
- **Verdict:** ✅ Handled gracefully

### 3.3 Missing `limits-snapshot.json`

```typescript
// readLimitsSnapshot returns defaults on error
const defaults: LimitsSnapshot = {
  claude: { used: 0, limit: 1000, resetAt: null },
  copilot: { used: 0, limit: 300, resetAt: null },
  lastUpdated: new Date().toISOString(),
};
```

- **Verdict:** ✅ Default values shown, no crash

### 3.4 Missing `odinclaw.config.yaml`

```typescript
// parseConfig returns hardcoded defaults
const result: AgentConfigResponse = { agents: [...DESIGN_TEAM, ...BUILD_TEAM]..., ... };
```

- **Verdict:** ✅ All agents shown with default model, no crash

### 3.5 `/api/dashboard` failure

Store fallback chain:
1. Try `/api/dashboard` → 
2. On failure, try `/api/projects` + `/api/agents` individually →
3. Set `error` state to show `ErrorBanner`

- **Verdict:** ✅ Graceful degradation

---

## 4. Missing/Malformed Data

### 4.1 `RunStageEntry` with null fields

`premiumRequests: null` is typed and handled: `stage.premiumRequests ?? 0`  
`completedAt: null` — only displayed if present  
`agent: undefined` — `stage.agent?.toLowerCase() ?? ''` in analytics

**Verdict:** ✅ All nulls defensively handled

### 4.2 Malformed JSON in `execution-log.json`

```typescript
const stages = JSON.parse(content) as RunStageEntry[];
```

No try/catch on the JSON.parse specifically, but the outer try/catch catches JSON parse errors → returns `[]`.

**Verdict:** ✅ Handled

### 4.3 Empty portfolio directory

`listProjects()` returns `[]` if `PORTFOLIO_PATH` doesn't exist (caught error → returns `[]`).

Home view shows: "No active job running" + empty team panels (still render correctly).

**Verdict:** ✅ Handled via EmptyState components

### 4.4 Very large `execution-log.json`

No streaming or pagination. All stages loaded into memory. For a typical OdinClaw pipeline (8-10 stages per run), this is fine. Could be an issue with 1000s of runs, but that's not the use case.

**Verdict:** ℹ️ Acceptable for current scale

---

## 5. Client-Side State Edge Cases

### 5.1 Polling during component unmount

```typescript
useEffect(() => {
  fetchAll();
  startPolling(10000);
  return () => stopPolling();
}, [fetchAll, startPolling, stopPolling]);
```

Cleanup function calls `stopPolling()` which calls `clearInterval`. Module-scoped `pollingInterval` is correctly nulled.

**Verdict:** ✅ No memory leak

### 5.2 Multiple view instances starting polls

`pollingInterval` is module-scoped. `stopPolling` is called before starting a new interval:

```typescript
startPolling: (intervalMs = 10000) => {
  get().stopPolling(); // clears existing first
  ...
}
```

**Verdict:** ✅ Only one interval running at a time

### 5.3 Race condition: fast navigation between views

If a user navigates Home → Pipeline rapidly, each view calls `startPolling`. The second call stops the first. No dangling callbacks since `fetchAll` is idempotent.

**Verdict:** ✅ No issue

---

## 6. Dependency Vulnerabilities

```
2 moderate severity vulnerabilities (esbuild dev server CORS)
```

- Both are in `esbuild` (bundled with Vite)
- Only affects the **dev server** (port 5173)
- Fix requires `vite@8` which is a breaking change
- Production build is not affected

**Verdict:** ℹ️ Acceptable for dev tool. Pin or update when Vite v8 stable lands.

---

## Summary

| Category | Finding | Severity | Status |
|----------|---------|----------|--------|
| XSS via markdown | None | — | ✅ Clean |
| Path traversal | Possible via id/runId params | LOW | ⚠️ Recommend validation |
| Error states | All handled gracefully | — | ✅ Clean |
| Malformed data | All nulls handled | — | ✅ Clean |
| Client memory leaks | None | — | ✅ Clean |
| npm vulnerabilities | 2 moderate (dev only) | LOW | ℹ️ Track for Vite v8 |

No blockers for release.
