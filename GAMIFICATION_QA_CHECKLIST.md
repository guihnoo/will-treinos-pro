# 🎮 Gamification QA Checklist — Phase 8-10 Validation

Complete este checklist para validar todas as features de gamificação antes de fazer deploy em staging/produção.

## 🔧 Setup

- [ ] Rodando `pnpm dev` localmente
- [ ] Logado como aluno (student role)
- [ ] Browser DevTools aberto para verificar console errors
- [ ] Banco de dados Supabase sincronizado

## ✅ Feature Tests

### 1. GamificationContext — XP Log Persistence
- [ ] Supabase: tabela `xp_log` existe e tem permissões RLS
- [ ] Supabase: tabela `awards` existe e tem 5 tiers
- [ ] Supabase: tabela `xp_multipliers` existe com 7 multiplicadores
- [ ] Tabela `xp_multipliers` seed data: ataque=2.0, levantamento=1.8, bloqueio=1.6, saque=1.5, defesa=1.4, recepção=1.3, posicionamento=1.2
- [ ] Tabela `awards` seed data: bronze(500), prata(1500), ouro(3000), diamante(6000), elite(10000)
- [ ] RLS policy: `xp_multipliers` permite leitura pública
- [ ] RLS policy: `xp_log` estudante vê só own, staff vê tudo, system insere
- [ ] RLS policy: `awards` estudante vê só own, staff vê tudo

### 2. Training Integration (/treinos)
- [ ] `/treinos` carrega com planos de treino
- [ ] Pode expandir planos
- [ ] Pode abrir exercícios em modal
- [ ] Pode marcar séries como completas
- [ ] Quando 100% de um plano completa: toast `🏆 Plano concluído! +50 XP ganho!`
- [ ] Toast desaparece após 3s
- [ ] Sem erros no console ao completar plano
- [ ] Mudança de estado é suave (not janky)

### 3. XPBadge Component (Dashboard)
- [ ] Dashboard mostra seção "Pontuação de XP"
- [ ] Exibe total XP (número grande)
- [ ] Exibe nível atual (Lv N)
- [ ] Exibe tier atual (Bronze/Prata/Ouro/Diamante/Elite)
- [ ] Progress bar mostra progresso para próximo nível
- [ ] Responsive: mobile (375px), tablet (768px), desktop (1920px)
- [ ] Dark theme respeitado (oro/dark/gold colors)

### 4. AwardShowcase Component (Dashboard)
- [ ] Seção "Cards de Conquista" visível
- [ ] 5 cards em grid: Bronze, Prata, Ouro, Diamante, Elite
- [ ] Cards desbloqueados têm cor do tier
- [ ] Cards bloqueados são cinzas/desaturados
- [ ] Progress bar em cada card mostra progresso para unlock
- [ ] Cards desbloqueados têm brilho/glow animado
- [ ] Cards próximos de desbloquear mostram: "✨ Pronto para desbloquear!"
- [ ] Responsive: 1 coluna mobile, 5 colunas desktop

### 5. XPHistoryList Component (Dashboard)
- [ ] Seção "Histórico de XP" visível
- [ ] Mostra até 5 entradas mais recentes
- [ ] Cada entrada mostra:
  - [ ] Ícone (CheckCircle para aula, MapPin para check-in, Users para social)
  - [ ] Label (Avaliação de Aula, Check-in, Ação Social)
  - [ ] Nota/descrição (se houver)
  - [ ] XP ganho (+50, +100, etc)
  - [ ] Data (format: "3 ago", "28 mai")
- [ ] Animações suaves ao carregar
- [ ] Se vazio: mensagem "Nenhum registro de XP ainda..."

### 6. GamificationPanel (Full Integration)
- [ ] GamificationPanel visível na dashboard
- [ ] Carrega com skeleton loaders enquanto busca dados
- [ ] XPBadge, AwardShowcase, XPHistoryList todos visíveis
- [ ] Smooth animations entre seções
- [ ] Dark theme/Gold colors aplicados corretamente
- [ ] Mobile scrolling funciona (overflow-y-auto)

### 7. Data Persistence — Supabase Sync
- [ ] Complete um plano em `/treinos`
- [ ] Aguarde toast
- [ ] Navegue para dashboard
- [ ] GamificationPanel mostra XP novo
- [ ] F5 (refresh page)
- [ ] XP persiste (não volta ao valor anterior)
- [ ] Abra DevTools → Application → Local Storage
- [ ] Supabase client tem auth token válido

### 8. RLS Security (Authorization)
**Simular com 2 students diferentes:**
- [ ] Student A: vê só seu XP histórico
- [ ] Student B: vê só seu XP histórico (não vê A)
- [ ] Coach/Admin: pode ver todos via dashboard de gestão
- [ ] Browser DevTools → Network: não há erros 403/401 para próprio user
- [ ] Tentar access outro student's XP via API manualmente → erro 403

### 9. XP Calculation (Math)
**Formula: `XP = 100 × (nota/10)² × 10 × multiplicador`**

Test cases (se system calcula XP em outro lugar):
- [ ] Nota 10, ataque: 100 × 1 × 10 × 2.0 = 2000 XP
- [ ] Nota 5, posicionamento: 100 × 0.25 × 10 × 1.2 = 300 XP
- [ ] Nota 0: 0 XP
- [ ] Nota > 10: capped at 10
- [ ] Nota < 0: capped at 0

### 10. Award Unlock Flow
- [ ] XP total atinge 500 → Bronze desbloqueado imediatamente
- [ ] XP 1500 → Prata desbloqueado
- [ ] XP 3000 → Ouro desbloqueado
- [ ] XP 6000 → Diamante desbloqueado
- [ ] XP 10000 → Elite desbloqueado
- [ ] Unlock date aparece em card (e.g., "Desbloqueado em 08 mai")
- [ ] Glow effect anima em card desbloqueado

### 11. Performance
- [ ] Dashboard carrega em < 2s
- [ ] XPHistoryList carrega em < 1s (com skeleton)
- [ ] Scroll é smooth (60fps)
- [ ] Componentes não causam re-renders desnecessários
- [ ] DevTools → Performance: sem long tasks
- [ ] Bundle size não aumentou significativamente

### 12. Mobile/PWA (Phase 11)
- [ ] App works no iOS Safari (test in dev)
- [ ] App works no Android Chrome
- [ ] GamificationPanel responsive em 375px viewport
- [ ] Cards não overflow
- [ ] Text não muito pequeno (min 12px)
- [ ] Icons visíveis e toques funcionam

### 13. Error Handling
- [ ] Se Supabase está offline: error message aparece gracefully
- [ ] Se usuário não está autenticado: não mostra dados sensíveis
- [ ] Se `useGamification` falha: não quebra página
- [ ] Console não tem erros tipo: "useGamification deve ser usado dentro..."

### 14. Accessibility
- [ ] Keyboard navigation funciona (Tab, Enter)
- [ ] Color contrast é suficiente (gold #EAB308 on black)
- [ ] Modals têm focus management
- [ ] Icons têm aria-labels ou alt text
- [ ] Form inputs têm labels associados

### 15. Browser Compatibility
- [ ] Chrome/Chromium ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

---

## 🚀 Pre-Deploy Checklist

Antes de fazer `git push origin main`:

- [ ] Todos os testes acima passados ✅
- [ ] E2E tests rodaram sem erros: `pnpm exec playwright test`
- [ ] Build verde: `pnpm run build` (exit 0)
- [ ] TypeScript clean: `pnpm exec tsc --noEmit`
- [ ] Sem console errors em browser
- [ ] Commit messages claros com referência ao Phase
- [ ] MASTER_MEMORY.md atualizado com status
- [ ] Feature branch é atualizada com main

---

## 🐛 Known Issues / Workarounds

| Issue | Workaround | Status |
|-------|-----------|--------|
| (none yet) | N/A | ✅ |

---

## 📊 Metrics to Track

Colete esses dados após deploy para entender impacto:

- [ ] Quantos alunos visualizaram gamification dashboard (analytics)
- [ ] Quantos completaram primeiro plano (XP log count)
- [ ] Quantos desbloquearam primeiro award (awards table unlock count)
- [ ] Bounce rate na página de treinos (antes vs depois)
- [ ] Time on page na dashboard (antes vs depois)

---

## 📝 Notes for Tester

Add notas aqui sobre issues encontrados:

```
[Data/Hora] — Descrição do issue
- Steps to reproduce:
- Expected:
- Actual:
- Severity: (Critical/High/Medium/Low)
```

---

**Last Updated:** 08/05/2026
**Tested By:** [Your Name]
**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Complete
