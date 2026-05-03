# Skill: Parallel Exploring — Will Treinos PRO

## When to use
When you need to quickly understand a large area of the codebase before implementing something.
Example: "How does the payment system work end-to-end?"

## Protocol

Launch multiple read-only subagents simultaneously, each investigating one area:

### Will Treinos PRO standard areas:

**Subagent 1 — Contexts and State**
```
Read all files in src/context/
Map: what data each context exposes, what actions, who depends on what
```

**Subagent 2 — Pages and Routes**
```
Read src/app/**/page.tsx
Map: which role accesses each route, which contexts each page consumes
```

**Subagent 3 — Critical Components**
```
Read src/components/will/ and src/components/ui/
Map: props, dependencies, animation patterns used
```

**Subagent 4 — Backend and Security**
```
Read src/lib/supabasePersistence.ts, middleware.ts, supabase/migrations/
Map: which tables exist, which have RLS, which operations are allowed per role
```

## Synthesis

After all 4 subagents finish, consolidate into:
- Dependency map
- Identified fragility points
- What may be impacted by the planned change

## Rule
Reading phase = ZERO changes. Observe and map only.
