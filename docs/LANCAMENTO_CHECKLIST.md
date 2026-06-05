# Checklist lançamento (freemium)

**URL:** https://will-treinos-pro.vercel.app · **Sem domínio pago por enquanto**

| Agente | Foco |
|--------|------|
| **Claude Code** | Lote C — `docs/CLAUDE_CODE_LOTE_C_HARDENING.md` |
| **Cursor** | Lote D — piloto + polish UX |
| **Will** | Piloto real + login produção |

## Infra
- [x] `vercel.json` + orchestrator(es) no `main` + deploy Ready
- [x] Supabase Auth: Site URL + redirect URLs (vercel.app + localhost) — **04/06 Will**
- [x] `NEXT_PUBLIC_APP_URL` na Vercel Production
- [x] Smoke rotas produção (`scripts/smoke-production.ps1`)
- [x] VERIFY_PRODUCTION OK (MCP)
- [x] CI Playwright otimizado freemium
- [x] Secret `CRON_SECRET` no GitHub Actions — **04/06 Will**
- [x] `supabase/APPLY_SECURITY_AND_PERF.sql` no remoto — **05/06 Cursor MCP** (migration `apply_security_and_perf_launch` + trigger)
- [ ] ~~Domínio .com.br~~ adiado

## Produto (Cursor)
- [x] `src/lib/appUrl.ts` + links sem domínio pago
- [x] Pulse Inbox A+B+C + polish mobile/deep link recados
- [x] Fix missão do dia (CRM id + conclusão real)
- [x] Fix notificações aluno (dedup + link-student)
- [ ] QA manual preenchido (Will)

## Piloto (Will)
- [ ] Login produção: email, Google, esqueci senha
- [ ] 1 aluno: cadastro → aprovação → login → check-in → XP
- [ ] 1 fluxo admin: aprovar + criar aula
- [ ] Sino / recados: aluno vê mensagem do coach
