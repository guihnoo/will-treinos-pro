# 🚀 WILL TREINOS PRO — AGENT ARSENAL
> Pesquisa completa e curada de todos os melhores subagentes, MCPs e skills disponíveis.
> Fontes: awesome-mcp-servers (punkpeye, 2692+ entradas), VoltAgent/awesome-claude-code-subagents (131+), Docs Oficiais Anthropic.

---

## ⚡ TIER S — OS MONSTROS ABSOLUTOS (Usar AGORA)

### 🖥️ 1. Microsoft Playwright MCP (OFICIAL)
- **Repo:** `github.com/microsoft/playwright-mcp`
- **O que faz:** Browser automation usando snapshots de acessibilidade. O Claude consegue abrir localhost:3000, clicar em botões, preencher formulários de login, validar o fluxo do aluno, e gerar relatório com screenshot.
- **Por que é Tier S:** É o MCP oficial da Microsoft, com a melhor estabilidade. Usa accessibility tree ao invés de visão, é 3x mais rápido.
- **Instalar:** `npx -y @playwright/mcp@latest`
- **Config:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### 🗄️ 2. Supabase MCP (OFICIAL)
- **Repo:** `github.com/supabase-community/supabase-mcp`
- **O que faz:** Conecta direto no banco do Will Treinos. O agente pode inspecionar schema, rodar SQL, testar RLS policies, criar dados de seed.
- **Config:** Necessita `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
- **Instalar:** `npx -y @supabase/mcp-server-supabase@latest`

### 🐙 3. GitHub MCP (OFICIAL)
- **Repo:** `github.com/github/github-mcp-server`
- **O que faz:** Abre issues automaticamente quando um teste quebra, cria PRs, faz code review por CLI.
- **Instalar:** `npx -y @modelcontextprotocol/server-github`

### 🔒 4. E2B Sandbox MCP
- **Repo:** `github.com/asif-nvc/e2b-sandbox-mcp`
- **O que faz:** Executa código em VMs isoladas na nuvem. Permite ao Claude rodar `npm run build`, `npx playwright test` sem tocar na sua máquina. 29 tools.
- **Instalar:** `npx -y e2b-sandbox-mcp` (requer E2B API Key)

### 🖥️ 5. DesktopCommander MCP
- **Repo:** `github.com/wonderwhy-er/DesktopCommanderMCP`
- **O que faz:** Canivete suíço: roda programas, executa comandos shell, lê/escreve/busca arquivos. Essencial para orquestrar o build.
- **Instalar:** `npx -y @wonderwhy-er/desktop-commander`

---

## 🔥 TIER A — PODEROSOS (Usar no Sprint)

### 🎨 6. Figma MCP (Talk to Figma)
- **Repo:** `github.com/sonnylazuardi/cursor-talk-to-figma-mcp`
- **O que faz:** Lê seu design Figma e extrai cores, fontes, espaçamentos. Pode até alterar frames.
- **Por que é útil:** Se você tiver o layout do Will Treinos no Figma, o Claude gera Tailwind pixel-perfect.
- **Instalar:** Plugin Figma + `npx -y figma-mcp`

### 🌐 7. Operative Web Eval Agent
- **Repo:** `github.com/Operative-Sh/web-eval-agent`
- **O que faz:** **Debugga aplicações web de forma autônoma** com browser-use agents. Detecta erros de UI, erros de console, e tenta consertar sozinho.
- **Stack:** Python + Playwright + browser-use

### 📸 8. PageBolt MCP (Screenshots + Video)
- **Repo:** `github.com/Custodia-Admin/pagebolt-mcp`
- **O que faz:** Tira screenshots, gera PDFs e **grava videos de navegação** no seu app. Perfeito para documentar fluxos.
- **Instalar:** `npx -y pagebolt-mcp`

### 🔧 9. Browser DevTools MCP
- **Repo:** `github.com/serkan-ozal/browser-devtools-mcp`
- **O que faz:** Inspelment de elementos, console do browser, network requests. O Claude testa, debugga e valida diretamente.

### 🛡️ 10. Preflight MCP (Anti-Prompt Vago)
- **Repo:** `github.com/preflight-dev/preflight`
- **O que faz:** 24-tool MCP que **pega prompts vagos antes que eles desperdicem tokens**. Valida prompts com 12 categorias de scorecard antes de executar.
- **Instalar:** Via npm

---

## 🤖 TIER S — SUBAGENTES CLAUDE CODE (VoltAgent Collection)

> Instalar via: `claude plugin marketplace add VoltAgent/awesome-claude-code-subagents`

### 👾 Os Monstrinhos que VOCÊ PRECISA:

| Subagente | Plugin | O que faz |
|-----------|--------|-----------|
| **`ui-ux-tester`** | `voltagent-qa-sec` | Testa fluxos de UI documentados exaustivamente |
| **`qa-expert`** | `voltagent-qa-sec` | Automação de testes completa |
| **`test-automator`** | `voltagent-qa-sec` | Cria frameworks de teste automático |
| **`nextjs-developer`** | `voltagent-lang` | Especialista Next.js 14+ full-stack |
| **`typescript-pro`** | `voltagent-lang` | TypeScript strict mode expert |
| **`postgres-pro`** | `voltagent-data-ai` | PostgreSQL + RLS + índices |
| **`database-optimizer`** | `voltagent-data-ai` | Performance de queries Supabase |
| **`security-auditor`** | `voltagent-qa-sec` | Audita vulnerabilidades (RLS, JWT) |
| **`performance-engineer`** | `voltagent-qa-sec` | Otimiza bundle, lazy loading, memoization |
| **`accessibility-tester`** | `voltagent-qa-sec` | A11y compliance (WCAG 2.1) |
| **`code-reviewer`** | `voltagent-qa-sec` | Code quality guardian |
| **`debugger`** | `voltagent-qa-sec` | Advanced debugging specialist |
| **`error-detective`** | `voltagent-qa-sec` | Analisa e resolve erros |
| **`frontend-developer`** | `voltagent-core-dev` | UI/UX React specialist |
| **`fullstack-developer`** | `voltagent-core-dev` | End-to-end feature development |
| **`workflow-orchestrator`** | `voltagent-meta` | Orquestra workflows complexos |
| **`multi-agent-coordinator`** | `voltagent-meta` | Coordena múltiplos agentes em paralelo |
| **`context-manager`** | `voltagent-meta` | Otimiza uso de contexto (economiza tokens!) |

---

## 🎯 TIER A — CURSOR RULES (Para .cursor/rules/)

### Regras que o Cursor deve seguir para o Will Treinos:

#### 1. `nextjs-15-app-router.mdc`
- Nunca usar `useState` em Server Components
- Sempre usar `use server` e `use client` corretamente
- Data fetching via Server Components by default

#### 2. `tailwind-framer-premium.mdc`
- Proibido cores genéricas (red-500, blue-400)
- Obrigado usar paleta Will Treinos (#000000, #EAB308)
- Animações Framer Motion em toda interação

#### 3. `supabase-rls-guardian.mdc`
- Toda query deve ter RLS policy verificada
- Nunca expor service_role no client
- Sempre usar Row Level Security

#### 4. `tdd-playwright-enforcer.mdc`
- Escrever teste ANTES da feature
- Não encerrar tarefa sem testes passando
- Screenshots de evidência obrigatórias

---

## 🧩 TIER B — MCPs EXTRAS ÚTEIS

| MCP | Uso | Instalar |
|-----|-----|---------|
| **MCP Doctor** | Diagnostica outros MCPs, verifica conexões | `npx -y mcp-doctor` |
| **Filesystem MCP** | Acesso controlado ao sistema de arquivos | `npx -y @modelcontextprotocol/server-filesystem` |
| **Fetch MCP** | Busca conteúdo web para os agentes | `npx -y @modelcontextprotocol/server-fetch` |
| **Memory MCP** | Persiste conhecimento entre sessões | `npx -y @modelcontextprotocol/server-memory` |
| **PostHog MCP** | Analytics e product analytics | Já no projeto (mcp.json) |
| **Context7 MCP** | Documentação de libs sempre atualizada | `npx -y @upstash/context7-mcp` |
| **Mermaid MCP** | Gera diagramas de arquitetura | `npx -y @narasimhaponnada/mermaid-mcp-server` |
| **Deploy Dashboard MCP** | Vercel + Railway + Fly em uma interface | Via pip |

---

## 🏗️ ARQUITETURA DO ESQUADRÃO COMPLETO

```
WILL TREINOS ENGINE
│
├── 🧠 ORQUESTRADOR PRINCIPAL (Claude Code / Cursor)
│   ├── Lê CLAUDE.md + WILLPRO_MASTER_MEMORY.md
│   └── Delega para subagentes especializados
│
├── 🔬 SQUAD DE QUALIDADE (Paralelo)
│   ├── ui-ux-tester → valida interfaces
│   ├── qa-expert → roda suíte Playwright
│   ├── accessibility-tester → WCAG compliance
│   └── security-auditor → RLS + JWT check
│
├── 💻 SQUAD DE CÓDIGO
│   ├── nextjs-developer → features Next.js 15
│   ├── typescript-pro → type safety
│   └── postgres-pro → queries Supabase
│
├── 🌐 MCPs ATIVOS
│   ├── playwright-mcp → browser automation
│   ├── supabase-mcp → banco de dados
│   ├── github-mcp → versionamento
│   └── desktop-commander → shell + files
│
└── 📊 MEMÓRIA
    └── WILLPRO_MASTER_MEMORY.md (registro de tudo)
```

---

## 🚀 COMO ATIVAR TUDO (Step-by-Step)

### Passo 1: Instalar MCPs no Claude Code
```bash
# No diretório do projeto
cd C:\Users\monte\Desktop\will-treinos-pro

# Instalar Playwright
npx -y @playwright/mcp@latest

# Instalar Desktop Commander (global)
npx -y @wonderwhy-er/desktop-commander
```

### Passo 2: Instalar Subagentes VoltAgent
```bash
claude plugin marketplace add VoltAgent/awesome-claude-code-subagents
claude plugin install voltagent-qa-sec      # Testing + Security
claude plugin install voltagent-lang        # nextjs-developer, typescript-pro
claude plugin install voltagent-data-ai     # postgres-pro, database-optimizer
claude plugin install voltagent-meta        # workflow-orchestrator, multi-agent-coordinator
```

### Passo 3: Configurar .claude/mcp.json
> Ver arquivo: `.agent-arsenal/mcp-config.json`

### Passo 4: Adicionar Cursor Rules
> Ver pasta: `.cursor/rules/` (arquivos .mdc)

---

## 📅 Data da Pesquisa
- Fontes consultadas: 2026-05-04
- awesome-mcp-servers: 2692+ servidores analisados
- VoltAgent subagents: 131+ agentes analisados
- Cursor Directory: Consultado (rate limited, mas principais capturados)
- Docs Anthropic Claude Code: Referência oficial de subagents

---
*Arsenal curado para Will Treinos PRO — Tier 1 Global Tech Product*
