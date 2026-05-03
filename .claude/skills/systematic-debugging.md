# Skill: Systematic Debugging — Will Treinos PRO

## When to use
Any bug reported by the user or identified during development.
NEVER guess the cause. Follow the chain of evidence.

## CSI Methodology (Crime Scene Investigation)

### Step 1 — Reproduce
```
What is the EXACT symptom?
- What the user sees vs. what they should see
- Which role (admin/coach/student)?
- Which page/component?
- With which data?
```

### Step 2 — Isolate
```
Which layer has the problem?
- UI (incorrect rendering)
- State (context with wrong data)
- Logic (wrong calculation, wrong filter)
- API (Supabase returning wrong data)
- Auth (RLS incorrectly blocking or allowing)
```

### Step 3 — Hypothesize
```
Based on evidence, what is the most likely cause?
Add console.log or breakpoint BEFORE fixing to confirm.
```

### Step 4 — Confirm
```
Did console.log confirm the hypothesis?
If YES → fix
If NO → new hypothesis (back to Step 3)
```

### Step 5 — Surgical fix
```
Change ONLY what is necessary to fix.
Do NOT refactor during a bug fix.
```

### Step 6 — Regression check
```
Could the fix have caused issues elsewhere?
Check components that share the same state/context.
```

## Known Bugs in Will Treinos PRO (do not reproduce)

| Symptom | Cause | Fix |
|---|---|---|
| Date shows 1 day before | `toISOString()` with UTC offset | Use `localDateISO()` from dateUtils.ts |
| Modal freezes scroll on iOS | Scroll lock without counter | `useBodyScrollLock` with global `lockCount` |
| Cockpit infinite loading | Empty data gate | Remove `students.length === 0 &&...` gate |
| KPIDetailModal weird morph | layoutId in drawer | Remove `layoutId` from KPIDetailModal |
| Build fails after pnpm clean | Next.js quirk | Run `pnpm run build` twice |

## Severity Classification
- 🔴 CRITICAL — data loss, unauthorized access, app inaccessible
- 🟠 HIGH — main feature broken
- 🟡 MEDIUM — degraded UX, visible incorrect data
- 🔵 LOW — cosmetic, no functional impact

## Required logging
Every fixed bug → log in `WILLPRO_MASTER_MEMORY.md` with:
symptom + root cause + fix + modified files
