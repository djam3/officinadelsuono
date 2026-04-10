# Claude Best Practices — Boris Cherny Patterns

## Explore-Plan-Code (EPC)

The foundational development methodology for Claude Code,
adapted from Boris Cherny's guidelines for autonomous coding agents.

## Phase 1: Explore

Before writing any code, thoroughly understand the problem space.

### Checklist

- [ ] Read all files in the affected area
- [ ] Understand the existing patterns and conventions
- [ ] Check for similar implementations in the codebase
- [ ] Review test files for expected behaviors
- [ ] Check memory for past experiences with similar tasks
- [ ] Identify all files that might need changes
- [ ] Map dependencies (what imports what)

### Tools for Exploration

```bash
# Find all files related to a feature
grep -r "keyword" src/ --include="*.tsx" --include="*.ts"

# Check TypeScript types
npx tsc --noEmit 2>&1 | head -50

# View component dependency graph
grep -r "import.*from" src/components/ | sort
```

### Common Pitfalls

1. **Starting before understanding** — Reading one file is not enough.
   Read the whole module, its tests, and its consumers.

2. **Assuming patterns** — Every codebase has quirks.
   Check how THIS codebase does things, not how you think it should.

3. **Ignoring tests** — Tests are documentation.
   They tell you what the code is supposed to do.

## Phase 2: Plan

Create a detailed plan before writing code.

### Plan Structure

```markdown
## Goal
What we're trying to accomplish

## Current State
What exists today and how it works

## Changes Required
1. File X: Add function Y
2. File Z: Modify component W
3. New file: Create service S

## Risks
- Risk 1: Mitigation approach
- Risk 2: Mitigation approach

## Test Plan
- Unit test for function Y
- Integration test for service S
- Manual verification of component W

## Rollback Plan
If something goes wrong, revert commits A, B, C
```

### Planning Rules

1. **Atomic changes** — Each planned change should be independently testable
2. **Dependency order** — Plan changes in correct dependency order
3. **Test-first** — Include test plan for every code change
4. **Size limits** — If plan exceeds 10 changes, break into smaller sub-plans
5. **Explicit assumptions** — Document any assumptions made

## Phase 3: Code

Execute the plan with discipline.

### Coding Principles

1. **One change at a time** — Make one atomic change, verify it works, then proceed
2. **Run tests after every change** — Catch regressions immediately
3. **Commit after every passing test** — Create a safety net for rollback
4. **Follow existing patterns** — Match the style of surrounding code
5. **No TODO comments without tickets** — TODOs must reference a task ID

### Code Quality Standards

```typescript
// Good: Clear types, error handling, descriptive names
async function fetchProducts(category: string): Promise<Product[]> {
  try {
    const snapshot = await firestore.collection('products')
      .where('category', '==', category)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error(`Failed to fetch products for category ${category}:`, error);
    throw new Error(`Product fetch failed: ${(error as Error).message}`);
  }
}

// Bad: Any types, no error handling, unclear names
async function getStuff(c: any) {
  const s = await firestore.collection('products').where('category', '==', c).get();
  return s.docs.map((d: any) => d.data());
}
```

### React Component Patterns (officinadelsuono)

```tsx
// Follow existing patterns in the codebase:

// 1. Named exports for components
export function ProductCard({ product, onNavigate }: ProductCardProps) { ... }

// 2. Lazy loading for pages
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));

// 3. Framer Motion for animations
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// 4. Tailwind for styling (dark theme always)
className="bg-zinc-950 text-white border border-white/10 rounded-2xl"

// 5. Brand colors
className="text-brand-orange" // #F27D26
className="bg-brand-orange hover:bg-orange-500"

// 6. Italian text for UI
<h1>Benvenuto in Officina del Suono</h1>
```

## Anti-Patterns (Never Do)

1. **Large diffs** — Changes touching >10 files without sub-plans
2. **Orphan code** — Code that nothing imports or references
3. **Silent failures** — Missing error handling on async operations
4. **Type erasure** — Using `any` to bypass type checking
5. **Untested paths** — New logic without corresponding tests
6. **Copy-paste programming** — Duplicating code instead of abstracting
7. **Premature optimization** — Optimizing before profiling
8. **Breaking existing tests** — Modifying tests to pass instead of fixing code

## Debugging Strategy

When something does not work:

1. **Read the error** — Actually read the full error message and stack trace
2. **Reproduce** — Can you reliably reproduce the issue?
3. **Isolate** — What is the smallest change that triggers the bug?
4. **Check memory** — Have you seen this error before?
5. **Binary search** — If the bug is in recent changes, bisect to find the cause
6. **Rubber duck** — Explain the problem out loud (or to episodic memory)
7. **Fresh eyes** — If stuck after 3 attempts, escalate to Orchestrator
