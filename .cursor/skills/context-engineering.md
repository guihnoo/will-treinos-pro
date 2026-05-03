# Skill: Context Engineering — Will Treinos PRO
# Source: muratcankoylan/agent-skills-for-context-engineering (v1.3.0)
# Adapted for Will Treinos PRO stack

## When to use
When building, optimizing, or debugging agent systems, multi-agent architectures,
context window management, memory systems, or tool design.

---

## Context Fundamentals

Context is NOT just the prompt text — it is the complete state available to the model:
system instructions, tool definitions, retrieved documents, message history, tool outputs.

**Effective context engineering = curating maximum signal-to-noise ratio.**

### Context Degradation Patterns (know these)
- **Lost-in-middle**: Information in the CENTER of context gets less attention
- **U-shaped attention**: Model prioritizes BEGINNING and END of context
- **Context poisoning**: Errors early in context compound and corrupt later reasoning
- **Context distraction**: Irrelevant info overwhelms relevant content

### Applied to Will Treinos PRO
- Keep CLAUDE.md short and dense (high signal)
- Put the most critical rules at TOP and BOTTOM of CLAUDE.md
- WILLPRO_MASTER_MEMORY.md = separate file to avoid polluting main context
- Skills loaded on-demand (not all at once) = better signal per token

---

## Multi-Agent Architecture Patterns

Three dominant patterns in production systems:

1. **Supervisor/Orchestrator** (our model) — centralized control routes tasks to specialists
2. **Peer-to-peer swarm** — agents hand off to each other flexibly
3. **Hierarchical** — for complex task decomposition with sub-hierarchies

**Critical insight:** Sub-agents exist primarily to ISOLATE CONTEXT, not to simulate org roles.

### Will Treinos PRO agents follow pattern 1:
- Orchestrator (orchestrator.md) → routes to specialist agents
- memory-logger, design-guardian, build-validator, security-scanner, volleyball-coach

---

## Memory System Design

| Type | Pros | Cons | When to use |
|---|---|---|---|
| Scratchpad files | Simple, unlimited | Manual management | Active task state |
| Vector RAG | Semantic search | Loses relationships | Historical search |
| Knowledge graphs | Preserves structure | Complex to build | Entity relationships |
| Filesystem-as-memory | Just-in-time loading | Requires good file org | Long-horizon tasks |

**Our approach:** Filesystem-as-memory (WILLPRO_MASTER_MEMORY.md) + on-demand skill loading.

---

## Filesystem-Based Context (our primary pattern)

```
Project context architecture:
CLAUDE.md              → always loaded (dense, high-signal)
WILLPRO_MASTER_MEMORY  → loaded when historical context needed
.cursor/skills/*.md    → loaded on-demand by task type
.claude/skills/*.md    → Claude Code auto-discovers on startup
```

Agent uses `ls`, `grep`, `read_file` for targeted context discovery.
This outperforms semantic search for structural queries about the codebase.

---

## Context Compression (for long sessions)

When a session grows long:
1. Summarize decisions made (not full conversation)
2. Keep: files modified, decisions made, next steps
3. Drop: exploration tangents, failed attempts, verbose outputs
4. Target: **tokens-per-task** not tokens-per-request

```
Summary format:
- Files modified: [list]
- Decisions made: [list]  
- Patterns established: [list]
- Next steps: [list]
```

---

## Context Optimization Techniques

| Technique | How | Savings |
|---|---|---|
| Compaction | Summarize near context limit | 40-60% |
| Observation masking | Replace verbose output with reference | 30-50% |
| Prefix caching | Reuse KV blocks (CLAUDE.md stays cached) | 20-40% |
| Context partitioning | Split work across sub-agents | Task-dependent |

---

## Tool Design Principles

- **Consolidation**: Prefer 1 comprehensive tool over 3 narrow ones
- **Contextual errors**: Return useful info in error messages, not just error codes
- **Response format options**: Support compact vs verbose output
- **Clear namespacing**: `supabase_query` not just `query`

---

## Evaluation Framework

Production evaluation dimensions:
1. Factual accuracy (did it get the data right?)
2. Completeness (did it cover all requirements?)
3. Tool efficiency (did it use the minimum tools needed?)
4. Process quality (did it follow the established protocol?)

Use LLM-as-judge for scale, human review for edge cases.

---

## Quick Reference — Applied to Will Treinos PRO

| Problem | Context Engineering Solution |
|---|---|
| Agent forgets earlier decisions | Save to MASTER_MEMORY immediately |
| Agent ignores rules mid-session | Put rules at top AND bottom of CLAUDE.md |
| Too many tokens per task | Load skills on-demand, not all upfront |
| Sub-agent loses parent context | Pass only essential slice, use shared files |
| Long debugging session | Compress to decision log before continuing |
