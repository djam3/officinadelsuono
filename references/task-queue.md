# Task Queue Protocol

## Queue Schema

Each task in the queue follows this schema:

```json
{
  "id": "task-uuid",
  "title": "Short description of the task",
  "description": "Detailed description with context",
  "phase": "IMPLEMENT",
  "assigned_agent": "BackendAgent",
  "priority": "high",
  "status": "PENDING",
  "dependencies": ["task-uuid-1", "task-uuid-2"],
  "retry_count": 0,
  "max_retries": 3,
  "created_at": "ISO8601",
  "started_at": null,
  "completed_at": null,
  "result": null,
  "error": null,
  "estimated_tokens": 0,
  "actual_tokens": 0,
  "tags": ["api", "products"]
}
```

## Status Transitions

```
PENDING -> IN_PROGRESS -> DONE
                       -> FAILED -> RETRY (max 3) -> ESCALATE
                       -> BLOCKED -> (wait for dependency) -> IN_PROGRESS
```

### PENDING
- Task is queued but not yet assigned to an agent
- Dependencies may not all be resolved yet

### IN_PROGRESS
- Agent has picked up the task and is actively working on it
- Timer starts for duration tracking

### DONE
- Task completed successfully
- Result artifact(s) recorded
- Tokens and duration logged

### FAILED
- Task encountered an error
- Error details recorded
- Retry counter incremented
- If retry_count < max_retries, transitions to RETRY
- If retry_count >= max_retries, transitions to ESCALATE

### RETRY
- Task is being retried with adjusted approach
- Must log what changed between attempts in episodic memory
- Each retry should try a different strategy

### BLOCKED
- Task cannot proceed due to unresolved dependency
- Blocker reason must be documented
- Orchestrator is notified for resolution

### ESCALATE
- Task has exceeded maximum retries
- Or circuit breaker has triggered
- Orchestrator must intervene with new approach

---

## Priority Levels

| Priority | Description | SLA |
|---|---|---|
| `critical` | Production down, security breach | Immediate |
| `high` | Feature blocker, quality gate failure | Within current cycle |
| `medium` | Standard feature work | Next available slot |
| `low` | Nice-to-have, optimization | When bandwidth permits |
| `background` | Monitoring, documentation | Continuous, lowest priority |

---

## Circuit Breaker System

Circuit breakers prevent cascading failures when a domain is experiencing
repeated errors.

### Trigger Conditions
- 3 consecutive task failures in the same domain
- Domain = agent type category (e.g., "backend", "frontend", "deploy")

### Circuit Breaker States

```
CLOSED (normal) -> OPEN (broken) -> HALF_OPEN (testing) -> CLOSED
```

**CLOSED (Normal Operation):**
- Tasks flow normally
- Failures are counted per domain

**OPEN (Circuit Broken):**
- All new tasks for this domain are held in queue
- Existing in-progress tasks are allowed to complete
- Orchestrator is notified with full failure context
- Cooldown period: 5 minutes

**HALF_OPEN (Testing):**
- After cooldown, one task is allowed through as a test
- If it succeeds, circuit returns to CLOSED
- If it fails, circuit returns to OPEN with extended cooldown (10 min)

### Circuit Breaker Log Format

```json
{
  "timestamp": "ISO8601",
  "domain": "backend",
  "trigger": "3 consecutive failures",
  "failed_tasks": [
    {
      "id": "task-1",
      "error": "Firestore permission denied",
      "agent": "BackendAgent"
    },
    {
      "id": "task-2",
      "error": "Firestore permission denied",
      "agent": "BackendAgent"
    },
    {
      "id": "task-3",
      "error": "Firebase Admin not initialized",
      "agent": "FirestoreAgent"
    }
  ],
  "root_cause_hypothesis": "Firebase credentials may be expired or misconfigured",
  "recommended_action": "Verify firebase-applet-config.json and re-initialize Admin SDK",
  "state": "OPEN",
  "cooldown_until": "ISO8601"
}
```

### Emergency Halt

If 3 different domains trigger circuit breakers in a single session:
1. Halt ALL operations immediately
2. Write comprehensive state dump to `.loki/memory/episodic/emergency-halt-{timestamp}.json`
3. Log all active tasks, their states, and failure chains
4. Wait for Orchestrator to perform root cause analysis
5. Do NOT attempt automated recovery

---

## Task Assignment Rules

1. Tasks are assigned based on agent specialization (see `agent-types.md`)
2. A Tier 2 agent can have at most 3 active tasks simultaneously
3. A Tier 3 agent works on exactly 1 task at a time
4. Task dependencies must be resolved before assignment
5. Priority ordering: critical > high > medium > low > background
6. Within the same priority, FIFO ordering applies

## Queue Capacity

- Maximum 50 tasks in the queue at any time
- If queue is full, Orchestrator must triage and remove lowest priority tasks
- Completed tasks are archived after 10 sessions
