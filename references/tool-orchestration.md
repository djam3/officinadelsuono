# Tool Orchestration — Efficiency and Rewards

Inspired by NVIDIA's ToolOrchestra framework for optimizing multi-agent tool usage.

## Efficiency Metrics

### Token Cost Tracking

Every agent action is tracked for token efficiency:

```json
{
  "task_type": "implement_endpoint",
  "agent": "BackendAgent",
  "measurements": [
    {
      "session_id": "session-1",
      "tokens_in": 500,
      "tokens_out": 1200,
      "total_tokens": 1700,
      "duration_ms": 30000,
      "outcome": "success",
      "retries": 0
    }
  ],
  "aggregates": {
    "avg_tokens": 1700,
    "median_tokens": 1650,
    "p95_tokens": 2500,
    "success_rate": 0.92,
    "avg_retries": 0.15
  }
}
```

**Storage:** `.loki/metrics/efficiency/{agent}-{task_type}.json`

### Cost Categories

| Category | Description | Budget Guideline |
|---|---|---|
| Reasoning | REASON phase token usage | <500 tokens per cycle |
| Implementation | ACT phase for code writing | <3000 tokens per task |
| Review | Code review token usage | <2000 tokens per reviewer |
| Testing | Test generation and execution | <1500 tokens per test suite |
| Documentation | Doc generation | <1000 tokens per doc |
| Coordination | Agent-to-agent communication | <200 tokens per message |

### Efficiency Score

```
Efficiency = (Tasks Completed * Quality Score) / Total Tokens Used

Where:
  Quality Score = (Tests Passing / Tests Total) * (1 - Severity Findings / 10)
```

Higher efficiency scores indicate better agent performance.

---

## Reward Signals

Three types of reward signals guide agent behavior:

### 1. Outcome Rewards

Binary signal based on task success/failure:

```json
{
  "type": "outcome",
  "task_id": "task-uuid",
  "agent": "BackendAgent",
  "reward": 1.0,
  "reason": "Task completed successfully, all tests pass"
}
```

| Outcome | Reward |
|---|---|
| Success, first attempt | 1.0 |
| Success, after retry | 0.7 |
| Partial success | 0.3 |
| Failure | -0.5 |
| Failure causing circuit break | -1.0 |

### 2. Efficiency Rewards

Based on token usage relative to task complexity:

```json
{
  "type": "efficiency",
  "task_id": "task-uuid",
  "agent": "FrontendAgent",
  "reward": 0.8,
  "reason": "Completed in 1200 tokens (budget: 1500)"
}
```

| Token Usage vs Budget | Reward |
|---|---|
| Under budget by >30% | 1.0 |
| Under budget | 0.8 |
| At budget (+/- 10%) | 0.5 |
| Over budget by <50% | 0.2 |
| Over budget by >50% | -0.3 |

### 3. Preference Rewards

Based on code quality and adherence to patterns:

```json
{
  "type": "preference",
  "task_id": "task-uuid",
  "agent": "BackendAgent",
  "reward": 0.9,
  "reason": "Code follows established patterns, proper error handling, clean types"
}
```

Evaluated criteria:
- Consistency with existing codebase patterns
- TypeScript type safety
- Error handling comprehensiveness
- Naming convention adherence
- Documentation quality
- Test coverage

---

## Reward Aggregation

**Storage:** `.loki/metrics/rewards/{agent}-{session_id}.json`

```json
{
  "agent": "BackendAgent",
  "session_id": "session-abc",
  "total_tasks": 5,
  "rewards": {
    "outcome": { "total": 4.4, "average": 0.88 },
    "efficiency": { "total": 3.5, "average": 0.70 },
    "preference": { "total": 4.2, "average": 0.84 }
  },
  "combined_score": 0.807,
  "rank": "A"
}
```

### Ranking System

| Combined Score | Rank | Interpretation |
|---|---|---|
| >= 0.9 | S | Exceptional performance |
| >= 0.8 | A | Strong performance |
| >= 0.7 | B | Good performance |
| >= 0.5 | C | Acceptable performance |
| >= 0.3 | D | Below expectations |
| < 0.3 | F | Poor performance, needs investigation |

### Using Rewards

1. Track agent performance trends across sessions
2. Identify agents that consistently underperform
3. Adjust token budgets based on historical efficiency
4. Prioritize patterns that lead to higher rewards
5. Feed reward data into semantic memory for future optimization
