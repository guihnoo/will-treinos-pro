# Checklist lançamento (freemium)

**URL:** https://will-treinos-pro.vercel.app · **Sem domínio pago por enquanto**

| Agente | Foco |
|--------|------|
| **Claude Code** | Lote A — `docs/CLAUDE_CODE_LOTE_A_FREEMIUM.md` |
| **Cursor** | Lote B — código + UX |
| **Will** | Piloto real |

## Infra (Claude — Lote A)
- [ ] `vercel.json` + orchestrator(es) no `main` + deploy Ready
- [ ] Supabase Auth: site URL + 4 redirect URLs (vercel.app + localhost)
- [ ] `NEXT_PUBLIC_APP_URL` na Vercel Production
- [ ] Smoke 15 rotas (runbook)
- [ ] Playwright CI — doc de secrets (opcional workflow)
- [ ] ~~Domínio .com.br~~ adiado

## Produto (Cursor — Lote B)
- [x] `src/lib/appUrl.ts` + links sem `willtreinospro.com.br`
- [x] Docs plano freemium + prompt Claude
- [ ] Build + push
- [ ] QA manual preenchido

## Piloto (Will)
- [ ] 1 aluno: cadastro → aprovação → login → check-in → XP
- [ ] 1 fluxo admin: aprovar + criar aula
