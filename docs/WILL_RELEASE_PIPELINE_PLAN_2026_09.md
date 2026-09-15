# WILL RELEASE PIPELINE PLAN — 09/2026

**Data:** 14/09/2026 · **Agente:** Cursor (Release Guardian — Fase 1)  
**Status:** ✅ **PLANEJAMENTO FINALIZADO** (pronto para implementação em worktree isolada)  
**Modo desta missão:** somente documentação · **Sem implementação de workflows nesta entrega**  
**Arquivo único autorizado nesta missão:** este documento  

> Fontes cruzadas (read-only):  
> `docs/WILL_PRODUCT_AUDIT_2026_09.md` · `docs/WILL_ENGINEERING_BASELINE_2026_09.md` · `docs/WILL_RUNTIME_UX_AUDIT_2026_09.md` · `.github/workflows/test.yml` · `playwright.config.ts` · `e2e/`  
>
> **Fora de escopo desta fase:** auto-migration Supabase production · alteração de código de produto · commit/push/stash/branch nesta sessão de planejamento.

---

## 0. Objetivo do fluxo

Automatizar, com segurança:

```
Claude (worktree A)  e/ou  Cursor (worktree B)
  → branch feature/* | chore/ci-* | fix/*
  → commit
  → push
  → Pull Request → main
  → CI gates (obrigatórios)
  → Vercel Preview
  → review humano (+ opcional Bugbot/security)
  → merge (somente se TODOS os required checks verdes)
  → Vercel Production (deploy Git em main)
```

**Regra de ouro:** “CI verde” deve significar **“seguro o bastante para merge”**, não apenas “TypeScript compila”.

---

## 0.1 Worktrees separados — Cursor × Claude (obrigatório no dia a dia)

O working tree principal (`will-treinos-pro` em `main`) **não** deve ser compartilhado por dois agentes editando ao mesmo tempo. Isso evita checkout/branch/stash acidental e conflitos de arquivos não commitados.

### Layout recomendado

| Agente | Worktree | Branch típica | Papel |
|---|---|---|---|
| **Claude Code** | ex.: `../will-treinos-pro-claude` | `chore/ci-fase-1a` ou tarefa de produto | Implementação / fixes |
| **Cursor** | ex.: `../will-treinos-pro-cursor` | outra branch, nunca a mesma do Claude | Plano, review, auditoria, 2º PR paralelo |
| **Humano / main limpa** | `Desktop/will-treinos-pro` | `main` (só pull/merge) | Checkout estável; evitar edits diretos |

### Regras anti-colisão

1. **Um agente = um worktree = uma branch.**  
2. Nunca `git checkout` / `git switch` / `git stash` no worktree do outro agente.  
3. Nunca dois agentes na mesma branch sem coordenação explícita.  
4. PRs de infra CI (Fase 1A) preferir **um único dono** (Claude **ou** Cursor), o outro só revisa.  
5. Docs de auditoria/planos podem viver em PR `docs/*` separado se a main estiver suja.  
6. Antes de iniciar implementação 1A: `git status` limpo **naquele** worktree.

### Comandos de referência (humano executa; agentes não improvisam)

```bash
# Exemplo — criar worktree Claude a partir de main atualizada
git fetch origin
git worktree add ../will-treinos-pro-claude -b chore/ci-fase-1a origin/main

# Exemplo — worktree Cursor para review/paralelo
git worktree add ../will-treinos-pro-cursor -b docs/release-guardian-notes origin/main
```

> Esta seção é **operacional**. A implementação dos workflows acontece só após autorização + worktree limpa.

---

## 1. Estado atual (gap analysis)

### 1.1 O que já existe

| Peça | Estado | Evidência |
|---|---|---|
| Workflow CI | `.github/workflows/test.yml` | typecheck → build → (playwright condicional) + rls-audit paralelo |
| Typecheck | ✅ em PR e push `main` | `pnpm run typecheck` |
| Build | ✅ em PR e push `main` | `pnpm run build` (precisa `needs: typecheck`) |
| Playwright no repo | 11 specs + 5 projects | `e2e/*.spec.ts`, `playwright.config.ts` |
| Playwright no CI | ⚠️ 1 spec, 1 browser, **só após push em `main`** | `if: github.event_name == 'push'` + `student-journey.spec.ts --project=chromium` |
| Target E2E atual | Produção Vercel | `PLAYWRIGHT_BASE_URL: https://will-treinos-pro.vercel.app` |
| RLS audit job | ⚠️ frágil | Postgres 15 vazio + `continue-on-error: true` + grep `FAILED` |
| Cron evening | Workflow separado | bate produção com `CRON_SECRET` |
| Vercel deploy | Integração Git → `main` | documentado no CLAUDE / audits |
| CodeQL / Dependabot / Gitleaks | ❌ ausentes | engineering baseline §11 |
| Branch protection / required checks | ❌ não versionado no repo | precisa configurar no GitHub UI/API |
| Contas de teste E2E | ❌ secrets ausentes na prática | runtime audit + `PLAYWRIGHT_TEST_CREDS` skips |

### 1.2 Por que “CI verde” ainda não é gate real

1. **E2E não roda em PR** → regressão funcional mergeia sem teste.  
2. **10/11 suites nunca rodam em CI**; a maioria ainda faz `test.skip` sem `PLAYWRIGHT_TEST_CREDS`.  
3. **E2E contra produção** após merge = feedback tarde + risco de poluir dados reais.  
4. **RLS audit falso-verde** possível (schema vazio + `continue-on-error`).  
5. **Sem SAST / secret scan / dependency scan** no PR.  
6. **Sem required status checks** documentados → merge manual pode ignorar CI.  
7. **Sem auto-merge controlado** (nem regra “só com todos verdes”).  
8. Runtime audit mostrou gaps públicos (`/privacidade`, `/termos`, signup gate) que o smoke atual **já deveria falhar** se rodasse em PR contra preview — hoje o `student-journey` só roda pós-merge.

### 1.3 Resposta direta

> Um bug pode chegar em produção com este CI verde?

**Sim.** Confirmado pelo engineering baseline (§9) e reforçado pelo runtime audit (Homes autenticadas / RLS / offline / push sem cobertura efetiva em PR).

---

## 2. Arquitetura-alvo do pipeline (Fase 1 → Fase 2)

### Camadas de gate

| Camada | Quando | Bloqueia merge? | Ambiente |
|---|---|---|---|
| **L0 — Estática** | todo PR | **Sim** | GitHub Actions |
| **L1 — Build** | todo PR | **Sim** | GitHub Actions |
| **L2 — Smoke E2E** | todo PR | **Sim** | Vercel Preview (preferencial) ou `pnpm start` no runner |
| **L3 — Auth E2E** | todo PR (quando secrets ok) | **Sim** (após secrets) | Preview **staging DB** (não prod) |
| **L4 — Segurança tooling** | todo PR | **Sim** (high+) | GitHub Actions |
| **L5 — RLS** | todo PR | **Sim** (após schema real no job) | Postgres CI + migrations |
| **L6 — Preview review** | todo PR | Humano | Vercel Preview URL |
| **L7 — Production** | merge → `main` | Deploy automático Vercel | Produção |
| **L8 — Smoke pós-deploy** | após deploy `main` | Alerta (não rollback auto na F1) | Produção `/api/health` |

**Explícito:** **não** ligar auto-migration Supabase production nesta fase.

---

## 3. Proposta exata — PR checks obrigatórios

### 3.1 Nomes sugeridos dos required checks (branch protection `main`)

Configurar em **GitHub → Settings → Branches → Branch protection rule → Require status checks**:

| Check name (job) | Required na Fase 1A | Required na Fase 1B |
|---|---|---|
| `TypeScript` | ✅ | ✅ |
| `Build` | ✅ | ✅ |
| `E2E Smoke (chromium)` | ✅ | ✅ |
| `E2E Smoke (Mobile Chrome)` | ⬜ opcional 1A | ✅ 1B |
| `Gitleaks` | ✅ | ✅ |
| `Dependency Audit` | ✅ (`high`+) | ✅ |
| `CodeQL` | ⬜ warn 1A | ✅ 1B |
| `RLS Audit` | ⬜ warn 1A | ✅ 1B (após schema) |
| `E2E Auth (chromium)` | ⬜ skip sem secrets | ✅ quando secrets + staging |
| `Vercel` / `Vercel Preview Comments` | ✅ (deployment success) | ✅ |

Também exigir:
- **Require a pull request before merging**
- **Require approvals: 1** (dono/Will ou reviewer designado)
- **Dismiss stale reviews** quando novos commits
- **Do not allow bypassing** (exceto emergency break-glass documentado)
- **Block force pushes** e **Block deletions** em `main`
- **Require conversation resolution**
- **Restrict who can push to main** → ninguém (só via PR)

### 3.2 Regras de merge

| Modo | Quando usar |
|---|---|
| Merge commit ou Squash | Preferir **Squash** para histórico limpo |
| Auto-merge | Somente **squash + required checks verdes + 1 approval** |
| Hotfix | Branch `hotfix/*` → PR curto → mesmos gates (sem bypass silencioso) |

---

## 4. Typecheck

### Estado
Já correto como job isolado e pré-requisito do build.

### Proposta
Manter:

```yaml
# job: typecheck
- pnpm install --frozen-lockfile
- pnpm run typecheck
```

### Refinos
- Node **20.x** (já usado) — travar no `engines` do `package.json` numa implementação futura.
- Falha de typecheck = **merge bloqueado** (required).
- Não misturar typecheck com build no mesmo job (paralelismo/cache melhores).

---

## 5. Build

### Estado
`needs: typecheck` + secrets `NEXT_PUBLIC_*` — adequado.

### Proposta
- Manter build em PR.
- Adicionar upload de artefato opcional `.next` **não** necessário se E2E sobe preview Vercel.
- Se E2E for no runner (sem preview): após build, `pnpm start` + Playwright local.

### Gate
Build vermelho = **merge bloqueado**.

### Atenção
Não apontar `NEXT_PUBLIC_APP_URL` do **PR** para produção se E2E autenticado for escrever dados. Em PR:

```text
NEXT_PUBLIC_APP_URL = <vercel-preview-url>
```

Produção só no job pós-merge / env Vercel Production.

---

## 6. Playwright — estratégia geral

### 6.1 Problema atual
- Só `student-journey.spec.ts` · só `chromium` · só `push` em `main` · URL = **produção**.

### 6.2 Split obrigatório de suites

Criar (na implementação futura) tags/pastas lógicas — **proposta de naming**, sem editar agora:

| Suite | Specs | Auth? | Todo PR? | Browser PR |
|---|---|---|---|---|
| **Smoke público** | `auth.spec.ts` (partes), `student-journey.spec.ts`, trechos públicos de `full-audit` / PWA manifest | Não | **Sim** | chromium + Mobile Chrome |
| **Auth crítico** | `admin-approval-flow`, `rls-isolation`, `offline-sync`, `gamification-*`, `training-plans`, partes auth de `full-audit` | Sim | **Sim (Fase 1B)** | chromium (Mobile Chrome nightly) |
| **Push** | `push-notifications.spec.ts` | Parcial | Nightly / manual device | chromium only no CI |
| **Full audit** | `full-audit.spec.ts` | Híbrido | Nightly ou `workflow_dispatch` | chromium |

### 6.3 Quais E2E devem rodar em **todo PR** (Fase 1A — sem secrets auth)

**Obrigatório em todo PR (chromium):**

1. `e2e/student-journey.spec.ts` — smoke jornada / páginas públicas / redirects  
2. `e2e/auth.spec.ts` — login UI, redirect protegido, erro credencial inválida  
3. Subconjunto **público** de PWA (extrair ou filtrar):
   - `manifest.json` válido  
   - `/offline.html` carrega  
   - ícones 192/512  
   - (opcional) SW registra em `/login` após wait  

**Obrigatório em todo PR (Mobile Chrome) — Fase 1B ou paralelo se minutos permitirem:**

- Mesmos smokes públicos (viewport Pixel 5)

**Ainda NÃO obrigatório em todo PR (até staging + credenciais):**

| Spec | Motivo |
|---|---|
| `admin-approval-flow.spec.ts` | `PLAYWRIGHT_TEST_CREDS` skip |
| `rls-isolation.spec.ts` | credenciais + 2 alunos |
| `offline-sync.spec.ts` | auth + data-testid sync |
| `gamification-ui.spec.ts` | skip sem creds |
| `gamification-training-flow.spec.ts` | skip |
| `xp-gamification-phase8.spec.ts` | skip |
| `training-plans-phase7.spec.ts` | skip |
| `push-notifications.spec.ts` | parcial + iOS real não cobrível |
| `full-audit.spec.ts` | longo; mistura admin real; email hardcoded de fallback |

### 6.4 Fase 1B — E2E autenticados em todo PR

Quando existirem:
- Secrets `PLAYWRIGHT_TEST_CREDS=1`
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASS`
- `TEST_COACH_EMAIL` / `TEST_COACH_PASS`
- `TEST_STUDENT_A_EMAIL` / `TEST_STUDENT_A_PASS`
- `TEST_STUDENT_B_EMAIL` / `TEST_STUDENT_B_PASS`
- Projeto Supabase **staging** (não production) ligado ao Preview

Então tornar required:

1. `admin-approval-flow.spec.ts`  
2. `rls-isolation.spec.ts`  
3. `offline-sync.spec.ts`  
4. Um smoke autenticado aluno (`student` dashboard carrega)  
5. Um smoke autenticado coach (`/will/court` ou dashboard coach)

### 6.5 Chromium / Mobile strategy

| Projeto Playwright | Todo PR | Nightly | Manual |
|---|---|---|---|
| `chromium` | ✅ smoke (+ auth 1B) | ✅ full | — |
| `Mobile Chrome` | ✅ smoke (1B) / ⬜ 1A se custo | ✅ | — |
| `firefox` | ⬜ | ✅ smoke | — |
| `webkit` | ⬜ | ✅ smoke UI | — |
| `Mobile Safari` (Playwright) | ⬜ | smoke UI only | **não** substitui iPhone PWA real |

**iPhone PWA real (push/offline/install):** checklist manual pré-release (engineering baseline) — **não** virar required check falso.

### 6.6 Onde rodar E2E de PR

**Ordem preferida:**

1. **Vercel Preview URL** do PR (melhor fidelidade com deploy real)  
2. Fallback: `pnpm build && pnpm start` no runner GitHub  

**Nunca (PR):** apontar writes autenticados para `https://will-treinos-pro.vercel.app` (produção).

Produção só para:
- smoke **read-only** pós-deploy (`/api/health`, `/login` GET)
- cron evening (já existente)

### 6.7 Integração Preview ↔ Playwright (padrão recomendado)

```text
PR aberto
  → Vercel cria Preview
  → GitHub Action espera deployment_status == success
  → PLAYWRIGHT_BASE_URL=${{ vercel_preview_url }}
  → playwright smoke
```

Implementação típica (fase de código futura):
- `wait-for-vercel` / `vercel-preview-url` action, **ou**
- job `on: deployment_status` separado, **ou**
- secret `VERCEL_TOKEN` + API para resolver alias do PR.

Até isso existir: fallback runner local com `webServer` desligado e `pnpm start` após build do próprio CI.

---

## 7. Estratégia para testes autenticados

### 7.1 Princípios
- Contas **dedicadas** (`@will.local` / domínio de teste), nunca contas humanas reais no CI.  
- Projeto Supabase **staging** espelhado (schema via migrations manuais ou CLI — **sem auto-migrate prod**).  
- Seed idempotente (script SQL ou API admin) rodando no início do job auth.  
- Specs devem falhar alto se secrets faltarem **quando o job for required** (não `skip` silencioso em 1B).  
- Em 1A, jobs auth podem `skip` com mensagem clara **ou** existir só como `workflow_dispatch`.

### 7.2 Matriz de identidades

| Role | Uso nos testes |
|---|---|
| Admin | aprovação aluno, alunos, financeiro read, cockpit smoke |
| Coach | court, presença, avaliação smoke |
| Aluno A | home, treinos, feed, financeiro próprio |
| Aluno B | isolamento RLS vs A |
| Observador (opcional) | gates de cadastro |

### 7.3 Segredos GitHub Actions (lista)

```
NEXT_PUBLIC_SUPABASE_URL          # staging no PR; prod só jobs prod
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
NEXT_PUBLIC_DEV_ROOT_EMAILS       # se ainda necessário ao build
PLAYWRIGHT_TEST_CREDS=1
TEST_ADMIN_EMAIL / TEST_ADMIN_PASS
TEST_COACH_EMAIL / TEST_COACH_PASS
TEST_STUDENT_A_EMAIL / TEST_STUDENT_A_PASS
TEST_STUDENT_B_EMAIL / TEST_STUDENT_B_PASS
VERCEL_TOKEN                      # opcional, resolver preview URL
CRON_SECRET                       # já usado (não no PR)
```

**Proibido no CI de PR:** `SUPABASE_SERVICE_ROLE_KEY` em jobs de browser, salvo job isolado de seed com permissões mínimas e sem logar o valor.

### 7.4 Dados
- Preferir **staging** com reset periódico.  
- Se inevitável usar prod: apenas testes **read-only** (proibido na F1 para auth flows).

---

## 8. Vercel Preview

### 8.1 Estado esperado
Integração GitHub ↔ Vercel já usada para production em `main`. Preview por PR deve estar habilitado no projeto Vercel.

### 8.2 Checklist de configuração (manual, UI Vercel)

1. Project → Settings → Git → **Preview Deployments: On** para PRs.  
2. Env vars Preview = **staging Supabase** (não production), quando auth E2E entrar.  
3. Env vars Production = production.  
4. Protection: Preview público ou Password Protection (se password, Playwright precisa do bypass cookie/header).  
5. Comentário automático da Preview URL no PR (Vercel GitHub App).  
6. Required check: deployment Preview **Ready**.

### 8.3 Gate de review
- Humano abre Preview no mobile 393×852.  
- Checklist mínimo (ligado aos audits):
  - Login carrega  
  - `/privacidade` e `/termos` acessíveis (quando bug AuthWrapper for corrigido — até lá o smoke deve **falhar** e bloquear)  
  - Sem console error crítico no login  
  - SW não quebra first load (observação)

### 8.4 Produção
- Só via merge em `main`.  
- Sem deploy CLI ad-hoc no fluxo normal (alinhado às regras do repo).

---

## 9. CodeQL

### Proposta
Adicionar workflow `.github/workflows/codeql.yml` (implementação futura):

- `on: pull_request` + `push: main` + `schedule` semanal  
- Languages: `javascript-typescript`  
- Queries: `security-extended` (ou default + security)  
- Upload SARIF para Security tab  

### Gate
- **Fase 1A:** job roda; severidade `error` não bloqueia ainda (report).  
- **Fase 1B:** required check; falha em findings **High/Critical** novos no PR.

### Nota
CodeQL não substitui correção dos P0 de produto (`lesson_ratings` GET frouxo, QR check-in anônimo) — esses precisam de fix + teste de regressão API.

---

## 10. Dependency scanning

### Opções (escolher na implementação)

| Opção | Pros | Cons |
|---|---|---|
| **A)** `pnpm audit --audit-level=high` no CI | Simples, sem app extra | Advisory DB npm; pode ter ruído |
| **B)** Dependabot (`dependabot.yml`) | PRs automáticos de bump | Precisa review |
| **C)** A+B | Melhor | Mais PRs |

### Proposta Will
- **Todo PR:** job `Dependency Audit` → `pnpm audit --audit-level=high` (required).  
- **Semanal:** Dependabot para `npm` + `github-actions`.  
- Allowlist só com justificativa em `docs/` (não no silêncio).

---

## 11. Gitleaks

### Proposta
- Workflow `gitleaks` em todo PR + push `main`.  
- Action oficial `gitleaks/gitleaks-action` (ou binary).  
- Config opcional `.gitleaks.toml` (allowlist de falsos positivos documentados).  
- Required check.

### Escopo
- Detectar `.env`, service role, VAPID private, tokens Vercel/GitHub commitados.

### Complemento (fase posterior)
- Pre-commit local via husky/lefthook — **não** substitui CI.

---

## 12. RLS testing

### Estado atual
`supabase/rls-audit.sql` é script ad-hoc para SQL Editor; no CI roda contra Postgres **vazio** com `continue-on-error: true` → **falso verde**.

### Proposta em 3 estágios (sem auto-migrate prod)

#### Estágio R0 (imediato, ainda F1A)
- Remover `continue-on-error` **ou** falhar se o script não aplicar schema.  
- Job marcado `continue-on-error: true` **só** se explicitamente `experimental` — **não** required.

#### Estágio R1 (F1B — required)
1. Subir Postgres no Actions.  
2. Aplicar **migrations versionadas** de `supabase/migrations/` (ordem) no Postgres do CI.  
3. Habilitar extensão necessária (`pgcrypto`, etc.).  
4. Seed mínimo de roles/users de teste.  
5. Rodar suite RLS (reescrever `rls-audit.sql` para emitir `FAILED` de forma determinística **ou** migrar para pgTAP).  
6. Job required.

#### Estágio R2 (posterior)
- pgTAP + policies por papel.  
- Job separado `e2e/rls-isolation.spec.ts` contra **staging** (app-level).

### Proibido nesta fase
- Qualquer step `supabase db push --linked` contra **production**.  
- Migration automática no merge.

Migrations em prod continuam: **revisão humana + SQL Editor / CLI manual consciente**.

---

## 13. Proteção da `main`

### Checklist GitHub (executar na Fase 1A)

1. Branch protection em `main`  
2. Required PR  
3. Required status checks (lista §3.1)  
4. 1 approval  
5. Sem force push  
6. Sem delete  
7. Sem bypass (exceto role admin break-glass)  
8. Signed commits **opcional** (não bloquear F1)  
9. Rulesets (GitHub Rulesets) preferível a legacy branch protection, se org permitir  

### Política de branch
- `feature/*`, `fix/*`, `chore/*`, `hotfix/*` → PR → `main`  
- Proibir commit direto em `main` (mesmo para o dono, no dia a dia)

---

## 14. Auto-merge somente com todos os gates verdes

### Proposta
Usar **GitHub Auto-merge** (squash) com:

```text
IF
  all required checks == success
  AND approvals >= 1
  AND no merge conflicts
  AND conversation threads resolved
THEN
  allow auto-merge
ELSE
  block
```

### Regras de uso para agentes (Claude/Cursor)
1. Abrir PR com body padronizado (Summary + Test plan).  
2. Habilitar auto-merge **só** se o PR for baixo risco (chore/ci/docs/test).  
3. Features de produto / auth / RLS / PWA: auto-merge **off** até review humano explícito.  
4. Nunca `--no-verify` / never force push main.

### Implementação técnica futura (opcional)
- Action `merge` com `if: github.event.workflow_run.conclusion == 'success'` — redundante se Auto-merge nativo estiver ok.  
- Preferir nativo GitHub.

---

## 15. Mapa alvo dos workflows (proposta de arquivos)

> Só proposta — **não criar nesta missão**.

| Arquivo | Função |
|---|---|
| `.github/workflows/ci.yml` (ou evoluir `test.yml`) | typecheck, build, e2e-smoke, e2e-auth (condicional), rls, audit, gitleaks |
| `.github/workflows/codeql.yml` | CodeQL |
| `.github/workflows/dependabot` via `.github/dependabot.yml` | bumps |
| `.github/workflows/preview-e2e.yml` | opcional: trigger em `deployment_status` |
| `.github/workflows/smoke-production.yml` | pós-push `main`: `/api/health` |
| `.github/workflows/cron-evening.yml` | manter |

### Esboço lógico do `ci.yml` (Fase 1B)

```
jobs:
  gitleaks          → required
  dependency-audit  → required
  typecheck         → required
  build             → needs typecheck → required
  e2e-smoke         → needs build → preview URL → chromium + mobile-chrome → required
  e2e-auth          → needs build → if secrets → staging → required (1B)
  rls-audit         → needs migrations applied → required (1B)
  codeql            → required (1B) / warn (1A)
```

Playwright env PR:

```yaml
PLAYWRIGHT_BASE_URL: ${{ steps.preview.outputs.url }}  # nunca prod
PLAYWRIGHT_TEST_CREDS: ${{ secrets.PLAYWRIGHT_TEST_CREDS }}
```

Remover o `if: github.event_name == 'push'` do E2E smoke.

---

## 16. Fluxo operacional dos agentes (Claude/Cursor)

### Playbook diário (por worktree)

1. Confirmar que está no **worktree correto** (§0.1) e `git status` limpo.  
2. **Branch** a partir de `origin/main` atualizado (só nesse worktree).  
3. Implementar / auditar.  
4. `pnpm run typecheck` + `pnpm run build` local.  
5. Smoke Playwright local (`auth` + `student-journey`) quando UI mudar.  
6. Commit (mensagem convencional).  
7. Push + `gh pr create`.  
8. Esperar Preview + CI.  
9. Colar Preview URL no PR; checklist mobile.  
10. Pedir review.  
11. Auto-merge **somente** se política §14 permitir.  
12. Após merge: confirmar deploy Vercel Production + smoke `/api/health`.  
13. Registrar no `WILLPRO_MASTER_MEMORY.md` (quando houver mudança de produto).

### O que o agente NÃO faz no fluxo seguro
- Push direto em `main`  
- Deploy Vercel CLI “para adiantar”  
- Migration automática em prod  
- Usar conta real de aluno/admin nos testes  
- Bypass de checks  
- `checkout` / `stash` / troca de branch no worktree compartilhado sujo  
- Dois agentes na mesma branch sem acordo explícito

---

## 17. Ordem segura de implementação (Release Guardian)

### Fase 1A — “Gate mínimo real” (1 PR de infra, worktree isolada)

**Dono sugerido:** um único agente (preferência: Claude **ou** Cursor — não os dois).  
**Branch sugerida:** `chore/ci-fase-1a`  
**Escopo fechado do PR 1A (ticket-ready):**

| # | Entrega | Arquivos típicos | Bloqueia merge? |
|---|---|---|---|
| 1 | Evoluir `.github/workflows/test.yml` (ou `ci.yml`) | workflows | — |
| 2 | E2E smoke em **pull_request** | `student-journey` + `auth`, `--project=chromium` | sim (após branch protection) |
| 3 | Remover `if: github.event_name == 'push'` do smoke | workflows | — |
| 4 | `PLAYWRIGHT_BASE_URL` no PR = preview **ou** `http://127.0.0.1:3000` após `pnpm start` | **nunca** prod no job de PR | — |
| 5 | Job Gitleaks | workflow novo ou step | sim |
| 6 | Job `pnpm audit --audit-level=high` | workflow | sim |
| 7 | Smoke pós-`main`: GET `/api/health` | workflow | alerta |
| 8 | Documentar secrets faltantes no PR body | texto | — |
| 9 | Humano: branch protection required checks | GitHub UI | sim |

**Fora do PR 1A:** staging Supabase, contas auth, CodeQL required, RLS schema real, Mobile Chrome required, auto-merge feature, qualquer `.tsx` de produto.

**Critério de sucesso 1A:** nenhum PR mergeia sem typecheck+build+smoke; E2E deixa de ser “depois do acidente”.

### Fase 1B — “Gate de produto”

1. Criar projeto Supabase staging + env Preview.  
2. Provisionar 4 contas de teste + secrets.  
3. Tornar required: auth E2E críticos + Mobile Chrome smoke.  
4. Reescrever job RLS com migrations aplicadas; required.  
5. CodeQL required para High+.  
6. Dependabot semanal.  
7. Auto-merge habilitado com regras §14.

**Critério de sucesso 1B:** regressão de login/redirect/RLS básico/offline sync não chega em `main` sem falha de CI.

### Fase 1C — “Endurecimento” (ainda sem auto-migrate prod)

1. Nightly full Playwright (firefox/webkit + full-audit).  
2. Checklist manual iPhone PWA pré-release.  
3. Alertas Sentry/PostHog ligados a falha de smoke.  
4. (Opcional) Rulesets + environments `preview`/`production` com reviewers.

### Explicitamente depois (não agora)
- Auto-migration production  
- Serwist migration  
- Decomposição WillCockpit (produto)  
- DAST (ZAP) contínuo  

---

## 18. Matriz “required vs optional” — resumo executivo

| Gate | 1A | 1B |
|---|---|---|
| Typecheck | Required | Required |
| Build | Required | Required |
| E2E smoke chromium | Required | Required |
| E2E smoke Mobile Chrome | Optional | Required |
| E2E auth | Off / manual | Required |
| Gitleaks | Required | Required |
| pnpm audit high | Required | Required |
| CodeQL | Report | Required (high+) |
| RLS CI real | Report | Required |
| Vercel Preview ready | Required | Required |
| Approval humano | Required | Required |
| Auto-merge | Só docs/ci | docs/ci/test; feature off default |
| Prod smoke health | Alert | Alert |
| Supabase auto-migrate prod | **Proibido** | **Proibido** |

---

## 19. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Minutos Actions explodem | Smoke enxuto no PR; full no nightly; 1 worker Playwright |
| Preview atrasado / flaky | Retry 2; wait deployment; fallback `pnpm start` |
| Secrets ausentes → skip esconde buraco | Em 1B, job auth falha se secret missing |
| E2E em prod polui dados | Banir writes autenticados em prod URL |
| Falso verde RLS | Schema real + sem `continue-on-error` |
| Bypass humano | Branch protection sem bypass |
| Agente mergeia feature cedo | Política auto-merge só low-risk |
| Dois agentes no mesmo working tree | Worktrees separados (§0.1); um dono por branch |

---

## 20. Definition of Done

### 20.A — Planejamento Fase 1 (ESTE documento) — ✅ CONCLUÍDO

1. Gap do CI atual documentado.  
2. Required checks 1A/1B definidos.  
3. Suite E2E “todo PR” vs “depois” definida.  
4. Estratégia chromium/mobile definida.  
5. Estratégia auth + secrets definida.  
6. Preview Vercel, CodeQL, audit, Gitleaks, RLS, proteção `main`, auto-merge definidos.  
7. Auto-migration prod explicitamente **proibida**.  
8. Worktrees Cursor/Claude e handoff 1A documentados.

### 20.B — Implementação Fase 1A — 🔄 EM PR (`chore/ci-fase-1a`, docs/WILL_CI_FASE_1A.md)

1. `main` protegida com required checks reais. → ⚠️ **humano** (GitHub UI após jobs estabilizarem)  
2. Todo PR roda typecheck + build + smoke E2E **antes** do merge. → ✅ workflows  
3. Smoke E2E **não** usa produção como base URL de writes. → ✅ `127.0.0.1:3000`  
4. Gitleaks + dependency audit bloqueiam PR. → ✅ jobs no `ci.yml`  
5. Smoke `/api/health` pós-deploy `main`. → ✅ `smoke-production.yml`

### 20.C — Implementação Fase 1B — ⏳ PENDENTE

1. Staging + contas de teste.  
2. Auth E2E + RLS real required.  
3. CodeQL high+ required.  
4. Auto-merge com política §14.

---

## 21. Handoff — prompt pronto para o próximo agente (implementar 1A)

Usar **somente** após:
- worktree limpa criada (§0.1), e  
- humano autorizar explicitamente “implementar Fase 1A”.

```text
MISSÃO: WILL RELEASE GUARDIAN — FASE 1A (IMPLEMENTAÇÃO)

Leia docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md (§17 Fase 1A, §0.1, §3, §6).

Escopo FECHADO:
- Evoluir CI para smoke E2E em pull_request (auth + student-journey, chromium)
- PLAYWRIGHT_BASE_URL no PR ≠ produção (preview ou pnpm start)
- Adicionar Gitleaks + pnpm audit --audit-level=high
- Smoke pós-main /api/health
- NÃO tocar produto (.tsx de app), NÃO auto-migrate Supabase prod
- NÃO implementar 1B (auth secrets/staging) neste PR

Ao terminar: pnpm typecheck/build se tocado package; abrir PR chore/ci-fase-1a;
listar checks que o humano deve marcar required no GitHub.
```

---

## 22. Próxima ação recomendada (humano)

1. ✅ Plano validado (este arquivo).  
2. Criar worktrees separados Cursor / Claude (§0.1).  
3. Manter `main`/worktree principal sem edits concorrentes.  
4. Autorizar **um** agente: “implementar Fase 1A” no worktree limpo.  
5. No GitHub UI: ligar branch protection conforme §3.1 (após o PR 1A existir e os job names estabilizarem).  
6. Provisionar staging + secrets só quando for liberar 1B.

---

## 23. Carimbo de fechamento — Release Guardian Fase 1 (planejamento)

| Item | Estado |
|---|---|
| Documento `WILL_RELEASE_PIPELINE_PLAN_2026_09.md` | ✅ Finalizado |
| Implementação workflows | ✅ Fase 1A em PR (`ci.yml` + smoke + auth manual) |
| Commit / push / branch nesta missão | Ver PR `chore/ci-fase-1a` |
| Arquivos de produto alterados | ❌ Nenhum (só CI/QA/docs) |
| Auto-migration production | ❌ Proibida |

**Planejamento concluído.** Implementação 1A: ver `docs/WILL_CI_FASE_1A.md`.
