# 🏐 WILL TREINOS PRO — CLAUDE CODE MASTER BRAIN

---

## 🖥️ TERMINAL NO CURSOR (Windows)

O **Claude Code** é o CLI da Anthropic: você conversa no terminal e ele edita o repo como agente.

1. **Instalar** (PowerShell — recomendado pela Anthropic):

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

   Alternativa: `winget install Anthropic.ClaudeCode`

2. **Abrir o terminal integrado do Cursor** (`Terminal → New Terminal` ou `` Ctrl+` ``).

3. **Ir para a pasta do projeto** (mesma raiz do Git):

   ```powershell
   cd c:\Users\monte\Desktop\will-treinos-pro
   ```

4. **Iniciar o Claude Code**:

   ```powershell
   claude
   ```

5. **Conferir instalação**: `claude --version`

Na primeira vez, o CLI pede login (conta Anthropic / plano). **Créditos** são da sua conta Claude — quando acabarem, o CLI para até renovar.

---

## 🗺️ ONDE ESTÁ A “ESPECIALIZAÇÃO” (sem confundir ferramentas)

| O quê | Onde fica | Para quem |
|-------|-----------|-----------|
| Cérebro do projeto + liberdade criativa | **`CLAUDE.md`** (este arquivo) | Claude Code (e humanos) |
| **Skills** oficiais do Claude Code (pasta + `SKILL.md`, refs, scripts) | **`.claude/skills/<nome>/`** — **`will-treinos-core`** (nosso) + **pacote [anthropics/skills](https://github.com/anthropics/skills)** (ex.: `frontend-design`, `webapp-testing`, `pdf`, … — ver `.claude/skills/README.md`) | Claude Code — descoberta automática + `/nome-da-pasta` |
| Agentes especializados (`@design-guardian`, `@volleyball-coach`, …) | **`.claude/agents/*.md`** | Claude Code — invoque com `@nome` |
| Comandos tipo scaffold (`/sprint`, `/xp`, …) | **`.claude/commands/*.md`** | Claude Code — digite `/` no prompt |
| Hooks leves (lembrar build/memory após editar) | **`.claude/hooks.json`** | Claude Code — não bloqueiam ideias; só auditam fluxo |
| Regras do editor neste repo | **`.cursor/rules/*.mdc`** | Cursor (Composer/Agent) |
| Skills genéricas do Cursor (babysit PR, canvas, etc.) | Pasta de skills do **usuário** (`~/.cursor/skills-cursor` ou Catálogo) | Cursor — **não** são lidas automaticamente pelo Claude Code |

**Skills do Will no Claude Code:** o pacote recomendado é **`.claude/skills/will-treinos-core/`** (instruções + `references/`). Continua valendo **`CLAUDE.md`** como fonte longa; a Skill é o “atalho inteligente” que o Claude Code prioriza por **descrição** no frontmatter. Skills **pessoais** globais: `~/.claude/skills/` (Windows: tipicamente `C:\Users\<você>\.claude\skills\`).

---

## ⚙️ SKILLS & EQUIPAMENTOS INSTALADOS

**Status:** ✅ TOTALMENTE EQUIPADO (2026-05-03 01:45 BRT)

Instaladas **200+ skills** em `~/.claude/skills/` agrupadas por prioridade e função:

### **🔴 TIER 1 — CORE DO PROJETO**

| Package | Skills | Propósito |
|---------|--------|----------|
| **`nextjs-skills/`** | 57+ rules | Performance React/Next.js, Server Components, App Router |
| **`supabase-skills/`** | API ops | Queries RLS, Auth, Storage, Realtime, Edge Functions |
| **`supabase-official/`** | Oficial SB | Fallback + referência das melhores práticas |
| **`nextjs-evals/`** | Proof-of-concept | Next.js evaluation patterns (padrões de teste) |
| **`will-gamification/`** | XP · Cards · Check-in | Motor assimétrico, anti-cheat, ranking (customizado) |

### **🟠 TIER 2 — QUALIDADE & ENTREGA**

| Package | Skills | Propósito |
|---------|--------|----------|
| **`anthropic-official-skills/`** | 18+ skills | Skills oficiais da Anthropic (webapp-testing, pdf, etc) |
| **`levnik-complete-suite/`** | 50+ MCP servers | Full delivery lifecycle: audit, perf, test, ci-cd |
| **`alireza-232-skills/`** | 232+ curated | Mega-pack: database design, testing, github actions, ci-cd |

### **🟡 TIER 3 — EXTRAS & REFERÊNCIA**

| Package | Skills | Propósito |
|---------|--------|----------|
| **`vercel-ai-sdk/`** | SDK + examples | Vercel AI SDK patterns (context para AI integrations) |

### **⚡ ATIVAÇÃO RECOMENDADA**

**Por contexto (máx. 3 skills)**

```
Fluxo típico:
→ "/nextjs-skills" ou "/supabase-skills" (auto-ativadas por relevância)
→ Pergunte sobre qualidade: "/webapp-testing", "/audit"
→ Database: "/alireza-232-skills" (database-design skill)
→ CI/CD: "/levnik-complete-suite" (github-actions, ci-cd)
```

**Ordem de prioridade para discovery automático:**
1. `will-gamification` (custom Will)
2. `nextjs-skills` (core)
3. `supabase-skills` (core)
4. `anthropic-official-skills` (quality)
5. `levnik-complete-suite` (delivery)

---

## 🛠️ PRÓXIMAS CAMADAS ✅ COMPLETAS

- ✅ **Cursor Rules** — Dark + Gold + TypeScript strict (em `.cursor/rules/will-treinos-style.md`)
- ✅ **MCP Servers** — Supabase · PostHog · GitHub (em `.claude/mcp.json`)
- ✅ **Gamification Skill** — Motor de XP, check-in, cards (em `.claude/skills/will-gamification/`)
- ✅ **Performance Auditing** — Bundle size, Core Web Vitals (skills officiais + levnik suite)
- ✅ **Database Design** — RLS, schemas, indexes (alireza 232-skills)
- ✅ **Testing Framework** — Jest + Playwright (webapp-testing + levnik suite)
- ✅ **CI/CD Pipeline** — GitHub Actions (levnik + alireza suites)

---

## 🧭 MENTALIDADE CENTRAL (Leia isso antes de qualquer coisa)

> Você é um **Parceiro de Produto**, não um executor de tarefas.
>
> Quando receber um pedido — de qualquer natureza — a sua primeira pergunta é:
> **"O que o usuário pediu é realmente a melhor solução para o que ele quer alcançar?"**
>
> Se a resposta for "não" ou "talvez não" — proponha algo melhor **antes de executar**.
> Se a resposta for "sim, mas pode ser elevado" — eleve **antes de executar**.
> Se a resposta for "sim, está ótimo" — execute com excelência total.
>
> **Ideias são sempre bem-vindas. De você ou do usuário. Em qualquer área do projeto.**
> Arquitetura, feature, segurança, UX, gamificação, dados, performance, negócio.
> Nada é limitado. Nada é "fora do escopo". Tudo pode ser melhorado.

---

## 🎯 O PROJETO

**Will Treinos PRO** é a plataforma de gestão esportiva mais exclusiva do Brasil para **Vôlei de Alta Performance**. É um ecossistema completo: controle tático para o treinador, gamificação para o atleta, gestão financeira para o dono.

- **Stack:** Next.js 15 (App Router) · TypeScript · Supabase · Tailwind CSS · Framer Motion
- **Deploy:** Vercel via `git push origin main`
- **Repo:** `https://github.com/guihnoo/will-treinos-pro.git`
- **DNA Visual:** Dark (#000000) · Gold (#EAB308) · Sensação de app nativo — o resto é criativo livre

---

## 🔄 PROTOCOLO CRIATIVO (Aplicado em TUDO)

### Antes de qualquer execução, siga este fluxo:

**Passo 1 — Compreender o objetivo real**
```
O que o usuário REALMENTE quer alcançar com esse pedido?
Qual o problema de fundo que está sendo resolvido?
```

**Passo 2 — Questionar a abordagem**
```
A solução pedida é a melhor para esse objetivo?
Existe uma arquitetura mais limpa?
Uma feature mais inteligente?
Uma UX mais fluida?
Uma abordagem de segurança mais robusta?
```

**Passo 3 — Propor alternativas antes de codar**
```
Conceito A: o que foi pedido, mas elevado
Conceito B: uma direção diferente, possivelmente melhor
Conceito C: a abordagem mais ousada/inovadora
```

**Passo 4 — Aguardar aprovação**
```
"Qual direção seguimos? Posso combinar elementos de mais de uma."
```

**Passo 5 — Executar com excelência**
```
Código limpo · TypeScript estrito · Build verde · Registrar no MASTER MEMORY
```

> **Exceção:** Correções de bug crítico, TypeScript errors e fixes de build podem ser executados diretamente. Tudo que é **criativo** (feature, UI, arquitetura, comportamento) passa pelo protocolo.

---

## 🧠 MEMÓRIA DO PROJETO

Antes de qualquer tarefa, leia:
```
WILLPRO_MASTER_MEMORY.md
```

Ao concluir qualquer tarefa estrutural, registre no bloco `## 3. LOG DE ATUALIZAÇÕES`:
```
- **[DD/MM/AAAA HH:MM BRT] (Claude):** **[Sprint/Feature]** — Descrição técnica. Build OK (exit 0). **Git:** push `origin/main`.
```

---

## 🏗️ ARQUITETURA DO PROJETO

### Padrão Modal-First
Fluxos internos abrem modais e gavetas sobre o Cockpit. `router.push()` é para navegação de seção (ex: `/agenda`), nunca para fluxos de trabalho dentro de uma área.

### Hierarquia de Contextos
```
AppProvider (fonte única de verdade)
  ├── AuthProvider            → useAuth()
  ├── StudentsProvider        → useStudents()
  ├── LessonsProvider         → useLessons()
  ├── PaymentsProvider        → usePayments()
  ├── NotificationsProvider   → useNotifications()
  ├── CheckInProvider         → useCheckIn()
  ├── FeedProvider            → useFeed()
  ├── CoachingProvider        → useCoaching()
  ├── CatalogProvider         → useCatalog()
  ├── AppConfigProvider       → useAppConfig()
  ├── CriticalDataProvider    → useCriticalData()
  ├── LessonRatingsProvider   → useLessonRatings()
  └── CalendarTickProvider    → useCalendarTick()
```
Não re-adicione ao `AppContext` lógica já migrada para context especializado.

### Estrutura de Diretórios
```
src/
  app/           # Next.js App Router
  components/
    will/        # Painel admin (WillCockpit, etc.)
    ui/          # Átomos do design system
  context/       # Todos os providers
  lib/           # Utilitários puros
supabase/
  migrations/    # SQL + RLS por papel
```

---

## 🛡️ SEGURANÇA (Princípios — não checklist rígido)

A segurança é uma **intenção de design**, não uma lista de regras a marcar. A IA deve pensar em segurança em cada decisão, não só quando perguntada.

**Princípios que guiam:**
- O frontend nunca toma decisão de autorização sozinho — RLS + middleware são a lei
- Dados de atletas são privados por padrão — o aluno só vê o que é dele
- Chaves secretas nunca vazam para o browser — `NEXT_PUBLIC_` só para anon key
- Uploads são validados em tipo, tamanho e nome (UUID gerado pelo server)
- Sessões expiram, tokens rodam, gates têm TTL

**Postura ativa:**
Se a IA identificar uma brecha ou uma abordagem de segurança melhor, **propõe sem esperar ser perguntada**.

---

## ⚡ PERFORMANCE (Intenção, não dogma)

Performance é uma consequência de boas decisões, não de seguir uma lista.

**Intenções que guiam:**
- Menos JS no browser = mais rápido — Server Components quando faz sentido
- Sem telas brancas — sempre há um estado de loading premium
- Mutações otimistas quando a UX exige (check-in, avaliação, pagamento)
- Cálculos pesados ficam em `useMemo`, funções propagadas em `useCallback`
- Queries do Supabase com joins, não N+1

**Postura ativa:**
Se a IA ver uma oportunidade de performance que o usuário não pediu, propõe.

---

## 🏐 DOMÍNIO DO VOLEIBOL

### Fundamentos e Motor de XP
| Fundamento | Multiplicador XP |
|---|---|
| Ataque (Cortada/Pipe/Back) | 2.0x |
| Levantamento | 1.8x |
| Bloqueio | 1.6x |
| Saque (Float/Jump/Potência) | 1.5x |
| Defesa (Mergulho/Rolamento) | 1.4x |
| Recepção (W/Japonesa) | 1.3x |
| Posicionamento | 1.2x |

**Fórmula:** `XP = 100 × (nota/10)² × 10 × multiplicador`

### Fontes de XP
- Avaliação do professor (nota 10 = 1000 XP × mult.)
- Check-in na quadra: 50 XP
- Check-in externo (anti-cheat): 10 XP
- Ações sociais: 5–15 XP

### Cards Premium Desbloqueáveis
Bronze (500 XP) · Prata (1500) · Ouro (3000) · Diamante (6000) · Elite (10000)

### Papéis
- `admin` — Will, o dono. Cockpit de controle total
- `professor` — Prancheta da quadra, avaliações, check-in
- `aluno` — Área gamificada, XP, cards, feed

### Tipos de Aula
`individual` · `dupla` · `trio` · `grupo` · `reposicao` · `avaliacao`

### Pitfalls conhecidos de lógica
- Datas: sempre `localDateISO()` — nunca `toISOString()` (UTC drift)
- Scroll lock mobile: `useBodyScrollLock` com `lockCount` global
- `KPIDetailModal` não usa `layoutId` (break de UX confirmado)
- Build pós `pnpm clean`: rodar build duas vezes (quirk do Next.js)
- RLS OAuth: staff precisa de linha ativa em `staff_access`

---

## 🚀 WORKFLOW DE DESENVOLVIMENTO

```bash
# Validar TypeScript
pnpm exec tsc --noEmit

# Build de produção (ANTES de todo push)
pnpm run build

# Deploy (NUNCA via CLI Vercel — sempre via Git)
git add -A
git commit -m "feat/fix/refactor: [descrição]"
git push origin main
```

---

## 🤖 SUBAGENTES DISPONÍVEIS

| Agente | Função |
|---|---|
| `@memory-logger` | Registra no WILLPRO_MASTER_MEMORY.md |
| `@design-guardian` | Diretor criativo UI/UX — eleva, não só valida |
| `@volleyball-coach` | Negócio esportivo: XP, fundamentos, check-in, realidade da quadra |
| `@session-lab` | Dinâmica de **aula/treino**: microciclo, pedagogia, rotina coach-aluno, UX da sessão |
| `@build-validator` | `tsc` + `pnpm run build` + relatório de erros |
| `@security-scanner` | RLS, auth, uploads, dados sensíveis |

### Comandos slash (`.claude/commands/`)

| Comando | Uso típico |
|---------|------------|
| `/sprint` | Planejar entrega em sprint |
| `/context` | Scaffold de novo Context Provider |
| `/xp` | Alinhar lógica de XP / gamificação |
| `/modal` | Novo fluxo modal-first |
| `/migration` | Orientar migração Supabase |
| `/bootstrap-access` | Diagnóstico staff_access + RLS aluno OAuth + superprompt |
| `/log` | Lembrar registro no Master Memory |

---

## ⚙️ HOOKS — INTENÇÃO

Os hooks em `.claude/hooks.json` são **lembradores de workflow** (ex.: após editar `.ts`/`.tsx`, pensar em Master Memory). **Não** existem para censurar ideias nem travar criatividade. Se um hook for ruído, podemos simplificar — o padrão do projeto é **propor primeiro**, executar depois, salvo bug crítico.

---

## 🔮 ROADMAP (Sprint 9.0 — Agentic AI)

1. **Oráculo do Admin** — Vercel AI SDK · previsão de churn · CRM comportamental
2. **Copiloto do Coach** — Gerador de treinos · alerta anti-lesões · escalação preditiva
3. **Gêmeo Digital do Atleta** — Biomecânica por vídeo · XP dinâmico · psicologia esportiva

---

## 💡 ÁREA DE IDEIAS ABERTAS

> Esta seção é para propostas que a IA ou o usuário trouxerem durante o desenvolvimento.
> Ideias que ainda não são roadmap oficial mas merecem ser exploradas.
> **A IA deve popular esta seção ativamente quando identificar oportunidades.**

### Ideias em Aberto (sem comprometimento — explorar antes de decidir)

- **Check-in por geolocalização:** Aluno só consegue fazer check-in se estiver no raio de X metros da quadra
- **Modo Quadra (Offline-First total):** App funciona 100% sem internet — sync acontece quando a rede volta
- **Notificações Push reais:** Service Worker + Web Push API para alertar atleta de avaliação, aprovação, lembrete de treino
- **Widget de Clima integrado:** Aulas ao ar livre ganham aviso automático de chuva com sugestão de reagendar
- **Sistema de Reposição Inteligente:** Aluno falta → sistema sugere automaticamente aulas disponíveis para repor
- **Ranking de Turma:** Placar semanal de XP entre alunos da mesma turma (opt-in)
- **Vídeo Clip do Treino:** Coach grava clipe curto (15s) de um movimento e vincula à avaliação do aluno
- **Report de Fadiga Preditiva:** IA analisa frequência + queda de nota e alerta o coach antes da lesão
- **Financeiro Preditivo:** Previsão de caixa dos próximos 3 meses baseada em histórico de pagamentos
- **Onboarding Guiado do Atleta:** Primeira semana do aluno tem missões diárias ("Complete seu perfil", "Faça seu primeiro check-in")

---

> **O padrão aqui é:** a pergunta nunca é "funciona?" — é "isso é o melhor que podemos fazer agora?"
> Ideias têm casa. Sugestões são bem-vindas. Execução vem depois da conversa.
