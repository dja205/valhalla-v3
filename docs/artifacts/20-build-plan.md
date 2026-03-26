# Build Plan — Valhalla V3

**Run:** 2026-03-26-gh1-build-valhalla-v3-real-time-agent-pipeline-dashboard  
**Project:** valhalla-v3  
**Thor:** Build Orchestrator  
**Date:** 2026-03-26  
**Status:** Planning complete — ready for execution

---

## Request Summary

Build Valhalla V3 — a complete rebuild of the OdinClaw pipeline dashboard with real-time agent status tracking, two-phase (Design/Build) pipeline view, cost breakdowns, analytics, and mobile responsiveness. Replaces Valhalla V2.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion, Zustand, Node.js + Express, recharts, react-markdown  
**Source directory:** `valhalla-v3/src/`  
**Reference:** `valhalla-v2/src/` (existing working implementation)  
**23 issues** approved across 7 bounded contexts.

---

## Approved Scope

From Loki's delivery pack (12-delivery-pack.md), all blocking items resolved, quality score 4/5:

| Decision | Summary |
|----------|---------|
| AD-01 | 10s polling; no SSE/WebSocket in v3 |
| AD-02 | Single Zustand store with slices; one polling interval |
| AD-03 | Express API owns all filesystem access; frontend has no fs access |
| AD-04 | TypeScript types co-owned in `src/types/api.ts` |
| AD-05 | Design/Build team membership derived server-side from config |
| AD-06 | No external component libraries (no shadcn, no MUI) |

---

## Run Overview

| Run | Issues | Description | Specialist | Est. Duration |
|-----|--------|-------------|-----------|---------------|
| 1 | DISC-01-C1, CC-01-C1, INT-01-C1 + scaffold | Ymir scaffolds project; discovery + design system + shared types | Ymir | ~3h |
| 2 | BC-01-C4, BC-01-C1, BC-01-C2, BC-01-C3 | Full Express backend API layer | Modi | ~4h |
| 3 | CC-02-C1, BC-02-C1, BC-03-C1 | App shell + routing + Zustand store + Home hero card | Modi | ~5h |
| 4 | BC-03-C2, BC-03-C3, BC-04-C1 | Home view completion (team panels + cost header) + Backlog view | Modi | ~5h |
| 5 | BC-05-C1, BC-05-C2, BC-05-C3 | Pipeline view — Design Phase + Build Phase + animated transitions | Magni | ~6h |
| 6 | BC-06-C1, BC-06-C2a, BC-06-C2b | Completed view — jobs list + overlay desktop + overlay mobile | Modi | ~5h |
| 7 | BC-07-C3, BC-07-C1a, BC-07-C1b, BC-07-C2 | Analytics view — limits tracker + cost charts + performance dashboard | Modi | ~6h |
| 8 | — (pipeline phases) | Code review + adversarial testing + integration + resilience + release | Tyr → Valkyrie → Jormungandr → Fenrir → Surtr | ~5h |

---

## Run 1: Scaffold + Foundation

### Issues
- **[Ymir]** Project scaffold — full `valhalla-v3/src/` directory structure, package.json, all tooling configs
- **DISC-01-C1** (S) — Discovery: confirm state.yaml schema, execution-log.json schema, and stage-to-phase mapping
- **CC-01-C1** (M) — Design system: shared component library (tokens, AgentCard, JobCard, StageChip, CostBar, AgentAvatar)
- **INT-01-C1** (S) — API-Frontend contract: shared TypeScript types for all API response shapes

### Scope
- Vite + React 18 + TypeScript project scaffold with all dependencies installed
- Directory skeleton: `src/`, `server/`, `src/types/`, `src/lib/`, `src/stores/`, `src/components/`, `src/views/`, `src/hooks/`
- Tailwind dark theme configured with Norse design tokens (CSS variables: `--color-bg-base`, `--color-bg-surface`, `--color-accent-amber`, `--color-accent-cyan`, glows, etc.)
- All shared primitive components: `AgentAvatar`, `AgentCard`, `JobCard`, `StageCard`, `StatusBadge`, `ModelBadge`, `CostBar`, `MarkdownRenderer`, `Accordion`, `Overlay`, `SkeletonCard`, `EmptyState`, `ErrorBanner`, `RefreshControl`, `ProgressBar`
- `AgentAvatar` image map for all 21 agents — corrects `ratatoksr.PNG` → `ratatoskr.PNG` typo
- Framer Motion animation variants in `src/lib/motion.ts` with `prefers-reduced-motion` support
- `src/types/api.ts` with all API response shapes: `ProjectSummary`, `RunDetail`, `RunStageEntry`, `AgentConfig`, `LimitsSnapshot`; `premiumRequests: number | null`; status as union type
- Base Express server file at `server/index.ts` (skeleton, no routes yet)

### Entry state
- `valhalla-v3/src/` is empty (or contains only placeholder files)
- `valhalla-v2/src/` exists as reference implementation
- Agent avatar images exist in `public/img/agents/` (22 files, including typo)

### Exit state
- `npm install` succeeds
- `npm run dev` starts Vite dev server with stub views for all 5 routes
- All shared components render with correct dark theme tokens
- `AgentAvatar` correctly resolves all 21 agent names to PNG files with no 404s
- TypeScript compiles clean (`npm run type-check` passes)
- `ratatoskr.PNG` typo corrected and all references updated
- Animation variants available and prefers-reduced-motion respected

### Specialist routing
- **Ymir** (claude-sonnet-4-6) — owns this entire run; scaffold + discovery + design system + types
- Discovery findings (DISC-01-C1) must be embedded as inline comments in `src/types/api.ts` and a `DISCOVERY.md` note in the run artifact

---

## Run 2: Backend API Layer

### Issues
- **BC-01-C4** (S) — Backend: limits snapshot reader for API/Copilot rate limit data
- **BC-01-C1** (M) — Backend: filesystem reader for projects, runs, state.yaml, execution-log.json
- **BC-01-C2** (S) — Backend: artifact reader endpoint for stage markdown files
- **BC-01-C3** (S) — Backend: agent config reader for model assignments and Design/Build team derivation

### Scope
- Full Express API server with all routes:
  - `GET /api/projects` — list all projects with summary status
  - `GET /api/projects/:projectId` — full project state with run history
  - `GET /api/projects/:projectId/runs/:runId` — execution log for a run
  - `GET /api/projects/:projectId/runs/:runId/artifacts/:stage` — artifact markdown
  - `GET /api/config` — agent config with `designTeam` and `buildTeam` arrays pre-derived
  - `GET /api/limits` — limits snapshot from `data/limits-snapshot.json`
- In-process cache with 10s TTL (prevents filesystem hammering on each poll tick)
- Graceful error handling: missing files → structured error responses, not 500 crashes
- Agent-to-phase mapping table server-side (Design: loki, mimir, baldr, ratatoskr, sleipnir, freya, heimdall, brokk, sindri; Build: thor, ymir, modi, magni, tyr, valkyrie, jormungandr, fenrir, surtr, hel)
- `premiumRequests: null` handled as 0 for cost calculations; displayed as `--` in API responses
- Artifact path resolution from stage name → numbered `.md` file at run root (flat convention; `40-build/` subdirectory treated as obsolete)
- Reads from `~/odinclaw/portfolio/projects/` and `~/odinclaw/odinclaw.config.yaml`

### Entry state
- Run 1 complete: scaffold, types, components all in place
- `src/types/api.ts` defines all response shapes (BC-01-C1 imports from this)
- No backend routes implemented yet

### Exit state
- `npm run server` starts Express on port 3001
- `GET /api/projects` returns real data from portfolio filesystem
- All 6 API routes return correctly shaped JSON matching `src/types/api.ts`
- API handles missing files, null premiumRequests, empty projects gracefully
- Cache TTL working — rapid repeated calls don't re-read disk
- TypeScript compiles clean for `server/` directory

### Specialist routing
- **Modi** (claude-opus-4-6) — owns this entire run
- Implement BC-01-C4 first (no dependencies, simple file reader) then BC-01-C1 (core reader), then BC-01-C2 and BC-01-C3 sequentially

---

## Run 3: App Shell + Store + Home Hero

### Issues
- **CC-02-C1** (M) — Application shell: routing, navigation, and mobile tab bar
- **BC-02-C1** (M) — Frontend: Zustand store with 10-second polling loop and global refresh trigger
- **BC-03-C1** (M) — Home view: active job hero card with real-time stage indicator

### Scope
- React Router v6 with 5 named routes: `/`, `/backlog`, `/pipeline`, `/completed`, `/analytics`
- Desktop sidebar navigation (200px expanded / 64px icon-only collapsed at < 1024px)
- Mobile bottom tab bar (56px, 5 items with icons + labels)
- Active route highlighted; page fade transition via Framer Motion
- Global error boundary rendering graceful fallback on uncaught errors
- `VITE_API_BASE_URL` env var defaulting to `http://localhost:3001`
- Zustand store with slices: `projectsSlice`, `activeRunSlice`, `completedRunsSlice`, `configSlice`, `limitsSlice`, `uiSlice`
- 10s polling loop (single `setInterval`); manual refresh button triggers immediate poll
- Last-refreshed timestamp in store; 1-second counter for display
- Polling error state: stale banner shown, previous data retained
- Home view: Active Job hero card — job title, current stage, elapsed time, running cost, pulsing amber glow when active, "Pipeline idle" empty state when no active run

### Entry state
- Run 1 complete: components and types
- Run 2 complete: Express API serving real data on port 3001

### Exit state
- `npm run dev` starts both Vite and Express concurrently
- Browser navigates between all 5 routes via nav
- Store polls API every 10s and populates all slices
- Manual refresh button works
- Home view renders active job hero card with real data (or idle empty state)
- Pulsing glow displays on in-progress job
- TypeScript compiles clean; no console errors

### Specialist routing
- **Modi** (claude-opus-4-6) — owns this entire run
- Implement CC-02-C1 (shell + nav) first, then BC-02-C1 (store + polling), then BC-03-C1 (home hero)

---

## Run 4: Home View Completion + Backlog

### Issues
- **BC-03-C2** (M) — Home view: Design and Build agent team panels
- **BC-03-C3** (M) — Home view: pipeline flow bar and sticky cost/limits header
- **BC-04-C1** (M) — Backlog view: scrollable queued jobs list with expandable request markdown

### Scope
- Home — Design Team panel and Build Team panel side-by-side (desktop) / stacked (mobile)
- Each team panel: horizontally scrollable agent card row on mobile, 3-column grid on desktop
- Agent cards: avatar, name, status badge (● Working / ○ Idle / ⚠ Blocked), current model badge
- Amber glow ring on actively working agent
- Home — sticky `CostSummaryBar` at top: daily premium requests, Claude API %, Copilot %
- Home — `PipelineFlowBar`: horizontal pill flow showing Backlog → Design ● → Build → Done with job counts
- Backlog view: scrollable list of `awaiting_review` status jobs
- Each backlog card: title, issue number, project, date created
- Expand/collapse on tap: renders full request markdown via `MarkdownRenderer`
- Pull-to-refresh on mobile (overscroll gesture); loading spinner
- Empty state: "Backlog is clear." with Norse icon
- Skeleton loading cards on first load

### Entry state
- Run 3 complete: app shell, store polling, home hero card working
- Home view has active job hero card; team panels and flow bar are stubs
- `/backlog` route renders a stub view

### Exit state
- Home view fully complete: hero card + team panels + cost header + pipeline flow bar
- Agent statuses derived from store (working if agent matches current stage in active run)
- Backlog view shows real queued jobs, expand/collapse works, markdown renders
- Pull-to-refresh functional on mobile breakpoint (375px)
- All three home sections update on each 10s poll tick

### Specialist routing
- **Modi** (claude-opus-4-6) — owns this entire run
- Implement in order: BC-03-C2 → BC-03-C3 → BC-04-C1

---

## Run 5: Pipeline View

### Issues
- **BC-05-C1** (L) — Pipeline view: Design Phase horizontal stage flow with job cards
- **BC-05-C2** (L) — Pipeline view: Build Phase horizontal stage flow with job cards
- **BC-05-C3** (M) — Pipeline view: animated stage transition system with Framer Motion

### Scope
- Pipeline view with two sections stacked vertically: **Design Phase** (top) and **Build Phase** (bottom)
- Design Phase stages (8): Architecture → UX Design → System Map → Capability Slicing → Discovery → Issues → Issue Refinement → Planning QA
- Build Phase stages (8): Foundation → Implementation → Code Review → Adversarial Testing → Integration Testing → Resilience Testing → Release → Recovery
- `StageCard` per stage (~96×120px mobile, ~140×130px desktop): agent avatar, stage name, elapsed duration, running cost, model badge
- Stage states with visual treatment:
  - `pending`: dim surface, grey avatar silhouette
  - `in_progress`: raised surface, amber `box-shadow` glow, live duration counter, pulsing amber ring
  - `completed`: dim surface, subtle green border, full avatar
  - `failed`: dim surface, red border
- Horizontal scroll on mobile; arrow navigation buttons on desktop overflow
- No active run: all stages `pending`, caption "Awaiting next job…"
- Animated transitions: `in_progress → completed` fades glow, border turns green, pulse stops; next card scales up with new glow — Framer Motion `layout` + `animate`, 400ms ease-out enter, 200ms ease-in exit
- Active stage ring pulse: CSS keyframes (`animation: pulse 2s ease-in-out infinite`), NOT Framer Motion (performance)
- All animations respect `prefers-reduced-motion: reduce` — static indicators, instant transitions

### Entry state
- Run 3 complete: app shell, store, routing
- `/pipeline` route renders a stub view
- Store `activeRunSlice` provides live stage data

### Exit state
- Pipeline view renders both phase flows with real execution data
- Active stage shows pulsing glow and live elapsed counter
- Completed stages show green border and final duration/cost
- Stage transitions animate correctly (reduced-motion variant also functional)
- Horizontal scroll works on mobile; overflow arrows functional on desktop
- TypeScript compiles clean; no console errors

### Specialist routing
- **Magni** (claude-opus-4-6) — owns this entire run (complex L-sized implementation + animation system)
- Implement in order: BC-05-C1 (Design Phase) → BC-05-C2 (Build Phase, reuses patterns from C1) → BC-05-C3 (animation system, polishes both phases)

---

## Run 6: Completed View

### Issues
- **BC-06-C1** (M) — Completed view: jobs list with summary metrics and status badges
- **BC-06-C2a** (M) — Completed view: detail overlay — desktop layout with accordion and artifact rendering
- **BC-06-C2b** (M) — Completed view: detail overlay — mobile tab layout variant

### Scope
- Completed view: scrollable list of finished jobs, newest first
- Each row: title, project, completion date, ✓ Success (green) / ✗ Failed (red) badge, total duration, total cost (`premiumRequests × $0.10`), total tokens (or `--` if unavailable)
- Tap row → Job Detail Overlay
- Desktop overlay: full-screen modal with dark translucent scrim; two-column layout (Design stages left, Build stages right); independently scrollable columns
- Each column: `Accordion` row per stage — agent name, avatar, model used, duration, premium requests/cost, token count (input/output), rendered artifact markdown
- Lazy artifact fetch triggered on accordion expand (calls `BC-01-C2` endpoint)
- "Artefact not available" shown in accordion body if fetch fails
- Summary footer: total duration, total cost, total tokens
- Focus trap, `Escape` to close, `role="dialog"` `aria-modal="true"`, accessible close button
- Mobile overlay: same accordion structure but Design / Build as tab switcher (not 2-column)
- Mobile: overlay slides up from bottom; close via back gesture or button
- Responsive: desktop 2-column at ≥ 768px, mobile tab layout below

### Entry state
- Run 2 complete: `BC-01-C2` artifact reader endpoint available
- Store `completedRunsSlice` provides list of completed runs
- `/completed` route renders a stub view

### Exit state
- Completed list renders real data, sorted newest first
- Success/failure badges correct
- Tap row → overlay opens; accordion sections expand/collapse
- Artifact markdown renders for real stage artifacts in run directories
- Desktop 2-column layout functional at ≥ 768px; mobile tab layout at < 768px
- Focus trap works; Escape closes overlay; focus returns to trigger row
- TypeScript compiles clean

### Specialist routing
- **Modi** (claude-opus-4-6) — owns this entire run
- Implement in order: BC-06-C1 → BC-06-C2a (desktop) → BC-06-C2b (mobile tab variant, reuses accordion from 2a)

---

## Run 7: Analytics View

### Issues
- **BC-07-C3** (M) — Analytics view: limits tracker with usage bars and burn rate projection
- **BC-07-C1a** (M) — Analytics view: cost time-series chart with granularity toggle (day/week/month)
- **BC-07-C1b** (M) — Analytics view: cost breakdown charts (per project, per agent, per model tier)
- **BC-07-C2** (L) — Analytics view: performance dashboard with agent durations and success/failure rates

### Scope
- Analytics view: single scrollable column on desktop; 3 tabs (Cost / Performance / Limits) on mobile
- **Limits Tracker** (BC-07-C3): Claude API progress bar + burn rate projection; GH Copilot progress bar + burn rate; data from `limitsSlice` (sourced from `data/limits-snapshot.json`); "No limits data configured" empty state if snapshot absent
- **Cost Time-Series** (BC-07-C1a): recharts `LineChart` or `BarChart` of daily/weekly/monthly premium request consumption; range toggle; dark styling, amber colour
- **Cost Breakdown** (BC-07-C1b): horizontal `BarChart` per project; horizontal `BarChart` per agent; model tier donut or bar; all derived from `completedRunsSlice` stage data
- **Performance Dashboard** (BC-07-C2): average stage duration per agent (bar chart); job completion time distribution (line/scatter); success vs failure rate (donut or big number); Design phase vs Build phase duration comparison
- All charts: `<ResponsiveContainer>` wrapper; dark background, muted grid lines; amber (Design) / cyan (Build) colour palette; static (no drill-down in v3)
- Empty state per chart: "No data yet — complete a job to see analytics."
- `premiumRequests: null` → treated as 0 in all aggregations

### Entry state
- Run 2 complete: `BC-01-C4` limits endpoint available
- Store `completedRunsSlice` and `limitsSlice` populated
- `/analytics` route renders a stub view

### Exit state
- Analytics view renders all 3 sections with real data from portfolio
- Limits bars show correct values (or configured empty state if no snapshot)
- Cost charts aggregate correctly from execution-log data; `null` premiumRequests treated as 0
- Performance charts render from completed run history
- Granularity toggle (day/week/month) functions on cost time-series chart
- Mobile tab switching between Cost / Performance / Limits works
- TypeScript compiles clean

### Specialist routing
- **Modi** (claude-opus-4-6) — owns this entire run
- Implement in order: BC-07-C3 (limits tracker, simplest) → BC-07-C1a → BC-07-C1b → BC-07-C2 (largest, L-sized)

---

## Run 8: Review + Testing + Release

### Issues
- *(No issue IDs — these are pipeline quality gates)*

### Scope

**Tyr — Code Review (`24-code-review.md`)**
- Architecture compliance: no direct fs from frontend, store is sole HTTP client, no per-view polling
- TypeScript type safety: no `any`, shared types used consistently, `premiumRequests: number | null` handled correctly
- Accessibility: WCAG AA contrast, keyboard navigation, focus trap in overlay, `aria-live` on stage counter, `aria-busy` on skeletons
- Tailwind dark theme consistency across all views
- Error handling: partial failures degrade gracefully (no white screens)
- Performance: no unnecessary re-renders, polling interval not leaked

**Valkyrie — Adversarial Testing (`25-adversarial-testing.md`)**
- Missing `state.yaml` → API returns structured error, UI shows empty state
- Missing `execution-log.json` → graceful empty; no crash
- `premiumRequests: null` on all stages → costs show $0.00 or `--`; no NaN errors
- API unreachable → amber "unable to refresh" banner; previous data retained
- Empty states: no active run, empty backlog, no completed runs, no analytics data
- Malformed markdown → renders as `<pre>`, no crash
- 375px viewport: all nav items tappable (≥ 44×44px), no layout overflow

**Jormungandr — Integration/E2E Testing (`26-integration-e2e.md`)**
- All 6 API endpoints return data matching `src/types/api.ts` shapes from real portfolio filesystem
- Zustand store populates all slices correctly after first poll
- Views render correctly with real portfolio data (existing projects and runs)
- 10s polling cycle updates store without re-render flash
- Manual refresh button triggers immediate poll and updates last-refreshed timestamp
- Artifact loading in Completed overlay fetches and renders real `.md` files

**Fenrir — Resilience Testing (`27-resilience.md`)**
- Polling under rapid tab switching — no interval leak
- Large `execution-log.json` (50+ stage entries) — no performance regression
- Many projects (10+) — list renders correctly
- Filesystem unavailable mid-session — recovers on next poll
- No memory leak after 10 minutes of 10s polling

**Surtr — Release (`28-release.md`)**
- `npm run build` succeeds (Vite production build)
- `npm run server` starts in production mode
- `README.md` updated with setup, start, and port configuration instructions
- Any Tyr review findings resolved before this step

### Entry state
- Runs 1–7 all complete
- All 5 views functional with real data
- Full application navigable end-to-end

### Exit state
- All review findings addressed
- No known edge-case crashes
- Production build verified
- `28-release.md` written as final release summary artifact
- Source code committed and pushed

### Specialist routing
- **Tyr** (claude-sonnet-4-6) — code review; outputs findings for Modi/Magni to fix before testing begins
- **Valkyrie** (claude-sonnet-4-6) — adversarial testing after fixes applied
- **Jormungandr** (claude-haiku-4.5) — integration/E2E verification
- **Fenrir** (claude-haiku-4.5) — resilience/stress testing
- **Surtr** (claude-haiku-4.5) — final build, README, release notes
- Gate: Tyr review findings must be addressed before Valkyrie begins; all testing must pass before Surtr proceeds

---

## Specialist Routing Summary

| Specialist | Runs | Model |
|------------|------|-------|
| Ymir | Run 1 | claude-sonnet-4-6 |
| Modi | Runs 2, 3, 4, 6, 7 | claude-opus-4-6 |
| Magni | Run 5 | claude-opus-4-6 |
| Tyr | Run 8 (review) | claude-sonnet-4-6 |
| Valkyrie | Run 8 (adversarial) | claude-sonnet-4-6 |
| Jormungandr | Run 8 (integration) | claude-haiku-4.5 |
| Fenrir | Run 8 (resilience) | claude-haiku-4.5 |
| Surtr | Run 8 (release) | claude-haiku-4.5 |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Implementation volume (23 issues, ~95h est.) | Medium | Well-defined scope from design phase; V2 reference available; each run is independently committable |
| Pipeline view complexity (BC-05, L×2 + animation) | High | Isolated in Run 5; Magni handles all three issues in sequence; animation system designed in Run 1 |
| premiumRequests always null in current data | Low | Discovery confirmed; cost displays $0.00 or `--`; null treated as 0 throughout |
| Tyr review findings requiring rework | Medium | Gate enforced before testing; rework happens between Tyr and Valkyrie within Run 8 |
| Context limit in Copilot CLI sessions | Low | Each run capped at 3–5 issues; V2 reference and scaffold reduce starting cost |
| Agent-to-phase mapping drift | Low | Derived server-side from config; mapping documented in DISC-01-C1 findings |

---

## Release Strategy

1. Each run commits and pushes source to `valhalla-v3` repo on completion
2. No half-built state spans runs — each run exit state is a working, runnable application
3. Run 8: `npm run build` verification before `28-release.md` is written
4. Recovery path: if any run is incomplete, document gaps in the run's artifact file; Hel invoked for rollback planning if build fails

---

## Recovery Strategy

- Incomplete run: document remaining work in the run artifact; next session resumes from exact issue checkpoint
- `npm run build` failure: Surtr documents, Hel is invoked (`29-recovery.md`)
- Tyr review blockers: Modi/Magni fix findings before Valkyrie starts; no skipping gates
- Any run may be re-invoked with the same context if session is lost

---

_Thor — Build Orchestrator_  
_2026-03-26_
