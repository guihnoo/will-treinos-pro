# Estado atual — Will Treinos PRO

**Atualizado:** 03/06/2026 · freemium

**Produção:** https://will-treinos-pro.vercel.app

---

## Trabalho em paralelo

| Agente | Lote | Arquivo guia |
|--------|------|----------------|
| **Claude Code** | A — Infra, crons, Supabase Auth, CI | `docs/CLAUDE_CODE_LOTE_A_FREEMIUM.md` |
| **Cursor** | B — URL canônica, docs | `docs/PLANO_FREEMIUM_CURSOR_CLAUDE.md` |
| **Will** | C — Piloto | `docs/QA_LANCAMENTO_MANUAL.md` |

---

## Última entrega (Cursor — Lote B)

| Mudança | Detalhe |
|---------|---------|
| **URL canônica** | `src/lib/appUrl.ts`; layout OG/sitemap/referral/crons usam Vercel |
| **Sem domínio** | Plano freemium; `.com.br` adiado |
| **Docs** | Plano + prompt Claude Lote A |

---

## Funciona / pendente

| ✅ | ⚠️ Pendente |
|----|-------------|
| Cockpit, agenda, financeiro, gamificação | Crons orquestrador no `main` (Claude) |
| Login fix (`wt_role`) em `main` | Supabase Auth redirects (Claude) |
| `staff_access` + env Vercel | `NEXT_PUBLIC_APP_URL` na Vercel (Claude confirma) |
| Runbook infra | QA piloto Will |

---

## Após cada sessão

1. Atualizar este arquivo  
2. Linha em `WILLPRO_MASTER_MEMORY.md` §3  
3. Checkboxes em `docs/LANCAMENTO_CHECKLIST.md`
