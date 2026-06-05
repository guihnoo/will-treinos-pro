# Estado atual — Will Treinos PRO

**Atualizado:** 04/06/2026 · Lote C — Hardening  
**Produção:** https://will-treinos-pro.vercel.app

---

## Status rápido

| Área | Estado |
|------|--------|
| Deploy (Vercel) | ✅ git push main → deploy automático |
| Auth login | ✅ Google OAuth + email/senha funcionando |
| Supabase Auth redirects | ✅ configurado em 04/06 |
| GitHub secret `CRON_SECRET` | ✅ configurado em 04/06 |
| Cron morning (Vercel) | ✅ orchestrator-morning 08h BRT |
| Cron evening (GH Actions) | ✅ cron-evening.yml 18h BRT |
| Pulse Inbox A+B+C | ✅ em produção |
| Notificações (dedup + aluno) | ✅ fix b2ece34 |
| Missões diárias (CRM id correto) | ✅ fix 30524aa |
| `/api/health` endpoint | ✅ criado (Lote C) |
| `APPLY_SECURITY_AND_PERF.sql` | ⚠️ **Pendente — rodar no Supabase SQL Editor** |
| Playwright CI | ⚠️ 4 secrets faltando no GitHub |

---

## Playwright CI — Secrets para adicionar

**Onde:** github.com/guihnoo/will-treinos-pro → Settings → Secrets → Actions

| Secret | Crítico? | Onde pegar |
|--------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Build falha sem ele | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Build falha sem ele | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Build falha sem ele | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_DEV_ROOT_EMAILS` | ⚠️ Opcional | Vercel → Settings → Env Vars |

`CRON_SECRET` — só necessário no `cron-evening.yml` (já configurado por Will).

---

## APPLY_SECURITY_AND_PERF.sql — Executar no Supabase

**Onde:** supabase.com/dashboard/project/armrortldtqxmgvvcbko → SQL Editor

Copiar `supabase/APPLY_SECURITY_AND_PERF.sql` → colar → Run. É **100% idempotente**.

Contém:
1. `CREATE OR REPLACE FUNCTION students_check_sensitive_fields()` — bloqueia escalada de privilégio
2. `CREATE OR REPLACE FUNCTION wt_is_staff()` — usa `app_metadata` seguro
3. `CREATE INDEX IF NOT EXISTS` — 10 índices de performance (xp_log, awards, lessons, payments, notifications, students, auth_user_id, absence_requests, training_sessions)

---

## Top 5 — Security + Performance (Advisors)

| # | Tipo | Ação |
|---|------|------|
| 1 | 🔴 Security | Executar `APPLY_SECURITY_AND_PERF.sql` (C1 + A1) |
| 2 | 🔴 Security | Confirmar: `SELECT prosrc FROM pg_proc WHERE proname = 'wt_is_staff'` → deve conter `app_metadata` |
| 3 | 🟡 Security | Verificar RLS em `staff_access`: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='staff_access'` |
| 4 | 🟡 Performance | Confirmar 10 índices: `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%' ORDER BY 1` |
| 5 | 🟢 Geral | Rodar `supabase/VERIFY_PRODUCTION.sql` — staff 2/2, 3 RPCs, 3 tabelas críticas |

---

## Smoke 10/10 ✅ (04/06/2026 22:09 BRT)

```
✅ 200 /          ✅ 200 /login       ✅ 307 /dashboard
✅ 200 /api/leaderboard              ✅ 200 /api/leaderboard/tv
✅ 405 /api/auth/link-student
✅ 401 /api/cron/orchestrator-morning ✅ 401 /api/cron/orchestrator-evening
✅ 401 /api/cron/daily-reminder      ✅ 401 /api/cron/fomo-reminder
```

---

## Após cada sessão

1. Atualizar este arquivo
2. Linha em `WILLPRO_MASTER_MEMORY.md` §3
3. Checkboxes em `docs/LANCAMENTO_CHECKLIST.md`
