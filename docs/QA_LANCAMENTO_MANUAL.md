# QA manual — lançamento

Base: https://will-treinos-pro.vercel.app

**Piloto guiado (primeiro aluno real):** [`PILOTO_PRIMEIRO_ALUNO.md`](./PILOTO_PRIMEIRO_ALUNO.md)

## Auth (Will — infra já configurada 04/06)
| # | Teste | ✅/❌ |
|---|--------|------|
| L1 | Login email/senha aluno → **Início** (não loop login) | |
| L2 | Login Google admin → **Cockpit** | |
| L3 | Esqueci senha → e-mail → link abre `/nova-senha` | |
| L4 | Logout → login de novo | |

## Aluno
| # | Teste | ✅/❌ |
|---|--------|------|
| A1 | Login → abre **Início** (não volta ao login) | |
| A2 | Card **Missão do dia** no Início (some após perfil + check-in) | |
| A3 | Treinos — empty state ouro (sem roxo) | |
| A4 | Ranking sem crash (vazio ou com dados) | |
| A5 | Config / Perfil / Check-in | |
| A6 | Indicação — link copiado usa `will-treinos-pro.vercel.app` | |
| A7 | Esqueci senha → nova senha | |
| A8 | Sino → abas Avisos/Recados; CTA recados abre painel (`?recados=1`) | |
| A9 | Mensagem do coach → notificação aparece (sem duplicata) | |

## Admin
| # | Teste | ✅/❌ |
|---|--------|------|
| C1 | Google → Cockpit | |
| C2 | Aprovar pendente | |
| C3 | Criar aula + financeiro | |
| C4 | Sino → Pulse sheet; peek desktop; strip ações pendentes no Cockpit | |
