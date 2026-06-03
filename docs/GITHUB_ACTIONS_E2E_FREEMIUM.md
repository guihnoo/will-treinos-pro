# GitHub Actions — E2E Playwright (freemium)

Smoke E2E roda contra a URL pública do app (sem login real com credenciais no CI).

## Secrets necessários (Settings → Secrets and variables → Actions)

| Secret | Uso |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Obrigatório — workflow `test.yml` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Obrigatório — workflow `test.yml` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Obrigatório — workflow `test.yml` |
| `NEXT_PUBLIC_DEV_ROOT_EMAILS` | Obrigatório — workflow `test.yml` |
| `CRON_SECRET` | Obrigatório — workflow `cron-evening.yml` (mesmo valor da Vercel, **não** commitar) |
| `PLAYWRIGHT_BASE_URL` | Opcional. Default: `https://will-treinos-pro.vercel.app` |
| `E2E_STUDENT_EMAIL` | Opcional — só para testes autenticados futuros |
| `E2E_STUDENT_PASSWORD` | Opcional — **nunca** commitar no repo |

Não é necessário `SUPABASE_SERVICE_ROLE_KEY` no workflow de smoke E2E.

## Comandos locais

```powershell
cd c:\Users\monte\Desktop\will-treinos-pro
$env:PLAYWRIGHT_BASE_URL = "https://will-treinos-pro.vercel.app"
pnpm exec playwright test e2e/student-journey.spec.ts
```

## O que o CI valida hoje

- Landing, login, signup, privacidade, termos, ranking
- Rotas protegidas redirecionam sem auth
- API `/api/leaderboard` responde &lt; 500
- Perfil público `/atleta/[id]` sem crash

Workflow existente: `.github/workflows/` (se `e2e.yml` estiver ausente, o Claude Code pode adicionar no Lote A).

## Pós-deploy

Rodar smoke após deploy **Ready** na Vercel. Falha com 502/timeout → aguardar propagação e repetir.
