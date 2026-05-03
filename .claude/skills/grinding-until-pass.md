# Skill: Grinding Until Pass — Will Treinos PRO

## When to use
When a build or TypeScript check is failing and needs to be resolved without manual intervention.

## Protocol

1. Run the check:
```bash
pnpm exec tsc --noEmit
# or
pnpm run build
```

2. Capture the exact error (file, line, message)

3. Fix the minimum necessary (do NOT refactor without permission)

4. Run again

5. Repeat until clean output (exit 0, zero TypeScript errors)

6. Only stop when:
   - `pnpm exec tsc --noEmit` → empty output
   - `pnpm run build` → `✓ Compiled successfully`

## Will Treinos PRO specific rules

- Error `Cannot find module '@/context/AppContext'` for a type → move import to `@/context/types`
- Error `Property X does not exist on AppContextType` → check if migrated to specialized context
- Build fails on 1st try after `pnpm clean` → run a second time (known quirk)
- NEVER use `as any` to silence error — solve the real typing
- After resolving, log in WILLPRO_MASTER_MEMORY.md

## Stop criteria
Zero errors. No exceptions.
