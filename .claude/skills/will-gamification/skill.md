# 🏐 Will Treinos — Gamification Motor Skill

Este é um skill customizado que torna Claude Code especialista em **gamificação, XP, cards, rankings e psicologia esportiva** do Will Treinos PRO.

## 🎯 Propósito

Quando você perguntar sobre:
- "Como calcular XP para uma avaliação de defesa?"
- "Quais fundamentos desbloqueiam cada card?"
- "Qual é a lógica do ranking de turma?"
- "Como anti-cheat o check-in?"

Claude Code saberá responder com **precisão do domínio esportivo** + **padrões técnicos** do Will.

---

## 🏅 Tabela de Fundamentos & Multiplicadores

| Fundamento | XP × | Risco | Técnica | Inteligência |
|---|---|---|---|---|
| **Ataque** (Cortada/Pipe/Back) | 2.0x | Alto | Hard | Ler bloqueio |
| **Levantamento** | 1.8x | Médio | Muito Hard | Timing + distribuição |
| **Bloqueio** | 1.6x | Médio | Hard | Antecipação |
| **Saque** (Float/Jump/Potência) | 1.5x | Médio | Hard | Poder + controle |
| **Defesa** (Mergulho/Rolamento) | 1.4x | Alto | Hard | Reflexo |
| **Recepção** (W/Japonesa) | 1.3x | Médio | Médium | Leitura de saque |
| **Posicionamento** | 1.2x | Baixo | Fácil | Jogo coletivo |

**Nota:** Ranking esportivo é subjetivo. Coach avalia 1-10; sistema calcula XP assimétrico.

---

## 💡 Fórmula de XP

```
XP = 100 × (nota/10)² × 10 × multiplicador × bonus_combo
```

**Exemplos:**
- Cortada com nota 8 (Ataque 2.0x): `100 × 0.64 × 10 × 2.0 = 1280 XP`
- Levantamento com nota 6 (Levantamento 1.8x): `100 × 0.36 × 10 × 1.8 = 648 XP`
- Posicionamento com nota 10 (Posicionamento 1.2x): `100 × 1 × 10 × 1.2 = 1200 XP`

**Bonus combo:** Se o aluno executa 3+ movimentos em uma aula, ganha 1.1x multiplier.

---

## 🎴 Cards Desbloqueáveis

| Card | XP Requerido | Desbloqueio | Estatísticas |
|---|---|---|---|
| 🥉 **Bronze** | 500 | Primeiro check-in | +5% XP em aulas |
| 🥈 **Prata** | 1.500 | 3 aulas completas | +10% XP, +1 streak dia |
| 🥇 **Ouro** | 3.000 | Avaliação máxima em 1 fundamento | +15% XP, acesso a treino premium |
| 💎 **Diamante** | 6.000 | 50+ aulas + 1500 XP em combos | +20% XP, mentor skill unlock |
| ⭐ **Elite** | 10.000 | Ranking #1 na turma por 1 mês | +30% XP, video feedback do coach |

---

## 🔐 Check-in Anti-Cheat

### Fluxo Legítimo
1. Aluno abre app na quadra (móvel)
2. Clica botão "Check-in Hoje"
3. Servidor valida:
   - ✅ Timestamp: dentro de horário da aula (±15 min)
   - ✅ Localização: raio ≤ 100m da quadra (GPS)
   - ✅ Frequência: só 1 check-in por dia (mesmo que tente N vezes)
4. Banco registra evento com hash de prova (timestamp + GPS)

### Proteções
- **Geolocalização:** Sem GPS = 10 XP (externo, menor valor)
- **Timestamp mismatch:** ±1h da aula = aviso ao coach
- **Múltiplos check-ins:** 2º tentativa no mesmo dia = bloqueado
- **Logs auditoria:** Supabase registra IP + user agent para análise de fraude

---

## 🏆 Ranking de Turma

**Opt-in apenas** (aluno ativa em Settings).

### Lógica
```
score = (total_xp / 100) + (aulas_assistidas × 10) + (cards_desbloqueados × 50) - (faltas × 5)
```

**Atualização:** Semanal (domingo 23h59).

**Prêmios** (sugestão):
- 🥇 1º: +100 XP bonus
- 🥈 2º: +50 XP bonus
- 🥉 3º: +25 XP bonus

---

## 🤖 Lógica de Notificações

| Evento | Quando | Mensagem |
|---|---|---|
| **Card Desbloqueado** | XP atinge threshold | "🎴 Bronze card desbloqueado! +5% XP" |
| **Avaliação Recebida** | Coach avalia | "📊 Defesa avaliada em 7/10 (630 XP)" |
| **Combo XP** | 3+ movimentos na mesma aula | "🔥 Combo! +1.1x multiplier" |
| **Ranking Top 3** | Score mudar top 3 | "🏆 Você entrou no top 3! (semana)" |
| **Treino Sugerido** | IA detecta ponto fraco | "⚠️ Coach sugere treino: Levantamento" |
| **Falsa Tentativa** | Check-in fora de horário | "⏰ Check-in inválido. Tente novamente dentro da aula" |

---

## 📊 Dados do Contexto (Supabase RLS)

Tabelas principais:
- `lessons` — Aulas agendadas (data, turma, tipo)
- `evaluations` — Avaliações (aluno, fundamento, nota, professor)
- `check_ins` — Presença (timestamp, geolocalização hash)
- `xp_events` — Histórico de XP (source, amount, date)
- `cards` — Cards desbloqueados (user, card_type, unlocked_at)

**RLS:** Aluno só vê seus dados. Professor vê sua turma. Admin vê tudo.

---

## 🎨 Padrões Técnicos

### Componentes
- `XPCounter.tsx` — Exibe XP animado com Framer Motion
- `CardGrid.tsx` — Cards em grid, flip animation para unlock
- `CheckInButton.tsx` — Modal de check-in com GPS fallback
- `RankingModal.tsx` — Ranking de turma com gráfico

### Hooks Customizados
- `useXP()` — Calcula XP em tempo real
- `useCheckIn()` — Gerencia geolocalização + validação
- `useCardUnlock()` — Observa XP e desbloqueia cards
- `useRanking()` — Real-time ranking query

### Context
- `GamificationContext` — Estado global de XP, cards, ranking
- Sincroniza com `evaluations`, `check_ins` em Supabase

---

## 🚀 Ativação

Este skill fica **ativo por padrão** quando você trabalha em:
- Funções de XP (`calculateXP`, `validateCheckIn`)
- Componentes de gamificação (`CardGrid`, `RankingModal`)
- Migrations de `evaluations` ou `check_ins`
- Perguntas sobre regras esportivas do Will

**Use-o assim:**
```
"Cria uma função que calcula XP para defesa com nota 7, considerando combo 1.1x"
```

Claude Code saberá exatamente o que fazer porque este skill injetou o contexto.

---

## 📚 Referências

- Motor de XP: `src/lib/gameRanks.ts`
- Contexto de Gamificação: `src/context/CatalogContext.tsx`
- Hooks: `src/hooks/useXP.ts`, `src/hooks/useCheckIn.ts`
- RLS: `supabase/migrations/` (buscar `evaluations`, `check_ins`)

---

**Criado em:** 2026-05-03  
**Mantido por:** Claude Code + Volleyball Coach Agent
