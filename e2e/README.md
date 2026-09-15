# Testes E2E — Will Treinos PRO

Testes end-to-end com Playwright. Conteúdo e documentação em **pt-BR**.

## Setup

```bash
pnpm install
pnpm exec playwright install
```

## Execução local

```bash
# Todos os testes
pnpm exec playwright test

# Smoke público (mesmo conjunto do CI Fase 1A)
pnpm exec playwright test e2e/student-journey.spec.ts e2e/auth.spec.ts --project=chromium

# UI mode / headed / debug
pnpm exec playwright test --ui
pnpm exec playwright test --headed
pnpm exec playwright test --debug
```

Base URL padrão: `http://localhost:3000` (sobe `pnpm dev` via `webServer` se `PLAYWRIGHT_BASE_URL` não estiver definido).

## Suites

| Arquivo | Auth? | No CI PR (1A)? |
|---|---|---|
| `student-journey.spec.ts` | Não | ✅ Sim |
| `auth.spec.ts` | Não (UI / redirect / erro) | ✅ Sim |
| `admin-approval-flow.spec.ts` | Sim (`PLAYWRIGHT_TEST_CREDS`) | ❌ Manual / 1B |
| `rls-isolation.spec.ts` | Sim | ❌ Manual / 1B |
| `offline-sync.spec.ts` | Sim | ❌ Manual / 1B |
| `gamification-*.spec.ts` / `xp-*` / `training-plans-*` | Sim | ❌ |
| `push-notifications.spec.ts` | Parcial | ❌ |
| `full-audit.spec.ts` | Híbrido | ❌ Nightly futuro |

Specs autenticados usam `test.skip` sem `PLAYWRIGHT_TEST_CREDS` — isso **não** é falso-verde no job de smoke (essas suites simplesmente não são invocadas no PR).

## CI (Fase 1A)

Ver `docs/WILL_CI_FASE_1A.md` e `.github/workflows/ci.yml`.

- Smoke em todo PR contra `http://127.0.0.1:3000` (build + `next start`)
- **Proibido** apontar E2E autenticado para produção
- Auth E2E: `.github/workflows/e2e-auth-manual.yml` (`workflow_dispatch`)

## Credenciais (Fase 1B)

Contas dedicadas de teste + projeto Supabase **staging**. Nunca contas humanas reais no CI.

## Próximos passos

1. Branch protection com required checks da 1A  
2. Staging + secrets para promover auth E2E  
3. Mobile Chrome smoke na 1B  
