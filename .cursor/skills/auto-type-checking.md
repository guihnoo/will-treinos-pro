# Skill: Auto Type Checking — Will Treinos PRO

## When to use
Automatically after any `.ts` or `.tsx` file edit.
Can be triggered via Cursor hook or manually.

## Command
```bash
pnpm exec tsc --noEmit
```

## Error pattern interpretation

| Error pattern | Likely cause in project | Action |
|---|---|---|
| `Property 'X' does not exist on type 'AppContextType'` | Property migrated to specialized context | Switch `useApp()` to correct context |
| `Cannot find module '@/context/X'` | Context not created or wrong path | Check `src/context/` |
| `Type 'string' is not assignable to type 'Role'` | Role type without correct cast | Use `as Role` or fix type at source |
| `Object is possibly 'null'` | Access without optional chaining | Add `?.` |
| `Argument of type 'X' is not assignable to 'Y'` | Outdated interface | Update the type or the caller |

## Golden rules
- NEVER silence with `// @ts-ignore` — solve the real type
- NEVER use `as any` — it's a typological defeat
- If a type is too complex → create dedicated interface in `src/types/`
- After zero errors → proceed to build

## Hook integration
In `.cursor/hooks.json`, configure the hook to run after edits:
```json
{
  "hooks": [{
    "event": "onFileEdit",
    "pattern": "src/**/*.{ts,tsx}",
    "command": "pnpm exec tsc --noEmit"
  }]
}
```
