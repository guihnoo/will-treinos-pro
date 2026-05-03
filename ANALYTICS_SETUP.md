# 📊 Analytics com PostHog — Entender Comportamento de Usuários

## O Que É?

**PostHog** = Plataforma open-source que rastreia:
- Como usuários usam o app (eventos)
- Quantos usuários ativos por dia (DAU)
- Onde eles ficam (funnels/conversão)
- Quando saem (churn)
- Regravar sessões deles (replay)

---

## Setup (10 minutos)

### Passo 1: Criar Conta PostHog

1. Acesse https://posthog.com
2. Clique "Try for free"
3. Crie conta (GitHub, Google ou email)
4. Escolha plano **Free** (1M events/mês grátis)

### Passo 2: Copiar Credenciais

1. Dashboard → Projects → Your Project
2. Copy Project API Key (algo como `phc_XXXXX...`)
3. Copie também o Host (padrão: `https://us.posthog.com`)

### Passo 3: Adicionar em .env.local

```bash
# .env.local (não commitar)
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXX...
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

### Passo 4: Integrar no App

Já está integrado! Apenas abra `src/lib/analytics.ts` para ver todos os eventos.

### Passo 5: Testar

```bash
pnpm dev
# Abrir http://localhost:3000
# PostHog deve carregar no DevTools → Network → phc_...

# Fazer alguma ação (login, check-in, etc)
# PostHog Dashboard → Events → deve ver os eventos chegando
```

---

## Eventos Rastreados

### Auth
- `user_signup` (role)
- `user_login` (role)
- `user_logout`

### Check-in
- `check_in_requested` (lessonId, studentName)
- `check_in_approved` (studentId)
- `check_in_rejected` (studentId)

### Alunos
- `new_student_signup` (name, plan)
- `student_approved` (studentId, name)
- `student_suspended` (studentId)

### Pagamentos
- `payment_made` (amount, method, studentId)
- `payment_proof_submitted` (studentId)

### Feed
- `post_created` (postId, authorRole)
- `post_liked` (postId)
- `post_commented` (postId)
- `post_moderated` (postId, action)

### XP & Gamificação
- `xp_gained` (amount, source, studentId)
- `card_unlocked` (cardName, studentId)

### Feedback
- `lesson_rating_submitted` (lessonId, rating)
- `feedback_given` (studentId, category)

### Offline
- `offline_sync_started` (actionCount)
- `offline_sync_completed` (successCount, failureCount)

### Errors
- `error_occurred` (errorType, page)

---

## Como Usar em Componentes

### Exemplo 1: Rastrear um evento simples

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

export function CheckInButton() {
  const analytics = useAnalytics();

  const handleCheckIn = () => {
    // Fazer check-in
    analytics.checkInRequested('lesson_123', 'João Silva');
    // PostHog recebe o evento e registra
  };

  return <button onClick={handleCheckIn}>Check-in</button>;
}
```

### Exemplo 2: Rastrear XP ganho

```typescript
analytics.xpGained(100, 'lesson_completion', 'student_456');
```

### Exemplo 3: Rastrear funnel (conversão)

```typescript
// Novo aluno se cadastra
analytics.funnel.signupStep();

// Admin aprova aluno
analytics.funnel.approvalStep('student_789');

// Aluno faz primeiro check-in
analytics.funnel.firstCheckInStep('student_789');

// PostHog cria funil: signup → approval → check-in
// Você consegue ver taxa de conversão em cada etapa
```

---

## Dashboard PostHog

### Key Metrics

1. **Events**: Todos os eventos rastreados
   - Últimos 24h, últimos 7 dias, últimos 30 dias
   - Filtrar por tipo, user, propriedade

2. **DAU (Daily Active Users)**: Quantos usuários únicos por dia
   - Métrica principal de saúde do app

3. **Funnels**: Conversão de usuários
   - Signup → Approval → Check-in
   - Qual etapa tem drop-off?

4. **Retention**: Quantos voltam 7 dias depois
   - Métrica de engajamento

5. **Users**: Lista de usuários com histórico
   - Clique em um usuário → veja todas as ações
   - Session replay: rewatch como ele usou o app

### Exemplo Dashboard

```
🎯 Top Metrics (últimos 7 dias)
  DAU: 142
  Engaged users: 87 (61%)
  New signups: 23
  Check-ins completed: 156
  Avg session duration: 4m 32s

📈 Funnels
  Signup → Approval: 82% conversion
  Approval → First Check-in: 71% conversion
  Overall: 58% (signup → check-in)

🔴 Issues
  High bounce on /financeiro page (68%)
  Session recording: 3 users gravados
```

---

## Alertas

### Padrão (grátis)

- Novo evento tipo
- Threshold exceeded (ex: mais de 10 events/min)

### Avançado (pago)

- DAU cai 20%
- Churn semanal > 30%
- Erro rate > 5%
- Latência > 3s

---

## Privacy & Security

PostHog NÃO rastreia:
- Senhas
- Tokens (você não envia em eventos)
- Dados pessoais sensíveis

Seu dados:
- Armazenados na AWS
- Criptografados em trânsito (HTTPS)
- Você controla retenção (padrão 60 dias)

---

## Próximos Passos

### Integração Completa (1h)

1. [ ] Criar conta PostHog
2. [ ] Copiar API key
3. [ ] Adicionar em .env.local + Vercel
4. [ ] Testado localmente (events chegando)
5. [ ] Deploy em produção
6. [ ] Monitorar dashboard

### Análise (ongoing)

- [ ] Olhar DAU diariamente (semana 1)
- [ ] Identificar quem não faz check-in (drop-off)
- [ ] Melhorar página com taxa de bounce alta
- [ ] Celebrar quando DAU cresce 🎉

---

## FAQ

**P: Quanto custa?**
R: Grátis até 1M eventos/mês (~10k MAU). Depois é $25/mês + eventos extras.

**P: Meus dados estão seguros?**
R: Sim. PostHog é open-source, GDPR-compliant. Você pode até self-host.

**P: Posso rastrear usuário específico?**
R: Sim. PostHog automaticamente faz identify via userId.

**P: Preciso de analytics em produção?**
R: Sim, é crítico. Você quer saber como o app está sendo usado.

**P: Qual é alternativa?**
R: Mixpanel, Segment, Google Analytics, Amplitude. PostHog é open-source + privado.

---

## Checklist

```
Setup:
  ☐ Conta PostHog criada
  ☐ API key copiado
  ☐ .env.local atualizado
  ☐ Vercel env vars atualizado
  ☐ Redeploy Vercel

Testes:
  ☐ Localmente: events chegando
  ☐ Produção: events chegando
  ☐ DAU rastreando
  ☐ Funnels configurados

Monitoring:
  ☐ Olhar DAU diariamente
  ☐ Monitorar churn
  ☐ Identificar drops de conversão
```

---

**Status:** 🟢 READY TO TRACK USER BEHAVIOR

