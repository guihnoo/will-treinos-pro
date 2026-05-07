# 🚀 PROMPT MASTER — WILL TREINOS PRO ARSENAL SETUP

# Cole este prompt diretamente no Claude Code e ele executará tudo autonomamente

# Versão: 2.0 | Data: 2026-05-04

---

## COMO USAR

1. Abra o Claude Code no terminal dentro de: `C:\Users\monte\Desktop\will-treinos-pro`
2. Cole TODO o conteúdo da seção "PROMPT" abaixo
3. Pressione Enter e aguarde — o Claude faz tudo sozinho

---

## PROMPT

[(Copie a partir daqui até o final do arquivo)]
Leia este prompt completo antes de executar qualquer coisa. Execute cada fase em sequência, confirmando o resultado de cada passo antes de continuar.

---

## 🎯 MISSÃO

Configurar o ecossistema completo de desenvolvimento do Will Treinos PRO com:

1. MCPs (ferramentas com "mãos" para o Claude)
2. Subagentes já instalados (verificar e ativar)
3. Validar estrutura do projeto
4. Atualizar o arquivo de memória central
5. Rodar uma verificação final de saúde do projeto

---

## ⚠️ REGRA ABSOLUTA #1 — DIRETÓRIO CORRETO

**ANTES DE QUALQUER COISA**, verifique se você está no diretório correto:

```
C:\Users\monte\Desktop\will-treinos-pro
```

Execute: `pwd` ou `Get-Location`

Se o resultado for DIFERENTE desse caminho, PARE imediatamente e avise:
> "⚠️ ERRO DE DIRETÓRIO: Estou em [caminho atual]. O projeto está em C:\Users\monte\Desktop\will-treinos-pro. Por favor, me execute nesse diretório."

Só continue se estiver no diretório correto.

---

## 📋 FASE 1 — AUDITORIA DO PROJETO (não modifica nada)

Execute estas verificações e me mostre os resultados:

```bash
# 1.1 Verificar se Next.js está instalado
cat package.json | grep -E '"next"|"version"'

# 1.2 Verificar estrutura do projeto
ls -la

# 1.3 Verificar subagentes já instalados
ls .claude/agents/

# 1.4 Verificar cursor rules
ls .cursor/rules/

# 1.5 Verificar se .claude/mcp.json existe
cat .claude/mcp.json 2>/dev/null || echo "mcp.json não encontrado"

# 1.6 Verificar se node_modules existe
ls node_modules | head -5 2>/dev/null || echo "node_modules não encontrado"
```

Mostre um resumo: ✅ ou ❌ para cada item.

---

## 📦 FASE 2 — INSTALAR/ATUALIZAR MCPs

### 2.1 Criar/atualizar `.claude/mcp.json`

Verifique se `.claude/mcp.json` existe. Se existir, LEIA o conteúdo atual e faça MERGE (não sobrescreva os MCPs já configurados). Se não existir, crie com o conteúdo completo abaixo:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "description": "Browser automation oficial Microsoft. Testa UI, valida fluxos, tira screenshots do Will Treinos."
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "description": "Banco de dados Supabase. Inspeciona schema, testa RLS, cria dados de seed."
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      },
      "description": "GitHub: abre issues de bugs, cria PRs, faz code review automático."
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\monte\\Desktop\\will-treinos-pro"
      ],
      "description": "Acesso seguro ao sistema de arquivos do projeto Will Treinos."
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "description": "Memória persistente entre sessões. Salva decisões arquiteturais."
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "description": "Busca conteúdo web. Consulta docs, APIs, referências externas."
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "description": "Documentação sempre atualizada de Next.js 15, Supabase, Tailwind, Framer Motion. USE CONTEXT7 antes de qualquer implementação."
    },
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander@latest"],
      "description": "Executa comandos shell, lê/escreve arquivos. Roda npm run build, npm test."
    }
  }
}
```

### 2.2 Instalar dependência de Web Push

Verifique se `web-push` está no package.json:

```bash
cat package.json | grep web-push
```

Se não estiver, instale:

```bash
npm install web-push
npm install --save-dev @types/web-push
```

### 2.3 Verificar se Playwright está instalado para testes E2E

```bash
cat package.json | grep playwright
```

Se não estiver, instale:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium --with-deps
```

---

## 🤖 FASE 3 — VERIFICAR SUBAGENTES

Liste todos os subagentes em `.claude/agents/` e verifique se estes existem:

**Obrigatórios:**

- [ ] `nextjs-developer.md`
- [ ] `ui-ux-tester.md`
- [ ] `performance-engineer.md`
- [ ] `pwa-specialist.md`
- [ ] `xp-gamification.md`
- [ ] `will-qa-tester.md`
- [ ] `will-design-guardian.md`
- [ ] `will-security-auditor.md`
- [ ] `volleyball-coach.md`

Se algum estiver faltando, avise quais estão faltando mas **NÃO tente criá-los** — eles já existem em `.agent-arsenal/` e precisam ser verificados.

---

## 📏 FASE 4 — VERIFICAR CURSOR RULES

Verifique se estes arquivos existem em `.cursor/rules/`:

**Obrigatórios:**

- [ ] `nextjs-15-expert.mdc`
- [ ] `supabase-expert.mdc`
- [ ] `will-design-system.mdc`
- [ ] `will-tdd-enforcer.mdc`
- [ ] `pwa-standards.mdc`
- [ ] `gamification-rules.mdc`

---

## 🏗️ FASE 5 — VERIFICAR ESTRUTURA DO PROJETO NEXT.JS

Verifique se a estrutura do App Router está correta:

```bash
# Verificar estrutura principal
ls app/ 2>/dev/null || echo "Pasta app/ não encontrada"
ls components/ 2>/dev/null || echo "Pasta components/ não encontrada"
ls lib/ 2>/dev/null || echo "Pasta lib/ não encontrada"
ls public/ 2>/dev/null || echo "Pasta public/ não encontrada"
```

Se `app/` não existir mas `src/app/` existir, me avise.

**Verificar arquivos críticos do PWA:**

```bash
ls public/manifest.json 2>/dev/null || echo "❌ manifest.json não encontrado"
ls public/sw.js 2>/dev/null || echo "❌ Service Worker não encontrado"
ls public/icons/ 2>/dev/null || echo "❌ Pasta de ícones não encontrada"
```

---

## 🔐 FASE 6 — VERIFICAR .env.local

Verifique se `.env.local` existe e tem as variáveis essenciais (SEM mostrar os valores):

```bash
# Listar apenas os NOMES das variáveis (sem valores)
cat .env.local | grep -oP '^[^=]+' 2>/dev/null || echo ".env.local não encontrado"
```

Variáveis que devem existir:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (ou marcar como pendente)
- [ ] `VAPID_PRIVATE_KEY` (ou marcar como pendente)

---

## 📝 FASE 7 — ATUALIZAR WILLPRO_MASTER_MEMORY.md

Leia `WILLPRO_MASTER_MEMORY.md` e adicione uma nova seção no final:

```markdown

---

## 🤖 ARSENAL DE AGENTES — Atualizado em [DATA_ATUAL]

### Status do Ecossistema
- **MCPs Configurados:** playwright, supabase, github, filesystem, memory, fetch, context7, desktop-commander
- **Subagentes Ativos:** 14 agentes em .claude/agents/
- **Cursor Rules:** 9 regras em .cursor/rules/

### Subagentes Especializados Will Treinos
| Agente | Gatilho |
|--------|---------|
| xp-gamification | XP, pontos, nível, multiplicador, fundamento |
| pwa-specialist | PWA, push, Service Worker, offline, VAPID |
| performance-engineer | lento, bundle, Lighthouse, N+1, otimizar |
| nextjs-developer | feature, componente, página, API Route |
| ui-ux-tester | testar, fluxo, UI, verificar, bug visual |

### Como Chamar os Agentes (Claude Code)
- Automático: O Claude detecta o contexto e delega sozinho
- Manual: "Use o agente xp-gamification para calcular o XP do check-in"
- Parallel: "Teste os fluxos de login E o sistema de XP ao mesmo tempo"

### MCPs Essenciais
- **context7:** Sempre adicionar "use context7" para docs atualizadas
- **playwright:** Testa a UI real no browser
- **supabase:** Acessa o banco diretamente para testes e migrations
```

---

## ✅ FASE 8 — RELATÓRIO FINAL

Gere um relatório completo no formato:

```
╔══════════════════════════════════════════╗
║   WILL TREINOS PRO — ARSENAL STATUS      ║
╠══════════════════════════════════════════╣
║ 📁 Diretório: [caminho]                  ║
║ ⚡ Next.js: [versão]                     ║
╠══════════════════════════════════════════╣
║ 🔧 MCPs CONFIGURADOS                     ║
║   ✅ playwright                          ║
║   ✅ supabase                            ║
║   ✅ context7                            ║
║   ✅ filesystem                          ║
║   ✅ memory                              ║
║   ✅ fetch                               ║
║   ✅ desktop-commander                   ║
║   ✅ github                              ║
╠══════════════════════════════════════════╣
║ 🤖 SUBAGENTES ([N]/14)                   ║
║   [lista de ✅/❌ por agente]             ║
╠══════════════════════════════════════════╣
║ 📏 CURSOR RULES ([N]/9)                  ║
║   [lista de ✅/❌ por rule]               ║
╠══════════════════════════════════════════╣
║ 🏗️ ESTRUTURA DO PROJETO                  ║
║   [✅/❌] app/                            ║
║   [✅/❌] components/                     ║
║   [✅/❌] lib/                            ║
║   [✅/❌] public/manifest.json            ║
║   [✅/❌] public/sw.js                    ║
╠══════════════════════════════════════════╣
║ 🔐 VARIÁVEIS DE AMBIENTE                 ║
║   [✅/❌] NEXT_PUBLIC_SUPABASE_URL        ║
║   [✅/❌] VAPID keys                      ║
╠══════════════════════════════════════════╣
║ ⚠️ PENDÊNCIAS CRÍTICAS                   ║
║   [lista do que precisa atenção]         ║
╠══════════════════════════════════════════╣
║ 🚀 PRÓXIMOS PASSOS SUGERIDOS             ║
║   1. [ação mais urgente]                 ║
║   2. [segunda ação]                      ║
║   3. [terceira ação]                     ║
╚══════════════════════════════════════════╝
```

---

## 🧠 REGRAS COMPORTAMENTAIS (durante toda a execução)

1. **Nunca modifique código de produção** durante este setup — apenas arquivos de configuração e documentação
2. **Se algo falhar**, continue com a próxima fase e liste o erro no relatório final
3. **Use Context7** para qualquer dúvida sobre APIs do Next.js ou Supabase durante o processo
4. **Registre tudo** — qualquer decisão importante vai no WILLPRO_MASTER_MEMORY.md
5. **Design System:** Se precisar criar algum componente, use obrigatoriamente `#000000` + `#EAB308` + Framer Motion
6. **Idioma:** Relatórios e comentários em Português (pt-BR). Código em inglês.

---

## 🎯 FOCO DO PRÓXIMO DESENVOLVIMENTO

Após concluir o setup, sugira qual funcionalidade deve ser desenvolvida primeiro com base nas lacunas encontradas. Prioridade sugerida:

1. 🔔 **PWA Service Worker + Push Notifications** (maior diferencial de produto)
2. 🏋️ **CRUD de Treinos completo** (coach prescreve → aluno executa)
3. ⚡ **Supabase Realtime** (check-ins ao vivo no cockpit admin)
4. 📊 **XP System** com `xp_log` e multiplicadores por fundamento
5. 🏅 **Área do Aluno V2 Kinetic** completa

Aguardo seu relatório completo!
