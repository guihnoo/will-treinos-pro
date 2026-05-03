# 🚨 Error Tracking com Sentry

## O Que É?

**Sentry** = Plataforma que captura erros em produção e avisa você em tempo real.

Sem Sentry:
- App quebra → usuário reclama 1 hora depois

Com Sentry:
- App quebra → Sentry envia email/slack em 1 minuto

---

## Setup (5 minutos)

### Passo 1: Criar Conta Sentry (grátis)

1. Acesse https://sentry.io/welcome/
2. Clique "Sign Up" (Google, GitHub ou email)
3. Escolha plano **Free** (5k events/mês grátis)

### Passo 2: Criar Projeto Next.js

1. Dashboard Sentry → Create Project
2. Selecione **Next.js**
3. Escolha alert rule: "Alert me on every issue"
4. Copie o **DSN** (algo como `https://xxxxx@xxxxx.ingest.sentry.io/999999`)

### Passo 3: Adicionar DSN Localmente

```bash
# .env.local (não commitar)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/999999
```

### Passo 4: Testar Localmente

```bash
pnpm dev
# Abrir http://localhost:3000
# Ir em DevTools Console e executar:
> throw new Error("Test error");
# Sentry deve capturar (não é enviado em dev, mas faz log)
```

### Passo 5: Deploy em Vercel

1. Vercel Dashboard → Seu projeto → Settings → Environment Variables
2. Adicionar: `NEXT_PUBLIC_SENTRY_DSN` = (seu DSN)
3. Redeploy
4. Testador qualquer erro em produção e receberá no Sentry

---

## Arquitetura

```
Browser (client)
  ↓
  throw Error("Não consigo fazer check-in")
  ↓
  sentry.client.config.ts captura
  ↓
  Envia para: https://sentry.io/...
  ↓
  Dashboard Sentry mostra erro
  ↓
  Email/Slack: "New Issue: TypeError in app"
```

---

## O Que É Capturado?

### ✅ Capturado
- Erros não tratados (uncaught exceptions)
- Network errors (falha ao comunicar com API)
- API route errors (POST /api/... retorna 500)
- Console.error()
- Promises rejeitadas
- React error boundaries

### ❌ Não Capturado
- Erros de lógica de negócio (ex: validação)
- Erros que você tratou com try-catch
- Avisos (console.warn)

---

## Dashboard Sentry

### Key Metrics

1. **Issues**: Problemas únicos agrupados
   - Ex: "TypeError: cannot read property 'push' of undefined" (5 occurrências)
2. **Events**: Ocorrências individuais
   - Cada erro é um event
3. **Release Tracking**: Qual versão tem mais erros
4. **Performance**: P95/P99 latência

### Workflow

```
Error chega → Sentry cria Issue
  ↓
Dashboard agrupa por tipo
  ↓
Email/Slack notifica
  ↓
Dev clica no email → Dashboard Sentry
  ↓
Vê: stack trace, timestamp, browser, OS, IP
  ↓
Clica "Resolve" (ou "Ignore")
```

---

## Filtrar Dados Sensíveis

Sentry NÃO captura automaticamente:
- Senhas (você já faz sanitização)
- Tokens (não enviamos em client)
- CPF/PII

Mas para garantir:

```typescript
// sentry.client.config.ts
Sentry.init({
  beforeSend(event) {
    // Remover headers (podem ter auth tokens)
    if (event.request) delete event.request.headers;
    return event;
  }
});
```

---

## Alertas

### Padrão (gratuito)

Sentry avisa quando:
- Novo tipo de erro (issue primeira vez)
- Erro atinge 10 occurrências
- Erro em release nova

### Avançado (pago)

- Alertas por taxa de erro (ex: >5% de requests falhando)
- Alertas de performance (LCP > 3s)
- Slack/Discord/webhook customizado

---

## Teste End-to-End

### Cenário A: Erro em componente

```tsx
// src/app/test-error/page.tsx
"use client";
export default function TestError() {
  throw new Error("Teste erro em componente");
}

// Acessar http://localhost:3000/test-error
// Deve capturar em Sentry
```

### Cenário B: Erro em API route

```ts
// src/app/api/test-error/route.ts
export async function GET() {
  throw new Error("Teste erro em API");
}

// POST http://localhost:3000/api/test-error
// Deve capturar em Sentry
```

### Cenário C: Network error

```tsx
// Fetch para URL inexistente
fetch('https://inexistente-123456.com/api')
  .catch(err => {
    // Sentry captura
  });
```

---

## Integração com Deploy

### GitHub → Vercel → Sentry

1. Faz push para main
2. GitHub Actions dispara Vercel build
3. Vercel detecta NEXT_PUBLIC_SENTRY_DSN
4. Build cria release no Sentry com commit SHA
5. Errors em produção são linkados ao commit

Resultado: Você clica no erro e vê qual commit o causou.

---

## Próximos Passos

- [ ] Criar conta Sentry (5 min)
- [ ] Copiar DSN
- [ ] Adicionar em .env.local
- [ ] Testar localmente
- [ ] Deploy em Vercel
- [ ] Configurar Slack/Email alerts

---

## FAQ

**P: Quanto custa?**
R: Grátis até 5k events/mês (suficiente para app novo). Depois é $29/mês.

**P: Dados meus ficam em segurança?**
R: Sentry usa TLS. Você pode usar self-hosted se quiser.

**P: Consigo ver quem é o usuário que teve o erro?**
R: Sim, adicione `setUser()` para capturar user_id e email do erro.

```typescript
import * as Sentry from '@sentry/nextjs';

const { user } = useAuth();
if (user) {
  Sentry.setUser({ id: user.id, email: user.email });
}
```

**P: Posso definir alertas customizados?**
R: Sim, em Alerts → Create Alert Rule (pago começa em $29).

