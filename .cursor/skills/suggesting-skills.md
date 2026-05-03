# Skill: Suggesting Skills — Will Treinos PRO

## What it does
When the agent notices it's manually repeating a process that could be a skill,
or when receiving a task for which an installed skill exists but wasn't invoked,
it proactively suggests it.

## Automatic behavior

### Situation 1 — Existing skill not invoked
If the user asks for something a skill covers, the agent uses it automatically
(via orchestrator.md) and announces:
```
💡 Using @skill-name for this — it's the project's standard approach.
```

### Situation 2 — Repeated pattern without skill
If the agent notices it's doing something manually for the 2nd time:
```
💡 I notice we're repeating this process. I can create a skill
   in .cursor/skills/ to automate this in the future.
   Should I create it?
```

### Situation 3 — Complex task without protocol
If the task is new and complex, the agent proposes creating a skill at the end:
```
💡 This was a complex task with a clear pattern. Should I create a
   skill to standardize how we do this in the future?
```

## Available skills quick reference

| @skill | When to use |
|---|---|
| `@grinding-until-pass` | Build/TS broken |
| `@parallel-exploring` | Understand codebase area |
| `@visual-qa-testing` | After UI change |
| `@parallel-code-review` | Before push |
| `@saving-workspace-context` | End of session |
| `@systematic-debugging` | Bug report |
| `@responsive-testing` | Layout change |
| `@building-skills-from-patterns` | Repeated pattern |
| `@auto-type-checking` | TypeScript errors |
| `@auditing-security` | Security/new table |
| `@auditing-performance` | App slow/heavy query |
| `@writing-commit-messages` | Before commit |
| `@grill-me` | Challenge new idea |
| `@improve-architecture` | Architectural analysis |
| `@best-of-n-solving` | Problem with multiple approaches |
