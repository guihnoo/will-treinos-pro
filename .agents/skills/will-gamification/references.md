# 📚 Referências Internas — Gamification Motor

## Arquivos Críticos

### Cálculos de XP
- **`src/lib/gameRanks.ts`** — Tabela de multiplicadores, fórmula XP, funções auxiliares
  - `calculateXP(nota: number, fundamento: string, comboMultiplier?: number): number`
  - `getMultiplier(fundamento: string): number`
  - `isCardUnlocked(totalXP: number, cardType: CardType): boolean`

### Contextos de Estado
- **`src/context/CatalogContext.tsx`** — Estado global de cards, XP acumulado
  - `useCatalog().totalXP`
  - `useCatalog().unlockedCards`
  - `useCatalog().addXP(amount)`

- **`src/context/CoachingContext.tsx`** — Avaliações, check-ins
  - `useCoaching().evaluations`
  - `useCoaching().checkIns`
  - `useCoaching().submitEvaluation()`

### Banco de Dados (Supabase)
- **Migrations:**
  - `supabase/migrations/[...]/evaluations.sql` — Tabela de avaliações
  - `supabase/migrations/[...]/check_ins.sql` — Tabela de presença
  - `supabase/migrations/[...]/xp_events.sql` — Log de XP

- **RLS Policies:**
  - Aluno vê apenas suas avaliações
  - Professor vê sua turma
  - Admin vê tudo

### Componentes UI
- **Modais:**
  - `src/components/EvaluationModal.tsx` — Avalia fundamentoscom slider 1-10
  - `src/components/CheckInModal.tsx` — Check-in com validação GPS
  - `src/components/CardUnlockModal.tsx` — Animação de card desbloqueado

- **Cards Gamificação:**
  - `src/components/CardGrid.tsx` — Grade de cards (Bronze, Prata, Ouro, etc)
  - `src/components/RankingModal.tsx` — Ranking de turma com gráfico
  - `src/components/XPCounter.tsx` — Exibição animada de XP

### Hooks Especializados
- **`src/hooks/useXP.ts`**
  - `useXP()` — Expõe `totalXP`, `levelNumber`, `levelProgress`, `nextLevelXP`
  - Recalcula sempre que context muda

- **`src/hooks/useCheckIn.ts`**
  - `useCheckIn()` — Obtém localização, valida timestamp, envia para server
  - Retorna `{ success, error, xpAwarded }`

- **`src/hooks/useCardUnlock.ts`**
  - `useCardUnlock()` — Observa XP e desbloqueia cards automaticamente
  - Trigga animação quando card é desbloqueado

### Tipos TypeScript
- **`src/types/index.ts`**
  - `type CardType = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'elite'`
  - `type Fundamento = 'ataque' | 'levantamento' | 'bloqueio' | 'saque' | 'defesa' | 'recepcao' | 'posicionamento'`
  - `type Evaluation = { id, userId, lessonId, fundamento, nota, createdAt }`
  - `type CheckIn = { id, userId, lessonId, timestamp, geolocationHash }`
  - `type XPEvent = { id, userId, source, amount, date }`

---

## Fluxos Críticos

### Fluxo 1: Aluno recebe avaliação → XP é calculado

1. **Coach** avalia em `EvaluationModal` (fundamento + nota)
2. **Server** (Edge Function) calcula XP usando `calculateXP()`
3. **XP é registrado** em `xp_events` tabela
4. **Context atualiza** `totalXP` em tempo real
5. **Hook `useCardUnlock`** detecta novo level → desbloqueia card se aplicável
6. **Notificação** enviada ao aluno (Push + banner in-app)

### Fluxo 2: Aluno faz check-in → Presença validada

1. **Aluno** clica "Check-in Hoje" em `CheckInModal`
2. **Browser** solicita GPS do dispositivo
3. **Server** valida:
   - ✅ Timestamp dentro de ±15min da aula
   - ✅ GPS distância < 100m da quadra
   - ✅ Não há outro check-in no mesmo dia
4. **Se válido:** +50 XP registrado
5. **Se inválido:** Erro explicativo enviado
6. **RLS** garante que aluno só vê seu próprio check-in

### Fluxo 3: Ranking de turma atualiza

1. **Cron job** (weekly, domingo 23h59) executa:
   ```sql
   SELECT user_id, 
          SUM(xp) as total_xp,
          COUNT(DISTINCT lesson_id) as aulas,
          COUNT(card_id) as cards
     FROM xp_events, cards
    WHERE lesson.turma_id = $1
    ORDER BY (total_xp/100) + (aulas*10) + (cards*50) DESC
   ```
2. **Ranking salvo em `turma_rankings` table**
3. **Top 3 recebem notificação**
4. **Modal `RankingModal` exibe com gráfico Recharts**

---

## Configurações (`.env.local`)

```bash
# Validação de Check-in
NEXT_PUBLIC_QUADRA_LAT="-23.550520"   # Latitude da quadra
NEXT_PUBLIC_QUADRA_LNG="-46.633309"   # Longitude da quadra
NEXT_PUBLIC_CHECKIN_RADIUS_METERS="100"

# Supabase (RLS)
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Never in .env.local public

# Feature Flags (PostHog)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

---

## Testes

### Unit Tests
- `src/__tests__/gameRanks.test.ts`
  - ✅ Calcula XP corretamente
  - ✅ Combos multiplicam corretamente
  - ✅ Cards desbloqueiam nos thresholds certos

- `src/__tests__/checkIn.test.ts`
  - ✅ Valida GPS corretamente
  - ✅ Rejeita check-in fora de horário
  - ✅ Impede múltiplos check-ins no mesmo dia

### Integration Tests
- Avaliação → XP → Card unlock (fim a fim)
- Check-in com GPS fallback
- RLS: Aluno não pode ver avaliação de outro aluno

---

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| XP não sobe após avaliação | Context não sincroniza | Verificar `CatalogContext` subscription a `evaluations` |
| Card não desbloqueia | Threshold incorreto | Validar `getCardThreshold()` em `gameRanks.ts` |
| Check-in falha com GPS | Permissões do navegador | Testar em HTTPS (localhost ok para dev) |
| Ranking não atualiza | Cron não rodou | Verificar Supabase Cron Scheduler em Dashboard |
| RLS bloqueia query | Policies restritivas demais | Rodar `supabase migrations resolve` + test em anon mode |

---

**Última atualização:** 2026-05-03  
**Mantido por:** Claude Code + Volleyball Coach Agent
