# Checklist lançamento

**Cursor** = código/QA · **Claude Code** = infra

## Infra (Claude)
- [ ] Domínio + DNS Vercel
- [ ] Supabase Auth redirects (`/nova-senha`, `/auth/callback`)
- [ ] Env + crons + `staff_access`
- [ ] Webhook deploy no push
- [ ] `docs/RUNBOOK_LANCAMENTO_INFRA.md`

## Produto (Cursor)
- [x] Cookie `wt_role` no middleware
- [x] Redirect aluno → `/dashboard`
- [x] Ranking empty state
- [ ] Deploy commit atual
- [ ] QA manual preenchido

## Piloto (Will)
- [ ] 1 aluno: cadastro → aprovação → login → check-in
