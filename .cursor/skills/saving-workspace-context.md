# Skill: Saving Workspace Context — Will Treinos PRO

## When to use
At the end of any significant work session. Ensures knowledge acquired
in the session is not lost when context is cleared.

## What to persist

### 1. Architectural decisions made
→ Log in `WILLPRO_MASTER_MEMORY.md` (## 3. LOG block)

### 2. Problems discovered but not resolved
→ Create entry in `WILLPRO_MASTER_MEMORY.md` with tag `[PENDING]`

### 3. New patterns established
→ If it's a pattern that will repeat, create a skill in `.cursor/skills/`

### 4. Ideas that emerged during work
→ Add to `## 💡 OPEN IDEAS AREA` section in `CLAUDE.md`

## End-of-session protocol

```
1. What decisions were made today that impact architecture?
2. What problems were discovered but left for later?
3. What patterns were used that should be followed in future sessions?
4. What ideas emerged that are worth exploring?

For each answer → log in the correct file.
```

## MASTER MEMORY log format
```
- **[DD/MM/YYYY HH:MM BRT] (Claude/Cursor):** **[Sprint]** — [Description]. Build OK (exit 0). **Git:** push `origin/main`.
```

## Rule
Never end a session without at least 1 entry in MASTER MEMORY.
Unlogged knowledge = lost knowledge.
