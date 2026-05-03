# Skill: Building Skills From Patterns — Will Treinos PRO

## When to use
When you notice you're repeating the same process manually more than 2 times.
Turn the pattern into a skill for automatic reuse.

## Protocol

### 1. Identify the pattern
```
What sequence of steps are you repeating?
Examples in Will Treinos PRO:
- Create modal → always glassmorphism + useBodyScrollLock + AnimatePresence
- Create context → always Provider + Hook + types + register in layout.tsx
- Deploy → always tsc + build + commit + push
- Log change → always BRT date + file + description + build status
```

### 2. Write the skill
```markdown
# Skill: [Pattern Name]

## When to use
[Condition that triggers this skill]

## Protocol
[Steps in order]

## Template/Scaffold
[Base code if applicable]

## Completion checklist
[What to verify before considering done]
```

### 3. Save in `.cursor/skills/[skill-name].md`

### 4. Test
Ask the agent to follow the skill on the next occurrence of the pattern.

## Skills candidates to create in Will Treinos PRO

| Repeated pattern | Suggested skill name |
|---|---|
| Create new page with restricted role | `creating-protected-page` |
| Add new field to type + context + database | `adding-domain-field` |
| Refactor useApp() consumer to specialized context | `migrating-to-domain-context` |
| Create new migration with RLS | `creating-rls-migration` |
| Test complete auth flow | `testing-auth-flow` |

## Rule
If you did something manually 2 times → create a skill.
Skills save time and eliminate inconsistencies.
