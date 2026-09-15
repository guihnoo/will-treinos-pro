# ✅ Vercel Environment Variables Checklist

**Last Updated:** 2026-05-03
**Status:** Required before production deployment

> ⚠️ **Aviso de segurança:** Valores de produção nunca devem ser armazenados
> neste repositório. Use apenas os nomes definidos em `.env.example`. Valores
> reais ficam exclusivamente no painel da Vercel ou no `.env.local` ignorado
> pelo Git.

---

## 📋 Checklist — Variáveis Obrigatórias

| Variável | Origem | Propósito | Status | ✓ Setada |
|----------|--------|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | URL da API do Supabase | 🔴 Crítica | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Chave pública para cliente | 🔴 Crítica | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Chave para servidor (Push/AI/RLS admin) | 🔴 Crítica | ☐ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Gerado localmente | Chave pública VAPID (Web Push) | 🟡 Alta | ☐ |
| `VAPID_PRIVATE_KEY` | Gerado localmente | Chave privada VAPID (Web Push server) | 🟡 Alta | ☐ |
| `VAPID_SUBJECT` | Email do projeto | Subject para Web Push (email) | 🟡 Alta | ☐ |
| `NEXT_PUBLIC_DEV_ROOT_EMAILS` | Config local | Emails admin dev (bypass de RLS) | 🟡 Alta | ☐ |
| `ANTHROPIC_API_KEY` | Anthropic Console | API key para Oracle AI (Vercel AI SDK) | 🟡 Alta | ☐ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard | Error tracking (produção) | 🟢 Média | ☐ |
| `SENTRY_AUTH_TOKEN` | Sentry Dashboard | Upload de source maps | 🟢 Média | ☐ |

---

## 🔧 Como Setarr (4 passos)

### **Passo 1: Abrir Vercel Dashboard**

1. Abra https://vercel.com
2. Login com sua conta Vercel
3. Clique no projeto `will-treinos-pro`
4. Vá em **Settings** → **Environment Variables** (menu esquerdo)

### **Passo 2: Copiar valores de `.env.local`**

No seu computador, abra o arquivo `.env.local`:

```bash
# Terminal — copiar conteúdo
cat .env.local
```

Você vai ver algo assim (nomes de exemplo — nunca copie valores reais para
documentação ou commits):

```
NEXT_PUBLIC_SUPABASE_URL=<configurar no painel>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configurar no painel>
SUPABASE_SERVICE_ROLE_KEY=<NUNCA VERSIONAR>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<configurar no painel>
VAPID_PRIVATE_KEY=<NUNCA VERSIONAR>
VAPID_SUBJECT=<seu-email-de-contato>
NEXT_PUBLIC_DEV_ROOT_EMAILS=<email(s) admin, separados por vírgula>
ANTHROPIC_API_KEY=<NUNCA VERSIONAR>
```

### **Passo 3: Settar na Vercel**

Para cada variável:

1. Clique em **Add Environment Variable** (botão azul)
2. **Name:** cole o nome exato (ex: `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value:** cole o valor de `.env.local`
4. **Environment:** selecione `Production` (ou `All` se quiser que valha para todas)
5. Clique **Save**

**Repetir para todas as 10 variáveis.**

### **Passo 4: Validar e Deploy**

1. Na Vercel Dashboard, clique em **Deployments**
2. Clique no último deploy
3. Vá em **Logs** → procure por erros de env var ausentes
4. Se houver erro de var, adicione-a e re-deploy manualmente:
   - Clique em **Redeploy** na última linha
   - Ou faça um novo commit e push para trigger automático

---

## 🔐 Gerar VAPID Keys (se não existirem)

Se `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` não existem em `.env.local`:

```bash
# Terminal — gerar par de chaves VAPID
npx web-push generate-vapid-keys
```

O comando imprime um par `Public Key` / `Private Key` no terminal.

Copie e cole em `.env.local` (nunca em documentação ou commits):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<valor gerado pelo comando acima>
VAPID_PRIVATE_KEY=<NUNCA VERSIONAR>
VAPID_SUBJECT=<seu-email-de-contato>
```

Depois, repita **Passo 3** para settar na Vercel.

---

## 🚨 Checklist de Validação

Após settar todas as vars, execute no seu PC:

```bash
# 1. Certifique-se que o app builda localmente
pnpm run build
# ✓ exit 0

# 2. Faça um commit e push para trigger build automático na Vercel
git add -A
git commit -m "infra: add environment variables to Vercel"
git push origin main

# 3. Na Vercel Dashboard, veja o build rodando
# Clique em "Deployments" → último em cima
# Espere a barra chegar em 100%

# 4. Teste no link de produção
# Abra: https://will-treinos-pro.vercel.app
# Tente fazer login com Google
# ✓ Deve redirecionar para /cadastro ou /dashboard (não erro 500)
```

---

## ❌ Troubleshooting

### "Error: Missing Supabase configuration"
**Causa:** `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não setadas

**Solução:**
1. Vercel → Settings → Environment Variables
2. Verifique os nomes estão EXATOS (case-sensitive)
3. Cole os valores sem espaços extras
4. Clique **Save** novamente
5. Redeploy

### "Error: 500 Internal Server Error"
**Causa:** Pode ser `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, ou `VAPID_PRIVATE_KEY` ausentes

**Solução:**
1. Abra Vercel Logs: Deployments → Build logs
2. Procure por `error: Missing` ou `error: Undefined`
3. Adicione a var que falta
4. Redeploy

### "Web Push não funciona"
**Causa:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ou `VAPID_PRIVATE_KEY` inválidas ou ausentes

**Solução:**
1. Regenerate: `npx web-push generate-vapid-keys`
2. Atualize `.env.local`
3. Settar novamente na Vercel
4. Redeploy

---

## 📚 Referências

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Web Push Docs:** https://web.dev/notifications/
- **Anthropic API:** https://console.anthropic.com

---

## ✅ Conclusão

Após completar esta checklist:

- ✓ App builda em produção
- ✓ Login com Google funciona
- ✓ Admin vê alunos em `/alunos`
- ✓ Notificações chegam (se VAPID correto)
- ✓ Erro tracking em Sentry (se DSN correto)

**Próximo passo:** Testar a aplicação completa em https://will-treinos-pro.vercel.app

---

**Pronto!** Quando todas as vars estiverem setadas e o deploy passar, o app estará 100% configurado.
