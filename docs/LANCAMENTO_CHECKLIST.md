# Checklist lançamento (freemium)

**URL:** https://will-treinos-pro.vercel.app · **Sem domínio pago por enquanto**

| Agente | Foco |
|--------|------|
| **Claude Code** | Lote A — `docs/CLAUDE_CODE_LOTE_A_FREEMIUM.md` |
| **Cursor** | Lote B — código + UX |
| **Will** | Piloto real |

## Infra (Claude — Lote A + Cursor follow-up)
- [x] `vercel.json` + orchestrator(es) no `main` + deploy Ready
- [ ] Supabase Auth: site URL + 4 redirect URLs (vercel.app + localhost) — **Will ~3 min**
- [x] `NEXT_PUBLIC_APP_URL` na Vercel Production
- [x] Smoke 15 rotas (runbook)
- [x] VERIFY_PRODUCTION OK (MCP)
- [x] CI Playwright otimizado freemium
- [ ] Secret `CRON_SECRET` no GitHub Actions (mesmo valor Vercel) — **Will ~1 min**
- [ ] ~~Domínio .com.br~~ adiado

## Produto (Cursor — Lote B)
- [x] `src/lib/appUrl.ts` + links sem `willtreinospro.com.br`
- [x] Docs plano freemium + prompt Claude
- [x] Build + push (parcial — ver git)
- [ ] QA manual preenchido

## Piloto (Will)
- [ ] 1 aluno: cadastro → aprovação → login → check-in → XP
- [ ] 1 fluxo admin: aprovar + criar aula
