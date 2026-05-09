# Will Treinos PRO — SSOT de stack, skills e checklist de ship

Documento único de referência: **o que importa** para velocidade, qualidade e segurança neste repo. Complementa `CLAUDE.md` e `.cursor/rules/` sem duplicar o changelog (`WILLPRO_MASTER_MEMORY.md`).

---

## 1. Princípios

1. **Projeto primeiro:** `.claude/skills/will-treinos-core/` + regras Cursor em `.cursor/rules/` têm precedência estética e de produto.
2. **Poucas skills por tarefa:** no máximo ~3 skills “globais” relevantes por sessão — evitar ruído e discovery gigante.
3. **Capability vs preference:** skills que **executam** algo novo (browser, PDF, scrape confiável) × skills que **fixam o jeito Will** (checklists, formato PR). Ambos têm lugar; não misturar sem necessidade.
4. **Skills de terceiros:** antes de instalar pacotes não oficiais, prefira revisar origem; para installs em massa, considerar fluxo de auditoria (scanner/overrides da própria stack Claude/OpenClaw).

---

## 2. Skills e pacotes — curadoria “muda o jogo”

### Tier P — sempre no radar deste produto

| Área | Uso no Will |
|------|-------------|
| **`will-treinos-core`** (repo) | Domínio: modal-first, Supabase, XP, agenda, deploy Git→Vercel. |
| **nextjs-skills / next-best-practices** | Next.js 15 App Router, performance, limites RSC/client. |
| **supabase-skills / supabase oficial** | RLS, auth, mutations, Storage — lei junto ao código. |
| **webapp-testing** (Anthropic) | Playwright em app local — fluxos críticos (login, cadastro, staff, dinheiro). |

### Tier Q — qualidade de UI e React (quando o PR mexe em telas)

| Skill | Quando usar |
|-------|-------------|
| **Vercel Web Design Guidelines** | Auditoria de UI (a11y, foco, touch targets, motion reduzido). |
| **Vercel React Best Practices** | Re-render, bundle, padrões de performance React/Next. |

### Tier S — segurança e mudanças sensíveis

| Skill / fluxo | Quando usar |
|---------------|-------------|
| **Trail of Bits / análise estática** (se instalado) ou **`/security-review`** no Claude Code | PRs com auth, cookies, APIs, uploads, queries privilegiadas. |
| **database-design / SQL** (pacotes que já usam) | Novas tabelas, índices, revisão de políticas RLS. |

### Tier R — pesquisa na web (opcional, com custo)

| Skill | Quando usar |
|-------|-------------|
| **Firecrawl** (CLI/skill) | Changelogs, docs de libs, benchmarks — saída em arquivo para não estourar contexto. |

### Conflitos conhecidos

- **frontend-design (Anthropic)** empurra direções visuais “anti-genéricas” e pode sugerir tipografia fora do **DS Will** (Lexend + Space Grotesk + ouro `#EAB308`). Use para **landing/experimentos** ou combine com instrução explícita: “respeitar DS Will nas áreas autenticadas”.

---

## 3. Checklist por tipo de mudança

Marque mentalmente (ou no PR) antes de pedir merge/deploy.

### A — UI / UX (`*.tsx`, CSS, motion)

- [ ] Estados **loading / erro / empty** onde faz sentido.
- [ ] Foco visível, labels, alvos de toque razoáveis em fluxos mobile (professor/aluno).
- [ ] **`prefers-reduced-motion`** quando houver animação não essencial.
- [ ] Alinhamento ao DS: escuro + ouro como acento de decisão; sem `bg-white` dominante em shell principal (ver `.cursor/rules/will-design-system.mdc`).
- [ ] `pnpm run build` verde após mudanças que afetem imports ou tipos.

### B — Auth / API / dados sensíveis

- [ ] Nenhuma **service role** ou segredo em client bundle / `'use client'`.
- [ ] Autorização **RLS + servidor**; frontend não é fonte única de permissão.
- [ ] Uploads: tipo/tamanho/nome; URLs assinadas onde aplicável.
- [ ] Revisar impacto em **`staff_access`**, JWT, callbacks OAuth, gates `/cadastro` · `/signup` se tocados.
- [ ] Rodar **`/security-review`** (Claude Code) ou revisão humana equivalente em PR grande.

### C — Migração / SQL / Supabase

- [ ] Migração idempotente e nomeada em `supabase/migrations/`.
- [ ] Políticas RLS e índices pensados para **staff vs aluno**.
- [ ] Documentar se precisa **aplicação manual** no projeto remoto (SQL Editor).
- [ ] Sem dados reais ou secrets no repo.

### D — Ship (qualquer lote que vá para produção)

Conforme `.cursor/rules/willpro-vercel-deploy.mdc`:

- [ ] `pnpm run build` OK.
- [ ] Entrada em `WILLPRO_MASTER_MEMORY.md` §3 (log Cursor/Claude).
- [ ] `git add` só paths do projeto; **não** `.next/`, artefatos locais, segredos.
- [ ] `git commit` + `git push origin main` (ou branch de release); confirmar sucesso.

---

## 4. Comandos Claude Code úteis (mapa rápido)

| Momento | Command |
|---------|---------|
| Feature grande / incerta | `/plan` |
| Diff grande antes do merge | `/security-review` |
| Refactor amplo paralelizável | `/batch` (com critério; worktrees) |
| Contexto inchado | `/compact`, `/context` |
| Higiene pós-feature | `/simplify` |
| Menos prompts de permissão | `/fewer-permission-prompts` (depois de padrões estáveis) |
| CI falhou no PR | `/autofix-pr` (requer `gh` + política org) |
| Onboarding de novo dev | `/team-onboarding` |

Lista completa: [Claude Code — Commands](https://code.claude.com/docs/en/commands).

---

## 5. O que não fazer

- Instalar dezenas de skills “por precaução” — aumenta tokens de discovery e confusão.
- Depender só de LLM para **RLS** ou políticas de produção sem revisão humana ou diff explícito.
- Merge para produção sem build verde **ou** sem atualizar Master Memory quando a mudança for relevante.

---

## 6. Referências externas (pesquisa)

- Curadoria prática de skills Claude Code: [Firecrawl — Best Claude Code Skills](https://www.firecrawl.dev/blog/best-claude-code-skills).
- Mapa amplo de agent skills (descoberta): [DataCamp — Top agent skills](https://www.datacamp.com/pt/blog/top-agent-skills).
- Índice comunitário: [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills).

Última revisão deste SSOT: mantida pelo time via PRs; não substituir `CLAUDE.md` — apenas focar **stack + ship**.
