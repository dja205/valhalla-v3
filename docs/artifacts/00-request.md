# Build Valhalla V3 — Real-time Agent Pipeline Dashboard

> **Invoke Baldr** — This project requires UX design review before proceeding to specification.

# Valhalla V3 — Real-time Agent Pipeline Dashboard

## Vision

A completely rebuilt dashboard for monitoring the Norse Agent System v2 pipeline in real time. The key difference from V2: the agent workflow is now split into **Design** (led by Loki) and **Build** (led by Thor), and the dashboard must reflect this two-phase structure clearly.

## Agent System Structure

```
Odin (Global Orchestrator)
  → Loki (Design Orchestrator)
      → Mimir (Architecture)
      → Baldr (UX Design)
      → Ratatoskr (System Mapper)
      → Sleipnir (Capability Slicer)
      → Freya (Discovery)
      → Brokk (Issue Emitter)
      → Sindri (Issue Splitter)
      → Heimdall (Planning QA / Readiness)
  → Thor (Build Orchestrator)
      → Ymir (Foundation / Scaffolding)
      → Modi (Implementation)
      → Magni (Heavy Implementation)
      → Tyr (Code Review)
      → Valkyrie (Adversarial Testing)
      → Jormungandr (Integration / E2E Testing)
      → Fenrir (Resilience / Stress Testing)
      → Surtr (Release / Deployment)
      → Hel (Rollback / Recovery)
  → Yggdrasil (Memory / Continuity)
```

## Core Views

### 1. Dashboard Home (Overview)
- **Active job hero card** showing the current in-progress job with real-time stage indicator
- **Agent team panels** — two panels side by side:
  - **Design Team** (Loki's agents): show each agent with status (idle/working/blocked), current job if active, model badge
  - **Build Team** (Thor's agents): same layout
- **Pipeline flow visualisation** — a horizontal flow showing: Backlog → Design Phase → Build Phase → Complete, with job counts in each phase
- **Cost summary bar** at the top showing:
  - Total premium requests used today/this week
  - Remaining Claude API limits
  - Remaining GitHub Copilot limits
  - Estimated cost ($)

### 2. Backlog
- Scrollable list of all queued jobs (stage:backlog)
- Each card: title, issue number, date created, project name
- Click to expand full request markdown
- Pull-to-refresh on mobile

### 3. Pipeline (Active Jobs)
- Split into two clear sections:
  - **Design Phase** — jobs flowing through Loki's team
  - **Build Phase** — jobs flowing through Thor's team
- Each section shows a horizontal stage flow with cards at each stage
- Design stages: Architecture → UX Design → System Map → Capability Slicing → Discovery → Issues → Issue Refinement → Planning QA
- Build stages: Foundation → Implementation → Code Review → Adversarial Testing → Integration Testing → Resilience Testing → Release → Recovery
- Jobs transition visually between stages (animated)
- Each job card shows:
  - Title, issue number, project
  - Current agent working on it (with avatar)
  - Duration at current stage
  - Running cost so far
  - Pulsing glow when actively being processed

### 4. Completed
- Scrollable list of all finished jobs
- Each card shows:
  - Title, project, completion date
  - **Total duration** (sum of all stages)
  - **Total cost** (sum of all premium requests × $0.10)
  - **Total tokens** used
  - Star count or success/fail badge
- Click to expand into full job detail overlay:
  - **Two-column layout**: Design stages (left), Build stages (right)
  - Each stage is an expandable accordion section showing:
    - Agent name + avatar
    - Model used
    - Duration
    - Premium requests / cost
    - Token count (input/output)
    - Full artifact markdown (rendered)
  - Summary row at bottom: total duration, total cost, total tokens

### 5. Analytics
- **Cost dashboard**:
  - Daily/weekly/monthly premium request consumption (chart)
  - Cost per project (bar chart)
  - Cost per agent (which agents consume the most)
  - Cost per model tier (Opus vs Sonnet vs Haiku breakdown)
- **Performance dashboard**:
  - Average stage duration per agent
  - Average job completion time
  - Success/failure/retry rates per agent
  - Design phase vs Build phase duration comparison
- **Limits tracker**:
  - Claude API: remaining requests, reset time
  - GitHub Copilot: remaining premium requests, reset time
  - Visual progress bars showing usage vs limits
  - Projected burn rate (will you hit the limit before reset?)

## Job Card Detail — Cost Breakdown

Every job detail view must show a cost breakdown table:

| Stage | Agent | Model | Duration | Premium Requests | Est. Cost | Tokens (in/out) |
|-------|-------|-------|----------|-----------------|-----------|-----------------|
| Architecture | Mimir | sonnet-4.6 | 3m 12s | 1 | $0.10 | 54k/2.4k |
| Spec | Brokk | haiku-4.5 | 1m 45s | 0.33 | $0.03 | 175k/11k |
| Implementation | Modi | opus-4.6 | 7m 30s | 3 | $0.30 | 576k/6.9k |
| ... | ... | ... | ... | ... | ... | ... |
| **Total** | | | **25m 14s** | **8.33** | **$0.83** | **1.2M/45k** |

## Data Sources

### Portfolio directory
```
~/.openclaw/workspace/odinclaw/portfolio/projects/<project>/
  state.yaml          — runs with status, current_stage
  runs/<run>/
    execution-log.json — per-stage: agent, model, duration, premiumRequests, status, tokens
    00-request.md through 80-release.md — stage artifacts
```

### Agent config
```
~/.openclaw/workspace/odinclaw/odinclaw.config.yaml — agent model assignments
```

### Limits (new endpoints needed)
- GitHub Copilot limits: `gh copilot billing` or Copilot API
- Claude limits: Anthropic API rate limit headers (capture from gateway responses)
- Store latest limit snapshots in a local file that the API serves

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion (for stage transitions and pulse effects)
- Zustand for state management
- Node.js + Express backend API
- recharts for analytics charts
- react-markdown + react-syntax-highlighter for artifact rendering
- Mobile-first responsive design
- Dark theme with glowing accents

## Design Direction
- Dark space theme (consistent with the Norse/Valhalla brand)
- Two-column agent team layout (Design left, Build right)
- Glowing pulse on active agents/stages
- Smooth transitions as jobs move between stages
- Cost/limit indicators always visible (top bar or header)
- Agent avatars from `public/img/agents/` (existing images)
- Mobile: single-column with tabs, swipeable cards

## MVP Scope
- All 5 views (Overview, Backlog, Pipeline, Completed, Analytics)
- Real data from portfolio files (no mock data)
- Cost breakdown per job and per stage
- Agent status derived from active runs
- Limit tracking (at minimum: display configured limits, even if live API polling is deferred)
- Auto-refresh every 10 seconds
- Mobile responsive

---
_Source: GitHub Issue #1_
