# OpenAI Patterns — Agents SDK Integration

## Overview

Patterns derived from the OpenAI Agents SDK (2025) adapted for Loki Mode.
These patterns provide guardrails, tripwires, handoffs, and tracing capabilities.

## Guardrails

Guardrails are pre- and post-processing checks that run around every agent action.

### Input Guardrails

Run BEFORE the agent acts:

```typescript
interface InputGuardrail {
  name: string;
  check: (input: AgentInput) => GuardrailResult;
}

interface GuardrailResult {
  passed: boolean;
  reason?: string;
  severity: 'block' | 'warn' | 'info';
}

// Example guardrails for officinadelsuono:
const guardrails: InputGuardrail[] = [
  {
    name: 'no-production-data-mutation',
    check: (input) => ({
      passed: !input.action.includes('delete') || input.environment !== 'production',
      reason: 'Cannot delete data in production without explicit approval',
      severity: 'block'
    })
  },
  {
    name: 'secret-detection',
    check: (input) => ({
      passed: !containsSecrets(input.code),
      reason: 'Code contains potential secrets or API keys',
      severity: 'block'
    })
  },
  {
    name: 'type-safety',
    check: (input) => ({
      passed: !input.code?.includes(': any'),
      reason: 'Code uses "any" type without justification',
      severity: 'warn'
    })
  }
];
```

### Output Guardrails

Run AFTER the agent acts:

```typescript
interface OutputGuardrail {
  name: string;
  check: (output: AgentOutput) => GuardrailResult;
}

const outputGuardrails: OutputGuardrail[] = [
  {
    name: 'build-still-passing',
    check: async (output) => ({
      passed: await runTypeCheck(),
      reason: 'TypeScript compilation failed after changes',
      severity: 'block'
    })
  },
  {
    name: 'no-console-log-in-production',
    check: (output) => ({
      passed: !output.files_modified.some(f => containsConsoleLogs(f)),
      reason: 'New console.log statements added (use proper logging)',
      severity: 'warn'
    })
  }
];
```

## Tripwires

Tripwires are automated alerts that fire when specific conditions are detected.

```typescript
interface Tripwire {
  name: string;
  condition: () => boolean;
  action: 'alert' | 'pause' | 'halt';
  message: string;
}

const tripwires: Tripwire[] = [
  {
    name: 'token-budget-exceeded',
    condition: () => state.metrics.tokens_used > 100000,
    action: 'pause',
    message: 'Token budget exceeded 100K for this session'
  },
  {
    name: 'consecutive-failures',
    condition: () => getConsecutiveFailures() >= 3,
    action: 'halt',
    message: 'Circuit breaker: 3 consecutive failures detected'
  },
  {
    name: 'file-size-anomaly',
    condition: () => getModifiedFileSize() > 50000,
    action: 'alert',
    message: 'File exceeds 50KB — consider splitting'
  },
  {
    name: 'admin-page-size',
    condition: () => getFileSize('src/pages/Admin.tsx') > 200000,
    action: 'alert',
    message: 'Admin.tsx exceeds 200KB — must be refactored'
  }
];
```

## Handoffs

Handoffs transfer control between agents when a task crosses domain boundaries.

```typescript
interface Handoff {
  from: string;      // Source agent
  to: string;        // Target agent
  trigger: string;   // Condition for handoff
  context: object;   // Shared context passed to target
  protocol: 'sync' | 'async';
}

// Common handoffs in officinadelsuono:
const handoffs: Handoff[] = [
  {
    from: 'BackendAgent',
    to: 'FrontendAgent',
    trigger: 'API endpoint implementation complete',
    context: { endpoint: '/api/products', method: 'GET', schema: '...' },
    protocol: 'async'
  },
  {
    from: 'FrontendAgent',
    to: 'TestAgent',
    trigger: 'Component implementation complete',
    context: { component: 'ProductCard', path: 'src/components/ProductCard.tsx' },
    protocol: 'async'
  },
  {
    from: 'TestAgent',
    to: 'ReviewAgent',
    trigger: 'All tests passing with >80% coverage',
    context: { coverage: 85, testFiles: ['...'], passRate: 100 },
    protocol: 'sync'
  }
];
```

## Tracing

All agent operations are traced for debugging and cost analysis.

```json
{
  "trace_id": "trace-uuid",
  "spans": [
    {
      "span_id": "span-1",
      "agent": "OrchestratorAgent",
      "action": "decompose_prd",
      "start_time": "ISO8601",
      "end_time": "ISO8601",
      "tokens_in": 500,
      "tokens_out": 1200,
      "status": "success",
      "children": ["span-2", "span-3"]
    },
    {
      "span_id": "span-2",
      "parent": "span-1",
      "agent": "SpecAgent",
      "action": "generate_openapi",
      "start_time": "ISO8601",
      "end_time": "ISO8601",
      "tokens_in": 300,
      "tokens_out": 800,
      "status": "success",
      "children": []
    }
  ]
}
```

Traces are stored in `.loki/memory/episodic/` with a `trace-` prefix.

## AAIF Standards

Agentic AI Foundation standards applied to Loki Mode:

1. **Agent Identity** — Every agent declares its role and capabilities
2. **Action Transparency** — Every action is logged with reasoning
3. **Human Override** — User can interrupt any autonomous operation
4. **Audit Trail** — Complete trace from PRD to deployment
5. **Graceful Degradation** — Agents fail safely without data loss
