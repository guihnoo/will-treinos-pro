# Estado atual — Will Treinos PRO

**Atualizado:** 03/06/2026 · freemium

**Produção:** https://will-treinos-pro.vercel.app

---

## Trabalho em paralelo

| Agente | Lote | Arquivo guia |
|--------|------|----------------|
| **Claude Code** | A — Infra, crons, CI | `docs/CLAUDE_CODE_LOTE_A_FREEMIUM.md` |
| **Cursor** | B — URL canônica, docs, follow-up infra | `docs/PLANO_FREEMIUM_CURSOR_CLAUDE.md` |
| **Will** | C — Piloto | `docs/QA_LANCAMENTO_MANUAL.md` |

---

## Última entrega (Cursor — follow-up Lote A)

| Mudança | Detalhe |
|---------|---------|
| **NEXT_PUBLIC_APP_URL** | Adicionada na Vercel Production via CLI |
| **Cron evening** | `.github/workflows/cron-evening.yml` (18h BRT, gratuito) |
| **Runbook** | Corrigidas inconsistências (1 cron Hobby, Site URL freemium) |
| **VERIFY_PRODUCTION** | OK remoto: staff 2/2, RPCs, tabelas gamificação |

---

## Funciona / pendente

| ✅ | ⚠️ Pendente (Will, ~5 min total) |
|----|----------------------------------|
| Cockpit, agenda, financeiro, gamificação | Supabase Auth: Site URL + 4 redirects (§2.3 runbook) |
| Crons morning no Vercel + evening workflow | GitHub secret `CRON_SECRET` (copiar da Vercel) |
| `staff_access` + env Vercel + APP_URL | QA piloto 1 aluno real |
| Login fix `students.position` | |

---

## Após cada sessão

1. Atualizar este arquivo  
2. Linha em `WILLPRO_MASTER_MEMORY.md` §3  
3. Checkboxes em `docs/LANCAMENTO_CHECKLIST.md`
