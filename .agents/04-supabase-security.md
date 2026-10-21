# 🛡️ Supabase Security & Auth Governance
**Will Treinos PRO — Autonomous Engineering Standard**

## Objetivo
Blindar a segurança de dados de alunos, dados financeiros e operações de staff, garantindo conformidade com RLS, proteção de rotas públicas e mensagens amigáveis em português do Brasil.

---

## 1. Rotas Públicas vs Rotas Protegidas
- O `AuthWrapper.tsx` mantém a lista canônica `PUBLIC_ROUTES`:
  - `/`, `/login`, `/signup`, `/cadastro`, `/esqueci-senha`, `/nova-senha`, `/termos`, `/privacidade`, `/offline.html`, `/atleta/*`.
- Toda comparação de rota pública **deve** usar normalização de trailing slash (`pathname.replace(/\/$/, "")`).
- Usuários anônimos nunca devem ser redirecionados para `/login` ao tentar ler `/termos`, `/privacidade` ou `/offline.html`.

---

## 2. Autorização de Staff (`wt_is_staff`)
- O frontend **nunca** decide isoladamente se um usuário é administrador ou treinador.
- Toda operação crítica de backend, edge functions e RLS valida a existência e o status ativo do usuário em `staff_access` com a função SQL `wt_is_staff()`.
- O payload de JWT nunca deve conceder permissões administrativas baseado apenas em `user_metadata` do cliente (que é vulnerável à edição pelo usuário).

---

## 3. Tradução Centralizada de Erros Auth (pt-BR)
- Toda e qualquer mensagem de erro do Supabase GoTrue Auth deve passar por `src/lib/authErrorTranslator.ts`.
- Textos em inglês cru como *"Invalid login credentials"* ou *"User already registered"* são expressamente proibidos em telas de login e cadastro.
- Erros de rede ou indisponibilidade temporária devem orientar o usuário de forma clara e calma.
