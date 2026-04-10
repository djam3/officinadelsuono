# Memory System Architecture

## Overview

The Loki Mode memory system provides persistent learning across sessions.
It enables agents to recall past decisions, avoid repeated mistakes,
and build up domain knowledge over time.

## Memory Types

### 1. Episodic Memory

**Location:** `.loki/memory/episodic/`
**Format:** JSON files, one per event
**Naming:** `{timestamp}-{agent}-{action}.json`

Episodic memory stores specific interaction traces — what happened, when,
why, and what the outcome was.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-09T12:30:00.000Z",
  "session_id": "session-abc123",
  "agent": "BackendAgent",
  "action": "implement_endpoint",
  "phase": "IMPLEMENT",
  "input": {
    "task": "Create /api/products endpoint",
    "spec_ref": "specs/openapi.yaml#/paths/~1api~1products"
  },
  "output": {
    "files_modified": ["server.ts"],
    "lines_added": 45,
    "lines_removed": 0
  },
  "outcome": "success",
  "reflection": "Endpoint created matching OpenAPI spec. Used Firestore admin SDK for database access. Added proper error handling with try-catch.",
  "cost_tokens": 1200,
  "duration_ms": 30000,
  "tags": ["api", "products", "firestore"],
  "related_memories": []
}
```

### 2. Semantic Memory

**Location:** `.loki/memory/semantic/`
**Format:** JSON files, one per pattern
**Naming:** `{category}-{pattern-name}.json`

Semantic memory stores generalized patterns extracted from episodic memories.
When multiple episodic memories share a common pattern, it gets consolidated.

```json
{
  "id": "pattern-001",
  "category": "error-handling",
  "pattern": "firebase-operation-wrapper",
  "description": "All Firestore operations in this project should be wrapped in try-catch with specific error logging to the error_logs collection",
  "confidence": 0.95,
  "supporting_episodes": ["ep-001", "ep-005", "ep-012"],
  "first_observed": "2026-04-01T00:00:00Z",
  "last_verified": "2026-04-09T00:00:00Z",
  "applicable_to": ["BackendAgent", "FrontendAgent", "IntegrationAgent"],
  "example": {
    "code": "try { await firestore.collection('products').add(data); } catch (error) { console.error('Firestore write failed:', error); await logError(error); }"
  }
}
```

**Consolidation Rules:**
- A pattern needs at least 3 supporting episodes to be considered established
- Patterns with <3 episodes are flagged as `tentative`
- Conflicting memories prefer the most recent verified instance
- Patterns not verified in 30 sessions are flagged for re-verification

### 3. Procedural Memory (Skills)

**Location:** `.loki/memory/skills/`
**Format:** Markdown files
**Naming:** `{skill-name}.md`

Skills are reusable procedures that have been validated through experience.

```markdown
# Skill: Firebase Firestore CRUD

## Version: 1.2
## Last Verified: 2026-04-09
## Applicable Agents: BackendAgent, FrontendAgent

## Prerequisites
- Firebase Admin SDK initialized
- Firestore collection name known
- Data schema validated

## Procedure
1. Validate input data against schema
2. Wrap operation in try-catch
3. Use batch writes for multi-document operations
4. Return typed response (never raw Firestore response)
5. Log errors to error_logs collection

## Known Gotchas
- Firestore timestamps must be strings in this project (see firestore.rules)
- Image fields can be up to 800KB (base64 encoded)
- Products require name, category, price fields minimum
```

---

## Memory Operations

### Write (Record)

All agents write to episodic memory after every RARV cycle:

```typescript
interface MemoryWrite {
  agent: string;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'partial';
  reflection: string;
  cost_tokens: number;
}
```

### Read (Recall)

Agents query memory before acting (REASON phase):

1. **Exact Match** — Search for memories with matching action type
2. **Similarity Search** — Find memories with overlapping tags
3. **Temporal Recency** — Prefer recent memories over old ones
4. **Pattern Lookup** — Check semantic memory for established patterns

### Consolidate

Periodic consolidation extracts patterns from episodic memory:

1. Group episodic memories by action type and outcome
2. Identify common patterns (>3 occurrences)
3. Create or update semantic memory entries
4. Link supporting episodes
5. Flag contradictions for manual resolution

### Forget

Memory cleanup to prevent unbounded growth:

1. Episodic memories older than 30 sessions can be archived
2. Failed experiments that led to no learning can be summarized and removed
3. Semantic patterns not verified in 30 sessions are flagged
4. Skills not used in 50 sessions are marked as potentially stale

---

## Retrieval Strategy

When an agent needs context, it follows this retrieval order:

1. **Active State** — Check `.loki/state.json` for current context
2. **Recent Episodes** — Last 10 episodic memories for this agent type
3. **Semantic Patterns** — All patterns applicable to this agent type
4. **Skills** — Relevant procedural skills for the current task
5. **Full Search** — If none of the above helps, search all memory types

## Storage Limits

- Maximum 1000 episodic memory files before consolidation is required
- Maximum 100 semantic patterns per category
- Maximum 50 skill files
- Individual memory files should not exceed 10KB
