# WILL CI — FASE 1A (Gates de Pull Request)

**Data:** 14/09/2026  
**Branch:** `chore/ci-fase-1a`  
**Plano:** `docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md` (§17)

## Objetivo

Criar gates reais antes de qualquer código chegar em `main`: typecheck, build, smoke E2E público, Gitleaks e auditoria de dependências. Eliminar o falso-verde do CI antigo (E2E só pós-merge em produção).

## Checks adicionados / renomeados

| Nome do check (job) | Workflow | Required na 1A? | Observação |
|---|---|---|---|
| `TypeScript` | `ci.yml` | ✅ Sim | `pnpm run typecheck` |
| `Build` | `ci.yml` | ✅ Sim | `pnpm run build` |
| `E2E Smoke (chromium)` | `ci.yml` | ✅ Sim | `student-journey` + `auth` em `127.0.0.1:3000` |
| `Gitleaks` | `ci.yml` | ✅ Sim | **Range** PR/push apenas (Sprint 0D-A) — ver `docs/WILL_GITLEAKS_SPRINT_0D.md` |
| `Gitleaks Full History (legado)` | `gitleaks-full-history.yml` | ❌ Manual | Full-history; não required |
| `Dependency Audit` | `ci.yml` | ✅ Sim | `pnpm audit --audit-level=high` |
| `RLS Audit (experimental)` | `ci.yml` | ❌ Não | Postgres sem migrations; `continue-on-error` |
| `Production Health` | `smoke-production.yml` | Alerta | GET `/api/health` após push em `main` |
| `E2E Auth (chromium)` | `e2e-auth-manual.yml` | ❌ Manual | Só `workflow_dispatch` — Fase 1B |

Workflow antigo `.github/workflows/test.yml` foi **substituído** por `ci.yml` (sem E2E condicionado a `push` em produção).

## Estratégia E2E

### Todo Pull Request (obrigatório)

- `e2e/student-journey.spec.ts`
- `e2e/auth.spec.ts`
- Projeto Playwright: `chromium`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` após `pnpm build` + `next start`
- **Nunca** `https://will-treinos-pro.vercel.app` neste job

### Não rodam no PR (dependem de credenciais / são destrutivos ou longos)

| Spec | Motivo |
|---|---|
| `admin-approval-flow.spec.ts` | `PLAYWRIGHT_TEST_CREDS` |
| `rls-isolation.spec.ts` | credenciais + 2 alunos |
| `offline-sync.spec.ts` | auth |
| `gamification-*.spec.ts` / `xp-gamification-phase8` / `training-plans-phase7` | skip sem creds |
| `push-notifications.spec.ts` | parcial / device |
| `full-audit.spec.ts` | longo + auth |

Estrutura preparada: `.github/workflows/e2e-auth-manual.yml` (falha explícita se secrets ausentes; bloqueia URL de produção).

## Secrets — estado na Fase 1A

### Já usados no CI (build)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `NEXT_PUBLIC_DEV_ROOT_EMAILS` (opcional no build)

### Ausentes / Fase 1B (staging — nunca produção para writes)

```
PLAYWRIGHT_TEST_CREDS=1
TEST_ADMIN_EMAIL / TEST_ADMIN_PASS
TEST_COACH_EMAIL / TEST_COACH_PASS
TEST_STUDENT_A_EMAIL / TEST_STUDENT_A_PASS
TEST_STUDENT_B_EMAIL / TEST_STUDENT_B_PASS
VERCEL_TOKEN (opcional — resolver Preview URL)
```

**Proibido no browser CI de PR:** `SUPABASE_SERVICE_ROLE_KEY`.

## Dependency Audit — atenção (baseline atual)

Em 14/09/2026 o `pnpm audit --audit-level=high` **já falha** no lockfile atual (dezenas de high + critical transitivos, ex.: `sharp` via Next, `fast-uri` via next-pwa).

Isso é **intencional** (não falso-verde). Ordem recomendada:

1. Merge deste PR CI com branch protection em TypeScript + Build + E2E Smoke + Gitleaks  
2. PR separado remediando deps (ou overrides documentados)  
3. Só então marcar `Dependency Audit` como required  

Enquanto o audit estiver vermelho, **não ignore o job** — trate como dívida explícita.

## Branch protection (humano — GitHub UI)

Após este PR existir e os jobs rodarem pelo menos uma vez:

1. Settings → Branches → Rule / Ruleset em `main`
2. Require pull request before merging
3. Require status checks:
   - `TypeScript`
   - `Build`
   - `E2E Smoke (chromium)`
   - `Gitleaks`
   - `Dependency Audit`
4. Require 1 approval · dismiss stale reviews
5. Block force pushes · block deletions
6. **Não** marcar `RLS Audit (experimental)` como required
7. **Não** marcar E2E Auth manual como required até 1B

## Estrutura preparada para próximas camadas

- `dependabot.yml` — bumps semanais npm + github-actions
- `e2e-auth-manual.yml` — promoção para required na 1B com staging
- `smoke-production.yml` — alerta pós-deploy
- `.gitleaks.toml` — allowlist vazia (sem bypass)

## Fora de escopo (explícito)

- Código de produto (`.tsx` app), UI, PWA, Supabase migrations
- CodeQL required (1B)
- Auto-migration production (**proibido**)
- Mobile Chrome required (1B)
- Merge deste PR nesta missão
