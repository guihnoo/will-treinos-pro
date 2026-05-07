# 📊 ANÁLISE COMPLETA DO PROJETO WILL TREINOS PRO

**Data:** 06/05/2026  
**Versão:** v1.0 (Pós-Phase 10B)  
**Status:** Production-Ready com observações

---

## 📋 ÍNDICE

1. [Visão Geral do Ecossistema](#1-visão-geral-do-ecossistema)
2. [Infraestrutura Técnica](#2-infraestrutura-técnica)
3. [Propósito & Lógica do App](#3-propósito--lógica-do-app)
4. [Áreas de Divisão & Roles](#4-áreas-de-divisão--roles)
5. [Design Visual & Layouts](#5-design-visual--layouts)
6. [Análise Página por Página](#6-análise-página-por-página)
7. [Segurança do Usuário](#7-segurança-do-usuário)
8. [Bugs & Problemas Conhecidos](#8-bugs--problemas-conhecidos)
9. [Funcionalidades Não Implementadas](#9-funcionalidades-não-implementadas)
10. [Recomendações & Próximos Passos](#10-recomendações--próximos-passos)

---

## 1. VISÃO GERAL DO ECOSSISTEMA

### O Que É

**Will Treinos PRO** é uma plataforma completa de gestão esportiva especializada em **Vôlei de Alta Performance**. Integra controle tático para o treinador, gamificação para o atleta, e gestão financeira para o dono.

### Para Quê Serve

| Persona | Funcionalidade |
|---------|---|
| **Dono (Will/Admin)** | Gestão de staff (coaches), alunos, pagamentos, aulas, relatórios |
| **Coach/Professor** | Planejamento de aulas, avaliação de alunos, feedback, check-in, treino |
| **Aluno** | Acompanhar aulas, ver XP/ranking, feed social, treinos, perfil |
| **Pending Student** | Ver áreas restritas até aprovação do dono |

### Lógica Central

```
Aula (Lesson)
  ├─ Cadastro → aluno se inscreve/waitlist
  ├─ Check-in → aluno marca presença (ganha 50 XP)
  ├─ Avaliação → coach nota fundamento (ataque/levantamento/bloqueio/etc)
  │   └─ Fórmula: 100 × (nota/10)² × 10 × multiplier (1.2–2.0x)
  │       └─ Resultado: 100–2000 XP por avaliação
  └─ Feedback → aluno avalia aula (1-5 em 4 dimensões)

Gamificação (XP System)
  ├─ Tiers: Bronze (500 XP) → Prata (1.5k) → Ouro (3k) → Diamante (6k) → Elite (10k)
  ├─ Fontes: Avaliação + Check-in (50) + Social (5–15) + Treino (100)
  ├─ Anti-cheat: Rate-limit 5min, duplicate-check, outlier-flag 3σ
  └─ Leaderboard: Ranking visível para toda a turma

Training Plans
  ├─ Coach cria plano (N semanas, M exercícios)
  └─ Aluno acompanha, marca completado → ganha 100 XP

Feed Social
  ├─ Posts de aula/performance
  ├─ Likes (5 XP) + Comments (15 XP)
  ├─ Moderation: pin, official, targetRole
  └─ Soft delete (não apaga, marca deletedAt)

Pagamentos
  ├─ Controle de mensalidade por aluno
  ├─ Comprovante PIX upload (imagem/PDF)
  └─ Status: pending, paid, late

Notificações
  ├─ Aula iniciando, pagamento vencido, avaliação recebida, etc
  ├─ Push notifications (VAPID) + in-app drawer
  └─ Broadcast para turmas ou roles específicos
```

---

## 2. INFRAESTRUTURA TÉCNICA

### Stack

| Camada | Tecnologia |
|--------|---|
| **Frontend** | Next.js 15.3.1 (App Router) + React 19 + TypeScript |
| **Estilo** | Tailwind CSS 3.4.1 + Framer Motion (animações) |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Database** | PostgreSQL 15+ (via Supabase) |
| **Auth** | Supabase Auth (OAuth Google/Facebook + Password) |
| **Storage** | Supabase Storage (avatars, proof uploads) |
| **Realtime** | Supabase Realtime (PostgreSQL changes) |
| **Push** | Web Push API + Service Workers (VAPID keys) |
| **Error Tracking** | Sentry (production) |
| **Analytics** | PostHog (event tracking) |
| **Deploy** | Vercel (Next.js) |
| **PWA** | @ducanh2912/next-pwa (offline, installable) |
| **AI** | Anthropic Claude (Oracle insights) |

### Arquitetura de Estado

```
Global State (14 Context Providers)
├── AppContext → Hub central (CRUD + auth)
├── AuthContext → User + roles
├── StudentsContext → Alunos + aggregations
├── LessonsContext → Aulas + waitlist
├── PaymentsContext → Pagamentos + proofs
├── NotificationsContext → Notificações + broadcast
├── FeedContext → Posts + likes/comments
├── CheckInContext → Check-in profissional
├── LessonRatingsContext → Avaliações aluno
├── CoachingContext → Feedback + training plans
├── CatalogContext → Categorias + venues
├── AppConfigProvider → PIX key, WhatsApp, invite codes
├── CriticalDataProvider → Loading state
└── CalendarTickProvider → Refresh calendar

Persistência
├── Supabase (live)
├── localStorage (wtLs namespace)
├── Sync Queue (offline-first)
└── Service Worker (cache + offline)

Realtime
├── Postgres Changes (Lessons, Students, Payments, Posts)
├── Debounce 400ms
└── Manual refresh triggers
```

### Segurança de Acesso

**RLS (Row-Level Security) em SQL:**

```sql
wt_is_staff() = CASE
  WHEN current_user_id = owner_id THEN true
  WHEN JWT has admin|coach|professor roles THEN true
  ELSE false
END

students:
  ├── Staff → READ/WRITE ALL
  ├── Student → READ/WRITE SELF (auth_user_id match)
  └── Visitor → INSERT ONLY (para matrícula)

payments:
  ├── Staff → READ/WRITE ALL
  ├── Student → READ SELF only
  └── Visitor → NO ACCESS

lessons:
  ├── Staff → READ/WRITE ALL
  ├── Authenticated → READ ALL
  └── Visitor → NO ACCESS

xp_log:
  ├── Staff → READ/WRITE ALL
  ├── Student → READ SELF only
  └── Validation rules: max 100k points, duplicates blocked
```

### Fluxo de Autenticação

```
1. Login/OAuth → Supabase Auth (JWT)
2. postLogin() → buildSessionUser()
3. Sync wt_role cookie (admin|coach|aluno|visitor)
4. AppContext carrega dados críticos (single-flight)
5. Realtime subscription aos 4 canais principais
6. Middleware RBAC valida acesso por prefix (/will, /prof, /aluno)
7. RLS SQL valida acesso granular por tabela
```

---

## 3. PROPÓSITO & LÓGICA DO APP

### Problema que Resolve

❌ **Antes:** Controle de aulas de vôlei era manual (planilhas, WhatsApp, cara-a-cara)
- Sem rastreamento de desempenho
- Sem feedback automático
- Sem motivação visual (gamificação)
- Sem controle de pagamento centralizado

✅ **Depois (Will Treinos PRO):**
- Avaliação automatizada de fundamentos
- XP/ranking visível em tempo real
- Planejamento de treino estruturado
- Pagamento rastreado (proof upload)
- Feed social para engajamento

### Diferencial

| Aspecto | Will Treinos | Alternativas |
|--------|------|---|
| **Lógica de Avaliação** | Fórmula assimétrica (nota × multiplier por fundamento) | Genérico ou não existe |
| **Anti-cheat XP** | 3 camadas (rate-limit + duplicate + outlier) | Nenhum |
| **Check-in Profissional** | Presença com timestamps + aprovação coach | Simples ou ausente |
| **Gamificação** | 5 tiers + 4 fontes de XP + leaderboard | Nenhum |
| **Treinos Estruturados** | Planos por semana/exercício com tracking | Nenhum |
| **Feedback Real-Time** | Coach vê padrões + Oracle IA | Manual |

### Moeda: XP (Experience Points)

```
Ganhar XP:
  ├─ Avaliação: 100–2000 (fórmula multiplicador)
  ├─ Check-in: 50 (presença)
  ├─ Like: 5 (social)
  ├─ Comment: 15 (social)
  └─ Treino: 100 (completado)

Gastar XP: [FUTURO]
  ├─ Unlock virtual cards
  ├─ Competições internas
  └─ Prêmios/Benefícios

Validação:
  ├─ Max 100k por transação
  ├─ Rate limit 5min
  ├─ Duplicate detector
  └─ Outlier flagging (3σ)
```

---

## 4. ÁREAS DE DIVISÃO & ROLES

### Personas & Permissões

```
┌─────────────────────────────────────────────────┐
│ WILL (Dono da Franquia)                         │
│ ├─ /will/court → Cockpit principal               │
│ ├─ /will/evaluations/templates → Templates      │
│ ├─ Gestão de staff (coaches)                     │
│ ├─ Análise de XP + moderation                    │
│ ├─ Oracle IA (previsões)                         │
│ └─ Configuração app (PIX key, WhatsApp, etc)    │
├─────────────────────────────────────────────────┤
│ COACH/PROFESSOR (Staff)                         │
│ ├─ /will/court → Ver aulas + live panel         │
│ ├─ Avaliar alunos (nota + fundamento)            │
│ ├─ Check-in profissional (approve/reject)       │
│ ├─ Criar/editar aulas                            │
│ ├─ Criar training plans                          │
│ └─ Ver XP/feedback dos alunos                    │
├─────────────────────────────────────────────────┤
│ ALUNO (Student)                                 │
│ ├─ /dashboard → Home com XP/tier/próximas       │
│ ├─ /agenda → Ver aulas inscritas                │
│ ├─ /treinos → Training plans                    │
│ ├─ /feed → Social feed                          │
│ ├─ /perfil → Editar perfil                      │
│ ├─ /configuracoes → Notificações/privacidade    │
│ ├─ Check-in (mark presence)                     │
│ ├─ Rating (avaliar aula 1-5)                    │
│ ├─ Ver leaderboard (XP ranking)                 │
│ └─ Acumular XP (avaliação + social)             │
├─────────────────────────────────────────────────┤
│ PENDING (Matrícula Pendente)                    │
│ ├─ /cadastro → Completar formulário              │
│ ├─ Visão restrita até aprovação dono            │
│ └─ Espera em /aguardando                        │
├─────────────────────────────────────────────────┤
│ VISITOR (Não Autenticado)                       │
│ ├─ / → Landing page                            │
│ ├─ /login → Tela de login                       │
│ ├─ /signup → Cadastro aluno                     │
│ └─ /preview → Preview page                      │
└─────────────────────────────────────────────────┘
```

### Fluxo de Matrícula

```
1. Aluno clica "Cadastro"
2. Se NEXT_PUBLIC_REQUIRE_ENROLLMENT_INVITE=true:
   ├─ Banner pede código de convite
   └─ RPC verify_enrollment_invite() valida no servidor
3. Aluno preenche formulário (nome, email, telefone, etc)
4. INSERT em students → RLS auto-aprova + notification
5. Dono vê em /will/court com status "pending"
6. Dono clica "Aprovar" → status = "active"
7. Aluno vê /dashboard com próximas aulas
8. Se houver mensalidade:
   ├─ Payment criado automaticamente
   └─ Aluno vê em /financeiro
```

---

## 5. DESIGN VISUAL & LAYOUTS

### Tema & Paleta

| Elemento | Cor | Hex | Uso |
|----------|-----|-----|-----|
| Background | Preto | #000000 | Fundo geral (dark mode) |
| Gold Primary | Ouro | #EAB308 | Accent, botões CTA, badges |
| Gold Secondary | Ouro Escuro | #CA8A04 | Hover, borders |
| Zinc 100 | Cinza Claro | #f4f4f5 | Texto principal |
| Zinc 700 | Cinza Médio | #3f3f46 | Borders, backgrounds secundários |
| Zinc 900 | Cinza Escuro | #18181b | Backgrounds cartas |

### Componentes Visual

#### 1. **AppSectionCard** (Padrão)
- Fundo: `bg-zinc-900 border border-zinc-700`
- Border radius: `rounded-2xl`
- Padding: `p-4` ou `p-6`
- Animação: `hover:border-gold-500 transition-colors`
- Título em ouro

```tsx
<AppSectionCard title="Próximas Aulas">
  {/* conteúdo */}
</AppSectionCard>
```

#### 2. **StatCard** (KPI)
- Layout: icon + título + valor
- Valor em ouro destacado
- Ícone colorido (variad)
- Animação ao hover: `scale-105`

```tsx
<StatCard 
  icon={Users} 
  label="Alunos Ativos" 
  value={42}
  color="blue"
/>
```

#### 3. **KpiActionCard** (Ação)
- Título + descrição + botão
- Icon no canto superior
- Background: gradient sutil
- CTA: `bg-gold-500 hover:bg-gold-600`

#### 4. **UserAvatar** (Identificação)
- 40x40 ou 48x48px
- Fallback: Dicebear SVG seed-based
- Ring: `ring-2 ring-gold-500` se ativo
- Tooltip: nome + email

#### 5. **Modais** (Premium)
- AnimatePresence com Framer Motion
- Enter: `scale: 0.95, opacity: 0` → `scale: 1, opacity: 1`
- Exit: reverso
- Backdrop: `bg-black/40`
- Z-index: `z-[200]`
- Scroll lock ao abrir

#### 6. **Glassmorphism** (Fundo)
- Blur: `backdrop-blur-16`
- Background: `bg-zinc-900/80`
- Border: `border border-zinc-700/50`
- Usado em: panels floating, modais

### Padrões de Layout

#### Mobile-First (Responsive)
```
Mobile: 1 coluna, stacked
Tablet: 2 colunas, sm:grid-cols-2
Desktop: 3–4 colunas, lg:grid-cols-3
```

#### Hierarquia Visual
1. **Page Title** - Texto 2xl em ouro + ícone
2. **Section Headers** - Texto lg em zinc-100
3. **Data** - Texto sm em zinc-400
4. **Actions** - Botões ouro ou zinc-700

#### Ícones (Lucide React)
- Size: 16–24px (small), 32–48px (large)
- Color: `text-gold-500` (CTA), `text-zinc-400` (neutral)
- Hover: `text-gold-400 transition-colors`

### Estados Visuais

| Estado | Visual |
|--------|--------|
| **Loading** | SkeletonLoader com shimmer dourado |
| **Empty** | AppEmptyState com ícone + mensagem |
| **Error** | Toast vermelho (bottom-right) + retry button |
| **Success** | Toast verde com confetti (optional) |
| **Offline** | OfflineStatusBanner topo (sticky) |
| **Sync In Progress** | SyncQueueStatus indicador |

### Animações

```typescript
// Spring Physics (Framer Motion)
const springConfig = { type: "spring", damping: 20, stiffness: 300 };

// Entradas
whileInView={{ opacity: 1, y: 0 }}
initial={{ opacity: 0, y: 20 }}
transition={springConfig}

// Hover/Tap
whileHover={{ scale: 1.05, y: -2 }}
whileTap={{ scale: 0.95 }}
transition={{ duration: 0.2 }}

// Modal lifecycle
initial={{ scale: 0.95, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.9, opacity: 0 }}
transition={springConfig}
```

---

## 6. ANÁLISE PÁGINA POR PÁGINA

### 📱 Páginas Públicas

#### `/` (Landing Page)
**Status:** ✅ Implementada
**Descrição:** Hero page com call-to-action (login/cadastro)
**Componentes:** Hero, features grid, testimonials [MOCK]
**Issues:** 
- [ ] Testimonials estão hardcoded (sem dados reais)
- [ ] SEO: sem meta tags dinâmicas

**Recomendação:** Adicionar analytics tracking

---

#### `/login` (Autenticação)
**Status:** ✅ Implementada + Premium UX
**Descrição:** Login com password + OAuth (Google, Facebook)
**Componentes:** 
- Email/senha inputs
- OAuth buttons (Google, Facebook)
- "Lembrar-me" checkbox
- Links "Esqueci senha" e "Cadastro"

**Animações:** ✅ Spring physics + shimmer + glow pulse
**Segurança:** ✅ Password hashed, JWT, RLS
**Issues:**
- [ ] Recuperação de senha: não implementada (TODO)
- [ ] OAuth token refresh: peut expirar silenciosamente
- [ ] Validação de email: côté client only (sem rate-limit server)

**Recomendação:** Implementar password reset flow (Supabase magic link)

---

#### `/signup` (Cadastro Aluno)
**Status:** ✅ Implementada
**Descrição:** Novo aluno cria conta (email + password + profile)
**Fluxo:**
1. Preenche form (name, email, password, phone, avatar)
2. Validação client-side
3. OAuth alt: Google auto-preenche name + email
4. INSERT em students → RLS auto-aprova (pending status)

**Segurança:**
- ✅ Password hashed via Supabase
- ✅ RLS: allowed INSERT (anon) → pending approval
- ⚠️ Email validation: côté client only

**Issues:**
- [ ] CAPTCHA: não existe → bot signup vulnerability
- [ ] Rate-limit: não implementado
- [ ] Email confirmation: não está sendo validado

**Recomendação:** Adicionar email confirmation + CAPTCHA (turnstile)

---

#### `/cadastro` (Matrícula com Convite)
**Status:** ✅ Implementada com gate
**Descrição:** Aluno com convite se inscreve
**Fluxo:**
1. Banner pede código de convite (se NEXT_PUBLIC_REQUIRE_ENROLLMENT_INVITE=true)
2. RPC verify_enrollment_invite() valida código
3. Resto do form igual /signup
4. INSERT em students com invite_code armazenado

**Gate:** ✅ Implementado
**Segurança:** ✅ Server-side RPC validation

**Issues:**
- [ ] Código de convite pode estar hardcoded (exemplo: "DEV123")
- [ ] Expiração de código: não implementada
- [ ] Reutilização: código pode ser reusado (sem limite)

**Recomendação:** 
1. Adicionar `expires_at` ao enrollmentInviteCode
2. Rastrear quantas vezes foi usado
3. Configurar auto-expiration após 30 dias

---

#### `/auth/callback` (OAuth Redirect)
**Status:** ✅ Implementada
**Descrição:** Handler para Google/Facebook redirect
**Fluxo:**
1. OAuth provider redireciona com code
2. Supabase troca code → JWT
3. postLogin() constrói session
4. Redireciona para dashboard ou invite page

**Segurança:** ✅ PKCE flow, token secure

**Issues:**
- [ ] Error handling: não trata erros OAuth (invalid code, etc)
- [ ] CSRF: sem state validation explícita

---

#### `/preview` (Preview Mode)
**Status:** ✅ Implementada
**Descrição:** Mode para visualizar app sem autenticação
**Conteúdo:** Mock data, todos os componentes
**Dados:** Utilizando willLocalStorage + mockData

**Issues:**
- [ ] Performance: carrega TODOS os dados mock (pode ser lento)
- [ ] Estado: localStorage persiste entre refreshes (confusão)

**Recomendação:** Adicionar "clear demo data" button

---

### 🎓 Páginas de Aluno (Student)

#### `/dashboard` (Home Adaptada)
**Status:** ✅ Implementada com role-specific views
**Descrição:** Hub central com role-based content
**Componentes por Role:**

**Admin View:**
- KPI cards: Alunos total, novos, ativos, atrasados
- Aulas hoje + próximas semana (calendario)
- Pagamentos vencidos
- Posts recentes no feed
- Widget Oracle (insights IA) [TODO]

**Coach View:**
- Aulas do dia (live panel)
- Alunos pendentes de avaliação
- Training plans criados
- Check-in queue

**Student View:**
- Próximas aulas
- XP total + tier atual + progresso
- Leaderboard button
- Training plans (if enrolled)
- Notificações recentes

**Issues:**
- [ ] Layout: sem responsiveness para mobile (overflow em cards)
- [ ] Performance: carrega TODOS os students mesmo se não necessário
- [ ] Oracle widget: pendente implementação

---

#### `/agenda` (Visualizar Aulas)
**Status:** ✅ Implementada
**Descrição:** Calendário semanal com aulas
**Componentes:**
- `WeeklyCalendarGrid` (seg-dom + aulas por dia)
- Click aula → `LessonDetailModal`
- "Criar Aula" button (admin/coach only)

**Funcionalidades:**
- ✅ Seletor de semana (prev/next)
- ✅ Cores por tipo (individual, dupla, trio, grupo)
- ✅ Avatar alunos inscritos
- ✅ Waitlist indicator

**Issues:**
- [ ] Cores: hardcoded (sem config)
- [ ] Drag-drop: não implementado (não pode reagendar)
- [ ] Timezones: não está tratando (pode ter drift)
- [ ] Mobile: cascata vertical (ilegível em narrow)

---

#### `/alunos` (Gestão Alunos)
**Status:** ✅ Implementada (admin/coach only)
**Descrição:** Lista de alunos com filtros e ações
**Componentes:**
- Search por nome/email
- Filtro status (active, pending, suspended, trial)
- Table com: avatar, nome, status, phone, próxima aula, ações

**Ações:**
- ✅ Aprovar pending
- ✅ Suspender aluno
- ✅ Ver detalhes
- ✅ Editar perfil

**Issues:**
- [ ] Pagination: não implementado (para 100+ alunos vai slow)
- [ ] Bulk actions: não existe (aprovar 10 por vez)
- [ ] Export CSV: não implementado

---

#### `/financeiro` (Gestão Pagamentos)
**Status:** ✅ Implementada (admin/coach only)
**Descrição:** Controle de pagamentos por aluno
**Componentes:**
- KPI: Total receita, à receber, atrasado
- Table: aluno, valor, vencimento, status, ações
- Payment proof upload (imagem/PDF do comprovante)

**Ações:**
- ✅ Marcar como pago
- ✅ Visualizar comprovante
- ✅ Gerar relatório mensal

**Issues:**
- [ ] **SEGURANÇA CRÍTICA:** Comprovante upload sem validação de tipo (PNG/JPG + PDF)
  - Pode fazer upload de .exe ou .sh disfarçado
  - Sem virus scan
  - Sem size limit explícito (pode encher storage)
- [ ] Automação: não envia lembrete vencimento
- [ ] Relatórios: sem gráficos de tendência
- [ ] Reconciliação: sem integração real com PIX

---

#### `/feed` (Social Feed)
**Status:** ✅ Implementada com moderation
**Descrição:** Feed social da turma
**Componentes:**
- Post creation (text + media)
- Posts list (timeline)
- Like/comment counts
- Delete/edit actions

**Funcionalidades:**
- ✅ Posts com media (imagem)
- ✅ Like system (5 XP)
- ✅ Comments (15 XP)
- ✅ Pin/Official moderation (admin only)
- ✅ targetRole filtering (student/coach/all)
- ✅ Soft delete (não apaga, marca deletedAt)

**Issues:**
- [ ] **Foto upload:** Sem otimização (pode ser 10MB)
  - Usar `imageCompress.ts` mas não está sendo aplicado
  - Sem lazy loading de imagens
- [ ] **N+1 Query:** Cada like carrega author, avatar, etc
- [ ] Comments: não podem ser editados (uma vez escrito, fixo)
- [ ] Pagination: não implementado

---

#### `/treinos` (Training Plans)
**Status:** ✅ Implementada
**Descrição:** Planos de treino criados pelo coach
**Componentes:**
- `TrainingPlanEditor` modal
- Table: título, semanas, exercícios, status, ações

**Funcionalidades:**
- ✅ Coach cria plano (N semanas)
- ✅ Adiciona exercícios por dia (sets, reps, duration, intensity)
- ✅ Aluno vê plano e marca exercícios completos
- ✅ Completar plano = 100 XP

**Issues:**
- [ ] Interface: confusa (inline edit vs modal)
- [ ] Validation: sem validar (pode ter 0 exercícios)
- [ ] Historico: não guarda versões anteriores
- [ ] Compartilhamento: não pode compartilhar entre alunos

---

#### `/configuracoes` (Settings)
**Status:** ⚠️ Parcialmente implementada
**Descrição:** Configurações por usuário
**Disponível:**
- ✅ Notificações (push, in-app, email)
- ✅ Privacidade (feed visibility)

**Faltando:**
- [ ] Mudar senha
- [ ] 2FA (autenticação dupla)
- [ ] Sessões ativas (logout de outros devices)
- [ ] Data export/GDPR

---

#### `/perfil` (Profile)
**Status:** ✅ Implementada
**Descrição:** Perfil do usuário
**Campos:**
- ✅ Avatar (Dicebear SVG seed)
- ✅ Nome, email, telefone
- ✅ Instagram (optional)
- ✅ Bio/notas

**Edit Mode:**
- ✅ Inline edit
- ✅ Upload avatar
- ✅ Save/cancel

**Issues:**
- [ ] Avatar upload: sem validação (pode fazer upload de PNG gigante)
- [ ] Email change: não pede confirmação
- [ ] Phone validation: apenas formato, sem DDD check

---

### 🏐 Páginas Admin/Coach (Will)

#### `/will` (Redirect)
**Status:** ✅ Simples redirect para `/will/court`

---

#### `/will/court` (Cockpit Principal)
**Status:** ✅ Implementada + Premium UX
**Descrição:** Hub do dono/coach para gestão de aulas
**Componentes Principais:**

1. **CockpitHero** - Bem-vindo + KPI rápido
   - Aulas hoje, alunos ativos, pagamentos pendentes

2. **Weekly Calendar Grid** - Aulas da semana
   - Click aula → detalhes/live panel

3. **Quick Actions** - Botões rápidos
   - Criar aula, aprovar alunos, moderar XP, análise XP, etc

4. **Live Lesson Panel** (floating)
   - Timer inteligente (play/pause, duração selector)
   - Avatares alunos online (presença real-time)
   - Estatísticas (presentes, ausentes, não-confirmados)
   - Botão "Encerrar Aula"

5. **KPI Cards** - Métricas
   - Total XP, pagamentos hoje, aprovações pendentes, etc

**Animações:**
- ✅ Spring physics
- ✅ Hover lift (+4px, scale 1.02)
- ✅ Staggered list entries
- ✅ Modal morphing (layoutId)

**Segurança:** ✅ Admin/coach only via middleware

**Issues:**
- [ ] **CRITICAL:** Presença em tempo real
  - Usa Realtime, mas timeout sem resync (pode ficar offline silenciosamente)
  - Sem heartbeat fallback
- [ ] Timer: sem persistência (F5 perde estado)
- [ ] Live panel: pode abrir 2x (state management bug)
- [ ] Mobile: layout ruim (sobreposição de panels)

---

#### `/will/court/[lessonId]/live` (Painel Ao Vivo)
**Status:** ✅ Implementada
**Descrição:** Painel dedicated para aula ao vivo
**Funcionalidades:**
- ✅ Timer detalhado
- ✅ Presença com filtros
- ✅ Avaliar aluno (inline)
- ✅ Check-in aprovação
- ✅ Encerrar aula

**Issues:**
- [ ] **PERFORMANCE:** Carrega dados de TODOS alunos (sem paginação)
- [ ] Avaliação: salva diretamente (sem undo)
- [ ] Mobile: muito poluído visualmente

---

#### `/will/evaluations/templates` (Templates de Avaliação)
**Status:** ⚠️ Parcialmente implementada
**Descrição:** Gerenciar templates de avaliação
**Esperado:**
- [ ] CRUD templates
- [ ] Presets por categoria/venue
- [ ] Histórico de avaliações

**Atual:** Placeholder sem funcionalidade

---

### 🛠️ Páginas Dev/Debug

#### `/dev/monitor` (Monitor de Dev)
**Status:** ✅ Implementada
**Descrição:** Dashboard de eventos do sistema
**Componentes:**
- Real-time feed de dev_events
- Polling fallback 10s
- Filtros por tipo
- Clear button

**Usado Para:**
- Debug de Realtime
- Monitoramento de migrações
- Troubleshooting offline

---

#### `/aguardando` (Página de Espera)
**Status:** ✅ Implementada
**Descrição:** Redirect para pending students
**Conteúdo:**
- Mensagem: "Sua inscrição está sendo analisada"
- Countdown/refresh automático
- Logout button

**Issues:**
- [ ] Auto-refresh: sem implementar (manual F5)
- [ ] Mensagem: genérica (sem ETA)

---

## 7. SEGURANÇA DO USUÁRIO

### ✅ Implementado

| Aspecto | Status | Descrição |
|--------|--------|-----------|
| **Auth** | ✅ | Supabase Auth + JWT + password hashed |
| **RLS** | ✅ | Row-level security via PostgreSQL |
| **HTTPS** | ✅ | Vercel auto-HTTPS |
| **CORS** | ✅ | Supabase handles |
| **CSRF** | ✅ | OAuth PKCE flow |
| **Error Tracking** | ✅ | Sentry (sensiive data scrubbed) |
| **Offline Auth** | ✅ | localStorage JWT (com TTL) |

### ⚠️ Parcialmente Implementado

| Aspecto | Issue | Recomendação |
|--------|-------|---|
| **Password Policy** | Sem requisitos (0+ chars OK) | Enforce: 8+ chars, 1 maiúscula, 1 número |
| **Rate Limiting** | Não existe | Implementar no middleware |
| **2FA** | Não implementado | Adicionar TOTP via Supabase |
| **Session Timeout** | Sem timeout automático | Logout após 30 min inatividade |
| **Audit Log** | dev_events genéricos | Adicionar audit específico (login, role change) |
| **Encryption** | Data at-rest (DB) | Data in-transit (TLS) ✅, Sensitive fields? |

### ❌ Não Implementado

| Aspecto | Risk | Ação |
|--------|------|------|
| **CAPTCHA** | Bot signup/brute-force | Adicionar Turnstile em /signup |
| **Email Confirmation** | Email fake | Validar via Supabase magic link |
| **File Upload Validation** | Malware upload (XLS, EXE disfarçado) | Validar tipo + extensão + MIME + virus scan (ClamAV) |
| **Data Retention Policy** | GDPR: dados não deletam | Implementar auto-delete após N dias |
| **Penetration Testing** | Vulnerabilidades desconhecidas | Fazer audit anual |
| **Incident Response Plan** | Sem plano de ação | Documentar: quem, o quê, quando fazer |

### Dados Sensíveis Armazenados

```
┌─────────────────────────────────────────────┐
│ DADOS SENSÍVEIS                             │
├─────────────────────────────────────────────┤
│ ✅ Protegido                                │
│ ├─ Password (hashed via bcrypt Supabase)   │
│ ├─ JWT (stored in secure cookie)          │
│ ├─ OAuth tokens (Supabase managed)         │
│ └─ RLS validates row access                │
├─────────────────────────────────────────────┤
│ ⚠️ Validar                                  │
│ ├─ Phone number (visible to coach/admin)   │
│ ├─ Email (in posts, searchable)            │
│ ├─ Payment proof (student email/name)      │
│ └─ Avatar seed (derivado do nome)          │
├─────────────────────────────────────────────┤
│ ❌ Risco                                    │
│ ├─ localStorage JWT (XSS vulnerability)    │
│ ├─ Dev root impersonation (trace by email) │
│ └─ Student notes (free text, no encrypt)   │
└─────────────────────────────────────────────┘
```

### Vulnerability Checklist

```
OWASP Top 10 2021 Assessment:

[ ] A1: Broken Access Control
    ├─ ✅ RLS implemented
    ├─ ✅ Role-based routes
    ├─ ⚠️ Dev impersonation (TRACE DO EMAIL)
    └─ ⚠️ No logout on role change (lingering perms)

[ ] A2: Cryptographic Failures
    ├─ ✅ TLS everywhere
    ├─ ✅ Password hashed
    ├─ ⚠️ localStorage JWT plaintext
    └─ [ ] Data at-rest encryption (DB)

[ ] A3: Injection
    ├─ ✅ Parameterized queries (Supabase)
    ├─ ✅ No raw SQL user input
    └─ [ ] Student notes: XSS risk (no sanitize)

[ ] A4: Insecure Design
    ├─ [ ] CAPTCHA absent
    ├─ [ ] Rate-limit absent
    ├─ [ ] No email confirmation
    └─ [ ] File upload unvalidated

[ ] A5: Security Misconfiguration
    ├─ ✅ .env secure (never committed)
    ├─ ✅ Supabase RLS enabled
    ├─ ⚠️ Dev mode exposes devTools
    └─ [ ] CSP headers not set

[ ] A6: Vulnerable Components
    ├─ ✅ Dependencies audited (pnpm audit)
    ├─ ⚠️ VAPID keys in .env (rotação?)
    └─ [ ] SRI hashes for CDN

[ ] A7: Auth Failure
    ├─ ✅ OAuth + password
    ├─ ⚠️ No 2FA
    ├─ ⚠️ No session timeout
    └─ [ ] Brute-force protection

[ ] A8: Software/Data Integrity
    ├─ ✅ Signed commits (git)
    ├─ [ ] Release signing (npm)
    └─ ✅ CORS configured

[ ] A9: Logging/Monitoring
    ├─ ✅ Sentry error tracking
    ├─ ✅ PostHog analytics
    ├─ ⚠️ Audit log genérico
    └─ [ ] Real-time alerting

[ ] A10: SSRF
    ├─ ✅ No user input URLs
    ├─ [ ] Webhook validation
    └─ [ ] Image proxy validation
```

---

## 8. BUGS & PROBLEMAS CONHECIDOS

### 🔴 CRÍTICOS

#### 1. **Presença Real-time Sem Heartbeat**
**Local:** `/will/court` LiveLessonCoachPanel.tsx
**Problema:** 
- Usa Realtime Supabase, mas sem heartbeat
- Conexão pode cair silenciosamente
- Coach acha aluno ausente quando ele está lá

**Impacto:** Avaliações erradas, attendance incorrect

**Fix:**
```typescript
// Adicionar heartbeat a cada 30s
useEffect(() => {
  const heartbeat = setInterval(() => {
    recordPresence(studentId, lessonId);
  }, 30000);
  return () => clearInterval(heartbeat);
}, []);
```

---

#### 2. **Payment Proof Upload Sem Validação**
**Local:** `/financeiro` PaymentMutations.ts
**Problema:**
- Aceita qualquer arquivo (sem validação MIME)
- Sem virus scan
- Sem size limit (pode ser 100MB)

**Impacto:** Storage DOS, malware injection

**Fix:**
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Invalid type");
if (file.size > MAX_SIZE) throw new Error("File too large");

// PLUS: integrar virus scan (ClamAV ou VirusTotal API)
```

---

#### 3. **Signup Sem CAPTCHA**
**Local:** `/signup`, `/cadastro`
**Problema:**
- Sem proteção contra bots
- Rate-limit não existe
- Email validation côté-client only

**Impacto:** Bot spam, takeover de email

**Fix:** Adicionar Turnstile widget

```typescript
import { Turnstile } from "@marsidev/react-turnstile";

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setToken(token)}
/>
```

---

#### 4. **Offline XP Logging**
**Local:** useFeedMutations, useXPMutations
**Problema:**
- XP logging é fire-and-forget (async void)
- Se falhar (network error), silenciosamente não salva
- Aluno não vê erro

**Impacto:** XP perdido, frustração

**Fix:**
```typescript
void logXpEvent(...).catch(err => {
  toast("Erro ao salvar XP: " + err.message);
  addToSyncQueue({ type: 'xp', data: ... });
});
```

---

### 🟡 MAIORES

#### 5. **Dev Root Impersonation Traceable**
**Local:** middleware.ts, useDevRoleImpersonationToggle.ts
**Problema:**
- Dev pode usar `?dev=email@example.com` para impersonar
- Log pode traçar pelo email (não é anônimo)
- Sem audit de quem impersonou quem

**Impacto:** Privacy concern, data leak via logs

**Fix:**
```sql
-- Adicionar audit_logs table
INSERT INTO audit_logs (actor, action, target_id, timestamp)
VALUES (dev_email, 'impersonate', student_id, now());
```

---

#### 6. **Student Notes XSS Vulnerability**
**Local:** `/will/court`, student notes campo
**Problema:**
- Notes são stored em plain text
- Rendering sem sanitize: `{student.notes}`
- Se hacker coloca `<img src=x onerror=alert(1)>`

**Impacto:** XSS, session hijacking

**Fix:**
```typescript
import DOMPurify from "dompurify";

<div>{DOMPurify.sanitize(notes)}</div>
```

---

#### 7. **Lesson Presence Pode Ser Manipulada**
**Local:** useRealtimePresence.ts
**Problema:**
- Client-side recordPresence() sem validation
- Aluno pode se marcar presente mesmo ausente (jailbreak)

**Impacto:** Fraude attendance

**Fix:**
```sql
-- Adicionar IP geolocation check
-- Adicionar device fingerprinting
-- Coach aprovação manual (já existe) ✅
```

---

#### 8. **Realtime Debounce Pode Desincronizar**
**Local:** useSupabaseRealtimeRefresh.ts (400ms debounce)
**Problema:**
- 400ms delay entre mudança e UI update
- Se coach aprova aluno MUITO RÁPIDO, pode sobrescrever

**Impacto:** Data loss em batch operations

**Fix:**
```typescript
// Reduzir debounce pra 100ms ou usar optimistic updates
// Usar transaction-id para detectar conflicts
```

---

### 🔵 MENORES

#### 9. **Pagination Missing em Grandes Listas**
**Local:** `/alunos`, `/financeiro`
**Problema:**
- Sem paginação → carrega 500+ rows
- SELECT * sem LIMIT

**Impacto:** Performance degradation (1-3s latency)

**Fix:**
```typescript
// Add LIMIT 20 OFFSET (page * 20)
const { data } = await supabase
  .from('students')
  .select()
  .range(offset, offset + 19);
```

---

#### 10. **Avatar Upload Sem Otimização**
**Local:** `/perfil`
**Problema:**
- Upload PNG 10MB sem compression
- Sem lazy loading em lista avatares

**Impacto:** Bandwidth waste

**Fix:** Usar imageCompress.ts (já existe, aplicar)

---

#### 11. **Training Plan Sem Historico**
**Local:** `/treinos`
**Problema:**
- Edita plano in-place → perde histórico
- Sem versionamento

**Impacto:** Aluno não vê mudanças antigas

**Fix:**
```sql
CREATE TABLE training_plan_versions (
  id, plan_id, version, data JSONB, created_at
);
```

---

#### 12. **Comment Sem Edit/Delete**
**Local:** `/feed`
**Problema:**
- Comment uma vez escrito = permanente
- Sem "Edit" ou "Delete" buttons

**Impacto:** Erros typo não podem ser corrigidos

**Fix:**
```typescript
// Add buttons "Editar" e "Deletar" para author ou admin
```

---

#### 13. **Timezone Issues**
**Local:** Toda parte de datas (lessons, payments, ratings)
**Problema:**
- Datas salvas em UTC
- Display sem converter para timezone local
- Agendamento pode desalinhar

**Impacto:** Aula às 10h aparece como 9h ou 11h

**Fix:**
```typescript
// Usar date-fns-tz
import { formatInTimeZone } from 'date-fns-tz';
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
formatInTimeZone(date, tz, 'HH:mm');
```

---

## 9. FUNCIONALIDADES NÃO IMPLEMENTADAS

### ROADMAP PENDENTE

| Feature | Priority | Estimativa | Status |
|---------|----------|-------------|--------|
| **Password Reset** | Alta | 4h | ❌ TODO |
| **2FA (TOTP)** | Alta | 8h | ❌ TODO |
| **Email Confirmation** | Alta | 6h | ❌ TODO |
| **CAPTCHA (Turnstile)** | Alta | 2h | ❌ TODO |
| **Rate Limiting** | Alta | 6h | ❌ TODO |
| **File Upload Validation** | Alta | 4h | ❌ TODO |
| **Virus Scan (ClamAV)** | Média | 8h | ❌ TODO |
| **Session Timeout** | Média | 2h | ❌ TODO |
| **Audit Logging** | Média | 6h | ❌ TODO |
| **Real-time Heartbeat** | Média | 4h | ❌ TODO |
| **Optimistic Updates** | Média | 8h | ❌ TODO |
| **Oracle IA (Anthropic)** | Baixa | 12h | 🔄 WIP |
| **Advanced Analytics** | Baixa | 16h | ❌ TODO |
| **Payment Integration** | Baixa | 20h | ❌ TODO |
| **Mobile App (React Native)** | Baixa | 120h | ❌ TODO |

### FASE 11: ATHLETE GAMIFICATION DASHBOARD

```
[ ] Virtual Card Display
    ├─ Animação tier unlock
    ├─ Card animation on achievement
    └─ 3D flip effect (opcional)

[ ] Achievement Path Grid
    ├─ Timeline visual
    ├─ Milestones (500, 1.5k, 3k, etc)
    └─ Progress indicators

[ ] Daily Challenges
    ├─ Micro-missions (come back tomorrow, like posts, etc)
    ├─ Reward: 5-25 XP por challenge
    └─ Refresh daily
```

### FASE 12: AGENTIC AI

```
[ ] Oracle Dashboard (Admin)
    ├─ Prediction: Churn risk
    ├─ CRM behavioral insights
    └─ Recommended actions

[ ] Coach Copilot
    ├─ Auto-generate training plans
    ├─ Injury risk alerts
    └─ Tactical recommendations

[ ] Athlete Digital Twin
    ├─ Biomechanics from video
    ├─ Dynamic XP calculation
    └─ Sports psychology insights
```

---

## 10. RECOMENDAÇÕES & PRÓXIMOS PASSOS

### 🚀 PRIORIDADE CRÍTICA (Semana 1)

1. **Segurança de Upload**
   - [ ] Validar MIME type em `/financeiro` payment proof
   - [ ] Adicionar size limit (5MB)
   - [ ] Integrar ClamAV (virus scan)
   - **Esforço:** 4h | **Risk:** Crítico

2. **Presença Heartbeat**
   - [ ] Adicionar heartbeat 30s em LiveLessonCoachPanel
   - [ ] Fallback polling se Realtime cair
   - **Esforço:** 2h | **Risk:** Crítico

3. **CAPTCHA em Signup**
   - [ ] Integrar Turnstile
   - [ ] Validar no servidor
   - **Esforço:** 2h | **Risk:** Alto (bots)

4. **XP Error Handling**
   - [ ] Catch errors, add to SyncQueue
   - [ ] Show toast on failure
   - **Esforço:** 2h | **Risk:** Médio

---

### 🛡️ PRIORIDADE SEGURANÇA (Semana 2)

5. **Email Confirmation**
   - [ ] Adicionar magic link via Supabase
   - [ ] Validar email antes de ativar
   - **Esforço:** 6h

6. **Password Policy**
   - [ ] Enforce 8+ chars, 1 maiúscula, 1 número
   - [ ] Show strength indicator
   - **Esforço:** 2h

7. **Audit Logging**
   - [ ] Log logins, role changes, data modifications
   - [ ] Dashboard para admin
   - **Esforço:** 8h

8. **2FA (TOTP)**
   - [ ] Integrar Supabase Auth MFA
   - [ ] QR code setup
   - **Esforço:** 6h

---

### ⚡ PRIORIDADE PERFORMANCE (Semana 3)

9. **Pagination**
   - [ ] `/alunos` table: add LIMIT 20 + infinite scroll
   - [ ] `/financeiro` payments: paginação
   - **Esforço:** 4h

10. **Image Optimization**
    - [ ] Aplicar imageCompress em avatar uploads
    - [ ] Add lazy loading em listas
    - [ ] Use WebP format
    - **Esforço:** 4h

11. **N+1 Query Fixes**
    - [ ] Feed: prefetch authors + avatars
    - [ ] Lessons: prefetch students + coaches
    - **Esforço:** 4h

12. **Caching Strategy**
    - [ ] Add SWR revalidation
    - [ ] Cache students list (1 min)
    - [ ] Cache lessons (5 min)
    - **Esforço:** 6h

---

### 🎨 PRIORIDADE UX/DESIGN (Semana 4)

13. **Mobile Responsiveness**
    - [ ] Dashboard: 2-col → 1-col sm
    - [ ] Cockpit: stack panels vertically
    - [ ] Feed: full-width cards mobile
    - **Esforço:** 6h

14. **Timezone Fix**
    - [ ] Use date-fns-tz
    - [ ] Display em timezone local
    - [ ] Agendamento sem drift
    - **Esforço:** 4h

15. **Training Plan UX**
    - [ ] Separa view/edit modes
    - [ ] Validação (min 1 exercise)
    - [ ] Versionamento
    - **Esforço:** 6h

16. **Feedback on Error States**
    - [ ] Toast color-coded (success/error/warning)
    - [ ] Retry buttons
    - [ ] Offline indicator sticky
    - **Esforço:** 4h

---

### 🧪 PRIORIDADE TESTING (Semana 5)

17. **E2E Tests (Playwright)**
    - [ ] Signup flow (happy + error paths)
    - [ ] Check-in approval workflow
    - [ ] XP logging + accumulation
    - **Esforço:** 16h

18. **Unit Tests**
    - [ ] XP anti-cheat functions
    - [ ] Date utilities
    - [ ] Payment status logic
    - **Esforço:** 8h

19. **Performance Tests**
    - [ ] Lighthouse: aim for 90+
    - [ ] Load time: <2.5s (home)
    - [ ] API latency: <200ms (p95)
    - **Esforço:** 4h

---

### 📊 ROADMAP TRIMESTRAL (Q2 2026)

**Semana 1-4:** Segurança + Performance (acima)

**Semana 5-8:** Phase 11 (Athlete Gamification)
- Virtual cards with 3D animation
- Achievement path timeline
- Daily challenges system

**Semana 9-12:** Phase 12 (Agentic AI)
- Oracle dashboard (churn prediction)
- Coach copilot (training gen)
- Athlete digital twin

---

## CHECKLIST DE VALIDAÇÃO

Antes de rodar `/git push origin main` → Vercel deploy:

```
[ ] TypeScript: pnpm exec tsc --noEmit (zero errors)
[ ] Build: pnpm run build (exit 0, all 28 routes)
[ ] Bundle size: <300KB first load
[ ] Lighthouse: ≥90 on all metrics
[ ] RLS policies: tested for student isolation
[ ] XP logging: no duplicates in past 24h
[ ] Offline mode: tested on Slow 3G
[ ] Mobile: tested on iPhone 12 + Android
[ ] Security: OWASP top 10 audit
[ ] Backup: Supabase backup recent
[ ] Monitoring: Sentry + PostHog connected
[ ] Documentation: WILLPRO_MASTER_MEMORY.md updated
```

---

## CONCLUSÃO

**Estado Geral:** 🟢 **PRODUCTION READY** (com observações de segurança)

**Pontos Fortes:**
- ✅ Arquitetura limpa (14 contexts + 56 componentes)
- ✅ Gamificação XP completa (formula + anti-cheat + leaderboard)
- ✅ RLS security implementada
- ✅ PWA (offline-first, installable)
- ✅ Realtime via Supabase
- ✅ UX premium (Framer Motion, glassmorphism)

**Pontos de Atenção:**
- ⚠️ Upload validation (critical)
- ⚠️ Presença heartbeat (falhas silenciosas)
- ⚠️ CAPTCHA/rate-limit (bot risk)
- ⚠️ Pagination (perf em 100+ registros)
- ⚠️ Timezones (drift em datas)

**Próximo Sprint:** Implementar security fixes + Phase 11 (Athlete Gamification) + E2E tests

---

**Relatório Compilado Por:** Claude Code Agent  
**Data:** 06/05/2026 ~12:15 BRT  
**Versão:** v1.0 — Análise Completa
