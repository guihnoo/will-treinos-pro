# 📱 Guia Completo: Push Notifications no Will Treinos PRO

## O que é?
Push Notifications são alertas que chegam no celular do usuário **mesmo com o app fechado**. Ex: "João solicitou check-in" aparece como notificação nativa no iPhone/Android.

## Arquitetura
```
1. Usuário aciona evento (check-in, novo aluno aprovado)
   ↓
2. Hook dispara sendPushToRole("admin", { title, body, url })
   ↓
3. POST /api/push/send com JWT
   ↓
4. Servidor recupera subscriptions da role do Supabase
   ↓
5. VAPID envia para FCM/Apple Push (browser)
   ↓
6. Service Worker recebe push event
   ↓
7. Notificação aparece no celular + notificationclick abre app
```

---

## PASSO 1: Gerar VAPID Keys (Uma única vez)

VAPID = credencial que valida requisições entre seu servidor e FCM/Apple.

### Se ainda NÃO tem as chaves:

```bash
# Terminal do projeto
npx web-push generate-vapid-keys

# Output:
# Public Key: BC1qQ2...
# Private Key: 9fI3...
```

### Se JÁ tem as chaves, liste em `.env.local`:
```
VAPID_PRIVATE_KEY=9fI3...
VAPID_SUBJECT=mailto:seu-email@will.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BC1qQ2...
```

---

## PASSO 2: Configurar em Vercel (Produção)

1. Acesse [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no projeto **will-treinos-pro**
3. Vá em **Settings → Environment Variables**
4. Adicione as 3 variáveis:
   - `VAPID_PRIVATE_KEY` = (chave privada)
   - `VAPID_SUBJECT` = `mailto:seu-email@will.com`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = (chave pública)

5. Salve e **Redeploy** (clique em Deployments → últimos commits → `Redeploy`)

---

## PASSO 3: Testar Localmente

### 3a. Iniciar dev server
```bash
pnpm dev
```

### 3b. Abrir em navegador web
```
http://localhost:3000
```

### 3c. Ativar notificações
- Banner "Fique por dentro de tudo" aparece em 3s
- Clique em **Ativar Notificações**
- Navegador pede permissão → **Permitir**

### 3d. Acessar dashboard de teste
```
http://localhost:3000/will/push-debug
```

### 3e. Enviar notificação de teste
1. **Enviar para (role):** Selecione "Admin" (você mesmo)
2. **Título:** "Teste Local"
3. **Mensagem:** "Funcionando? 🎉"
4. Clique em **Enviar Notificação de Teste**

### 3f. Verificar resultado
- ✅ **Sucesso?** Notificação aparece no canto inferior direito do browser
- ❌ **Falhou?** Veja o debugInfo:
  - VAPID: ❌ Faltando → adicionar .env.local
  - Seu role: ❌ Não é admin → fazer login como admin primeiro

---

## PASSO 4: Testar no Celular Real (iPhone/Android)

### Prerequisitos
- App aberto **uma única vez** em wifi/rede (ativa o SW)
- Notificações **ativadas** via banner

### Cenários

#### Cenário A: Check-in de Aluno
1. Abra app em **Telefone A** (como aluno)
2. Na tela da aula, clique "Solicitar Check-in"
3. Abra app em **Telefone B** ou web (como admin/dono)
4. Notificação deve aparecer no Telefone B: `"✅ Check-in: João"`

#### Cenário B: Novo Aluno Cadastrado
1. Acesse `/cadastro?invite=...` (novo usuário)
2. Preencha e envie
3. Admin recebe notificação: `"Novo aluno aguardando aprovação"`

#### Cenário C: Aprovação de Aluno
1. Admin aprova novo aluno em `/alunos`
2. Aluno recebe notificação: `"🎉 Bem-vindo!"`

#### Cenário D: Check-in Aprovado
1. Aluno solicita check-in
2. Admin aprova
3. Aluno recebe notificação: `"✅ Check-in Aprovado"`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Notificação não aparece | Verificar: Notification.permission = "granted" no DevTools |
| SW não registrado | Limpar `.next`, recarregar, testar em `http://` (não `https`) ou domínio real |
| "push_not_configured" | VAPID keys faltando ou vazias em .env |
| VAPID inválida | Regenerar com `npx web-push generate-vapid-keys` |
| Erro 403 no /api/push/send | JWT expirado; fazer login novamente |
| Subscriptions não salva | Verificar RLS em `push_subscriptions` (admin pode READ, user pode INSERT own) |

---

## Métricas (Admin Dashboard)

Acesse `/will/push-debug` para:
- ✅ Testar push em tempo real
- 📊 Verificar VAPID status
- 🔍 Ver debugInfo de cada envio

---

## FAQ

**P: Por que aluno não recebe notificação?**
R: Notificações são brodcast por role. Aluno só recebe push que foi enviado com `targetRole: "aluno"`. Verifique se `sendPushToRole` está sendo chamado no evento.

**P: Notificação apareceu mas sem som/vibração?**
R: Options no `worker/index.ts` não configuram som. Navegador usa padrão do telefone. Personalize em `requireInteraction: true` para impedir fechamento automático.

**P: Posso testar offline?**
R: Push precisa de internet no servidor. Aluno com wifi ativa pode fazer check-in offline (fica pendente), e quando voltar online, sincroniza + recebe push retroativamente.

**P: Como saber se app foi aberto clicando na notificação?**
R: Service Worker abre `/dashboard` por padrão. Personalize `url` em `sendPushToRole({ ..., url: "/will/court" })`.

---

## Próximos passos (SPRINT 2)

- [ ] Analytics: rastrear "push sent" vs "notification clicked"
- [ ] Retry automático se FCM falhar
- [ ] Gerenciar preferências de notificação por aluno
- [ ] Notificações silenciosas (badge update sem som)

