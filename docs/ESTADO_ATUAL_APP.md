# Estado atual — Will Treinos PRO

**Atualizado:** 03/06/2026 · Cursor (paralelo ao Claude Code infra)

**Produção:** https://will-treinos-pro.vercel.app

---

## Última entrega (Cursor)

| Mudança | Detalhe |
|---------|---------|
| **Login loop (definitivo)** | Middleware lia `wt-role` → corrigido para `wt_role` |
| **Race auth** | Mantido fix Claude `141946a` (await `applySupabaseSession`) + `SIGNED_IN` também awaited |
| **Redirect aluno** | Login/OAuth/aguardando → `/dashboard` (Início) |
| **Ranking vazio** | Empty state premium + CTA Início |
| **Docs** | Checklist lançamento, QA manual, prompt infra Claude |

---

## Divisão de trabalho agora

| Quem | Fazendo |
|------|---------|
| **Claude Code** | Domínio, Supabase Auth URLs, env Vercel, smoke, runbook infra |
| **Cursor** | Código + build + push (este lote) |
| **Will** | Testar login após deploy; QA `docs/QA_LANCAMENTO_MANUAL.md` |

---

## Funciona / pendente

| ✅ | ⚠️ Pendente |
|----|-------------|
| Cockpit, agenda, financeiro, gamificação (código) | Domínio `.com.br` |
| Reset senha (rotas) | Redirect URLs Supabase (manual) |
| Login fix no repo | **Deploy** deste commit |
| | Push automático Vercel (validar com Claude) |

---

## Após cada sessão

1. Atualizar este arquivo  
2. Linha em `WILLPRO_MASTER_MEMORY.md` §3  
3. Checkboxes em `docs/LANCAMENTO_CHECKLIST.md`
