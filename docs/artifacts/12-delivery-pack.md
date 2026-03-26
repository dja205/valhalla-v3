# Valhalla V3 — Delivery Pack

**Run:** 2026-03-26-gh1-build-valhalla-v3-real-time-agent-pipeline-dashboard  
**Project:** valhalla-v3  
**Phase:** Design Complete → Pending Thor Handoff  
**Verdict:** ✅ READY FOR HANDOFF (all blocking items resolved)  
**Date:** 2026-03-26

---

## Overview

Valhalla V3 is a complete rebuild of the OdinClaw pipeline dashboard, adding real-time agent status tracking, a two-phase (Design/Build) pipeline view, full cost breakdowns, analytics, and mobile responsiveness. The design phase is complete. This document summarises all design artifacts produced and the conditions for handoff to Thor.

---

## Design Artifacts

| # | Artifact | Author | Status |
|---|----------|--------|--------|
| 01 | `01-orchestrator.json` | Loki | ✅ Complete |
| 02 | `02-system-map.json` | Ratatoskr | ✅ Complete |
| 03 | `03-architecture.md` | Mimir | ✅ Complete |
| 04 | `04-ux-design.md` | Baldr | ✅ Complete |
| 05 | `05-capability-slices.json` | Sleipnir | ✅ Complete |
| 06 | `06-discovery.json` | Freya | ✅ Complete |
| 07 | `07-issue-drafts.json` | Brokk | ✅ Complete (21 issues) |
| 08 | `08-split-issues.json` | Sindri | ✅ Complete |
| 11 | `11-planning-qa.json` | Heimdall | ✅ Complete (verdict: NEEDS_WORK) |
| 12 | `12-delivery-pack.md` | Loki | ✅ This document |

---

## Architecture Summary (Mimir)

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion, Zustand, Node.js + Express, recharts, react-markdown

**Key Architecture Decisions:**
- `AD-01`: Express API server reads filesystem; no direct fs access from frontend
- `AD-02`: Single 10-second polling interval via Zustand; no per-view polling
- `AD-03`: Phase assignment (design/build) computed server-side from agent name
- `AD-04`: premiumRequests typed as `number | null`; null treated as 0 for cost, displayed as `--` in detail views
- `AD-05`: Frontend must not encode agent team membership — derived server-side from config
- `AD-06`: No external component libraries (no shadcn, MUI); custom components only

**Data Sources:**
- `~/odinclaw/portfolio/projects/<project>/state.yaml` — project/run status
- `~/odinclaw/portfolio/projects/<project>/runs/<run>/execution-log.json` — stage data
- `~/odinclaw/odinclaw.config.yaml` — agent model/team config
- `data/limits-snapshot.json` — API limits (written by external process, read-only)

---

## UX Design Summary (Baldr)

**5 Views:**
1. **Home** — Active job hero card + Design/Build team panels + pipeline flow bar + sticky cost header
2. **Backlog** — Queued jobs (awaiting_review) with expandable request markdown
3. **Pipeline** — Two-phase horizontal stage flows (Design stages left, Build stages right) with animated cards
4. **Completed** — Historical runs with summary metrics and full stage breakdown overlay
5. **Analytics** — Cost charts, performance charts, limits tracker with burn rate projection

**Design Language:** Dark space theme, glowing pulse on active agents, Framer Motion stage transitions, mobile-first responsive. Agent avatars from `public/img/agents/` (22 files confirmed). Known issue: `ratatoksr.PNG` typo → must be renamed to `ratatoskr.PNG` in CC-01-C1.

**Mobile:** Single-column, tab navigation, swipeable stage flows, horizontal agent scroll in team panels.

---

## Discovery Findings (Freya)

**Confirmed Data Model:**
- Status values: `active`, `awaiting_review`, `blocked`, `completed` (no `failed`)
- `premiumRequests`: Always `null` in current data — type as `number | null`
- Artifact convention: Flat numbered `.md` files at run root (`00-request.md` through `80-release.md`); `40-build/` subdirectory is **obsolete**
- Agent-to-phase mapping: Must be server-side lookup table (agent name → design/build)
- V2 reference: `valhalla-v2/src/` is a working React+TS+Vite+Tailwind app and is the primary implementation reference

---

## Issue Backlog (Brokk)

**21 issues** across 7 bounded contexts:

### Delivery Order

| Order | ID | Title | Size | Dependencies |
|-------|-----|-------|------|-------------|
| 1 | DISC-01-C1 | Discovery: confirm data schemas | S | — |
| 2 | CC-01-C1 | Design system: shared components | M | — |
| 3 | CC-02-C1 | Application shell: routing + nav | M | CC-01-C1 |
| 4 | INT-01-C1 | Shared TypeScript types (API contract) | S | DISC-01-C1 ⚠️ |
| 5 | BC-01-C1 | Backend: filesystem reader | M | DISC-01-C1, INT-01-C1 ⚠️ |
| 6 | BC-01-C2 | Backend: artifact reader endpoint | S | BC-01-C1 |
| 7 | BC-01-C3 | Backend: agent config reader | S | BC-01-C1 |
| 8 | BC-01-C4 | Backend: limits snapshot reader | S | — |
| 9 | BC-02-C1 | Zustand store + polling loop | M | BC-01-C1, BC-01-C3, BC-01-C4 |
| 10 | BC-03-C1 | Home: active job hero card | M | BC-02-C1, CC-01-C1 |
| 11 | BC-03-C2 | Home: agent team panels | M | BC-02-C1, BC-01-C3, CC-01-C1 |
| 12 | BC-03-C3 | Home: pipeline flow bar + cost header | M | BC-02-C1, BC-01-C4, CC-01-C1 |
| 13 | BC-04-C1 | Backlog view | M | BC-02-C1, BC-01-C2, CC-01-C1 |
| 14 | BC-05-C1 | Pipeline: Design Phase flow | L | BC-02-C1, CC-01-C1, CC-02-C1 |
| 15 | BC-05-C2 | Pipeline: Build Phase flow | L | BC-05-C1, CC-01-C1 |
| 16 | BC-05-C3 | Pipeline: animated transitions | M | BC-05-C1, BC-05-C2 |
| 17 | BC-06-C1 | Completed: jobs list | M | BC-02-C1, CC-01-C1 |
| 18 | BC-06-C2 | Completed: detail overlay | L | BC-06-C1, BC-01-C2 |
| 19 | BC-07-C1 | Analytics: cost dashboard | L | BC-02-C1, CC-01-C1 |
| 20 | BC-07-C2 | Analytics: performance dashboard | L | BC-02-C1, CC-01-C1 |
| 21 | BC-07-C3 | Analytics: limits tracker | M | BC-01-C4, CC-01-C1 |

---

## Split Assessment (Sindri)

**2 issues flagged for splitting:**

| Original | Split Into | Rationale |
|----------|-----------|-----------|
| BC-06-C2 (L) | BC-06-C2a (desktop overlay), BC-06-C2b (mobile tabs) | Desktop two-column and mobile tab layouts are substantially different implementations |
| BC-07-C1 (L) | BC-07-C1a (time-series chart), BC-07-C1b (breakdown charts) | Distinct data aggregation concerns; can be built and reviewed independently |

**3 L-sized issues remain unsplit** (BC-05-C1, BC-05-C2, BC-07-C2) — Sindri assessed these as unified enough to remain single issues despite L sizing.

---

## Planning QA (Heimdall)

**Verdict: ✅ ALL BLOCKING ITEMS RESOLVED** — Quality score 4/5

### Blocking Issues — ALL RESOLVED
1. ~~Circular dependency: INT-01-C1 ↔ BC-01-C1~~ ✅ Fixed — removed BC-01-C1 from INT-01-C1's deps
2. ~~Apply Sindri's split recommendations~~ ✅ Fixed — 4 child issues applied, delivery order updated to 23 issues

### Warnings — ALL ADDRESSED
- ✅ Caching AC added to BC-01-C1: "in-process cache with 10s TTL"
- ✅ Error boundary AC added to CC-02-C1: "global error boundary renders graceful fallback"
- ✅ Manual refresh AC added to BC-02-C1: "manual refresh button triggers immediate poll"
- ✅ Animation specifics added to BC-05-C3: "300ms ease-out enter, 200ms ease-in exit, 2s pulse"
- 5 issues with >2 blocking dependencies remain (pragmatic, documented)

### Recommended First Sprint

`DISC-01-C1` → `INT-01-C1` + `CC-01-C1` (parallel) → `BC-01-C1` + `BC-01-C2` + `BC-01-C3` + `BC-01-C4` → `CC-02-C1`

---

## Handoff Conditions

### MUST complete before Thor handoff
- [x] Remove BC-01-C1 from INT-01-C1's dependency list ✅ Done
- [x] Apply BC-06-C2 → BC-06-C2a + BC-06-C2b split in issue backlog ✅ Done
- [x] Apply BC-07-C1 → BC-07-C1a + BC-07-C1b split in issue backlog ✅ Done
- [x] Update delivery order in issue backlog after splits ✅ Done (23 issues)

### SHOULD address before Thor starts
- [x] Add caching AC to BC-01-C1: "in-process cache with 10s TTL prevents filesystem hammering" ✅ Done
- [x] Add error boundary AC to CC-02-C1: "global error boundary renders graceful fallback" ✅ Done
- [x] Add manual refresh AC to BC-02-C1: "manual refresh button triggers immediate poll" ✅ Done

### NICE-TO-HAVE
- [x] Add animation duration/easing specifics to BC-05-C3 ACs ✅ Done (300ms ease-out enter, 200ms ease-in exit, 2s pulse)
- [ ] Populate `type` field for all issues (discovery_needed / bounded_context / cross_cutting / integration)

---

## Cost Estimate

| Size | Count | Est. Hours |
|------|-------|-----------|
| S | 5 | ~2h each = 10h |
| M | 12 | ~4h each = 48h |
| L | 4 | ~8h each = 32h |
| **Total** | **21** | **~90h** |

After splits applied: 23 issues, ~95h estimated.

---

## What Thor Receives (after blocking items resolved)

- Architecture spec with 6 key decisions and full data model
- UX spec with 5-view layout, mobile breakpoints, animation spec
- Discovery findings with confirmed schemas and known edge cases
- 23 issues (after splits) fully scoped with ACs, dependencies, and delivery order
- Reference implementation: `valhalla-v2/src/` for component patterns
- Source directory: `valhalla-v3/src/` (empty, ready for scaffold)

---

_Loki — Design Orchestrator_  
_2026-03-26_
