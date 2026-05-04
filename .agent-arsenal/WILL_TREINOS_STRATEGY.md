# 🧠 WILL TREINOS PRO — ESTRATÉGIA DE ARSENAL COMPLETA
> Análise estratégica profunda: o que o projeto REALMENTE precisa vs o que existe disponível.
> Baseada no DNA do projeto: PWA esportivo, gamificação, SaaS multi-role, real-time.

---

## 💡 SOBRE A INTELIGÊNCIA DO CLAUDE CODE

**Resposta: SIM, o Claude Code tem capacidade de auto-delegação!**

O campo `description` no YAML do subagente funciona como um **sistema de roteamento inteligente**. O Claude lê sua solicitação, compara com as descrições dos agentes disponíveis, e escolhe automaticamente o correto.

**Exemplo prático:**
```
Você: "Está lento o dashboard do aluno quando carrega os treinos"
↓ Claude analisa...
→ Chama 'performance-engineer' (detectou "lento" + "carrega")
→ Chama 'nextjs-developer' para corrigir o código
→ Chama 'ui-ux-tester' para validar a correção
→ Retorna apenas o resultado final para você
```

**Padrão Hub-and-Spoke:**
```
SUA SOLICITAÇÃO
     ↓
 ORQUESTRADOR (Claude principal)
   ↙    ↓    ↘
QA   NEXT.JS  SECURITY
testa  codifica  audita
   ↘    ↓    ↙
  RESULTADO FINAL
```

---

## 🎯 DNA DO PROJETO — O QUE O WILL TREINOS REALMENTE É

```
WILL TREINOS PRO = 
  SaaS Multi-Role (Admin + Coach + Aluno)
  + PWA Nativo (offline, push, installable)
  + Gamificação Assimétrica (XP por fundamento)
  + Real-time (check-ins, aprovações ao vivo)
  + Sports Management (vôlei, fundamentos, evolução)
  + Prescrição de Treinos (CRUD coach → aluno)
```

**Lacunas identificadas que precisamos fechar:**
1. 🔔 **Push Notifications reais** (não mock) — aprovações, prescrições
2. 📊 **XP Log com auditoria** — rastrear todo ponto ganho/perdido
3. 📱 **PWA Service Worker** — offline mode, install prompt
4. ⚡ **Real-time Supabase** — aprovações ao vivo no cockpit admin
5. 🏋️ **CRUD de Treinos completo** — editor, template por fundamento
6. 📈 **Analytics** — quem treina mais, fundamento mais treinado
7. 🔐 **RLS completo** — todas as 5 tabelas principais

---

## 🏆 ARSENAL ESSENCIAL — MAPEADO POR NECESSIDADE DO PROJETO

### CAMADA 1 — MCPs (Ferramentas com "mãos")

| MCP | Por que é ESSENCIAL para o Will Treinos | Instalar |
|-----|----------------------------------------|---------|
| **`@playwright/mcp`** | Testa o fluxo real: login → check-in → aprovação → XP | `npx -y @playwright/mcp@latest` |
| **`@supabase/mcp-server-supabase`** | Fala direto com o banco: cria tabelas, testa RLS, faz seed | `npx -y @supabase/mcp-server-supabase@latest` |
| **`context7`** | Docs always-up-to-date de Next.js 15, Supabase, Framer Motion | `npx -y @upstash/context7-mcp` |
| **`@modelcontextprotocol/server-memory`** | Persiste decisões entre sessões (não perde o contexto) | `npx -y @modelcontextprotocol/server-memory` |
| **`@wonderwhy-er/desktop-commander`** | Roda `npm run build`, `npx playwright test`, verifica erros | já existe |
| **`@modelcontextprotocol/server-github`** | Cria issues quando testes quebram, gerencia PRs | `npx -y @modelcontextprotocol/server-github` |
| **`mcp-server-vercel`** (ou dashboard) | Monitora deploys, logs de produção, rollback | via Vercel CLI MCP |

### CAMADA 2 — Subagentes Claude Code (Especialistas)

| Subagente | Por que é ESSENCIAL | Gatilho automático |
|-----------|--------------------|--------------------|
| **`nextjs-developer`** ✅ | Feature development Next.js 15 | "implementar", "criar página", "componente" |
| **`ui-ux-tester`** ✅ | Testa fluxos documentados exaustivamente | "testar", "verificar UI", "fluxo" |
| **`performance-engineer`** ⭐ | PWA precisa de Lighthouse ≥90 | "lento", "otimizar", "bundle", "LCP" |
| **`postgres-pro`** ⭐ | Queries Supabase, índices, RLS policies | "query", "banco", "RLS", "migration" |
| **`will-security-auditor`** ✅ | Antes de qualquer deploy | "deploy", "produção", "segurança" |
| **`will-design-guardian`** ✅ | Rejeita UI fora do padrão | "componente", ".tsx", "Tailwind" |
| **`pwa-specialist`** ⭐ NEW | Service Worker, manifest, push, offline | "PWA", "push", "offline", "install" |
| **`xp-gamification`** ⭐ NEW | Lógica de XP, níveis, multiplicadores vôlei | "XP", "gamificação", "nível", "pontos" |
| **`realtime-engineer`** ⭐ NEW | Supabase Realtime, canais, subscriptions | "real-time", "ao vivo", "channel" |
| **`workflow-orchestrator`** ⭐ | Coordena múltiplos agentes em paralelo | tarefas complexas multi-etapa |

### CAMADA 3 — Cursor Rules (Guardiões Automáticos)

| Rule | Função | Arquivo |
|------|--------|---------|
| **`nextjs-15-expert`** ✅ | Next.js 15 breaking changes, App Router | `.cursor/rules/nextjs-15-expert.mdc` |
| **`supabase-expert`** ✅ | Schema, RLS, queries type-safe | `.cursor/rules/supabase-expert.mdc` |
| **`will-design-system`** ✅ | Gold + Black + Framer Motion | `.cursor/rules/will-design-system.mdc` |
| **`will-tdd-enforcer`** ✅ | Testes antes de features | `.cursor/rules/will-tdd-enforcer.mdc` |
| **`pwa-standards`** ⭐ NEW | Web Push VAPID, Service Worker, manifest | `.cursor/rules/pwa-standards.mdc` |
| **`gamification-rules`** ⭐ NEW | XP assimétrico, multiplicadores, níveis | `.cursor/rules/gamification-rules.mdc` |

---

## 🕸️ HOOKS ESSENCIAIS — React Hooks Customizados

Estes hooks são fundamentais para o projeto e devem ser implementados:

```typescript
// hooks/useXP.ts — Gamificação
export function useXP(studentId: string) {
  // Retorna: xpTotal, level, nextLevelXP, recentGains, multiplier
}

// hooks/useRealtime.ts — Supabase Realtime
export function useRealtime<T>(table: string, filter?: string) {
  // Retorna: data, isConnected, lastEvent
}

// hooks/usePushNotifications.ts — Web Push API
export function usePushNotifications() {
  // Retorna: permission, subscribe, unsubscribe, isSupported
}

// hooks/useCheckIn.ts — Fluxo de check-in
export function useCheckIn(studentId: string) {
  // Retorna: submit, pending, approved, rejected, history
}

// hooks/usePWA.ts — PWA Install Prompt
export function usePWA() {
  // Retorna: canInstall, install, isInstalled, isOnline
}

// hooks/useRole.ts — Verificação de role
export function useRole() {
  // Retorna: role, isAdmin, isCoach, isStudent, canImpersonate
}

// hooks/useTrainingPlan.ts — CRUD de treinos
export function useTrainingPlan(planId?: string) {
  // Retorna: plan, save, delete, prescribe, exercises
}
```

---

## 🎮 MÉTODOS ESSENCIAIS — Funções Core do Negócio

```typescript
// lib/xp/calculator.ts
calculateXP(event: XPEvent, fundamento: Fundamento): number
// Multiplicadores: saque(1.2x), recepção(1.1x), levantamento(1.3x)
// ataque(1.0x), bloqueio(1.15x), defesa(1.05x)

// lib/xp/logger.ts
logXPEvent(studentId: string, event: XPEventType, amount: number, refId?: string): Promise<void>
// Grava em xp_log com auditoria completa

// lib/notifications/push.ts
sendPushToUser(userId: string, payload: PushPayload): Promise<void>
sendPushToAdmins(payload: PushPayload): Promise<void>
// Usa web-push lib com VAPID keys

// lib/training/prescriber.ts
prescribeTraining(coachId: string, studentId: string, plan: TrainingPlan): Promise<void>
// Cria o plano + notifica o aluno + loga no history

// lib/training/templates.ts
getTemplateByFundamento(fundamento: Fundamento): Exercise[]
// Templates pré-prontos por fundamento de vôlei

// lib/pwa/serviceWorker.ts
registerServiceWorker(): Promise<ServiceWorkerRegistration>
subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription>

// lib/realtime/channels.ts
subscribeToCheckIns(coachId: string, onNew: (checkIn: CheckIn) => void): RealtimeChannel
subscribeToNotifications(userId: string, onNew: (notif: Notification) => void): RealtimeChannel
```

---

## 🔥 O QUE MAIS AGREGA AO PROJETO (ANÁLISE ESTRATÉGICA)

### TOP 5 itens que transformariam o Will Treinos em um produto de classe mundial:

**1. 🏆 Context7 MCP (IMPACTO IMEDIATO)**
> O Claude para de usar APIs desatualizadas do Next.js e Supabase.
> Toda query, todo componente, toda config — sempre na versão mais recente.
> `npx ctx7 setup` — instala em 30 segundos.

**2. 🔔 PWA Specialist Subagente (DIFERENCIAL)**
> O Will Treinos PRECISA ser um PWA real: funcionar offline, mandar push, ser instalável.
> Um subagente especializado em Web Push API + Service Worker garante que o código esteja correto.
> Atualmente é o maior gap do projeto.

**3. ⚡ Supabase MCP Oficial (PRODUTIVIDADE)**
> Em vez de escrever SQL manualmente para cada teste de RLS, o Claude acessa diretamente.
> Valida se as policies estão corretas, cria dados de seed, testa cenários edge.
> `npx -y @supabase/mcp-server-supabase@latest`

**4. 🎮 XP Gamification Subagente (CORE DO PRODUTO)**
> O sistema de XP do Will Treinos é assimétrico (diferentes multiplicadores por fundamento).
> Um subagente especializado garante consistência matemática e lógica de negócio correta.
> Previne bugs onde um aluno ganha XP errado ou level errado.

**5. 📊 Performance Engineer Subagente (QUALIDADE)**
> PWA precisa de Lighthouse ≥90 para funcionar bem em celulares de alunos.
> O `performance-engineer` analisa bundle, detecta N+1 queries no Supabase, otimiza.
> Impacto direto na experiência do aluno no dia a dia.

---

## 📋 PLANO DE INSTALAÇÃO — ORDEM OTIMIZADA

### Fase 1 — Infraestrutura (hoje, 30 min)
```bash
# 1. Context7 — docs always updated
npx ctx7 setup

# 2. Supabase MCP oficial
# Adicionar em .claude/mcp.json

# 3. Playwright MCP (Microsoft oficial)
npx -y @playwright/mcp@latest
```

### Fase 2 — Subagentes (hoje, 20 min)
```bash
# VoltAgent — instalar plugins específicos
claude plugin marketplace add VoltAgent/awesome-claude-code-subagents
claude plugin install voltagent-qa-sec      # performance-engineer, ui-ux-tester
claude plugin install voltagent-data-ai     # postgres-pro
claude plugin install voltagent-meta        # workflow-orchestrator
```

### Fase 3 — Subagentes Customizados (15 min)
Os arquivos já estão em `.claude/agents/`:
- `pwa-specialist.md` ← criar agora
- `xp-gamification.md` ← criar agora
- `realtime-engineer.md` ← criar agora

### Fase 4 — Cursor Rules (10 min)
Os arquivos já estão em `.cursor/rules/`:
- `pwa-standards.mdc` ← criar agora
- `gamification-rules.mdc` ← criar agora

---

## 🗺️ ARQUITETURA DO ESQUADRÃO COMPLETO

```
WILL TREINOS ENGINE v2.0
│
├── 🧠 CLAUDE CODE (Orquestrador Central)
│   ├── Lê: CLAUDE.md + WILLPRO_MASTER_MEMORY.md
│   └── Roteia automaticamente para o subagente correto
│
├── ⚡ MCPs ATIVOS (Ferramentas Reais)
│   ├── playwright     → testa UI no browser real
│   ├── supabase       → acessa banco diretamente
│   ├── context7       → docs Next.js/Supabase atualizadas
│   ├── memory         → persiste contexto entre sessões
│   ├── github         → gerencia issues e PRs
│   └── desktop-cmd    → roda shell commands
│
├── 🤖 SUBAGENTES ESPECIALIZADOS (.claude/agents/)
│   │
│   ├── 💻 DESENVOLVIMENTO
│   │   ├── nextjs-developer     → App Router, Server Actions
│   │   ├── pwa-specialist       → Service Worker, Web Push
│   │   └── realtime-engineer    → Supabase Realtime
│   │
│   ├── 🎮 DOMÍNIO DE NEGÓCIO
│   │   ├── xp-gamification      → XP, níveis, multiplicadores vôlei
│   │   └── volleyball-coach     → lógica esportiva, fundamentos
│   │
│   ├── 🔬 QUALIDADE
│   │   ├── ui-ux-tester         → testa todos os fluxos
│   │   ├── will-qa-tester       → E2E Playwright específico
│   │   ├── performance-engineer → Lighthouse, bundle, N+1
│   │   └── will-design-guardian → Gold/Black/Framer Motion
│   │
│   ├── 🔐 SEGURANÇA
│   │   ├── will-security-auditor → RLS, JWT, env vars
│   │   └── postgres-pro          → queries, índices, migrations
│   │
│   └── 🎭 ORQUESTRAÇÃO
│       └── workflow-orchestrator → coordena múltiplos agentes
│
├── 📏 CURSOR RULES (.cursor/rules/)
│   ├── nextjs-15-expert.mdc     → Next.js 15 breaking changes
│   ├── supabase-expert.mdc      → schema + RLS patterns
│   ├── will-design-system.mdc   → Gold + Black + Framer
│   ├── will-tdd-enforcer.mdc    → testes antes de features
│   ├── pwa-standards.mdc        → Web Push + Service Worker
│   └── gamification-rules.mdc   → XP assimétrico + multiplicadores
│
└── 📊 MEMÓRIA DO PROJETO
    └── WILLPRO_MASTER_MEMORY.md (fonte da verdade)
```

---
*Data: 2026-05-04 | Análise estratégica profunda para Will Treinos PRO*
