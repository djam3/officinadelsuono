# Advanced Patterns — 2025 Research

## Multi-Agent Reflexion (MAR)

Multiple agents reflect on the same problem to improve solution quality.

### How It Works

```
Agent A solves problem -> Agent B critiques solution -> Agent A revises
                       -> Agent C critiques solution -> Agent A revises
Final: Agent A produces improved solution incorporating all feedback
```

### Application in Loki Mode

Used during the REVIEW phase:

1. **Author Agent** (BackendAgent/FrontendAgent) writes code
2. **Reviewer 1** critiques code quality
3. **Reviewer 2** critiques security
4. **Reviewer 3** critiques performance
5. **Author Agent** incorporates feedback and revises
6. If revisions are significant, another review round is triggered

### MAR Configuration

```json
{
  "max_reflexion_rounds": 3,
  "improvement_threshold": 0.1,
  "abort_condition": "no_improvement_after_2_rounds",
  "feedback_aggregation": "weighted_by_severity"
}
```

---

## Iterative Verification-Feedback (Iter-VF)

Iterative cycle of implementation and verification.

### Process

```
Implement V1 -> Verify -> Feedback -> Implement V2 -> Verify -> ...
```

Each iteration:
1. Implement the next increment
2. Run automated verification (tests, lint, type check)
3. If verification fails, analyze the failure
4. Incorporate failure analysis into next implementation attempt
5. Repeat until verification passes or max iterations reached

### Application in Loki Mode

Used during the IMPLEMENT phase for complex features:

```typescript
interface IterVFConfig {
  maxIterations: number;     // Maximum attempts: 5
  verificationSuite: string; // 'unit' | 'integration' | 'full'
  feedbackDepth: string;     // 'shallow' | 'deep' | 'root-cause'
  rollbackOnFailure: boolean; // Revert to last passing state
}
```

---

## GoalAct — Hierarchical Goal Planning

Breaks high-level goals into actionable sub-goals with dependency tracking.

### Goal Hierarchy

```
Goal: "Add product review system"
  |
  +-> Sub-goal 1: "Design review data model"
  |     +-> Task 1.1: "Define Review schema in OpenAPI spec"
  |     +-> Task 1.2: "Add Firestore rules for reviews collection"
  |
  +-> Sub-goal 2: "Implement backend"
  |     +-> Task 2.1: "Create review CRUD endpoints"
  |     +-> Task 2.2: "Add review validation logic"
  |
  +-> Sub-goal 3: "Implement frontend"
  |     +-> Task 3.1: "Create ReviewCard component"
  |     +-> Task 3.2: "Create ReviewForm component"
  |     +-> Task 3.3: "Integrate reviews into Product page"
  |
  +-> Sub-goal 4: "Test and review"
        +-> Task 4.1: "Write unit tests for review components"
        +-> Task 4.2: "Write integration tests for review API"
        +-> Task 4.3: "Run 3-reviewer quality gate"
```

### Goal Schema

```json
{
  "id": "goal-uuid",
  "title": "Add product review system",
  "description": "Allow authenticated users to leave reviews on products",
  "priority": "high",
  "status": "in_progress",
  "sub_goals": [
    {
      "id": "sub-goal-1",
      "title": "Design review data model",
      "dependencies": [],
      "tasks": ["task-1.1", "task-1.2"],
      "status": "complete"
    }
  ],
  "progress": 0.45,
  "estimated_tokens": 15000,
  "actual_tokens": 6750
}
```

---

## CONSENSAGENT — Anti-Sycophancy

Prevents agents from agreeing with each other to avoid conflict.

### The Problem

When multiple agents review code, they may:
- Agree with the first reviewer to avoid disagreement
- Rubber-stamp approvals to complete reviews faster
- Avoid raising concerns that might delay the process

### The Solution

1. **Blind Review** — Reviewers cannot see each other's feedback
2. **Independent Assessment** — Each reviewer uses a distinct evaluation framework
3. **Devil's Advocate** — Unanimous approval triggers a contrarian review
4. **Disagreement Bonus** — Track reviewers who raise unique concerns (positive signal)
5. **Consensus Detection** — Flag when all reviews are suspiciously similar

### Implementation

```json
{
  "anti_sycophancy": {
    "blind_review": true,
    "max_agreement_similarity": 0.85,
    "devils_advocate_on_unanimous": true,
    "disagreement_tracking": true,
    "min_unique_concerns_per_reviewer": 1
  }
}
```

---

## A-Mem / MIRIX — Advanced Memory Systems

### A-Mem (Associative Memory)

Memory entries are connected through associations:

```
[Episode: Fixed Firestore error] 
    -> associates with -> [Pattern: Firebase error handling]
    -> associates with -> [Skill: Firestore CRUD]
    -> associates with -> [Episode: Similar error in auth flow]
```

When retrieving context, associations are traversed to find related knowledge.

### MIRIX (Memory Integration and Retrieval with Indexed Experience)

Indexed retrieval for efficient memory lookup:

```json
{
  "index": {
    "by_agent": {
      "BackendAgent": ["mem-1", "mem-5", "mem-12"],
      "FrontendAgent": ["mem-2", "mem-6", "mem-8"]
    },
    "by_action": {
      "implement_endpoint": ["mem-1", "mem-5"],
      "create_component": ["mem-2", "mem-6"]
    },
    "by_outcome": {
      "success": ["mem-1", "mem-2", "mem-5"],
      "failure": ["mem-6", "mem-8", "mem-12"]
    },
    "by_tag": {
      "firestore": ["mem-1", "mem-5", "mem-12"],
      "react": ["mem-2", "mem-6", "mem-8"]
    }
  }
}
```

This index is rebuilt periodically from episodic memory to enable
sub-linear time lookups instead of scanning all memories.

---

## ToolOrchestra — See tool-orchestration.md

Efficiency metrics and reward signals for agent performance tracking.
