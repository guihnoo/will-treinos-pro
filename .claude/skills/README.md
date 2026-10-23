# Skills — Claude Code (Will Treinos PRO)

## Projeto (`will-treinos-core`)

- **`will-treinos-core/`** — Skill mantida pelo time Will Treinos (regras do produto, paths, agentes).

## Anthropic (referência oficial)

As demais pastas foram copiadas do repositório público **[anthropics/skills](https://github.com/anthropics/skills)** (pasta `skills/`). Cada skill pode incluir `LICENSE.txt` próprio — verifique antes de redistribuir fora do uso interno do projeto.

Skills incluídas:

| Pasta | Uso típico no app |
|-------|---------------------|
| `algorithmic-art` | Arte gerativa / experimentos visuais |
| `brand-guidelines` | Consistência de marca |
| `canvas-design` | Design em canvas |
| `claude-api` | Integração com API Claude |
| `doc-coauthoring` | Documentação colaborativa |
| `docx` | Manipular `.docx` |
| `frontend-design` | UI web de alta qualidade (Next/React) |
| `internal-comms` | Comunicação interna / texto |
| `mcp-builder` | Construir servidores MCP |
| `pdf` | PDFs |
| `pptx` | Apresentações |
| `skill-creator` | Criar novas skills |
| `slack-gif-creator` | GIFs estilo Slack |
| `theme-factory` | Temas e tokens |
| `web-artifacts-builder` | Artefatos HTML/web |
| `webapp-testing` | Testes de app web |
| `xlsx` | Planilhas |

## Design Engineering (emilkowalski/skills)

Copiadas do repositório público **[emilkowalski/skills](https://github.com/emilkowalski/skills)** (MIT, ver `EMILKOWALSKI-SKILLS-LICENSE.md`). Autor: Emil Kowalski (Vaul, Sonner, criador do curso Animations on the Web).

| Pasta | Uso típico no app |
|-------|---------------------|
| `emil-design-eng` | Filosofia de polish/craft — formato obrigatório de review (tabela Before/After/Why) |
| `animate` | Receitas prontas de animação (Framer Motion/CSS) com curvas e durações corretas |
| `break-ui` | Catálogo de armadilhas de UI genérica a evitar |
| `improve-animations` | Diagnóstico de animações existentes fracas/genéricas |
| `review-animations` | Checklist de revisão de motion antes de aprovar |

Usado pelo agente `@visual-director` (abaixo) como base de critério — não é genérico: é a mesma régua que produtos premium (Linear, Vercel, Raycast) usam.

## Design/UI avançado (mblode/agent-skills)

Copiadas do repositório público **[mblode/agent-skills](https://github.com/mblode/agent-skills)** (MIT, ver `MBLODE-AGENT-SKILLS-LICENSE.md`) — pacote focado explicitamente em evitar "AI slop" (resultado genérico com cara de IA).

| Pasta | Uso típico no app |
|-------|---------------------|
| `ui-design` | O núcleo: escolhe direção visual (modo Direction), implementa em React/Tailwind (modo Build), audita o que já existe incl. "deslop" (modo Audit), testa dado-limite (modo Break) |
| `ui-animation` | Constrói/mede motion real — springs, gestos, curvas, reverse-engineering de animação de referência |
| `typography-audit` | 78 regras de auditoria tipográfica (carregamento de fonte, escala, espaçamento, OpenType) |
| `ux-verification` → `ui-verification` | Mede o resultado de verdade no navegador (probes de foco, hit target, overflow, tema) |
| `product-design` | Decide comportamento/interação antes da aparência — o que o controle faz, é reversível, estado vazio |
| `ax-audit` | Audita fluxos onde um agente/IA opera o produto (relevante pros nossos próprios agentes dentro do app) |

Usado pelo agente `@visual-director` como a sequência principal de trabalho (ver seu arquivo `.md` — ordem de skills a carregar).

## Sistemas & fundamentos (wshobson/agents, plugin ui-design)

Copiadas do repositório público **[wshobson/agents](https://github.com/wshobson/agents)** (MIT, 41k★, marketplace multi-harness ativo). `WSHOBSON-AGENTS-LICENSE.md` tem a licença completa. Agentes novos descritos na seção seguinte.

| Pasta | Uso típico no app |
|-------|---------------------|
| `visual-design-foundations` | Tipografia, teoria da cor, sistemas de espaçamento, iconografia |
| `interaction-design` | Microinterações, transições, estados de loading/feedback |
| `design-system-patterns` | Design tokens, theming, arquitetura de componentes |
| `responsive-design` | Container queries, tipografia fluida, mobile-first |
| `web-component-design` | Padrões de componente React (composição, CSS-in-JS) |
| `accessibility-compliance` | WCAG 2.2, ARIA, leitor de tela — não negociável pra quadra/suor/mãos |
| `brand-landingpage` | Entrevista de identidade de marca → gera landing page via **Stitch** (mesma ferramenta usada antes pelo Codex) |

## Resumo do time (atualizado 23/10/2026 — reforçado)

| Papel | Onde | Pode escrever código? |
|-------|------|------------------------|
| Direção + implementação visual nova (líder do time) | `@visual-director` (agente) | ✅ Write/Edit/Bash |
| Componentes/layout/visual de UI | `@ui-designer` (agente, wshobson) | ✅ (herda todas as ferramentas) |
| Tokens, temas, arquitetura de design system | `@design-system-architect` (agente, wshobson) | ✅ |
| Acessibilidade (WCAG, leitor de tela, teclado) | `@accessibility-expert` (agente, wshobson) | ✅ |
| Auditoria de código visual já existente | `@design-guardian`, `@will-design-guardian` (agentes) | ✅ (função hoje sobreposta pelo skill `ui-design` modo Audit — preferir o skill quando possível) |
| Critério de craft/polish | skills `emil-design-eng`, `ui-design`, `typography-audit`, `visual-design-foundations` | — (conhecimento, não execução) |
| Motion | skills `animate`, `ui-animation`, `improve-animations`, `review-animations`, `interaction-design` | — |
| Design system / tokens / responsividade | skills `design-system-patterns`, `responsive-design`, `web-component-design` | — |
| Stress-test de dado real | skill `break-ui` | — |
| Medir no navegador de verdade | skill `ui-verification` + MCP `playwright` já configurado | ✅ via MCP |
| Landing page com identidade de marca via Stitch | skill `brand-landingpage` | — (gera via Stitch) |

**Quando usar qual agente:** `@visual-director` lidera e decide a direção; chama `@design-system-architect` quando a decisão é de tokens/tema (não de uma tela isolada); chama `@ui-designer` pra implementação de componente específico quando quiser uma segunda perspectiva; chama `@accessibility-expert` como última revisão antes de considerar algo pronto — touch target ≥44px e contraste não são negociáveis neste app (quadra, suor, mãos).

Reinicie o Claude Code após adicionar esta pasta pela primeira vez, se a sessão já estiver aberta.
