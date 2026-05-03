# 🏐 Will Treinos PRO — Cursor AI Rules

## DNA Estético & Arquitetura

### Cores & Design
- **Dark theme:** `#000000` (preto puro)
- **Accent (Gold):** `#EAB308` (dourado energético)
- **Fundo cards:** `#0a0a0a` (quase preto, para depth)
- **Texto primary:** `#ffffff` (branco limpo)
- **Texto secondary:** `#a0a0a0` (cinza médio)
- **Alert/Positive:** `#10b981` (esmeralda)
- **Negativo:** `#ef4444` (vermelho)

### Padrões React + Next.js
- **Sempre use TypeScript strict mode** (`"strict": true` em tsconfig.json)
- **Server Components by default** — só `"use client"` quando precisa de interatividade
- **Context API para estado global** — evite Redux (overkill para este projeto)
- **Supabase RLS is the law** — nunca confie em filtros do frontend
- **No `any` type** — use `unknown` + type guards se necessário

### Convenções de Código
- **Componentes:** PascalCase (`LoginModal.tsx`)
- **Hooks:** camelCase, prefixo `use` (`useAuthStore.ts`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Utilitários:** camelCase (`formatXP.ts`, `calculateLevel.ts`)
- **Tipos:** PascalCase (`User`, `Lesson`, `CheckIn`)

### Gamificação
- **XP Calculations:** Sempre validar no backend (Supabase Edge Function)
- **Cards desbloqueáveis:** Estado controlado por `CatalogContext`
- **Ranks:** Bronze < Prata < Ouro < Diamante < Elite (hardcoded em `src/lib/gameRanks.ts`)
- **Check-in anti-cheat:** Usar geolocalização + timestamp validação
- **Motor de XP:** `(nota/10)² × 100 × 10 × multiplicador` — implementar em `calculateXP.ts`

### UI Components
- **Use `shadcn/ui`** para átomos (Button, Input, Modal, etc)
- **Tailwind CSS** para utility-first styling
- **Framer Motion** para animações (modais, transitions, cards flip)
- **Glassmorphism** para modais (`bg-black/80 backdrop-blur`)
- **Scroll lock mobile:** Use `useBodyScrollLock` hook (global lockCount)

### Modal-First Pattern
- **Fluxos internos** → modais/gavetas (não `router.push()`)
- **Navegação entre seções** → `router.push('/agenda')` apenas
- **Dentro de uma seção:** tudo é modal
- **Exemplo:** Check-in da aula → abre modal sobre o Cockpit

### Banco de Dados & RLS
- **Sempre escrever migrations SQL** (não "vou fazer manual")
- **RLS policies:** Row-Level Security por papel (`admin`, `professor`, `aluno`)
- **Foreign keys:** ON DELETE CASCADE quando apropriado
- **Índices:** Para colunas usadas em WHERE / JOIN
- **Tipos customizados:** ENUM para roles, status, tipos de aula
- **Never** usar NEXT_PUBLIC_ para dados sensíveis

### Segurança
- **Autenticação:** Supabase Auth (OAuth + email/password)
- **Autorização:** RLS no banco, middleware no app, checks no frontend (UI only)
- **Uploads:** Validar tipo + tamanho, gerar UUID no server
- **Sessões:** TTL de 30 dias (refresh automático)
- **Logs:** Registrar ações críticas (pagamentos, exclusões) para auditoria

### Performance
- **Bundle:** Máximo 150KB (JS gzipped) para mobile
- **Images:** Next.js `Image` component, WebP quando possível
- **Queries:** Evitar N+1, usar joins no Supabase
- **Memoization:** `useMemo` para cálculos pesados, `useCallback` para event handlers
- **Lazy load:** Modais e seções que não são imediatas

### Nomenclatura de Branches & Commits
- **Branch:** `feat/nome` ou `fix/nome` ou `refactor/nome`
- **Commit:** `feat(area): descrição` (ex: `feat(xp): calcular XP assimétrico`)
- **PR:** Descrição clara + testing checklist
- **Merge:** Sempre para `main` via PR (nunca força)

### Testes
- **Unit tests:** Funções puras (`calculateXP`, `formatDate`)
- **Integration:** Fluxos que tocam Supabase (check-in, avaliação)
- **E2E:** Jornadas críticas (login → check-in → avaliação)
- **Ferramenta:** Jest + Playwright (se houver CI/CD)

---

## 🔧 Checklist pré-commit

- [ ] TypeScript compila sem erros (`pnpm exec tsc --noEmit`)
- [ ] Sem `console.log` de debug (deixar `console.error` para erros reais)
- [ ] Sem imports não utilizados
- [ ] Sem `any` types (justificar se inevitável)
- [ ] Build verde (`pnpm run build`)
- [ ] RLS policies revisadas (se toca banco)
- [ ] Sem secrets em commits (`.env.local` nunca é committed)

---

## 🚀 Shortcuts úteis

- `/sprint` — Status do sprint + próximas prioridades
- `/xp` — Calculadora e validação de XP
- `/context` — Scaffold novo Context Provider
- `/modal` — Novo fluxo modal-first
- `/migration` — Guide para migrations Supabase

Ativa as regras acima em todos os commits e PR reviews.
