# Architecture Constraints — Valhalla V3

## Summary

Valhalla V3 is a real-time dashboard SPA for the Norse Agent System v2 pipeline. It is a **local-only**, **read-only** tool: no auth, no writes, no external network calls required for core operation. The system has two discrete runtime processes — a Node.js/Express API server that owns filesystem access, and a Vite/React SPA that owns all presentation. The two communicate exclusively over HTTP polling at 10-second intervals.

The central design challenge is surfacing a **two-phase pipeline** (Design / Build) with live in-flight state across five views while remaining visually coherent on mobile. The architecture prioritises clarity of seams over clever coupling: the API is a thin filesystem reader, the client store is the single source of truth for all UI state, and each view consumes store slices without direct API calls.

---

## Boundaries and Bounded Contexts

### System Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│  Host Machine (macOS, local-only)                               │
│                                                                 │
│  ┌──────────────────────┐    HTTP/JSON    ┌──────────────────┐  │
│  │  Express API Server  │◄──────────────►│  Vite + React    │  │
│  │  (Node.js, port TBD) │  poll 10s      │  SPA (browser)   │  │
│  └──────────┬───────────┘                └──────────────────┘  │
│             │ fs read-only                                      │
│  ┌──────────▼───────────────────────────────────────────────┐  │
│  │  Portfolio Filesystem (~/.openclaw/workspace/odinclaw/)  │  │
│  │  · portfolio/projects/<project>/state.yaml               │  │
│  │  · portfolio/projects/<project>/runs/<run>/              │  │
│  │      execution-log.json                                  │  │
│  │      00-request.md … 80-release.md (artifact files)      │  │
│  │  · odinclaw.config.yaml                                  │  │
│  │  · (local limits snapshot — see Open Questions)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Bounded Context Summary

| ID | Name | Owner Layer | Primary Concern |
|---|---|---|---|
| BC-01 | Data Ingestion and API Layer | Backend | Filesystem reads, response shaping, Express routes |
| BC-02 | Real-Time State Sync and Client Store | Frontend | Zustand store, polling loop, normalisation |
| BC-03 | Dashboard Home View | Frontend | Active job hero, team panels, cost bar |
| BC-04 | Backlog View | Frontend | Queued jobs list, markdown expansion |
| BC-05 | Pipeline View | Frontend | Two-phase live flow, animations, stage cards |
| BC-06 | Completed Jobs View | Frontend | History list, cost/duration, artifact overlay |
| BC-07 | Analytics View | Frontend | Charts, burn rate projection, limits tracker |
| CC-01 | Design System and Shared UI Components | Frontend | Tailwind tokens, primitives, Framer Motion variants |
| CC-02 | Application Shell, Routing, Navigation | Frontend | Vite scaffold, React Router, global boundaries |
| INT-01 | API–Frontend Contract | Shared | TypeScript types, response schemas |
| DISC-01 | Filesystem Data Model Discovery | Discovery | Schema audit (unblocks BC-01, INT-01) |

---

## Key Components and Responsibilities

### Backend

#### Express API Server (`/api/`)
- **Single responsibility:** read filesystem data, shape and serve JSON responses.
- **Routes (proposed):**
  - `GET /api/projects` — list all projects with summary status
  - `GET /api/projects/:projectId` — full project state including run history
  - `GET /api/projects/:projectId/runs/:runId` — execution log for a specific run
  - `GET /api/projects/:projectId/runs/:runId/artifacts/:stage` — artifact markdown content
  - `GET /api/config` — parsed agent config (team membership, model assignments)
  - `GET /api/limits` — limits snapshot (source TBD — see Open Questions)
- **Caching:** lightweight in-process cache with TTL ≤ 10s to prevent hammering disk on every poll tick. Cache is invalidated on TTL expiry, not on file-watch events (simpler; 10s staleness acceptable).
- **No write operations.** No endpoints mutate the filesystem.
- **Error contract:** malformed or missing files must return structured error responses (not 500 crashes); the client must degrade gracefully.

#### Filesystem Reader Module
- Owns all `fs` calls and YAML/JSON parsing.
- Must handle: missing `state.yaml`, missing `execution-log.json`, missing artifact files, malformed YAML, zero runs.
- `premiumRequests` is nullable in `execution-log.json` — cost calculation must treat null as 0.

#### Agent Config Parser
- Parses `odinclaw.config.yaml`.
- Derives Design team and Build team membership from known orchestrator-to-specialist topology (see Agent Team Structure below).
- Config is read at startup and optionally re-read on cache miss; not hot-reloaded.

### Frontend

#### Application Shell (CC-02)
- Vite + React 18 + TypeScript project root.
- React Router v6 with five named routes: `/`, `/backlog`, `/pipeline`, `/completed`, `/analytics`.
- Persistent navigation (bottom bar on mobile, sidebar or top bar on desktop).
- Global error boundary and global loading indicator fed by Zustand store state.

#### Zustand Store (BC-02)
- Single store, multiple slices:
  - `projectsSlice` — list of all projects with current status
  - `activeRunSlice` — execution log for the current active run
  - `completedRunsSlice` — history list with cost/duration aggregates
  - `configSlice` — agent config (team membership, model info)
  - `limitsSlice` — cost limits and burn rate data
  - `uiSlice` — loading, error, last-refreshed timestamp, manual-refresh trigger
- Polling loop is owned by the store (a single `setInterval` started on mount, cleared on unmount); all views subscribe to the same interval.
- No per-view polling; the store is the only HTTP client.

#### Views
Each view is a React component that subscribes to store slices. Views must not issue API calls directly.

| View | Key Store Slices |
|---|---|
| Home (`/`) | `activeRunSlice`, `configSlice`, `limitsSlice` |
| Backlog (`/backlog`) | `projectsSlice` (queued status filter) |
| Pipeline (`/pipeline`) | `activeRunSlice`, `configSlice` |
| Completed (`/completed`) | `completedRunsSlice` |
| Analytics (`/analytics`) | `completedRunsSlice`, `limitsSlice` |

#### Design System (CC-01)
- Tailwind CSS v3 dark theme configured via CSS variables in `tailwind.config.ts`.
- Shared primitives: `Card`, `Overlay`, `Badge`, `Grid`, `AgentAvatar`, `JobCard`, `MarkdownRenderer`.
- Framer Motion animation variants centralised in `src/lib/motion.ts` — no inline variant definitions in view components.
- No external component library mandated.

---

## Integration Seams

### Seam 1: API Response Shape ↔ Client Store (INT-01)

This is the highest-risk seam. TypeScript types must be co-owned in a shared directory (`src/types/api.ts` or equivalent) and imported by both API response serialisers and client-side normalisation logic.

**Core response shapes (to be validated by DISC-01):**

```typescript
// Derived from observed state.yaml and execution-log.json schemas

interface ProjectSummary {
  projectId: string;
  description: string;
  status: 'active' | 'completed' | 'queued' | string; // open until DISC-01
  currentRun: string | null;
  lastUpdated: string; // ISO8601
}

interface RunStageEntry {
  stage: string;
  agent: string;
  model: string;
  provider: string;
  status: 'completed' | 'in_progress' | 'failed' | string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  durationFormatted: string;
  premiumRequests: number | null; // null = not tracked; treat as 0 for cost calc
  changedFiles: string[];
  summaryExcerpt: string;
}

interface RunDetail {
  runId: string;
  projectId: string;
  status: string;
  currentStage: string | null;
  stagesCompleted: string[];
  stages: RunStageEntry[]; // from execution-log.json
  created: string;
  lastUpdated: string;
  metadata: Record<string, unknown>;
}

interface AgentConfig {
  agents: Record<string, { model: string; provider: string; role?: string }>;
  designTeam: string[];  // derived — loki + design specialists
  buildTeam: string[];   // derived — thor + build specialists
}
```

**Cost calculation:** `premiumRequests × $0.10` per stage. Total run cost = sum across all stages. Null `premiumRequests` → 0 contribution.

### Seam 2: Artifact Markdown Resolution

Artifact files follow a numeric-prefix convention: `00-request.md`, `10-architecture.md`, `20-spec.md`, `30-tasks.md`, `40-build/` (directory), `50-implementation-summary.md`, `60-review.md`, `70-qa.md`, `80-release.md`, `80-memory.md`.

The API must resolve artifact paths from the run directory and serve file content at `GET /api/projects/:projectId/runs/:runId/artifacts/:stage`. The stage-to-filename mapping must be defined server-side; the client passes a stage name, not a filename.

**Assumption:** `40-build/` may be a directory (not a single file) — the API must handle this case. Clarification may be needed from DISC-01.

### Seam 3: Design / Build Phase Derivation

The two-phase pipeline display (Pipeline view, Home view team panels) requires knowing which agents belong to each phase. This is **derived from `odinclaw.config.yaml`**, not stored in `state.yaml` or `execution-log.json`.

Derivation rule (assumption — confirm via DISC-01 if needed):
- **Design phase agents:** `loki`, `mimir`, `baldr`, `ratatoskr`, `sleipnir`, `freya`, `heimdall`
- **Build phase agents:** `thor`, `ymir`, `modi`, `magni`, `tyr`, `valkyrie`, `jormungandr`, `fenrir`, `surtr`, `hel`, `brokk`, `sindri`
- **Cross-cutting:** `odin`, `yggdrasil`

The API's `/api/config` endpoint should return `designTeam` and `buildTeam` arrays pre-derived so the frontend does not need to encode this logic.

### Seam 4: Limits Data Source

`odinclaw.config.yaml` contains `thresholds` and `notify` keys but their full structure is not yet confirmed. A local limits snapshot file may be needed. This is an **open seam** — see Open Questions.

---

## Non-Functional Requirements

| Requirement | Constraint | Notes |
|---|---|---|
| Refresh latency | ≤ 10s staleness | Polling interval; WebSocket/SSE deferred to v4 |
| Mobile-first | All views usable on 375px viewport | Bottom navigation, swipe-friendly layouts |
| Local-only | No public network exposure | API bound to `localhost` only |
| Read-only | Zero filesystem writes from API | Hard constraint |
| No authentication | No login flow | Local tool, single user |
| Dark theme | All UI components dark-themed | Tailwind CSS variables, no light mode toggle required in v3 |
| Performance | Initial load < 3s on local machine | Vite production build; no lazy-loading mandate, but code-splitting per route is recommended |
| Error resilience | Partial data failures must not crash the UI | Missing files → graceful empty states, not white screens |
| Cost calc accuracy | `premiumRequests × $0.10` | Null values treated as 0; rounding to 2dp |

---

## Risks and Trade-offs

### Risk 1: `DISC-01` blocks API and Contract design
**Severity: High.** The exact field names and lifecycle status values in `state.yaml` are not fully confirmed. `premiumRequests` is nullable in observed data — the cost model must handle this. If additional fields are needed for Analytics (BC-07) and do not exist, the Analytics view scope must shrink or the data model must be extended.

**Mitigation:** DISC-01 must complete before BC-01 implementation starts. The TypeScript interface stubs above should be treated as provisional until DISC-01 validates them.

### Risk 2: Polling at 10s may feel stale for in-flight pipeline stages
**Severity: Medium.** A stage transition that completes in < 10s will appear delayed on screen. This is acceptable for v3 given the complexity cost of SSE/WebSocket.

**Mitigation:** Manual refresh button on all views. Accept the trade-off explicitly; document SSE as a v4 upgrade path.

### Risk 3: Pipeline View (BC-05) is XL and spans multiple PRs
**Severity: Medium.** Animation system (Framer Motion), live data binding, and two-phase layout are each substantial. Decomposition into child issues is required before implementation starts.

**Mitigation:** BC-05 child decomposition is a required pre-condition for its build ticket. Animation variants must be defined in CC-01 design system first.

### Risk 4: `40-build/` artifact directory vs single-file assumption
**Severity: Low–Medium.** The artifact file for the `build` stage appears to be a directory, not a single markdown file. The API artifact resolver must handle this. The frontend Completed view overlay expects a single renderable markdown string per stage.

**Mitigation:** API must either concatenate files in the `40-build/` directory, serve an index file, or return a list of sub-artifacts. Decision deferred to BC-01 / DISC-01 but the API interface must account for it.

### Risk 5: Agent team membership hardcoded vs. config-driven
**Severity: Low.** If the config topology changes (new agents, team reassignments), hardcoded Design/Build arrays in the API will drift. The derivation logic is simple enough to maintain but is a latent maintenance risk.

**Mitigation:** The API derives team membership from config at parse time; no hardcoded arrays in frontend code.

### Trade-off: Polling vs. SSE/WebSocket
**Decision: Polling at 10s for v3.**
- SSE or WebSocket would require the Express server to hold open connections and emit events on filesystem change, adding `fs.watch` complexity and connection lifecycle management.
- For a local single-user tool with a pipeline that runs for minutes per stage, 10s staleness is acceptable.
- Upgrade path: replace the Zustand polling loop with an SSE subscription in v4 without changing the store slice interfaces.

### Trade-off: Single Zustand store vs. per-view stores
**Decision: Single store, multiple slices.**
- Ensures all views reflect the same snapshot after each poll tick.
- Simplifies the polling loop — one interval, one set of fetch calls.
- Risk: store becomes a coordination point; slice boundaries must be clean to avoid cross-slice coupling.

---

## Open Questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| OQ-01 | What are all valid `status` values in `state.yaml` at project and run level? | BC-01, INT-01 | DISC-01 |
| OQ-02 | Does `40-build/` always contain sub-files, or can it be a single file? What is the canonical representation for the Completed view overlay? | BC-01, BC-06 | DISC-01 |
| OQ-03 | What is the full structure of the `thresholds` and `notify` keys in `odinclaw.config.yaml`? Is there a separate local limits snapshot file? | BC-07, BC-01 | DISC-01 |
| OQ-04 | Is `premiumRequests` always null for Copilot-provider stages, and tracked only for Anthropic/OpenAI providers? Or is tracking incomplete? | INT-01, BC-07 | DISC-01 |
| OQ-05 | What port should the Express API bind to? Is there a convention in the portfolio for local dev servers? | BC-01, CC-02 | Ratatoskr / project owner |
| OQ-06 | Is there a `current_run` field that identifies the active in-flight run, or must it be inferred from run `status`? (Observed `current_run: null` even for projects with completed runs — needs confirmation for active projects.) | BC-01, BC-03 | DISC-01 |

---

## Decision Log

| # | Decision | Rationale | Alternatives Rejected |
|---|---|---|---|
| AD-01 | Polling at 10s; no SSE or WebSocket in v3 | Lower complexity; acceptable staleness for local single-user tool with multi-minute pipeline stages | SSE (requires fs.watch + open connections); WebSocket (overkill) |
| AD-02 | Single Zustand store with slices | All views must reflect the same poll snapshot; one polling interval | Per-view stores (polling drift risk, duplication) |
| AD-03 | API owns all filesystem access; frontend has no fs access | Clean boundary; enables future deployment (remote API) without frontend changes | Direct fs access from frontend (Electron-style) — not applicable for browser SPA |
| AD-04 | TypeScript types co-owned in shared `src/types/api.ts` | Single source of truth prevents shape drift between API serialiser and client normaliser | Code generation from OpenAPI (deferred; adds toolchain complexity) |
| AD-05 | Design/Build team membership derived server-side from config | Prevents frontend from encoding pipeline topology logic | Frontend derives from raw config object (couples frontend to config schema) |
| AD-06 | No external component library (no shadcn, no MUI) | Maintains full control over dark theme tokens; avoids bundle bloat and override complexity | shadcn/ui (adds complexity), MUI (heavy, difficult to dark-theme cleanly) |
