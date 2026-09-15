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

| Arquivo | Auth? | Secrets server-side? | No CI PR (1A)? |
|---|---|---|---|
| `student-journey.spec.ts` | Não | Não | ✅ Sim |
| `auth.spec.ts` | Não (UI / redirect / erro) | Não | ✅ Sim |
| `server-integration.spec.ts` | Não | **Sim** (`SUPABASE_SERVICE_ROLE_KEY`) | ❌ Não roda em nenhum workflow hoje — Fase 1B / staging |
| `lesson-ratings-security.spec.ts` | Não (401/403) | Não | ❌ Manual (validação local) |
| `admin-approval-flow.spec.ts` | Sim (`PLAYWRIGHT_TEST_CREDS`) | Não | ❌ Manual / 1B |
| `rls-isolation.spec.ts` | Sim | Não | ❌ Manual / 1B |
| `offline-sync.spec.ts` | Sim | Não | ❌ Manual / 1B |
| `gamification-*.spec.ts` / `xp-*` / `training-plans-*` | Sim | Não | ❌ |
| `push-notifications.spec.ts` | Parcial | Não | ❌ |
| `full-audit.spec.ts` | Híbrido | Não | ❌ Nightly futuro |

Specs autenticados usam `test.skip` sem `PLAYWRIGHT_TEST_CREDS` — isso **não** é falso-verde no job de smoke (essas suites simplesmente não são invocadas no PR).

### Por que `server-integration.spec.ts` é separado

O job **E2E Smoke** do PR sobe a aplicação com `next start` **sem** `SUPABASE_SERVICE_ROLE_KEY` — de propósito, para não expor a service role em um workflow público que roda em qualquer Pull Request. Rotas que instanciam o client do Supabase com a service role no servidor (ex.: `src/app/api/leaderboard/route.ts`) por isso retornam 500 nesse ambiente — não é uma regressão do código, é um descompasso entre o escopo do teste e o ambiente do job.

Esses testes ficam em `server-integration.spec.ts`, fora do smoke público, e não são referenciados em nenhum workflow de CI hoje. Rodar essa suíte fica para a Fase 1B / staging, contra um ambiente controlado com as credenciais server-side apropriadas — **nunca** adicionando `SUPABASE_SERVICE_ROLE_KEY` ao workflow de PR público só para fazer o teste passar ali.

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
