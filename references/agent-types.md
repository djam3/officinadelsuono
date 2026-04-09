# Agent Types — 37 Specialized Agent Definitions

## Tier 1 — Orchestrator (Opus)

### 1. OrchestratorAgent
- **Model:** Opus
- **Lifetime:** Entire session
- **Responsibility:** Global coordination, PRD decomposition, phase transitions
- **Inputs:** PRD document, `.loki/state.json`
- **Outputs:** Task assignments, phase transitions, escalation decisions
- **Spawn Condition:** Session start
- **Rules:**
  - Never writes code directly
  - Maintains global state
  - Handles circuit breaker escalations
  - Makes architecture-level decisions

---

## Tier 2 — Domain Leads (Sonnet)

### 2. SpecAgent
- **Model:** Sonnet
- **Responsibility:** OpenAPI spec generation, data model design, API contracts
- **Phase:** SPEC
- **Outputs:** `openapi.yaml`, TypeScript type definitions
- **Quality Gate:** Spec validates against OpenAPI 3.1 schema

### 3. ArchAgent
- **Model:** Sonnet
- **Responsibility:** System design, tech stack decisions, component architecture
- **Phase:** DESIGN
- **Outputs:** Architecture diagrams, tech stack document, component hierarchy
- **Quality Gate:** Design review by Orchestrator

### 4. BackendAgent
- **Model:** Sonnet
- **Responsibility:** API routes, business logic, Firebase operations
- **Phase:** IMPLEMENT
- **Outputs:** Express routes, Firestore operations, Cloud Functions
- **Quality Gate:** API contract compliance, error handling coverage
- **Project-Specific:** Firebase Admin SDK, Resend email, multer uploads

### 5. FrontendAgent
- **Model:** Sonnet
- **Responsibility:** React components, routing, state management, UI/UX
- **Phase:** IMPLEMENT
- **Outputs:** React components, Zustand stores, Tailwind styles
- **Quality Gate:** Component renders without errors, responsive design
- **Project-Specific:** React 19, Framer Motion, Three.js, Lucide icons

### 6. IntegrationAgent
- **Model:** Sonnet
- **Responsibility:** External APIs, webhooks, SDK integrations
- **Phase:** IMPLEMENT
- **Outputs:** Service adapters, webhook handlers, SDK wrappers
- **Quality Gate:** Integration tests pass, error boundaries in place
- **Project-Specific:** Google GenAI, Firebase Auth, Cloud Storage, Resend

### 7. TestAgent
- **Model:** Sonnet
- **Responsibility:** Integration and E2E test suites
- **Phase:** TEST
- **Outputs:** Test files, test configurations, coverage reports
- **Quality Gate:** >80% coverage, 100% pass rate

### 8. DeployAgent
- **Model:** Sonnet
- **Responsibility:** CI/CD pipelines, Firebase deployment, cloud configuration
- **Phase:** DEPLOY
- **Outputs:** Deploy scripts, environment configs, Firebase rules
- **Quality Gate:** Staging deploy succeeds, smoke tests pass
- **Project-Specific:** Firebase Hosting, Firebase Functions, Vite build

### 9. ReviewAgent
- **Model:** Sonnet (x3 instances for parallel review)
- **Responsibility:** Code review, security scanning, quality gate enforcement
- **Phase:** REVIEW
- **Outputs:** Review comments, severity assessments, approval/block decisions
- **Quality Gate:** All 3 reviewers approve (with anti-sycophancy check)

### 10. BusinessAgent
- **Model:** Sonnet
- **Responsibility:** Analytics setup, pricing logic, onboarding flows
- **Phase:** OPERATE
- **Outputs:** Analytics events, pricing configurations, user journey maps
- **Quality Gate:** No dark patterns, transparent pricing

---

## Tier 3 — Specialists (Haiku)

### 11. UnitTestAgent
- **Model:** Haiku
- **Responsibility:** Writing unit tests for individual functions/components
- **Spawn Condition:** BackendAgent or FrontendAgent completes a module
- **Outputs:** Unit test files with >80% coverage target

### 12. LintAgent
- **Model:** Haiku
- **Responsibility:** Running ESLint, fixing auto-fixable issues
- **Spawn Condition:** Any code change
- **Outputs:** Lint-clean code, lint report

### 13. TypeCheckAgent
- **Model:** Haiku
- **Responsibility:** Running TypeScript strict mode checks
- **Spawn Condition:** Any code change
- **Outputs:** `tsc --noEmit` clean output

### 14. FormatAgent
- **Model:** Haiku
- **Responsibility:** Code formatting consistency
- **Spawn Condition:** Before commit
- **Outputs:** Formatted code

### 15. SecurityScanAgent
- **Model:** Haiku
- **Responsibility:** Scanning for exposed secrets, XSS, SQL injection patterns
- **Spawn Condition:** Before deploy
- **Outputs:** Security report

### 16. DependencyAuditAgent
- **Model:** Haiku
- **Responsibility:** `npm audit`, checking for vulnerable dependencies
- **Spawn Condition:** Package changes or weekly
- **Outputs:** Audit report, update recommendations

### 17. PerformanceAgent
- **Model:** Haiku
- **Responsibility:** Bundle size analysis, render performance checks
- **Spawn Condition:** Before deploy
- **Outputs:** Performance metrics, optimization suggestions

### 18. AccessibilityAgent
- **Model:** Haiku
- **Responsibility:** A11y checks (ARIA, contrast, keyboard navigation)
- **Spawn Condition:** UI component creation
- **Outputs:** Accessibility report

### 19. SEOAgent
- **Model:** Haiku
- **Responsibility:** Meta tags, structured data, semantic HTML validation
- **Spawn Condition:** Page creation/modification
- **Outputs:** SEO checklist compliance report

### 20. I18nAgent
- **Model:** Haiku
- **Responsibility:** Ensuring Italian text consistency, no hardcoded English strings
- **Spawn Condition:** UI text changes
- **Outputs:** Translation verification report

### 21. ImageOptimizationAgent
- **Model:** Haiku
- **Responsibility:** Image compression, format optimization, lazy loading checks
- **Spawn Condition:** Image upload or reference
- **Outputs:** Optimized images, srcset configurations

### 22. CSSAgent
- **Model:** Haiku
- **Responsibility:** Tailwind class optimization, responsive breakpoints
- **Spawn Condition:** Component styling
- **Outputs:** Optimized class lists, CSS audit

### 23. AnimationAgent
- **Model:** Haiku
- **Responsibility:** Framer Motion animation quality, performance impact
- **Spawn Condition:** Animation implementation
- **Outputs:** Animation performance report, 60fps verification

### 24. ThreeJSAgent
- **Model:** Haiku
- **Responsibility:** Three.js scene optimization, WebGL performance
- **Spawn Condition:** 3D scene changes
- **Outputs:** Scene performance metrics, memory leak checks

### 25. FirestoreAgent
- **Model:** Haiku
- **Responsibility:** Firestore query optimization, index requirements
- **Spawn Condition:** Database operations
- **Outputs:** Query analysis, index recommendations

### 26. AuthAgent
- **Model:** Haiku
- **Responsibility:** Authentication flow testing, token validation
- **Spawn Condition:** Auth-related changes
- **Outputs:** Auth flow verification report

### 27. EmailAgent
- **Model:** Haiku
- **Responsibility:** Email template rendering, Resend integration testing
- **Spawn Condition:** Email template changes
- **Outputs:** Email render preview, spam score check

### 28. ErrorHandlingAgent
- **Model:** Haiku
- **Responsibility:** Error boundary coverage, graceful degradation
- **Spawn Condition:** Any code change
- **Outputs:** Error handling coverage report

### 29. StateManagementAgent
- **Model:** Haiku
- **Responsibility:** Zustand store design review, state shape validation
- **Spawn Condition:** Store modifications
- **Outputs:** State flow diagram, mutation audit

### 30. RoutingAgent
- **Model:** Haiku
- **Responsibility:** Navigation flow verification, deep link handling
- **Spawn Condition:** Page/route changes
- **Outputs:** Route map, navigation test results

### 31. BuildAgent
- **Model:** Haiku
- **Responsibility:** Vite build process, chunk splitting analysis
- **Spawn Condition:** Before deploy
- **Outputs:** Build report, chunk analysis

### 32. MonitoringAgent
- **Model:** Haiku
- **Responsibility:** Error logging setup, performance monitoring
- **Spawn Condition:** Deploy to production
- **Outputs:** Monitoring dashboard config, alert rules

### 33. DocumentationAgent
- **Model:** Haiku
- **Responsibility:** JSDoc comments, README updates, API documentation
- **Spawn Condition:** Public API changes
- **Outputs:** Updated documentation

### 34. GitAgent
- **Model:** Haiku
- **Responsibility:** Semantic commit messages, branch management
- **Spawn Condition:** Quality gate pass
- **Outputs:** Git commits, branch operations

### 35. CacheAgent
- **Model:** Haiku
- **Responsibility:** Browser caching strategy, service worker optimization
- **Spawn Condition:** Deploy configuration
- **Outputs:** Cache policy report

### 36. APIContractAgent
- **Model:** Haiku
- **Responsibility:** Contract testing between frontend and backend
- **Spawn Condition:** API endpoint changes
- **Outputs:** Contract test results

### 37. RollbackAgent
- **Model:** Haiku
- **Responsibility:** Rollback plan creation, deployment verification
- **Spawn Condition:** Production deploy
- **Outputs:** Rollback script, deployment verification report

---

## Agent Communication

All agents communicate via `.loki/state.json` using structured messages:

```json
{
  "from": "BackendAgent",
  "to": "OrchestratorAgent",
  "type": "status_update",
  "payload": {
    "task_id": "uuid",
    "status": "complete",
    "artifacts": ["src/server.ts"],
    "metrics": { "tokens": 1200, "duration_ms": 45000 }
  }
}
```

## Parallelization Rules

- Up to 8 Tier 3 agents can run concurrently
- Tier 2 agents can run in parallel only if they operate on different codepaths
- BackendAgent and FrontendAgent can run simultaneously
- TestAgent must wait for IMPLEMENT phase to complete
- ReviewAgent runs 3 parallel instances (blind review)
