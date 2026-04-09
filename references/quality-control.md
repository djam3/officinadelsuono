# Quality Control — Review System and Gates

## The 5 Non-Negotiable Quality Gates

Every code change must pass ALL gates before merge. No exceptions.

### Gate 1: Static Analysis

**Tool:** TypeScript strict mode + ESLint

```bash
# TypeScript check
npx tsc --noEmit

# ESLint (when configured)
npx eslint src/ --ext .ts,.tsx
```

**Pass Criteria:**
- Zero TypeScript errors
- Zero ESLint errors (warnings are acceptable but logged)
- No `any` types without documented justification
- No `@ts-ignore` comments without associated issue ticket

### Gate 2: 3-Reviewer Parallel System

Three independent Sonnet instances review every change simultaneously.
Reviews are **blind** — reviewers cannot see each other's feedback.

**Reviewer 1 — Code Quality:**
```
Review this code change for:
- Readability and clarity
- Naming conventions (camelCase for variables, PascalCase for components)
- Function complexity (max 20 lines preferred, 40 hard limit)
- DRY principle adherence
- Proper error handling patterns
- React hooks rules compliance
- Zustand store design patterns
```

**Reviewer 2 — Security:**
```
Review this code change for:
- Input validation on all user inputs
- XSS prevention (no dangerouslySetInnerHTML without sanitization)
- Authentication checks on protected routes/endpoints
- Firestore rules compliance
- No exposed secrets or API keys
- CORS configuration correctness
- Data sanitization before database writes
```

**Reviewer 3 — Performance:**
```
Review this code change for:
- Bundle size impact
- Unnecessary re-renders in React components
- Proper use of React.memo, useMemo, useCallback
- Lazy loading for heavy components (Three.js, large pages)
- Image optimization (compression, lazy loading, srcset)
- Firestore query efficiency (no full collection scans)
- Animation performance (60fps target for Framer Motion)
```

### Gate 3: Anti-Sycophancy Check

If all 3 reviewers approve unanimously, trigger a devil's advocate review:

```
All three reviewers approved this change unanimously.
Your role is devil's advocate: find the strongest possible argument
AGAINST merging this code.

Consider:
- Hidden assumptions that might break in edge cases
- Scalability concerns not visible at current scale
- Security implications the reviewers might have overlooked
- Maintenance burden this code might create
- Alternative approaches that might be significantly better

If you cannot find a compelling argument against merge,
explicitly state "No compelling objection found" with your reasoning.
```

**Rules:**
- Devil's advocate must provide at least one concern or explicitly clear
- If a compelling objection is found, send back to Review with the new finding
- Log the anti-sycophancy check result in episodic memory

### Gate 4: Severity-Based Blocking

| Severity | Action | Resolution |
|---|---|---|
| Critical | BLOCK immediately | Must fix before any further work |
| High | BLOCK | Fix before merge, no exceptions |
| Medium | BLOCK | Fix or get documented exception from Orchestrator |
| Low | Warn | Fix recommended, not blocking |
| Info | Note | Logged for future reference |

**Critical Findings (always block):**
- Security vulnerabilities (XSS, injection, exposed secrets)
- Data loss risk
- Authentication bypass
- Production data corruption potential

**High Findings (always block):**
- Missing error handling on async operations
- Broken user flow
- Missing input validation
- Type safety violations (`any` usage)

**Medium Findings (block, discuss):**
- Performance concerns (bundle size >500KB increase)
- Accessibility violations
- Missing tests for complex logic
- Pattern inconsistency with existing codebase

### Gate 5: Test Coverage

```bash
# Coverage check
npx jest --coverage

# Or if using Vitest
npx vitest run --coverage
```

**Pass Criteria:**
- Unit test coverage > 80% for new code
- 100% test pass rate (zero failures)
- All critical paths have at least one test
- Edge cases documented even if not all tested

---

## Review Output Format

Each reviewer produces a structured assessment:

```json
{
  "reviewer": "CodeQuality|Security|Performance",
  "verdict": "APPROVE|BLOCK|REQUEST_CHANGES",
  "findings": [
    {
      "severity": "Critical|High|Medium|Low|Info",
      "file": "src/components/Example.tsx",
      "line": 42,
      "category": "error-handling|security|performance|style|logic",
      "description": "Missing error boundary for async operation",
      "suggestion": "Wrap in try-catch with user-facing error message"
    }
  ],
  "overall_assessment": "Brief summary of code quality",
  "tokens_used": 0
}
```

## Handling Review Failures

1. Log all findings to `.loki/memory/episodic/`
2. Create fix tasks for each blocking finding
3. Re-run the affected quality gate after fixes
4. If 3 consecutive review cycles fail, escalate to Orchestrator
5. Never merge with unresolved Critical or High findings
