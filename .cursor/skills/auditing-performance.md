# Skill: Auditing Performance — Will Treinos PRO

## When to use
- When adding new feature that queries Supabase
- When creating component with complex state
- When app feels slow or freezes
- Before major releases

## 1. Bundle Size

```bash
# Analyze the bundle
pnpm run build
# Check output: First Load JS per route
# Target: no route with > 200KB First Load JS
```

Flags:
- Route > 300KB → investigate lazy loading
- Large lib fully imported when only one function is used
- Component imported at top when it could be a `dynamic()` import

## 2. React Rendering

```
Check in each context-consuming component:
□ Uses specialized context (useStudents, usePayments) not useApp()?
□ Derived computations have useMemo?
□ Callbacks passed as props have useCallback?
□ Lists have stable key (not array index)?
□ Images have defined width/height (avoids layout shift)?
```

## 3. Supabase Queries

N+1 patterns to eliminate:
```typescript
// ❌ N+1 — fetches student, then payments for each
const students = await supabase.from('students').select('*')
for (const s of students) {
  const payments = await supabase.from('payments').select('*').eq('student_id', s.id)
}

// ✅ JOIN — single query
const students = await supabase.from('students').select('*, payments(*)')
```

Check:
```
□ Queries with .select('*') when only 3 fields are needed?
□ Same query being made in multiple components?
□ No index on columns used in .eq() and .filter()?
```

## 4. Core Web Vitals (PWA)

| Metric | Target | How to measure |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | DevTools > Performance |
| FID / INP (Interaction) | < 200ms | DevTools > Performance |
| CLS (Layout Shift) | < 0.1 | DevTools > Performance |

Common flags in Will Treinos PRO:
- Logo without fixed dimensions → CLS
- Skeleton without defined height → CLS on load
- useEffect fetching without Suspense → high LCP

## 5. PWA Offline

```
□ Service Worker registered?
□ Static assets cached?
□ API requests with offline fallback?
□ App works without network (at least in read mode)?
```

## Performance Report
```
⚡ PERFORMANCE AUDIT — [date]

Bundle: [size per route / "ok"]
React: [excessive re-renders / "ok"]
Queries: [N+1 found / "ok"]
Core Web Vitals: LCP: Xs | INP: Xms | CLS: X
PWA Offline: [works / "partial" / "doesn't work"]

Recommended actions: [prioritized list]
```
