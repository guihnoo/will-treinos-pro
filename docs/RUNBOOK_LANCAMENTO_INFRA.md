# RUNBOOK DE LANÇAMENTO — INFRA · Will Treinos PRO

> **Gerado em:** 03/06/2026 · **Responsável técnico:** Will (guihnoo)
> **Deploy atual:** `will-treinos-pro.vercel.app` · **Supabase:** `armrortldtqxmgvvcbko`
> **Branch main** → Vercel (Git-connected, webhook ativo)

---

## EXECUÇÃO DOS 3 PASSOS (03/06/2026 — Cursor)

| Passo | Ação | Resultado |
|-------|------|-----------|
| **1 — DNS** | `vercel domains add willtreinospro.com.br` + `www` | ✅ Domínios ligados ao projeto; **registrador ainda pendente** — `nslookup` retorna NXDOMAIN; configurar **A `@` → 76.76.21.21** e **CNAME `www` → cname.vercel-dns.com** (ou nameservers Vercel) no Registro.br |
| **2 — Supabase Auth** | Redirect URLs no painel | ⚠️ **Manual no Dashboard** — MCP não expõe Auth URL config; copiar lista da seção 2.3 abaixo |
| **3 — staff_access + Env** | SQL remoto + `vercel env ls` | ✅ `staff_access`: 2 linhas ativas (`guihmonteiro.2014@gmail.com` admin, `cityvoleicampeonatos@gmail.com` admin); env Production: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_*`, `VAPID_*` presentes |

## LOTE A FREEMIUM (03/06/2026 — Claude)

**Decisão: URL canônica = `https://will-treinos-pro.vercel.app` (sem domínio próprio por ora)**

| Item | Ação | Resultado |
|------|------|-----------|
| Crons Hobby | 9 → 1 Vercel + GitHub Actions | ✅ `vercel.json` 1 cron (`orchestrator-morning` 08h BRT) |
| Cron evening 18h | GitHub Actions | ✅ `.github/workflows/cron-evening.yml` — chama orchestrator-evening 21h UTC |
| CI workflow | Otimizado free tier | ✅ Playwright só main + só chromium + `NEXT_PUBLIC_APP_URL` |
| CRON_SECRET | Auditado 11 rotas | ✅ Todos os arquivos protegidos |
| TypeScript | `pnpm run typecheck` | ✅ Exit 0 |
| Smoke 19 rotas | curl vs produção | ✅ 19/19 — 04/06/2026 |
| NEXT_PUBLIC_APP_URL | Vercel env Production | ✅ `https://will-treinos-pro.vercel.app` |
| Supabase Auth redirects | URL Configuration | ⚠️ **Manual Will** — ver seção 2.3 (~3 min) |
| VERIFY_PRODUCTION.sql | SQL Editor | ✅ staff_access 2/2, RPCs OK, tabelas OK |
| GitHub secret `CRON_SECRET` | GitHub Settings → Secrets | ⚠️ **Manual Will** — mesmo valor da Vercel |
| `.cron-secret-temp.txt` | Segurança | ✅ Adicionado ao `.gitignore` (04/06) — nunca foi commitado |

## LOTE QA + INFRA (04/06/2026 — Claude)

| Item | Resultado |
|------|-----------|
| Smoke 19/19 ✅ | 04/06 02:20 BRT — todos os endpoints respondendo corretamente |
| Build verde | `pnpm run build` exit 0 pós-Pulse Inbox A+B+C |
| `.cron-secret-temp.txt` | ✅ Protegido em `.gitignore` — nunca exposto |
| Cron-evening workflow | ✅ YAML correto — requer secret manual no GitHub |
| GitHub CLI | ⚠️ Não instalado no ambiente — verificação de secrets manual |
| Supabase Auth redirects | ⚠️ **Pendente Manual Will** |
| APPLY_SECURITY_AND_PERF.sql | ⚠️ Arquivo existe mas não verificado no remoto — rodar no SQL Editor |

---

## STATUS RESUMIDO

| Área | Item | Estado |
|------|------|--------|
| Deploy | Git push → Vercel automático | ✅ Ativo (webhook GitHub App) |
| URL canônica | `will-treinos-pro.vercel.app` | ✅ Freemium — sem domínio .com.br por ora |
| Domínio | `willtreinospro.com.br` | ⏸️ Adiado — DNS opcional quando comprar |
| Supabase Auth | Site URL + 4 redirects | ⚠️ **Manual Will** — seção 2.3 (~3 min) |
| Env Vars | Todas as obrigatórias | ✅ Confirmado em Production |
| Crons | 1 Vercel + evening GH Actions | ✅ orchestrators respondendo 401 em prod |
| staff_access | 2 admins ativos | ✅ VERIFY_PRODUCTION confirmado |
| CI (Playwright) | GitHub Actions | ✅ Otimizado freemium |
| CI (Cron evening) | GitHub secret | ✅ `CRON_SECRET` configurado (04/06 Will) |
| Segurança | `.cron-secret-temp.txt` | ✅ No `.gitignore` — nunca commitado |
| Smoke | 19/19 rotas | ✅ 04/06/2026 |
| Pulse Inbox | A+B+C em produção | ✅ commits `e732249` + `4f7c026` |

---

## 1. DOMÍNIO `willtreinospro.com.br` — CHECKLIST DNS

### 1.1 Passos no painel Vercel

1. Abrir **vercel.com/dashboard** → projeto `will-treinos-pro`
2. **Settings → Domains → Add Domain**
3. Digitar `willtreinospro.com.br` → **Add**
4. Vercel exibe os registros DNS necessários (copiar para o próximo passo)

### 1.2 Registros DNS no registrador (Registro.br / GoDaddy / Cloudflare)

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| `A` | `@` (raiz) | `76.76.21.21` (Vercel) | 300 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 300 |

> **Se usar Cloudflare:** desativar proxy (nuvem laranja → cinza) durante propagação; reativar depois se quiser CDN Cloudflare (opcional — Vercel já tem Edge Network).

### 1.3 Verificar propagação

```bash
# Verificar A record
nslookup willtreinospro.com.br 8.8.8.8

# Ou via CLI
dig +short willtreinospro.com.br A
```

Propagação: tipicamente 5–30 min (TTL 300s). Máx 48h em casos raros.

### 1.4 SSL

O Vercel emite certificado Let's Encrypt **automaticamente** após o DNS propagar e o domínio ser verificado. Nenhuma ação manual necessária. Status visível em **Settings → Domains** (ícone cadeado verde).

---

## 2. SUPABASE AUTH — URL CONFIGURATION

### 2.1 Onde configurar

Painel Supabase → projeto `armrortldtqxmgvvcbko` → **Authentication → URL Configuration**

### 2.2 Site URL (freemium — obrigatório agora)

```
https://will-treinos-pro.vercel.app
```

> Quando comprar o domínio `.com.br`, trocar Site URL e manter os redirects da seção 2.3 (ambos os hosts).

### 2.3 Redirect URLs permitidas (adicionar todas)

```
https://willtreinospro.com.br/nova-senha
https://willtreinospro.com.br/auth/callback
https://will-treinos-pro.vercel.app/nova-senha
https://will-treinos-pro.vercel.app/auth/callback
http://localhost:3000/nova-senha
http://localhost:3000/auth/callback
```

> **Por que ambos os domínios?** O link de e-mail de redefinição de senha usa a URL configurada no momento do envio. Durante a migração do domínio, usuários com links antigos (vercel.app) precisam ser atendidos.

### 2.4 Verificar no código

O middleware já libera `/nova-senha` e `/auth/` como rotas públicas (`src/middleware.ts:38-40`). Nenhuma alteração de código necessária.

---

## 3. VARIÁVEIS DE AMBIENTE — VERCEL

### 3.1 Verificar no painel

**Vercel Dashboard → Settings → Environment Variables**

### 3.2 Variáveis obrigatórias

| Variável | Escopo | Obrigatória | Observação |
|----------|--------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ✅ | `https://armrortldtqxmgvvcbko.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | ✅ | Chave pública (anon), segura no browser |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | ✅ | **NUNCA no NEXT_PUBLIC_** · somente Production+Preview |
| `CRON_SECRET` | Server only | ✅ | Guards todos os 9 endpoints `/api/cron/*` |
| `VAPID_PUBLIC_KEY` | All | ✅ | Push notifications (web-push) |
| `VAPID_PRIVATE_KEY` | Server only | ✅ | web-push VAPID signing |
| `VAPID_SUBJECT` | Server only | ✅ | Ex: `mailto:contato@willtreinospro.com.br` |
| `NEXT_PUBLIC_APP_URL` | All | ✅ | `https://will-treinos-pro.vercel.app` — links OG, convite, perfil público |
| `ANTHROPIC_API_KEY` | Server only | ⚠️ Opcional | Ativa IA real nos planos de treino e resumos mensais — sem ela, usa fallback PT-BR |
| `NEXT_PUBLIC_DEV_ROOT_EMAILS` | All | Dev | E-mails admin que ignoram RLS em dev |

> **Regra de ouro:** se a variável contém `NEXT_PUBLIC_`, ela vaza para o bundle do browser. `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY` **jamais** devem ter esse prefixo.

### 3.3 Verificar VAPID via CLI (opcional)

Se as chaves VAPID ainda não foram geradas:

```bash
# No terminal local (npx, não precisa instalar globalmente)
npx web-push generate-vapid-keys
```

Copiar `publicKey` → `VAPID_PUBLIC_KEY` e `privateKey` → `VAPID_PRIVATE_KEY`.

---

## 4. CRONS — VERCEL HOBBY PLAN

### 4.1 Estado atual (`vercel.json`) — ✅ 1 cron Vercel + 1 externo

| Slot | Path | Schedule UTC | BRT | Jobs internos |
|------|------|-------------|-----|---------------|
| Vercel Hobby | `/api/cron/orchestrator-morning` | `0 11 * * *` | 08h | birthday, daily-reminder, onboarding, payment (dias 5/20), monthly (dia 1) |
| GitHub Actions (gratuito) | `/api/cron/orchestrator-evening` | `0 21 * * *` | 18h | absence, fomo, post-lesson-feedback, weekly-report (sexta) |

Os 9 crons individuais são rotas normais — chamadas pelos orquestradores. Nenhuma lógica de negócio foi alterada.

### 4.2 Limite do plano Hobby

O plano Hobby da Vercel suporta **1 cron job por projeto**. O slot das 18h BRT roda via **GitHub Actions** (repo público = cron gratuito).

### 4.3 Quando fazer upgrade

Ao migrar para Vercel Pro (~$20/mês): restaurar as 9 entradas individuais no `vercel.json`, remover os orquestradores e desativar o workflow `cron-evening.yml`.

### 4.4 Setup cron evening — GitHub Actions (recomendado, 2 min)

1. **GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret**
2. Nome: `CRON_SECRET` · Valor: **o mesmo** que está em Vercel → Settings → Environment Variables (copiar do painel, não commitar)
3. Workflow já no repo: `.github/workflows/cron-evening.yml` (dispara 21:00 UTC diário + botão manual)
4. Testar: **Actions → Cron Evening → Run workflow** — resposta esperada HTTP 200 e `{"ok":true,"dispatched":[...]}`

**Alternativa:** cron-job.org (seção antiga) — mesma URL e header `Authorization: Bearer <CRON_SECRET>`, schedule 21:00 UTC.

---

## 5. DEPLOY — WEBHOOK GITHUB → VERCEL

### 5.1 Status atual

O `git push origin main` **já dispara deploy automático** — confirmado pelo log do Master Memory (`dpl_H75msTf5Pc4FR7gF5s3RxkTj2MLS` Ready após push `141946a`).

### 5.2 Verificar webhook ativo

**GitHub → Repo → Settings → Webhooks**

Deve existir um webhook `https://api.vercel.com/v1/integrations/deploy/...` com status `✅ Active`.

Se não existir:
1. Vercel Dashboard → projeto → **Settings → Git → Disconnect**
2. **Settings → Git → Connect Git Repository** → selecionar `guihnoo/will-treinos-pro`
3. Vercel recria o webhook automaticamente.

### 5.3 Workflow de deploy

```bash
# Build local antes de todo push
pnpm exec tsc --noEmit
pnpm run build

# Deploy via Git (NUNCA via vercel deploy --prod)
git add <arquivos>
git commit -m "tipo: descrição"
git push origin main
# → Vercel detecta push → Build → Deploy automático → ~2-3 min
```

### 5.4 Rollback de emergência

**Vercel Dashboard → projeto → Deployments → escolher deploy anterior → Promote to Production**

Ou via URL de deployment anterior (`will-treinos-pro-<hash>.vercel.app`).

---

## 6. SUPABASE — VERIFICAÇÃO E `staff_access`

### 6.1 Rodar script de verificação

Abrir **Supabase → SQL Editor** e executar `supabase/VERIFY_PRODUCTION.sql`:

```sql
-- Verifica: staff_access rows, funções críticas, tabelas essenciais
SELECT 'staff_access' AS check, COUNT(*)::int AS rows, COUNT(*) FILTER (WHERE is_active)::int AS active
FROM staff_access;

SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('wt_is_staff', 'enroll_student_in_lesson', 'students_check_sensitive_fields');

SELECT 'referrals' AS tbl, to_regclass('public.referrals') IS NOT NULL AS ok
UNION ALL SELECT 'notification_preferences', to_regclass('public.notification_preferences') IS NOT NULL
UNION ALL SELECT 'xp_log', to_regclass('public.xp_log') IS NOT NULL;
```

**Resultado esperado:**
- `staff_access`: rows ≥ 1, active ≥ 1
- 3 funções retornadas: `wt_is_staff`, `enroll_student_in_lesson`, `students_check_sensitive_fields`
- 3 tabelas: `ok = true`

### 6.2 INSERT idempotente para `staff_access` (Will)

A tabela usa **`email`** (não `user_id`). Se `active = 0`, rodar no SQL Editor:

```sql
INSERT INTO staff_access (id, email, role, is_active)
VALUES (
  'staff-will-admin',
  'guihmonteiro.2014@gmail.com',
  'admin',
  true
)
ON CONFLICT (email)
DO UPDATE SET is_active = true, role = 'admin';
```

> **Não expor service_role_key no chat.** O SQL acima roda via SQL Editor do painel Supabase (já autenticado como admin).

### 6.3 Top 3 ações do Advisor (Security + Performance)

Com base nas migrations já aplicadas e na arquitetura atual:

| # | Categoria | Ação | Impacto |
|---|-----------|------|---------|
| 1 | **Security** | Confirmar que `wt_is_staff()` usa `app_metadata` (não `user_metadata`) — migration `20260602030000` aplicada. Rodar `SELECT prosrc FROM pg_proc WHERE proname = 'wt_is_staff'` para validar. | Crítico — previne escalada de privilégio |
| 2 | **Security** | Confirmar RLS em todas as tabelas novas: `evaluation_templates`, `reposition_requests`, `weekly_challenges`. Rodar `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=false` | Alto — tabelas sem RLS são públicas |
| 3 | **Performance** | Confirmar 11 índices de `20260602040000_performance_indexes.sql` aplicados. Rodar `SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY 1` e verificar presença de `idx_xp_log_student_id`, `idx_awards_student_id`, etc. | Alto — queries de leaderboard e XP |

---

## 7. SMOKE TEST — 15 ROTAS DE PRODUÇÃO

Executar após cada deploy. URL base: `https://will-treinos-pro.vercel.app` (ou `willtreinospro.com.br` após DNS).

| # | URL | Esperado | Verificar |
|---|-----|----------|-----------|
| 1 | `/` | `200` redirect ou landing | Não 404/500 |
| 2 | `/login` | `200` | Formulário visível |
| 3 | `/cadastro` | `200` | Formulário de cadastro |
| 4 | `/signup` | `200` | Página de signup |
| 5 | `/esqueci-senha` | `200` | Formulário de e-mail |
| 6 | `/nova-senha` | `200` | Formulário de senha nova (sem token = guard OK) |
| 7 | `/aguardando` | `200` | Tela de espera com polling |
| 8 | `/termos` | `200` | Texto de termos |
| 9 | `/privacidade` | `200` | Texto de privacidade |
| 10 | `/dashboard` | `302 → /login` | Redireciona sem sessão |
| 11 | `/ranking` | `302 → /login` | Redireciona sem sessão |
| 12 | `/perfil` | `302 → /login` | Redireciona sem sessão |
| 13 | `/api/leaderboard` | `200` JSON | `{"ranking":[...]}` |
| 14 | `/api/leaderboard/tv` | `200` JSON | Top 10 da semana |
| 15 | `/api/health` ou `/api/cron/daily-reminder` sem `CRON_SECRET` | `401` | **Não** `200` — guard ativo |

### Script rápido (PowerShell local)

```powershell
$BASE = "https://will-treinos-pro.vercel.app"
$routes = @("/","/login","/cadastro","/signup","/esqueci-senha","/nova-senha",
            "/aguardando","/termos","/privacidade","/dashboard","/ranking","/perfil")

foreach ($r in $routes) {
  $resp = Invoke-WebRequest -Uri "$BASE$r" -MaximumRedirection 0 -ErrorAction SilentlyContinue
  Write-Host "$($resp.StatusCode) $r"
}
```

---

## 8. CI — PLAYWRIGHT NO GITHUB ACTIONS

### 8.1 Diagnóstico: por que falha?

Os testes em `e2e/student-journey.spec.ts` usam `playwright.config.ts` com `baseURL: 'http://localhost:3000'` e `webServer: { command: 'pnpm dev', timeout: 120000 }`.

**Causa raiz mais provável:** falta de variáveis de ambiente no runner do GitHub Actions.

| Causa | Evidência | Fix |
|-------|-----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` ausente | Build falha ou Supabase client retorna null | Adicionar secret no GitHub |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` ausente | Idem | Idem |
| `CRON_SECRET` ausente | Cron routes retornam 500 em vez de 401 | Idem |
| `pnpm dev` demora >120s para subir | Timeout do webServer | Aumentar timeout para 180s ou usar `pnpm build && pnpm start` |
| Testes "flaky" por timing | Animações Framer Motion atrasam elementos | Adicionar `page.waitForLoadState('networkidle')` nos specs |

### 8.2 Plano de correção (sem editar specs)

**Passo 1 — Adicionar secrets no GitHub**

GitHub → Repo → **Settings → Secrets and variables → Actions → New repository secret**:

```
NEXT_PUBLIC_SUPABASE_URL       = https://armrortldtqxmgvvcbko.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = <anon key do Supabase>
CRON_SECRET                    = <mesmo valor do Vercel>
```

**Passo 2 — Workflow `.github/workflows/e2e.yml`** (criar se não existir)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      CRON_SECRET: ${{ secrets.CRON_SECRET }}

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test
        timeout-minutes: 10
```

**Passo 3 — Se flaky por animações**

Editar `playwright.config.ts` (não os specs) — aumentar `timeout` global:

```typescript
use: {
  timeout: 15_000,      // 15s por assertion
  actionTimeout: 8_000, // 8s por clique/fill
}
```

---

## 9. ROLLBACK DE EMERGÊNCIA

| Situação | Ação |
|----------|------|
| Deploy quebrado em produção | Vercel Dashboard → Deployments → deploy anterior → **Promote to Production** |
| Bug crítico no banco | Supabase → Database → Backups → Restore to point-in-time |
| RLS desativado acidentalmente | SQL Editor: `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;` |
| Variável de env errada | Vercel → Settings → Env Vars → editar → **Redeploy** |

---

## 10. PRÓXIMOS 3 PASSOS MANUAIS (Will)

### Passo 1 — DNS (5 min)

Acessar painel do registrador do domínio `willtreinospro.com.br` e adicionar:
- Record `A` na raiz (`@`) → `76.76.21.21`
- Record `CNAME` em `www` → `cname.vercel-dns.com`

Em seguida, em Vercel Dashboard → projeto → **Settings → Domains** → adicionar `willtreinospro.com.br`.

### Passo 2 — Supabase Auth Redirects (3 min)

Abrir **Supabase → Authentication → URL Configuration** e adicionar na lista de Redirect URLs:

```
https://willtreinospro.com.br/nova-senha
https://willtreinospro.com.br/auth/callback
https://will-treinos-pro.vercel.app/nova-senha
https://will-treinos-pro.vercel.app/auth/callback
```

Salvar.

### Passo 3 — Confirmar `staff_access` + Env Vars (5 min)

1. Supabase → SQL Editor → rodar `supabase/VERIFY_PRODUCTION.sql`
2. Se `active = 0` na `staff_access`, rodar o INSERT idempotente da seção 6.2
3. Vercel → Settings → Environment Variables → confirmar que `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` estão presentes em Production

---

## APÊNDICE — REFERÊNCIAS RÁPIDAS

| Recurso | URL |
|---------|-----|
| Vercel Dashboard | vercel.com/dashboard |
| Supabase Dashboard | supabase.com/dashboard/project/armrortldtqxmgvvcbko |
| GitHub Repo | github.com/guihnoo/will-treinos-pro |
| Vercel Cron Docs | vercel.com/docs/cron-jobs |
| Supabase Auth Config | supabase.com/docs/guides/auth/redirect-urls |
| Registro.br (DNS) | registro.br/tecnologia/ferramentas/whois |

---

*Runbook gerado automaticamente — manter atualizado após cada mudança de infra.*
