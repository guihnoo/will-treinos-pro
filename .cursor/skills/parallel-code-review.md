# Skill: Parallel Code Review — Will Treinos PRO

## When to use
Before any `git push origin main` involving significant changes.
4 perspectives in parallel, 1 consolidated report.

## The 4 Reviewers

### Reviewer 1 — Security 🛡️
```
Check:
- Secret keys with inappropriate NEXT_PUBLIC_ prefix?
- RLS enabled on new tables?
- Inputs sanitized before hitting the database?
- Uploads validated (MIME + size + UUID filename)?
- Private routes protected in middleware.ts?
- wt_role cookie with HttpOnly + SameSite?
```

### Reviewer 2 — Performance ⚡
```
Check:
- Client Components when they could be Server Components?
- useMemo missing on heavy computations (XP, financial)?
- useCallback missing on functions passed as props?
- N+1 queries to Supabase?
- Unnecessary re-renders from poorly segmented context?
- Skeleton loaders present in all loading states?
```

### Reviewer 3 — Functional Correctness ✅
```
Check:
- Business logic correct (XP Engine, local dates, check-in)?
- Uses localDateISO() instead of toISOString() for dates?
- Correct specialized context (not useApp() directly)?
- All edge cases handled (empty array, null, undefined)?
- Optional chaining (?.) on external data access?
- Scroll lock with useBodyScrollLock where modals exist?
```

### Reviewer 4 — Readability & Design System 🎨
```
Check:
- Variable and function names clear?
- Comments where logic is non-obvious?
- Components follow project visual pattern?
- Touch targets ≥ 44px?
- Spring physics in animations (not linear duration)?
- Empty states with premium UI (not raw text)?
```

## Consolidated Report
```
🔍 PARALLEL CODE REVIEW — [PR/Feature] [date]

🛡️ SECURITY: [issues / "clean"]
⚡ PERFORMANCE: [issues / "clean"]
✅ CORRECTNESS: [issues / "clean"]
🎨 READABILITY: [issues / "clean"]

Deploy blockers: [list or "none"]
Recommendations: [list or "none"]

Decision: ✅ CAN PUSH / ⚠️ FIX FIRST / ❌ NO DEPLOY
```
