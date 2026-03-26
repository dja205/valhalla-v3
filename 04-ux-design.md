# UX Constraints — Valhalla V3

> **Baldr — UX Design Specification**
> Real-time pipeline monitoring dashboard for the Norse Agent System v2.
> Audience: Brokk (build), Heimdall (QA), Thor (delivery). Date: 2026-03-26.

---

## Primary Actors

| Actor | Context | Primary Goal |
|---|---|---|
| **Operator** | Sole user; runs Norse Agent System locally on macOS | Monitor pipeline execution, track costs, review completed job artefacts |
| *(No other actors)* | Local-only tool, single-user, no authentication | — |

**Operator mental model:** The operator thinks in terms of *jobs* flowing through a pipeline. They want to know: what is running right now, how far through is it, how much has it cost, and what did past jobs produce. They are technically fluent — dense information display is appropriate.

---

## Key Journeys

### J-01 — Check What Is Running Right Now

1. Operator opens the app → lands on **Dashboard Home** (`/`).
2. Sees the **Active Job hero card** at the top — job name, current stage, elapsed time, running cost.
3. Glances at **Design Team** and **Build Team** panels — knows which agent is currently working.
4. Reads the **Pipeline flow bar** — understands where in the overall flow the job sits.
5. Reads the **Cost Summary bar** — checks daily premium request burn vs. remaining limits.
6. *Success condition:* Operator has a complete situational snapshot in < 10 seconds without navigating away.

### J-02 — Investigate an Active Run in Depth

1. From Dashboard Home, operator taps/clicks **Pipeline** tab → `/pipeline`.
2. Sees the **Design Phase** and **Build Phase** horizontal stage flows.
3. Locates the pulsing active stage card — reads agent avatar, stage name, live duration, running cost.
4. Watches animated card transition when a stage completes and the next begins.
5. *Success condition:* Operator can tell at a glance which agent is active, how long it has been in the current stage, and approximate cost — with no action required.

### J-03 — Browse Queued Work

1. Operator taps **Backlog** tab → `/backlog`.
2. Sees scrollable list of queued jobs — title, issue number, project, date.
3. Taps a card to expand → reads the full request markdown inline.
4. On mobile, pulls down to refresh the list.
5. *Success condition:* Operator can read the full scope of any queued job without leaving the view.

### J-04 — Review a Completed Job

1. Operator taps **Completed** tab → `/completed`.
2. Sees list sorted by completion date, most recent first.
3. Reads cost, duration, success/fail badge at a glance per item.
4. Taps a row → **Job Detail Overlay** opens over the list.
5. Overlay shows two-column layout (Design stages left, Build stages right).
6. Expands a stage accordion → reads agent name, model, duration, cost, rendered artefact markdown.
7. Closes overlay with back/dismiss action.
8. *Success condition:* Operator can audit any historical run's full stage-by-stage output without leaving the app.

### J-05 — Assess Cost and Performance Trends

1. Operator taps **Analytics** tab → `/analytics`.
2. Views **Cost** section: daily/weekly/monthly bar or line chart, per-project cost breakdown, per-agent cost.
3. Views **Performance** section: average stage duration per agent, job completion time distribution, success/failure rate.
4. Views **Limits Tracker**: Claude API remaining, GH Copilot remaining, burn rate projection to limit exhaustion.
5. *Success condition:* Operator can assess whether they are on track to stay within API limits by end of day/week.

---

## Information Architecture

```
/ (Dashboard Home)
├── Cost Summary Bar                  [persistent top bar]
├── Active Job Hero Card
├── Agent Team Panels (2-up)
│   ├── Design Team
│   └── Build Team
└── Pipeline Flow Mini-Bar

/backlog
└── Queued Jobs List
    └── [Expanded] Full Request Markdown

/pipeline
├── Design Phase Stage Flow (horizontal scroll)
│   └── Stage Cards × 8
└── Build Phase Stage Flow (horizontal scroll)
    └── Stage Cards × 8

/completed
└── Completed Jobs List
    └── [Overlay] Job Detail
        ├── Design Stages Column (left)
        │   └── [Accordion] Stage Detail + Artefact Markdown
        └── Build Stages Column (right)
            └── [Accordion] Stage Detail + Artefact Markdown

/analytics
├── Cost Dashboard Section
│   ├── Cost Over Time Chart
│   ├── Cost Per Project Chart
│   └── Cost Per Agent Chart
├── Performance Section
│   ├── Stage Duration Per Agent Chart
│   ├── Job Completion Time Chart
│   └── Success / Failure Rate
└── Limits Tracker Section
    ├── Claude API Progress Bar + Burn Rate
    └── GH Copilot Progress Bar + Burn Rate
```

### Navigation Structure

- **Five top-level routes** — no sub-routes or nested navigation (except the Completed overlay, which is a modal layer, not a route).
- **Persistent navigation** — visible on all routes.
  - **Mobile (≤ 768px):** Bottom tab bar with icon + label. Five items: Home, Backlog, Pipeline, Completed, Analytics.
  - **Desktop (≥ 769px):** Left sidebar (collapsed to icons only at ≥ 769px and < 1024px; expanded with labels at ≥ 1024px). Or top navigation bar — final choice deferred to CC-01/CC-02, but the tab model must work in both orientations.
- **Active route** — highlighted tab/sidebar item. No breadcrumbs required.
- **Last-refreshed timestamp** + **Manual refresh button** — persistent, visible on every view (recommend placement: top-right header area).

---

## Screen Layouts

> These are annotated wireframe descriptions. Dimensions are reference breakpoints: **mobile 375px**, **tablet 768px**, **desktop 1280px**.

---

### Screen 1 — Dashboard Home (`/`)

#### Mobile (375px)

```
┌─────────────────────────────────┐
│ COST SUMMARY BAR                │  ← sticky top; ~48px high
│ Premium: 12/50 today · $1.20    │
│ Claude: 82% · Copilot: 71%      │
├─────────────────────────────────┤
│ ACTIVE JOB HERO CARD            │  ← full width; ~140px
│ ● [pulse] Architecture Stage    │
│ Job: gh-42 — Auth Refactor      │
│ Duration: 4m 32s · Cost: $0.80  │
│ Model: claude-opus-4.5          │
├─────────────────────────────────┤
│ DESIGN TEAM PANEL               │  ← full-width card; ~200px
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Loki  │ │Mimir │ │Baldr │     │
│ │[work]│ │[idle]│ │[idle]│     │
│ └──────┘ └──────┘ └──────┘     │
│ (horizontally scrollable row)   │
├─────────────────────────────────┤
│ BUILD TEAM PANEL                │  ← same layout, idle state
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Thor  │ │Ymir  │ │Modi  │     │
│ │[idle]│ │[idle]│ │[idle]│     │
│ └──────┘ └──────┘ └──────┘     │
│ (horizontally scrollable row)   │
├─────────────────────────────────┤
│ PIPELINE FLOW BAR               │  ← mini; ~60px
│ Backlog(2)→[Design●]→Build→Done │
├─────────────────────────────────┤
│ ⌂ HOME  📋 BACKLOG  ⬡ PIPE  … │  ← bottom nav; 56px
└─────────────────────────────────┘
```

**Layout notes:**
- Cost Summary Bar: single line on mobile; ellipsis/truncate if needed. Tap to expand full breakdown (inline, not overlay).
- Active Job Hero Card: glowing border (CSS box-shadow) when active. If no active job, show "No active job — pipeline idle" neutral empty state.
- Team panels: each agent is a compact card (~80×90px) showing avatar (32px circle), name, status badge. Cards overflow horizontally with momentum scroll; no wrapping on mobile.
- Agent status badges: `● Working` (amber glow), `○ Idle` (dim), `⚠ Blocked` (red). Colour-coded; supplemented by text label (not colour-only — accessibility).
- Pipeline flow bar: pill-shaped stage indicators, active stage has pulse animation. Counts shown in parentheses.
- No pagination or lazy-loading on this view — all data fits in a single page scroll.

#### Desktop (1280px)

```
┌────────────────────────────────────────────────────────────────────┐
│ COST SUMMARY BAR (full width)                                      │
│ Premium: 12/50 today · 84/350 week · Claude: 82% · Copilot: 71%   │
│                              [↻ Refreshed 3s ago]                  │
├──────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR  │ ACTIVE JOB HERO CARD (full column width)                │
│          ├──────────────────────┬──────────────────────────────────┤
│ ⌂ Home   │ DESIGN TEAM PANEL    │ BUILD TEAM PANEL                 │
│ 📋 Backlog│ (agent grid 3×2+)   │ (agent grid 4×3+)               │
│ ⬡ Pipeline│                     │                                  │
│ ✓ Done   │                      │                                  │
│ 📊 Stats  │                      │                                  │
│          ├──────────────────────┴──────────────────────────────────┤
│          │ PIPELINE FLOW BAR (spans full content width)            │
└──────────┴─────────────────────────────────────────────────────────┘
```

- Two team panels side-by-side (2-column grid).
- Agent cards wrap into a 3-column grid per panel (no horizontal scroll needed at ≥ 768px).
- Sidebar is 200px wide (expanded); 64px collapsed (icons only).

---

### Screen 2 — Backlog (`/backlog`)

#### Mobile

```
┌─────────────────────────────────┐
│ BACKLOG                    [↻]  │  ← header + manual refresh
│ 3 queued jobs                   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ gh-43 · 2026-03-25          │ │  ← job card
│ │ Payment Gateway Refactor    │ │
│ │ portfolio/payments          │ │
│ │                         [▼] │ │  ← expand toggle
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ gh-44 · 2026-03-25          │ │
│ │ [expanded]                  │ │  ← full markdown rendered
│ │ ## Context                  │ │
│ │ ...                         │ │
│ │ ## Acceptance Criteria      │ │
│ │ ...                     [▲] │ │  ← collapse toggle
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layout notes:**
- Cards: full width, rounded corners, dark card surface colour.
- Pull-to-refresh: standard overscroll gesture on mobile. Show loading spinner when refreshing.
- Expand/collapse: single tap on card (or chevron). One card can be expanded at a time (auto-collapse previous). Alternatively, allow multiple open — implementation decision for Brokk, but note accessibility concern: ensure expanded state is clear.
- Markdown renderer: `react-markdown` with dark-themed prose styles (code blocks, headings, lists). Max expanded height with internal scroll if very long, or unconstrained (Brokk decides — surface as open question below).
- Empty state: "No jobs in backlog — pipeline is clear." with subtle illustration or Norse icon.
- Loading state: skeleton cards (3 rows) during first load.

#### Desktop
- Two-column card grid. Expanded card spans both columns. Otherwise identical interaction.

---

### Screen 3 — Pipeline (`/pipeline`)

> This is the most complex view. See BC-05 risk notes in architecture doc.

#### Mobile

```
┌─────────────────────────────────┐
│ PIPELINE                   [↻]  │
├─────────────────────────────────┤
│ ── DESIGN PHASE ──              │  ← section header
│  ←  horizontal scroll  →        │
│ ┌──────┐ ┌──────┐ ┌──────┐ … │
│ │Arch  │ │UX    │ │SysMap│   │
│ │✓done │ │●actv │ │queue │   │  ← stage cards
│ │Loki  │ │Baldr │ │      │   │
│ │4m 12s│ │2m 11s│ │      │   │
│ │$0.40 │ │$0.30 │ │      │   │
│ └──────┘ └──────┘ └──────┘   │
│                                 │
│ ── BUILD PHASE ──               │
│  ←  horizontal scroll  →        │
│ ┌──────┐ ┌──────┐ ┌──────┐ … │
│ │Found │ │Impl  │ │Review│   │
│ │wait  │ │wait  │ │wait  │   │
│ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

**Stage card anatomy (per card ~96×120px):**
```
┌─────────────────────┐
│ [Avatar 28px]       │  ← agent avatar; hidden/grey if not yet reached
│ Stage Name          │  ← 2 lines max, ellipsis
│ ● 2m 11s            │  ← live elapsed counter; pulsing dot if active
│ $0.30               │  ← running cost
│ [model badge: opus] │  ← badge: haiku/sonnet/opus/codex/etc.
└─────────────────────┘
```

**Stage states and visual treatment:**

| State | Background | Border | Avatar | Duration | Pulse |
|---|---|---|---|---|---|
| `pending` | Surface dim | None | Grey silhouette | — | None |
| `in_progress` | Surface raised | Amber glow (`box-shadow`) | Full colour | Live counter | Amber ring pulse |
| `completed` | Surface dim | Subtle green | Full colour | Final | None |
| `failed` | Surface dim | Red | Full colour | Final | None |

**Stage order (Design Phase):**
Architecture → UX Design → System Map → Capability Slicing → Discovery → Issues → Issue Refinement → Planning QA

**Stage order (Build Phase):**
Foundation → Implementation → Code Review → Adversarial Testing → Integration Testing → Resilience Testing → Release → Recovery

**Animated transitions:**
- When a stage transitions `in_progress → completed`, the card animates: glow fades, border turns green, pulse stops. Next card animates in: scale-up from 0.9, glow appears. Framer Motion `layout` prop on the card list to handle reflow smoothly.
- Transition duration: 400ms ease-out. Must respect `prefers-reduced-motion`.

**No active run state:**
Both phase sections show all stage cards in `pending` state. Show "Waiting for next run…" caption below Design Phase header.

#### Desktop (1280px)

```
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE                                           [↻ 3s ago]   │
├─────────────────────────────────────────────────────────────────┤
│ DESIGN PHASE                                                     │
│ [Arch] → [UX●] → [SysMap] → [CapSlice] → [Disc] → [Issues] → … │
│                                                                  │
│ BUILD PHASE                                                      │
│ [Found] → [Impl] → [Review] → [ATest] → [ITest] → [RTest] → …  │
└─────────────────────────────────────────────────────────────────┘
```

- Cards are wider (~140×130px) and display more detail inline.
- Horizontal scroll not required at 1280px if 8 cards × 140px ≈ 1120px plus arrows — tight. Provide arrow navigation buttons at ends of each row as overflow affordance. Scrollbar hidden but functionally scrollable.
- Stage name labels fully visible (no truncation on desktop).

---

### Screen 4 — Completed (`/completed`)

#### Mobile — List

```
┌─────────────────────────────────┐
│ COMPLETED                  [↻]  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ✓ gh-41 · Auth Refactor     │ │
│ │ portfolio/api · 2026-03-24  │ │
│ │ ⏱ 1h 12m · 💰 $4.20 · 🪙 …│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✗ gh-39 · Cache Layer       │ │  ← failed badge
│ │ portfolio/cache · 2026-03-22│ │
│ │ ⏱ 45m · 💰 $2.10           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- List sorted newest first.
- Success badge: green pill "✓ Success". Failure badge: red pill "✗ Failed".
- Tap any row → Job Detail Overlay slides up from bottom (mobile) or fades in as full-screen modal (mobile) / right-panel overlay (desktop).

#### Mobile — Job Detail Overlay

```
┌─────────────────────────────────┐
│ [←] Job Detail                  │  ← back button (closes overlay)
│ gh-41 · Auth Refactor           │
│ Total: 1h 12m · $4.20 · 18.4k tok│
├─────────────────────────────────┤
│ DESIGN STAGES          BUILD STAGES│  ← tab switcher on mobile
├─────────────────────────────────┤
│ ▼ Architecture                  │  ← accordion row (expanded)
│   Agent: Loki  Model: sonnet    │
│   Duration: 8m 32s  Cost: $0.40 │
│   Premium: 4  Tokens: 2,100     │
│   ─────────────────────────     │
│   [Rendered artefact markdown]  │
│                                 │
│ ▶ UX Design                     │  ← collapsed
│ ▶ System Map                    │
│ ▶ Capability Slicing            │
│ …                               │
└─────────────────────────────────┘
```

**Mobile-specific:** Design/Build phases shown as tabs (not side-by-side columns) due to width constraints.

#### Desktop — Job Detail Overlay

```
┌──────────────────────────────────────────────────────────────────┐
│ [✕] gh-41 — Auth Refactor                                        │
│ Total: 1h 12m · $4.20 · 18,400 tokens · ✓ Success               │
├─────────────────────────────┬────────────────────────────────────┤
│ DESIGN STAGES               │ BUILD STAGES                       │
├─────────────────────────────┼────────────────────────────────────┤
│ ▼ Architecture              │ ▶ Foundation                       │
│   Loki · claude-sonnet-4    │ ▶ Implementation                   │
│   8m 32s · $0.40 · 2.1k tok │ ▶ Code Review                     │
│   [rendered markdown]       │ ▶ Adversarial Testing              │
│                             │ ▶ Integration Testing              │
│ ▶ UX Design                 │ ▶ Resilience Testing               │
│ ▶ System Map                │ ▶ Release                          │
│ ▶ Capability Slicing        │ ▶ Recovery                         │
│ ▶ Discovery                 │                                    │
│ ▶ Issues                    │                                    │
│ ▶ Issue Refinement          │                                    │
│ ▶ Planning QA               │                                    │
└─────────────────────────────┴────────────────────────────────────┘
```

- Overlay opens as a full-screen modal with a dark translucent scrim behind it.
- Columns are independently scrollable.
- Accordion animation: max-height transition, 250ms ease. Respect `prefers-reduced-motion`.
- Rendered markdown in each accordion. Long artefacts: no height cap (user can scroll within the column).

---

### Screen 5 — Analytics (`/analytics`)

#### Mobile

```
┌─────────────────────────────────┐
│ ANALYTICS                       │
├─────────────────────────────────┤
│ [Cost] [Performance] [Limits]   │  ← 3 tabs
├─────────────────────────────────┤
│ ── Cost ──                      │
│ [Bar/Line chart: daily 7d]      │
│ Range: [Day] [Week] [Month]     │
│                                 │
│ Cost per Project                │
│ [Horizontal bar chart]          │
│                                 │
│ Cost per Agent                  │
│ [Horizontal bar chart]          │
├─────────────────────────────────┤
│ ── Performance ──               │
│ Avg Stage Duration              │
│ [Horizontal bar chart]          │
│                                 │
│ Job Completion Time             │
│ [Line/scatter chart]            │
│                                 │
│ Success / Failure Rate          │
│ [Donut chart or big number]     │
├─────────────────────────────────┤
│ ── Limits ──                    │
│ Claude API                      │
│ [▓▓▓▓▓░░░░░] 82% used           │
│ Burn rate: ~3 days to limit     │
│                                 │
│ GH Copilot                      │
│ [▓▓▓▓░░░░░░] 71% used           │
│ Burn rate: ~4 days to limit     │
└─────────────────────────────────┘
```

**Chart notes:**
- All charts: dark background, no grid lines (or very subtle); axis labels in muted text colour.
- Colour palette: use Norse design token colours — amber for active/Design phase, cyan/blue for Build phase, neutral for totals.
- recharts library (as per architecture). Responsive container wrapping.
- Charts are static (no drill-down required in v3).

#### Desktop
- Three sections laid out as a scrollable single column with generous spacing (not tabs).
- Cost chart wider at full content width — more data points visible.
- Limits tracker can show both bars side-by-side.

---

## Interaction Constraints

### IC-01 — Polling and Staleness

- Data refreshes every 10s automatically. No user action required.
- **Last-refreshed timestamp** displayed persistently (e.g. "Updated 3s ago") — must update in real time (1-second interval counter, not a new API call).
- **Manual refresh button** (↻) on every view header. Triggers an immediate poll cycle. Show loading spinner on the button while refresh is in-flight.
- Stale data (e.g. API unreachable) must not cause layout collapse. Show "Last updated X ago — unable to refresh" warning in the timestamp area. All data remains visible from the previous successful poll.

### IC-02 — No Actions / Read-Only

- Valhalla V3 is read-only. No buttons create, update, or delete pipeline state.
- All interactive elements (expand/collapse, tab switch, overlay open/close, manual refresh) are purely presentation controls.
- Do not imply write capability with icon choices or copy (avoid "Edit", "Delete", "Cancel" labels entirely).

### IC-03 — Navigation

- Bottom nav (mobile) and sidebar (desktop) must always be visible and tappable regardless of scroll position.
- Active view is indicated by highlighted tab/item.
- Overlay (Completed detail) is not a route — back button/swipe-down dismisses to the list without URL change.

### IC-04 — Animations

- All animations use Framer Motion variants defined in `src/lib/motion.ts`.
- Three animation classes:
  1. **Pulse** — active agent/stage ring; CSS keyframes (not Framer Motion) for performance. `animation: pulse 2s ease-in-out infinite`.
  2. **Stage transition** — Framer Motion `layout` + `animate` on stage card change. 400ms ease-out.
  3. **Overlay/Panel open** — slide-up (mobile) or fade-scale (desktop). 300ms ease-out.
- **`prefers-reduced-motion` media query must disable all animations** — views must remain fully functional and readable with no motion. Pulse becomes a static indicator. Transitions are instant. See ACC-04.

### IC-05 — Touch Targets

- All interactive elements: minimum touch target 44×44px (Apple HIG / WCAG 2.5.8).
- Expand/collapse chevrons and accordion rows must meet this minimum.
- Bottom nav items: minimum 48px height.

### IC-06 — Overflow and Truncation

- Job titles: 2-line max with `line-clamp-2`, ellipsis. Full title in tooltip on hover (desktop) / accessible label.
- Stage card names: 2-line max on mobile, fully visible on desktop.
- Cost and duration values: never truncated — they are the primary data. Use smaller font size or wrap rather than truncate.
- Agent names in panels: single line, ellipsis. Never wrap in compact card layout.

### IC-07 — Empty States

Each view must have an explicit, readable empty state:

| View | Empty condition | Message |
|---|---|---|
| Home | No active run | "Pipeline idle — no active job." |
| Backlog | No queued jobs | "Backlog is clear." |
| Pipeline | No active run | "Awaiting next job…" |
| Completed | No completed runs | "No completed runs yet." |
| Analytics | No historical data | "No data yet — complete a job to see analytics." |

Empty states: centred text with muted colour, optional Norse-themed icon (rune/symbol, not a photograph).

### IC-08 — Loading States

- First load (store not yet populated): skeleton cards for all lists. Skeleton must match the shape of real cards (same dimensions, `animate-pulse` shimmer in Tailwind).
- Polling refresh (store already populated): silent background update. Do not flash skeletons on every poll — only on initial load or manual refresh.

### IC-09 — Error States

- API unreachable or returning 500: show an inline banner at the top of each view — "Data unavailable — retrying." in amber. Previously loaded data stays visible. Do not navigate away or show a full-page error.
- Individual artefact unavailable (Completed overlay): show "Artefact not available" in the accordion body instead of empty space.
- Malformed markdown: render as preformatted text (`<pre>`) rather than crash.

---

## Accessibility Expectations

### ACC-01 — Colour and Contrast

- All text must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text/UI components) against dark background surfaces.
- Status colours (amber Working, red Blocked, green Completed) must not be the sole indicator — always pair with a text label or icon.
- Model tier badges: use distinct shapes or labels, not colour alone (e.g., "opus", "sonnet", "haiku" text always visible).

### ACC-02 — Keyboard Navigation

- Full keyboard navigation on desktop: tab order must follow visual reading order.
- Accordion rows: keyboard-expandable via `Enter`/`Space`. Chevron toggle is the focusable element.
- Overlay: focus is trapped within overlay while open. Close via `Escape` key. Focus returns to the triggering row on close.
- Bottom nav and sidebar items: `Tab` traverses all nav items. Active item has visible focus ring.

### ACC-03 — Screen Reader Support

- Agent status badges: use `aria-label` on the coloured badge element (e.g. `aria-label="Status: Working"`).
- Live pipeline stage: mark active stage counter with `aria-live="polite"` so screen readers announce stage changes without interrupting.
- Completed job list: rows must be `role="button"` or use `<button>` with accessible label including job title and date.
- Skeleton loading: use `aria-busy="true"` on the loading region; skeleton elements should be `aria-hidden="true"`.
- Overlay: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the overlay title.

### ACC-04 — Motion and Animation

- Respect `prefers-reduced-motion: reduce`. All Framer Motion animations and CSS keyframe animations must check this preference and either disable or reduce to a simple opacity fade with no transform.
- The pulsing glow on active stages/agents is the main motion risk — it must become a static amber glow (no animation) under `prefers-reduced-motion`.

### ACC-05 — Text and Readability

- Base font size: 14px minimum for secondary text; 16px for primary content text.
- Markdown-rendered artefacts: use `prose` typography class equivalent (line-height ~1.6, readable paragraph spacing).
- Avoid all-caps for long text strings. Use title case or sentence case. Short labels (badges, status) may use uppercase with letter-spacing.

### ACC-06 — Focus Indicators

- Visible focus ring on all interactive elements — do not remove `outline` without replacement. Use a high-contrast ring (e.g. amber `ring-2 ring-amber-400` on the dark theme).

---

## Component Inventory

> Shared primitives for CC-01. View-specific compositions are not listed here.

| Component | Description | Key Props | Notes |
|---|---|---|---|
| `AgentAvatar` | Circular avatar image; falls back to initials if image missing | `agent: string`, `size: 'sm' \| 'md' \| 'lg'`, `status?: 'idle' \| 'working' \| 'blocked'` | Images from `public/img/agents/{name}.PNG`. Note: ratatoskr file is `ratatoksr.PNG` — normalise in mapping. |
| `StatusBadge` | Coloured pill with text label | `status: 'idle' \| 'working' \| 'blocked' \| 'completed' \| 'failed'` | Colour + text label always; never colour alone. |
| `ModelBadge` | Small text badge showing model tier | `model: string` | Derive display label: e.g. "opus", "sonnet", "haiku", "codex". |
| `JobCard` | Card for a job in a list or pipeline stage | `job: JobSummary`, `variant: 'list' \| 'stage'` | Reused across Backlog, Pipeline, Home. |
| `StageCard` | Pipeline stage card | `stage: StageEntry`, `status: StageStatus` | Shows avatar, name, duration, cost, pulse if active. |
| `AgentCard` | Agent status in team panels | `agent: AgentConfig`, `status: AgentStatus` | Used in Home team panels. |
| `CostSummaryBar` | Top-of-screen cost indicator | `dailyCost`, `weeklyCost`, `claudeRemaining`, `copilotRemaining` | Sticky; max 1 line on mobile. |
| `PipelineFlowBar` | Mini horizontal stage flow | `stages`, `currentStage`, `jobCounts` | Home view only. Condensed representation. |
| `MarkdownRenderer` | Renders markdown string to HTML | `content: string` | Wraps `react-markdown`. Dark prose styles. Graceful fallback to `<pre>` on parse error. |
| `Accordion` | Expand/collapse container | `title`, `children`, `defaultOpen?: boolean` | Keyboard accessible. Animated height transition. |
| `Overlay` | Full-screen modal panel | `isOpen`, `onClose`, `title`, `children` | Focus trap, `Escape` to close, `role="dialog"`. |
| `SkeletonCard` | Loading placeholder | `variant: 'job' \| 'agent' \| 'stage'` | `aria-hidden`. `animate-pulse` shimmer. |
| `EmptyState` | Empty view placeholder | `message: string`, `icon?: ReactNode` | Centred; muted colour. |
| `ErrorBanner` | Inline error notification | `message: string` | Amber banner. Non-blocking. |
| `RefreshControl` | Manual refresh button + timestamp | `lastRefreshed: Date`, `isRefreshing: boolean`, `onRefresh: () => void` | ↻ icon. Accessible label. |
| `ProgressBar` | Limits usage bar | `value: number`, `max: number`, `label: string`, `burnRate?: string` | Used in Analytics Limits Tracker. |

---

## Design Tokens (Reference)

> Final values owned by CC-01. These are constraints, not exact values.

| Token | Purpose | Direction |
|---|---|---|
| `--color-bg-base` | Page background | Very dark navy/slate (not pure black) |
| `--color-bg-surface` | Card surfaces | Slightly lighter than bg-base |
| `--color-bg-surface-raised` | Active card elevation | Lighter still; used for `in_progress` stage cards |
| `--color-text-primary` | Primary text | Off-white; avoid pure `#ffffff` |
| `--color-text-muted` | Secondary/label text | ~60% opacity of primary |
| `--color-accent-amber` | Active / Working / Design phase | Amber-gold — Norse brand |
| `--color-accent-cyan` | Build phase indicators | Muted cyan/teal |
| `--color-success` | Completed / success badge | Muted green |
| `--color-danger` | Failed / blocked badge | Muted red |
| `--color-border-subtle` | Card borders, dividers | 10–15% opacity white |
| `--glow-amber` | Active pulse shadow | `0 0 12px 2px var(--color-accent-amber)` |
| `--glow-cyan` | Build phase glow | `0 0 12px 2px var(--color-accent-cyan)` |

**Agent avatar image map** (CC-01 must define):

| Agent | File | Notes |
|---|---|---|
| odin | `odin.PNG` | Cross-cutting orchestrator |
| loki | `loki.PNG` | Design phase lead |
| thor | `thor.PNG` | Build phase lead |
| mimir | `mimir.PNG` | |
| baldr | `baldr.PNG` | |
| ratatoskr | `ratatoksr.PNG` | ⚠️ Typo in filename — map `ratatoskr` → `ratatoksr.PNG` |
| sleipnir | `sleipnir.PNG` | |
| freya | `freya.PNG` | |
| heimdall | `heimdall.PNG` | |
| ymir | `ymir.PNG` | |
| modi | `modi.PNG` | |
| magni | `magni.PNG` | |
| tyr | `tyr.PNG` | |
| valkyrie | `valkyrie.PNG` | |
| jormungandr | `jormungandr.PNG` | |
| fenrir | `fenrir.PNG` | |
| surtr | `surtr.PNG` | |
| hel | `hel.PNG` | |
| brokk | `brokk.PNG` | |
| sindri | `sindri.PNG` | |
| yggdrasil | `yggdrasil.PNG` | `yggdrasil2.PNG` also exists — use primary |

---

## Responsive Behaviour Summary

| View | Mobile (< 768px) | Tablet (768–1023px) | Desktop (≥ 1024px) |
|---|---|---|---|
| **Home** | Single column; team panels horizontal-scroll | 2-col team panels; no horizontal scroll | 2-col team panels; sidebar nav |
| **Backlog** | Single column list | 2-col card grid | 2-col card grid |
| **Pipeline** | Horizontal-scroll stage rows | Horizontal-scroll (wider cards) | Full-width rows with overflow arrows |
| **Completed — list** | Single column list | 2-col list | 2-col list |
| **Completed — overlay** | Full-screen; Design/Build as tabs | Right-side drawer (60% width) | Centred modal; 2 columns side-by-side |
| **Analytics** | Tabbed sections (Cost / Performance / Limits) | Scrollable sections; 2-col chart grid | Scrollable single column; wider charts |
| **Navigation** | Bottom tab bar (56px) | Bottom tab bar or top nav | Left sidebar (200px expanded / 64px collapsed) |

---

## Non-Goals

- **No light mode toggle.** Dark theme only in v3. Light mode is a v4 concern.
- **No user authentication or login flow.** Local single-user tool.
- **No write operations via UI.** Valhalla V3 is a monitoring dashboard, not a control plane.
- **No data export** (CSV, PDF, etc.) from any view in v3.
- **No real-time WebSocket/SSE.** 10s polling is the data delivery mechanism; UI must not be designed around sub-second updates.
- **No drag-to-reorder backlog.** Pipeline ordering is owned by the Norse Agent System, not the dashboard.
- **No notifications or push alerts.** No browser notifications, no sound.
- **No Storybook or visual regression test suite.** Component documentation via code comments only in v3.
- **No drill-down on Analytics charts.** Charts are summary-only; no click-to-filter in v3.
- **No full-fidelity design system spec** beyond what is needed to implement the five views.

---

## Open Questions

| # | Question | Blocks | Assumption Made |
|---|---|---|---|
| UX-OQ-01 | What is the canonical agent-to-stage mapping? (i.e. which agent runs which design/build stage?) | Pipeline view stage card avatar | Assumed derivable from `odinclaw.config.yaml` at runtime; agent name shown on stage card from execution-log data |
| UX-OQ-02 | Can multiple jobs be in-flight simultaneously (one in Design, one in Build)? | Home hero card, Pipeline view layout | Assumed single active job at a time; if multiple are possible, the hero card and pipeline view need multi-job support |
| UX-OQ-03 | How should the Backlog expanded markdown behave if the markdown is very long (> 2 screen heights)? | Backlog view | Assumed: unconstrained expansion with internal page scroll; but a `max-height` + scroll within card is an alternative Brokk should decide |
| UX-OQ-04 | What data is available to drive "Cost per Agent" in Analytics? Is per-agent cost derivable from execution-log.json? | Analytics view | Assumed: each stage entry has agent name + premium requests → cost is derivable |
| UX-OQ-05 | Should the Completed overlay use a route (`/completed/:runId`) or remain a non-routed modal? | Navigation and deep-linking | Assumed: non-routed modal for v3 simplicity; deep-linking is a v4 concern |
| UX-OQ-06 | Should Design and Build phases be shown simultaneously on the same screen in Pipeline (stacked vertically), or do they need tab switching on all breakpoints? | Pipeline view layout | Assumed: stacked vertically on all breakpoints; tabs only used on mobile in Completed overlay |
| UX-OQ-07 | Is there a "current run" field reliable enough to drive the Home hero card, or must active run be inferred from stage `in_progress` status? | Home hero card, Dashboard | Flagged as OQ-06 in Architecture — UX assumes the API resolves this server-side before the frontend receives it |
| UX-OQ-08 | What is the expected token count format in execution-log.json — is a token total available per stage, or only premium request counts? | Completed overlay token display, Analytics | Assumed token count available; if only premium requests exist, token display is replaced with request count |
