# Claude Code — Lote A (Infra tier gratuito)

**Cole este bloco no terminal `claude` na raiz do repo.**  
**Cursor** executa em paralelo o **Lote B** (URLs + docs produto). Não editar os mesmos arquivos ao mesmo tempo.

---

## PROMPT (copiar da linha abaixo até o fim)

```
Você é o agente de INFRA do Will Treinos PRO. O dono decidiu: SEM domínio próprio por agora — só tier gratuito. URL canônica: https://will-treinos-pro.vercel.app

Leia antes: CLAUDE.md, WILLPRO_MASTER_MEMORY.md (§3 últimas 5 linhas), docs/RUNBOOK_LANCAMENTO_INFRA.md.

## Seu escopo (Lote A) — NÃO mexer em UI/TSX de telas (isso é Cursor)

### 1) Crons Vercel Hobby (CRÍTICO)
- No disco já existem (podem estar untracked):
  - src/app/api/cron/orchestrator-morning/route.ts
  - src/app/api/cron/orchestrator-evening/route.ts
  - vercel.json com 2 crons (11 UTC e 21 UTC)
- O plano Hobby permite **1 cron por projeto**. Avalie:
  - Opção A: 1 único orchestrator/dia (ex. 11 UTC) que chama matutinos + noturnos no mesmo handler
  - Opção B: manter 2 crons e documentar risco (pode falhar no deploy)
  - Opção C: 1 cron Vercel + documentar cron-job.org gratuito para o segundo slot
- Garantir CRON_SECRET em todas as sub-rotas /api/cron/*
- Após decisão: commit + push origin main + confirmar deploy Ready no painel

### 2) Supabase Auth (sem domínio .com.br)
Painel: https://supabase.com/dashboard/project/armrortldtqxmgvvcbko/auth/url-configuration

- Site URL: https://will-treinos-pro.vercel.app
- Redirect URLs (adicionar se faltarem):
  - https://will-treinos-pro.vercel.app/auth/callback
  - https://will-treinos-pro.vercel.app/nova-senha
  - http://localhost:3000/auth/callback
  - http://localhost:3000/nova-senha

### 3) Vercel Environment Variables
Confirmar/criar em Production + Preview:
- NEXT_PUBLIC_APP_URL = https://will-treinos-pro.vercel.app
- CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_* , VAPID_*
- NÃO adicionar domínio customizado como obrigatório

### 4) SQL / segurança (read-only primeiro)
- Rodar supabase/VERIFY_PRODUCTION.sql via MCP ou SQL Editor
- Se advisors MCP disponíveis: security + performance — top 3 ações
- Se APPLY_SECURITY_AND_PERF.sql ainda não aplicado no remoto: avaliar e aplicar só o que falta (idempotente)

### 5) Playwright CI (mínimo)
- Diagnosticar .github/workflows — secrets faltando
- Documentar em docs/RUNBOOK ou docs/PLANO_FREEMIUM quais secrets o Will deve criar (sem valores no chat)
- Opcional: workflow smoke 1x/dia (não a cada push) para economizar minutos GitHub

### 6) Smoke pós-deploy
Rodar smoke das 15 rotas do runbook contra https://will-treinos-pro.vercel.app

### 7) Entregáveis obrigatórios
1. git push origin main com mensagem clara (crons + env doc se aplicável)
2. Linha em WILLPRO_MASTER_MEMORY.md §3: [DATA] (Claude) [CONFIG] Lote A freemium — o que foi feito
3. Atualizar docs/RUNBOOK_LANCAMENTO_INFRA.md seção execução com status Lote A
4. Resumo final em pt-BR: ✅ feito | ⚠️ pendente Will | ❌ bloqueado

## Proibições
- Não forçar compra de domínio ou Vercel Pro
- Não expor service_role, CRON_SECRET, VAPID private no chat
- Não refatorar Cockpit/StudentHome (Cursor)
- Não alterar e2e specs sem combinar com Cursor

## Coordenação
Se encontrar conflito git com arquivos que Cursor está editando (appUrl, layout, sitemap), puxe main e resolva só vercel.json + orchestrator + docs infra.
```

---

## Checklist rápido (Claude marca ao terminar)

- [ ] `vercel.json` + orchestrator(es) no `main`
- [ ] Deploy Vercel Ready
- [ ] Supabase Auth URLs (4 redirects + site URL)
- [ ] `NEXT_PUBLIC_APP_URL` na Vercel
- [ ] VERIFY_PRODUCTION OK
- [ ] Master Memory atualizado
- [ ] Smoke 15 rotas OK
