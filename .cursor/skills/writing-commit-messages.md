# Skill: Writing Commit Messages — Will Treinos PRO

## When to use
Before every `git commit`. Commit messages are permanent documentation.

## Conventional Commits format

```
<type>(<scope>): <short description in English>
```

## Types

| Type | When |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Improvement without behavior change |
| `perf` | Performance improvement |
| `style` | Visual/animation change |
| `chore` | Deps, configs |
| `security` | Security fix |

## Will Treinos PRO scopes

```
auth · cockpit · students · payments · checkin
gamification · coach · feed · pwa · rls · ui · perf
```

## Good examples

```bash
feat(gamification): add animated XP counter on student home screen
fix(checkin): prevent duplicate check-in when clicking fast
style(cockpit): add gold glow pulse to overdue payment cards
perf(students): replace N+1 queries with Supabase join
security(rls): add RLS policies to lesson_ratings table
```

## Deploy command
```bash
git add -A && git commit -m "feat(scope): description" && git push origin main
```
