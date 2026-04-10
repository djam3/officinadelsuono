# SDLC Phases — Entry/Exit Criteria

## Phase Overview

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

---

## Phase 1: SPEC

**Lead Agent:** SpecAgent (Sonnet)

### Entry Criteria
- PRD document available (file or inline)
- Orchestrator has decomposed PRD into feature areas

### Activities
1. Analyze PRD requirements and extract functional specifications
2. Define data models and their relationships
3. Generate OpenAPI 3.1 specification for all endpoints
4. Define Firestore collection schemas
5. Identify external integration points (Firebase, Resend, GenAI, Stripe)
6. Document non-functional requirements (performance, security, scalability)

### Exit Criteria
- [ ] OpenAPI spec validates against OpenAPI 3.1 JSON Schema
- [ ] All endpoints have request/response schemas defined
- [ ] Data models documented with field types and constraints
- [ ] Non-functional requirements listed with measurable targets
- [ ] Spec reviewed and approved by Orchestrator

### Artifacts
- `specs/openapi.yaml`
- `specs/data-models.md`
- `specs/requirements.md`

---

## Phase 2: DESIGN

**Lead Agent:** ArchAgent (Sonnet)

### Entry Criteria
- SPEC phase complete with approved specifications
- OpenAPI spec available

### Activities
1. Design system architecture (component hierarchy, data flow)
2. Confirm/update tech stack for the feature
3. Design database schema (Firestore collections, indexes)
4. Plan state management approach (Zustand stores)
5. Design component hierarchy (React component tree)
6. Identify reusable components vs feature-specific ones
7. Plan routing and navigation changes

### Exit Criteria
- [ ] Architecture document approved by Orchestrator
- [ ] Component hierarchy defined
- [ ] Database schema designed with index requirements
- [ ] State management plan documented
- [ ] No circular dependencies in component graph

### Artifacts
- `docs/architecture.md`
- `docs/component-hierarchy.md`
- `docs/database-schema.md`

---

## Phase 3: SCAFFOLD

**Lead Agent:** DeployAgent (Sonnet)

### Entry Criteria
- DESIGN phase complete with approved architecture
- Tech stack confirmed

### Activities
1. Create directory structure for new features
2. Set up TypeScript type definitions from OpenAPI spec
3. Create placeholder components with proper exports
4. Configure Vite build settings if needed
5. Set up Firebase rules for new collections
6. Create git branch with semantic name

### Exit Criteria
- [ ] Directory structure matches architecture document
- [ ] TypeScript types generated from OpenAPI spec
- [ ] All placeholder files compile without errors (`tsc --noEmit`)
- [ ] Firebase rules updated for new collections
- [ ] Git branch created and committed

### Artifacts
- New directory structure
- Generated TypeScript types
- Updated `firestore.rules`

---

## Phase 4: IMPLEMENT

**Lead Agent:** BackendAgent + FrontendAgent (Sonnet, parallel)

### Entry Criteria
- SCAFFOLD phase complete
- Types and placeholder components exist
- OpenAPI spec available for contract compliance

### Activities

**Backend Stream (BackendAgent):**
1. Implement Express API routes matching OpenAPI spec
2. Write Firestore operations with proper error handling
3. Implement business logic and validation
4. Set up Firebase Cloud Functions if needed
5. Integrate external services (Resend, GenAI, Storage)

**Frontend Stream (FrontendAgent):**
1. Implement React components with Tailwind styling
2. Set up Zustand stores for state management
3. Implement Framer Motion animations
4. Build responsive layouts (mobile-first)
5. Integrate Three.js scenes if applicable
6. Wire up API calls to backend endpoints

**Integration Stream (IntegrationAgent):**
1. Connect frontend to backend APIs
2. Set up Firebase Auth flows
3. Implement real-time Firestore listeners
4. Configure Cloud Storage upload/download
5. Set up error logging pipeline

### Exit Criteria
- [ ] All API endpoints return expected responses
- [ ] All React components render without errors
- [ ] State management works correctly
- [ ] UI matches design specifications
- [ ] No TypeScript errors (`tsc --noEmit` clean)
- [ ] No `any` types in new code

### Artifacts
- Implementation code in `src/`, `functions/`, `server.ts`

---

## Phase 5: TEST

**Lead Agent:** TestAgent (Sonnet)

### Entry Criteria
- IMPLEMENT phase complete for the feature area
- All components compile without errors

### Activities
1. Write unit tests for all new functions (>80% coverage)
2. Write integration tests for API endpoints
3. Write E2E tests for critical user flows
4. Run performance tests for Three.js scenes
5. Test error handling and edge cases
6. Verify responsive behavior across breakpoints

### Exit Criteria
- [ ] Unit test coverage >80%
- [ ] All unit tests pass (100% pass rate)
- [ ] Integration tests pass against real Firebase (staging)
- [ ] E2E tests pass for critical flows
- [ ] No performance regressions detected
- [ ] Error handling covers all identified edge cases

### Artifacts
- Test files
- Coverage report
- Performance benchmark results

---

## Phase 6: REVIEW

**Lead Agent:** ReviewAgent (Sonnet x3)

### Entry Criteria
- TEST phase complete with all tests passing
- Coverage gates met

### Activities
1. **Reviewer 1:** Code quality, readability, patterns
2. **Reviewer 2:** Security, data validation, auth checks
3. **Reviewer 3:** Performance, bundle size, rendering efficiency

All reviewers work independently (blind review).

4. **Anti-Sycophancy Check:** If all 3 approve unanimously, a devil's advocate
   review is triggered to challenge the approval

### Exit Criteria
- [ ] All 3 reviewers approve (or devil's advocate confirms unanimous is justified)
- [ ] No Critical or High severity findings remain
- [ ] Medium severity findings have documented acceptance or fix plan
- [ ] Security scan clean
- [ ] Bundle size within acceptable range

### Severity Rubric
| Severity | Action | Examples |
|---|---|---|
| Critical | BLOCK, fix immediately | Security vulnerability, data loss risk |
| High | BLOCK, fix before merge | Missing error handling, broken auth flow |
| Medium | BLOCK, discuss | Performance concern, minor pattern violation |
| Low | Suggestion | Style preference, naming convention |
| Info | Note | Documentation suggestion, future improvement |

---

## Phase 7: DEPLOY

**Lead Agent:** DeployAgent (Sonnet)

### Entry Criteria
- REVIEW phase complete with approval
- All quality gates passing

### Activities
1. Build production bundle (`npm run build`)
2. Verify build output (no errors, reasonable bundle size)
3. Deploy to staging (`firebase deploy --only hosting --project staging`)
4. Run smoke tests against staging
5. If staging passes, deploy to production
6. Update Firestore rules if changed
7. Create rollback plan

### Exit Criteria
- [ ] Build completes without errors
- [ ] Staging deployment successful
- [ ] Smoke tests pass on staging
- [ ] Production deployment successful (if approved)
- [ ] Rollback plan documented
- [ ] Deploy commit tagged with version

---

## Phase 8: VALIDATE

**Lead Agent:** TestAgent (Sonnet) + MonitoringAgent (Haiku)

### Entry Criteria
- DEPLOY phase complete (staging or production)
- Application accessible at deployment URL

### Activities
1. Run full E2E test suite against deployed environment
2. Verify all critical user flows work
3. Establish performance baselines (load time, TTFB, FCP, LCP)
4. Verify Firebase rules work correctly in deployed context
5. Test email sending (Resend) in production
6. Verify error logging pipeline captures errors

### Exit Criteria
- [ ] All E2E tests pass against deployed environment
- [ ] Performance baselines recorded
- [ ] Error logging is capturing and reporting correctly
- [ ] Firebase rules tested with real auth tokens
- [ ] No regressions from previous deployment

---

## Phase 9: OPERATE

**Lead Agent:** BusinessAgent (Sonnet) + MonitoringAgent (Haiku)

### Entry Criteria
- VALIDATE phase complete
- Application running in production

### Activities
1. Monitor error rates and performance metrics
2. Set up alerts for anomalies
3. Track user analytics and engagement
4. Monitor Firebase quota usage
5. Review and respond to user feedback
6. Plan next iteration based on metrics

### Exit Criteria
- This phase runs continuously
- Transitions back to SPEC when new features are identified
- Circuit breaker triggers if error rate exceeds threshold

---

## Phase Transitions

```
SPEC -> DESIGN -> SCAFFOLD -> IMPLEMENT -> TEST -> REVIEW -> DEPLOY -> VALIDATE -> OPERATE
  ^                                                                                   |
  |___________________________________________________________________________________|
```

Only the Orchestrator can authorize phase transitions.
Skipping phases is prohibited except SCAFFOLD (if structure already exists).
