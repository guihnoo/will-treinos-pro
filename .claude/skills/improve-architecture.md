# Skill: Improve Architecture — Will Treinos PRO

## When to use
Before major Sprints. When code feels heavy or hard to maintain.
Honest codebase analysis + concrete improvement proposals.

## Analysis Protocol

### Phase 1 — Mapping (read only)
```
Read:
- src/context/    → all providers and hooks
- src/app/**/page.tsx → all pages
- src/components/will/ → critical components
- src/lib/        → utilities
- package.json    → dependencies

Map:
- Files with > 300 lines? (split candidates)
- Files doing > 3 different things? (SRP violation)
- Duplicated logic in multiple places?
- Circular dependencies between contexts?
- Dead code (functions/variables never used)?
```

### Phase 2 — Diagnosis

For each problem found, classify:

| Severity | Criterion |
|---|---|
| 🔴 Critical tech debt | Causes active bugs or blocks features |
| 🟠 Excessive complexity | Hard to maintain, bug-prone |
| 🟡 Improvement opportunity | Would be better, but works |
| 🟢 Good state | Nothing to do |

### Phase 3 — Proposal (always before executing)

```
Problem: [description]
Location: [file:line]
Current impact: [what it's causing]
Proposal: [what to do]
Estimated effort: [hours]
Change risk: [low/medium/high]
```

## SOLID applied to Will Treinos PRO
- **S** — Each context has ONE responsibility (StudentsContext = students only)
- **O** — New class types should not break existing logic
- **L** — Coach component should not depend directly on student data
- **I** — Specialized hooks (useStudents) instead of one giant hook
- **D** — Components depend on abstractions (hooks), not direct Supabase implementations

## Expected output

```
🏗️ ARCHITECTURE REVIEW — Will Treinos PRO — [date]

Files analyzed: X
Issues found: X critical, X medium, X opportunities

🔴 CRITICAL: [list]
🟠 EXCESSIVE COMPLEXITY: [list]
🟡 OPPORTUNITIES: [list]

Improvement roadmap proposal:
1. [priority 1 — effort X, risk Y]

Awaiting approval before any changes.
```
