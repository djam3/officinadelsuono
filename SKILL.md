# Loki Mode v2.35.0 — Multi-Agent Autonomous Development Skill

## Purpose

Loki Mode transforms a PRD (Product Requirements Document) into a fully deployed,
revenue-generating product with zero human intervention. It orchestrates a fleet of
specialized sub-agents across the full SDLC using the RARV cycle.

## Invocation

```
"Loki Mode"
"Loki Mode with PRD at path/to/prd.md"
"Loki Mode: <inline requirements>"
```

Run Claude Code with `--dangerously-skip-permissions` for full autonomy.

## Core Loop: RARV Cycle

Every agent iteration follows:

```
REASON  -> Analyze current state, identify next action, check memory
ACT     -> Execute the action (code, deploy, test, research)
REFLECT -> Evaluate outcome vs expected, log to episodic memory
VERIFY  -> Run quality gates, confirm state transition is valid
```

See `references/core-workflow.md` for full RARV rules.

## Agent Hierarchy

### Tier 1 — Orchestrator (Opus)
- Single instance, persists for entire session
- Reads PRD, decomposes into SDLC phases
- Dispatches tasks to Tier 2 agents
- Maintains global state in `.loki/state.json`
- Handles circuit breakers and escalations
- Never writes code directly

### Tier 2 — Domain Leads (Sonnet)
- One per active SDLC phase
- Owns a bounded work queue
- Reports status and blockers to Orchestrator
- Spawns Tier 3 agents for parallel work

| Agent | Responsibility |
|---|---|
| SpecAgent | OpenAPI spec, data models, contracts |
| ArchAgent | System design, tech stack decisions |
| BackendAgent | API routes, business logic, Firebase |
| FrontendAgent | React components, routing, state |
| IntegrationAgent | External APIs, webhooks, SDKs |
| TestAgent | Integration and E2E test suites |
| DeployAgent | CI/CD, Firebase deploy, cloud config |
| ReviewAgent | Code review, security scan, quality gate |
| BusinessAgent | Analytics, pricing, onboarding flows |

### Tier 3 — Specialists (Haiku)
- Spawned on demand, short-lived
- Unit tests, linting, monitoring checks
- Parallelized aggressively (up to 8 concurrent)
- Results aggregated by parent Tier 2 agent

See `references/agent-types.md` for all 37 agent definitions.

## Model Selection Rules

| Task Type | Model | Reason |
|---|---|---|
| System design, architecture decisions | Opus | High-stakes, long-horizon reasoning |
| Feature implementation, integration tests | Sonnet | Balanced capability/cost |
| Unit tests, monitoring, simple transforms | Haiku | Speed and parallelism |
| Code review (3-reviewer system) | Sonnet x3 | Parallel blind review |

NEVER use Opus for writing code. NEVER use Haiku for architecture decisions.

## SDLC Phases

```
1. SPEC      -> Requirements analysis, OpenAPI spec generation
2. DESIGN    -> Architecture diagram, tech stack confirmation
3. SCAFFOLD  -> Project structure, CI/CD setup
4. IMPLEMENT -> Feature development (parallel streams)
5. TEST      -> Unit + integration + E2E
6. REVIEW    -> 3-reviewer quality gate
7. DEPLOY    -> Staging then production
8. VALIDATE  -> Smoke tests, metrics baseline
9. OPERATE   -> Monitoring, error alerting, analytics
```

See `references/sdlc-phases.md` for phase entry/exit criteria.

## Quality Gates (Non-Negotiable)

Every PR must pass ALL gates before merge:

1. **Static Analysis** — TypeScript strict, ESLint zero errors
2. **3-Reviewer Parallel System** — Three independent Sonnet reviewers, blind
3. **Anti-Sycophancy Check** — Devil's advocate required on unanimous approval
4. **Severity Block** — Critical/High/Medium findings = BLOCK (no exceptions)
5. **Coverage Gate** — >80% unit coverage, 100% pass rate

If any gate fails: log failure, create fix task, retry. Never bypass.

See `references/quality-control.md` for reviewer prompts and severity rubric.

## Memory System

```
.loki/
  memory/
    episodic/     # Timestamped interaction traces (JSON)
    semantic/     # Generalized patterns extracted from episodic
    skills/       # Reusable procedures (markdown)
  metrics/
    efficiency/   # Token cost per task type
    rewards/      # Outcome/efficiency/preference signals
  state.json      # Current orchestrator state
  constitution.md # Behavioral constraints (loaded every session)
```

Episodic memory format:
```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "agent": "BackendAgent",
  "action": "implement_endpoint",
  "input": {},
  "output": {},
  "outcome": "success|failure|partial",
  "reflection": "string",
  "cost_tokens": 0
}
```

See `references/memory-system.md` for full architecture.

## Task Queue Protocol

```
PENDING -> IN_PROGRESS -> DONE
                       -> FAILED -> RETRY (max 3) -> ESCALATE
```

Circuit breaker: if 3 consecutive tasks fail in same domain, pause that domain,
escalate to Orchestrator, log to `.loki/memory/episodic/circuit-break-{timestamp}.json`.

See `references/task-queue.md` for queue schema and circuit breaker rules.

## Spec-Driven Development

1. Write OpenAPI 3.1 spec BEFORE any implementation
2. Generate TypeScript types from spec (`openapi-typescript`)
3. Mock server from spec for frontend development
4. Contract tests verify spec compliance at deploy time

See `references/spec-driven-dev.md`.

## Project-Specific Context (officinadelsuono)

**Stack:** React 19, TypeScript, Vite 6, Firebase 12, Tailwind CSS 4,
Framer Motion 12, Zustand 5, Three.js, Express, Google GenAI, Resend

**Deploy target:** Firebase Hosting + Firebase Functions
**Auth:** Firebase Auth
**Database:** Firestore
**Storage:** Google Cloud Storage
**Email:** Resend
**AI:** Google GenAI (Gemini)

Key directories:
```
src/
  ai-features/    # AI feature modules
  components/     # Shared UI components
  contexts/       # React context providers
  hooks/          # Custom React hooks
  pages/          # Route-level page components
  services/       # Firebase/API service layer
  store/          # Zustand stores
  utils/          # Pure utility functions
functions/        # Firebase Cloud Functions
public/           # Static assets
```

## Autonomy Rules

1. NEVER ask the user for clarification during autonomous operation
2. NEVER skip a quality gate even if it blocks progress
3. ALWAYS write spec before implementation
4. ALWAYS run tests before marking a task complete
5. ALWAYS commit with semantic messages after each passing gate
6. If genuinely ambiguous, choose the more conservative option and log the decision
7. Constitution in `autonomy/constitution.md` overrides all other rules

## Communication Protocol

Agents communicate via structured JSON messages in `.loki/state.json`:

```json
{
  "phase": "IMPLEMENT",
  "active_tasks": [],
  "blocked_tasks": [],
  "completed_tasks": [],
  "metrics": { "tokens_used": 0, "tasks_completed": 0 },
  "circuit_breakers": {}
}
```

## Deployment

```bash
# Staging
npm run build && firebase deploy --only hosting --project staging

# Production (after validation)
firebase deploy --only hosting,firestore:rules --project production
```

See `references/deployment.md` for full cloud deployment instructions.

## Anti-Patterns (Never Do)

- Implementing before spec is complete
- Merging without passing all quality gates
- Using `any` type in TypeScript
- Writing tests after implementation without TDD flag
- Skipping error handling on Firebase operations
- Hardcoding secrets or API keys
- Using Opus model for routine code generation

## Changelog

- v2.35.0: Added ToolOrchestra metrics, 37 agent types, GoalAct planning
- v2.34.0: Added MIRIX memory system, MAR reflexion loops
- v2.33.0: Anti-sycophancy CONSENSAGENT integration
- v2.32.0: Circuit breaker system, task queue v2
- v2.31.0: OpenAPI-first spec-driven development
- v2.30.0: Constitutional AI alignment layer

---
Loki Mode v2.35.0 | See CLAUDE.md for project overview | References in references/
