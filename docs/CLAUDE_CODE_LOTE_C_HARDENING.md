# Claude Code — Lote C (Hardening SQL + CI + advisors)

**Cole no terminal `claude` na raiz do repo.**  
**Cursor** executa **Lote D** (piloto UX) — não editar `StudentHome`, `Navigation`, `src/components/notifications/*` sem combinar.

---

## PROMPT (copiar da linha abaixo até o fim)

```
Você é o agente de INFRA/HARDENING do Will Treinos PRO.

Leia: CLAUDE.md, WILLPRO_MASTER_MEMORY.md (§3 últimas 8 linhas), docs/RUNBOOK_LANCAMENTO_INFRA.md, docs/ESTADO_ATUAL_APP.md.

Infra manual Will já está ✅ (Supabase Auth + GitHub CRON_SECRET — 04/06).

## Escopo Lote C — NÃO mexer em UI/TSX de telas

### 1) Aplicar SQL de segurança + performance
- Arquivo: `supabase/APPLY_SECURITY_AND_PERF.sql`
- Via Supabase MCP ou SQL Editor remoto (projeto armrortldtqxmgvvcbko)
- Antes: backup mental do que o script altera (triggers RLS, índices)
- Depois: rodar advisors de security + performance via MCP
- Se algo falhar (objeto já existe), documentar idempotência e ajustar script mínimo

### 2) VERIFY_PRODUCTION + smoke
- Executar queries do runbook / VERIFY_PRODUCTION
- `pnpm exec tsc --noEmit` + `pnpm run build` (2x se PageNotFoundError _document)
- Opcional: `scripts/smoke-production.ps1` contra produção

### 3) CI / secrets
- Confirmar `.github/workflows/cron-evening.yml` e `test.yml` com secrets corretos
- Documentar em `docs/GITHUB_ACTIONS_E2E_FREEMIUM.md` se faltar algo

### 4) Docs + ship
- Atualizar `docs/ESTADO_ATUAL_APP.md` e `docs/LANCAMENTO_CHECKLIST.md` se SQL aplicado
- Linha em WILLPRO_MASTER_MEMORY.md §3
- git add (sem .env, .next, .cron-secret-temp.txt)
- git commit + git push origin main
- Confirmar deploy Vercel Ready

## Fora de escopo (Cursor Lote D)
- StudentHome, Navigation, notification components
- Polish visual Pulse
- QA manual do Will

Reporte: o que foi aplicado no SQL, resultado advisors, build OK, URL deploy.
```

---

## Divisão Cursor × Claude (referência)

| Cursor | Claude |
|--------|--------|
| Fixes bugs piloto Will | `APPLY_SECURITY_AND_PERF.sql` |
| Polish Pulse / PWA UX | Advisors Supabase, VERIFY |
| `docs/product-guide/` opcional | Workflows CI, runbook sync |
