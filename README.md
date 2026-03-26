# OdinClaw — Norse Agent System v2

OdinClaw is a multi-project software delivery orchestration system. Odin coordinates two sub-orchestrators — **Loki** (design) and **Thor** (build) — who each manage their own specialist teams. All specialist execution happens through GitHub Copilot CLI. Project tracking uses GitHub Issues as the single source of truth.

## Architecture

```
User → Odin (global orchestrator, OpenClaw main session)
         │
         ├── Loki (design orchestrator, OpenClaw sub-agent)
         │     ├── Mimir          → Architecture         (via Copilot CLI)
         │     ├── Baldr          → UX Design + Wireframe (via Copilot CLI)
         │     ├── Ratatoskr      → System Mapping        (via Copilot CLI)
         │     ├── Sleipnir       → Capability Slicing     (via Copilot CLI)
         │     ├── Freya          → Discovery              (via Copilot CLI)
         │     ├── Brokk          → Issue Generation       (via Copilot CLI)
         │     ├── Sindri         → Issue Splitting        (via Copilot CLI)
         │     └── Heimdall       → Planning QA / Gate     (via Copilot CLI)
         │
         ├── Thor (build orchestrator, OpenClaw sub-agent)
         │     ├── Ymir           → Foundation / Scaffold   (via Copilot CLI)
         │     ├── Modi           → Implementation          (via Copilot CLI)
         │     ├── Magni          → Heavy Implementation    (via Copilot CLI)
         │     ├── Tyr            → Code Review / Gate      (via Copilot CLI)
         │     ├── Valkyrie       → Adversarial Testing     (via Copilot CLI)
         │     ├── Jormungandr    → Integration / E2E       (via Copilot CLI)
         │     ├── Fenrir         → Resilience / Stress     (via Copilot CLI)
         │     ├── Surtr          → Release / Deployment    (via Copilot CLI)
         │     └── Hel            → Rollback / Recovery     (via Copilot CLI)
         │
         └── Yggdrasil (memory / continuity)
```

## Key Principles

1. **Odin stays above local detail** — routes to Loki or Thor, doesn't call specialists directly
2. **Loki is orchestration-only** on the design side — decides which specialist runs next
3. **Thor is orchestration-only** on the build side — drives execution without inventing scope
4. **Design and build are separate phases** — design produces a delivery pack, build consumes it
5. **Handoffs are explicit** — Heimdall gates design→build, Tyr gates build→release
6. **Review cycles are versioned** — Heimdall, Tyr, and Valkyrie produce versioned artifacts (v1, v2, etc.)
7. **Memory is concise** — Yggdrasil stores decisions, constraints, and outcomes, not noise

## Execution Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Odin** | OpenClaw main session (Opus) | Global orchestration, user interaction, portfolio management |
| **Loki, Thor** | OpenClaw sub-agents (Sonnet) | Phase orchestration, specialist routing, quality control |
| **All specialists** | GitHub Copilot CLI | Actual work execution (code, review, testing, design) |
| **Yggdrasil** | Copilot CLI (Haiku) | Memory persistence |

## Workflow

### Design Phase (Loki)

```
Request → Mimir (architecture) → Baldr (UX + wireframe) → Ratatoskr (system map)
  → Sleipnir (capability slices) → Freya (discovery) → Brokk (issues)
  → Sindri (splits) → Heimdall (planning QA)
```

**Not every request needs every specialist.** Loki decides which are needed.

Heimdall scores the delivery pack:
- **Score ≤ 3** → `stage:ready-for-review` — needs work, Loki fixes and re-submits
- **Score ≥ 4** → `stage:ready-for-handoff` — approved for Thor

**Review cycles:** When Heimdall requests changes, previous artifacts are versioned (`11-planning-qa.v1.json`). After fixes, Heimdall re-reviews and produces a new version referencing what changed.

### Build Phase (Thor)

```
Delivery Pack → Ymir (foundation) → Modi/Magni (implementation)
  → Tyr (code review) → Valkyrie (adversarial testing)
  → Jormungandr (integration/E2E) → Fenrir (resilience)
  → Surtr (release) → Hel (recovery, if needed)
```

Thor routes to appropriate specialists based on the delivery pack. Tyr and Valkyrie also use the versioned review cycle pattern.

### Baldr Wireframe Requirement

Baldr **always** produces two artifacts:
- `04-ux-design.md` — UX design document
- `04-ux-wireframe.html` — Self-contained interactive HTML wireframe previewable in a browser

## Artifact Flow

### Design Artifacts
```
00-request.md              — Original request
01-orchestrator.json       — Loki's routing plan
02-system-map.json         — Ratatoskr
03-architecture.md         — Mimir
04-ux-design.md            — Baldr
04-ux-wireframe.html       — Baldr (interactive wireframe)
05-capability-slices.json  — Sleipnir
06-discovery.json          — Freya
07-issue-drafts.json       — Brokk
08-split-issues.json       — Sindri
09-dependency-review.json  — (if needed)
10-metadata.json           — (if needed)
11-planning-qa.json        — Heimdall (versioned: .v1, .v2, etc.)
12-delivery-pack.md        — Loki summary for Thor handoff
```

### Build Artifacts
```
20-build-plan.md           — Thor
21-foundation.md           — Ymir
22-implementation.md       — Modi
23-heavy-implementation.md — Magni
24-code-review.md          — Tyr (versioned: .v1, .v2, etc.)
25-adversarial-testing.md  — Valkyrie (versioned: .v1, .v2, etc.)
26-integration-e2e.md      — Jormungandr
27-resilience.md           — Fenrir
28-release.md              — Surtr
29-recovery.md             — Hel
```

## Agent Model Assignments

### Orchestrators
| Agent | Model | Provider |
|-------|-------|----------|
| Odin | claude-opus-4-6 | Anthropic (OpenClaw main) |
| Loki | claude-sonnet-4-6 | Copilot (OpenClaw sub-agent) |
| Thor | claude-sonnet-4-6 | Copilot (OpenClaw sub-agent) |

### Design Team
| Agent | Role | Model |
|-------|------|-------|
| Mimir | Architecture | claude-sonnet-4-6 |
| Baldr | UX Design + Wireframe | claude-sonnet-4-6 |
| Ratatoskr | System Mapping | claude-sonnet-4-6 |
| Sleipnir | Capability Slicing | claude-haiku-4.5 |
| Freya | Discovery | claude-sonnet-4-6 |
| Brokk | Issue Generation | claude-haiku-4.5 |
| Sindri | Issue Splitting | claude-haiku-4.5 |
| Heimdall | Planning QA / Gate | claude-sonnet-4-6 |

### Build Team
| Agent | Role | Model |
|-------|------|-------|
| Ymir | Foundation / Scaffold | claude-sonnet-4-6 |
| Modi | Implementation | claude-opus-4-6 |
| Magni | Heavy Implementation | claude-opus-4-6 |
| Tyr | Code Review / Gate | claude-sonnet-4-6 |
| Valkyrie | Adversarial Testing | claude-sonnet-4-6 |
| Jormungandr | Integration / E2E | claude-haiku-4.5 |
| Fenrir | Resilience / Stress | claude-haiku-4.5 |
| Surtr | Release / Deployment | claude-haiku-4.5 |
| Hel | Rollback / Recovery | claude-haiku-4.5 |

### Shared
| Agent | Role | Model |
|-------|------|-------|
| Yggdrasil | Memory / Continuity | claude-haiku-4.5 |

## GitHub Integration (`/project-gh`)

Each project uses GitHub Issues as the single source of truth:

- **One repo per project** with a GitHub Project v2 board
- **Board columns**: Backlog → Architecture → UX Design → Spec → Tasks → Ready for Review → Ready for Handoff → Build → Review → QA → Release → Done → Blocked
- **Labels**: `stage:*` labels track pipeline position
- **Issue comments**: Design and build artifacts posted as comments
- **Git commits**: Source code committed and pushed after implementation stages
- **Dev server**: Auto-restarts after pipeline completion

### Pipeline Flow on GitHub
```
New issue (stage:backlog)
  → Poller picks up → Odin spawns Loki
  → Design phase → stage:ready-for-review or stage:ready-for-handoff
  → (Approval if needed)
  → Odin spawns Thor → Build phase
  → stage:done → Issue closed
```

## Project Setup

```bash
# Initialize a new GitHub-backed project
./scripts/init-project-gh.sh <project_id> <owner/repo> [description]

# This creates:
# - Local project directory with runs/, memory/
# - GitHub Project v2 board with pipeline columns
# - Labels in the repo
# - state.yaml with GitHub config
```

## Cron Jobs

| Job | Schedule | Model | Purpose |
|-----|----------|-------|---------|
| daily-briefing-morning | 6am UK | Haiku | Morning briefing to #daily (weather, tasks) |
| daily-briefing-evening | 9pm UK | Haiku | Evening briefing to #daily (tomorrow preview) |

## Directory Structure

```
odinclaw/
  src/                          # TypeScript source
    orchestrator/               # Pipeline engines (v1 + v2)
    broker/                     # Copilot CLI integration
    agents/                     # Agent class implementations
    gh/                         # GitHub Issues integration
    config.ts                   # Config loader
  roles/                        # Agent prompts and contracts
    <agent>/prompt.md           # System prompt for each agent
    <agent>/contract.yaml       # Input/output contract
  docs/                         # Supporting documentation
    norse-agent-system-docs/    # Full system design docs
  portfolio/                    # Runtime project state
    projects/<id>/              # Per-project artifacts, runs, memory
  scripts/                      # Project scaffolding
  odinclaw.config.yaml          # Master agent configuration
```

## Quick Reference

```bash
# Generate Loki's design task
node dist/orchestrator/run-v2-cli.js <projectId> <runId> loki

# Generate Thor's build task  
node dist/orchestrator/run-v2-cli.js <projectId> <runId> thor

# Poll GitHub backlogs
node dist/gh/poll-backlog-cli.js [--project <id>]

# Run parallel queue (all projects)
node dist/gh/queue-runner.js [--poll]
```

## License

MIT
