# Core Workflow — RARV Cycle

## Overview

Every agent iteration in Loki Mode follows the RARV cycle:
**Reason -> Act -> Reflect -> Verify**

This ensures consistent, auditable decision-making across all agent tiers.

## RARV Phases

### 1. REASON

Before any action, the agent must:

1. **Assess Current State** — Read `.loki/state.json` for global context
2. **Check Memory** — Query episodic memory for similar past situations
3. **Identify Constraints** — Review constitution for applicable rules
4. **Plan Action** — Determine the single best next action
5. **Estimate Cost** — Predict token/time cost for the planned action

```json
{
  "reasoning": {
    "current_state": "Description of what the agent observes",
    "relevant_memories": ["memory-id-1", "memory-id-2"],
    "constraints": ["constraint-1", "constraint-2"],
    "planned_action": "Description of what the agent will do",
    "estimated_cost": { "tokens": 0, "time_ms": 0 },
    "confidence": 0.0
  }
}
```

**Rules:**
- If confidence < 0.5, request more context before acting
- If confidence < 0.3, escalate to parent agent
- Never skip reasoning — even for trivial tasks, log the reasoning chain

### 2. ACT

Execute the planned action:

1. **Single Action** — Execute exactly one atomic action per iteration
2. **Capture Output** — Record all outputs, errors, and side effects
3. **Time Bound** — Actions must complete within the estimated time (2x tolerance)
4. **Idempotency** — Prefer idempotent operations when possible

**Action Types:**
| Type | Description | Example |
|---|---|---|
| `code_write` | Write or modify source code | Create a new React component |
| `code_review` | Review code for quality | Run 3-reviewer parallel system |
| `test_run` | Execute tests | Run `npm run lint` |
| `deploy` | Deploy to environment | `firebase deploy --only hosting` |
| `research` | Gather information | Read documentation, check Stack Overflow |
| `communicate` | Send message to another agent | Report status to Orchestrator |
| `memory_write` | Store information in memory | Log episodic trace |

### 3. REFLECT

After every action, evaluate the outcome:

1. **Compare Expected vs Actual** — Did the action produce the intended result?
2. **Identify Surprises** — Any unexpected outputs, errors, or behaviors?
3. **Extract Lessons** — What can be generalized from this experience?
4. **Update Confidence** — Adjust confidence for future similar actions

```json
{
  "reflection": {
    "expected_outcome": "What was supposed to happen",
    "actual_outcome": "What actually happened",
    "outcome_match": "success|partial|failure",
    "surprises": ["Unexpected behavior X"],
    "lessons": ["When doing Y, also check Z"],
    "updated_confidence": 0.0
  }
}
```

**Rules:**
- Every reflection must be logged to episodic memory
- Failures must include root cause analysis
- Partial successes must specify what succeeded and what did not

### 4. VERIFY

Quality gate check before moving to the next iteration:

1. **State Consistency** — Is `.loki/state.json` still valid?
2. **Quality Gates** — Do all applicable quality gates pass?
3. **No Regressions** — Has anything previously working broken?
4. **Constitution Check** — Does the outcome comply with the constitution?

**Verification Levels:**
| Level | When | Checks |
|---|---|---|
| Quick | After every action | Syntax valid, no crashes |
| Standard | After feature completion | Tests pass, lint clean |
| Full | Before deploy | All 5 quality gates, E2E tests |

## State Transitions

```
IDLE -> REASONING -> ACTING -> REFLECTING -> VERIFYING -> IDLE
                                                      -> FAILED -> RETRY
                                                      -> BLOCKED -> ESCALATE
```

A single RARV cycle should complete in under 60 seconds for Tier 3 agents,
under 5 minutes for Tier 2 agents, and under 15 minutes for Orchestrator decisions.

## Autonomy Rules

1. NEVER ask the user for clarification during autonomous operation
2. NEVER skip a quality gate even if it blocks progress
3. ALWAYS write spec before implementation
4. ALWAYS run tests before marking a task complete
5. ALWAYS commit with semantic messages after each passing gate
6. If genuinely ambiguous, choose the more conservative option and log the decision
7. Constitution in `autonomy/constitution.md` overrides all other rules
