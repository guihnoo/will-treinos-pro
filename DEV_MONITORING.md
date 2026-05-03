# 🔍 Development Monitoring — Real-Time App Visibility

Sistema de monitoramento em tempo real para acompanhar tudo que acontece no app em produção.

## Architecture

### Phase 1: Event Logging Infrastructure ✅

**Tabela Supabase: `dev_events`**
- Logs automáticos de eventos importantes
- Columns: `id`, `event_type`, `entity_type`, `entity_id`, `details` (JSONB), `created_at`, `created_by`
- RLS: leitura para staff (`wt_is_staff()` ou `students.role = 'admin'`) — ver migração `20260504110000_dev_events_realtime.sql`
- Helper function: `log_dev_event()` (chamada via AppContext)

**Event Types Tracked:**
- `student_created` — Novo aluno registrado
- `student_approved` — Aluno aprovado pelo admin
- `student_suspended` — Aluno suspenso
- `lesson_created` — Aula criada
- `lesson_updated` — Aula atualizada
- `lesson_deleted` — Aula removida
- `check_in_requested` — Aluno fez check-in
- `check_in_approved` — Admin confirmou check-in
- `check_in_rejected` — Admin rejeitou check-in
- `payment_created` — Pagamento criado
- `payment_marked` — Pagamento marcado como pago
- `notification_sent` — Notificação enviada
- `feed_post_created` — Post de feed criado
- `app_started` — App iniciado

### Phase 2: Monitor Dashboard ✅

**Rota: `/dev/monitor` (admin-only)**

Displays:
- **KPIs em Real-Time:**
  - Alunos ativos / pendentes / total
  - Receita do mês
  
- **Event Type Distribution:**
  - Contagem de cada tipo de evento
  - Ordenado por frequência
  
- **Event Feed:**
  - Últimos 50 eventos com timestamp
  - Entity type e ID
  - Details (JSON preview)
  - **Realtime:** subscrição `INSERT` em `dev_events` via hook `useDevEventsRealtime` (debounce ~350ms)
  - **Polling:** opcional 3s; sem Realtime conectado, fallback automático a cada **10s**

### Phase 3: Real-Time Subscriptions ✅

1. Migração `supabase/migrations/20260504110000_dev_events_realtime.sql`: política `SELECT` alinhada a `wt_is_staff()` + `ALTER PUBLICATION supabase_realtime ADD TABLE dev_events`.
2. Hook `src/hooks/useDevEventsRealtime.ts` — canal `willpro-dev-events`, evento `INSERT`.

**Aplicar migração no projeto Supabase** para o badge «Tempo real» ficar verde na UI.

## Usage

### For Developers

Acesse: `https://seu-app.com/dev/monitor`

Requer:
- Sessão de admin autenticada
- Supabase conectado

### For App

Logging é **fire-and-forget** (não bloqueia UX):

```typescript
import { logDevEvent } from "@/lib/devEventsLogger";

// Chamada assíncrona, não aguarda
void logDevEvent("student_created", "student", studentId, {
  name: student.name,
  email: student.email,
});
```

## Files

- `supabase/migrations/20260503150000_dev_events.sql` — Schema + RLS
- `src/lib/devEventsLogger.ts` — Helper TypeScript (typed event types)
- `src/app/dev/monitor/page.tsx` — Dashboard (admin-only)
- `src/context/AppContext.tsx` — Logging integrado em 5 pontos críticos

## Next Steps

1. **Test in Production:** Deploy e validar logs aparecem em `/dev/monitor`
2. **Phase 3:** Implementar Supabase Realtime (real-time push, sem polling)
3. **Alerts:** Opcional — disparar notificações em eventos críticos (payment failed, etc)
4. **Metrics:** Opcional — gráficos de tendências (new students over time, etc)
