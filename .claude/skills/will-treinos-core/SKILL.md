---
name: will-treinos-core
description: >
  Projeto Will Treinos PRO — app Next.js 15 + Supabase para gestão de vôlei de alta performance
  (admin, professor, aluno). Use esta skill SEMPRE que estiver editando este repositório ou
  discutindo features, UX, XP/gamificação, agenda, financeiro, feed, check-in ou deploy Vercel.
  Carrega o manual mental do produto: identidade dark+gold, modal-first, RLS Supabase, parceria
  criativa (propor antes de codar). Para domínio esportivo profundo invoque @volleyball-coach;
  para dinâmica de aula/sessão invoque @session-lab; para UI arrojada @design-guardian.
---

# Will Treinos PRO — Skill núcleo

## Primeiro passo (obrigatório)

1. Ler **`CLAUDE.md`** na raiz do repo (mentalidade, protocolo criativo, stack, workflow Git/Vercel).
2. Se a tarefa alterar arquitetura ou decisão de produto, ler **`WILLPRO_MASTER_MEMORY.md`** (especialmente o changelog na seção 3).

## Referências nesta skill

| Arquivo | Conteúdo |
|---------|-----------|
| `references/paths.md` | Índice rápido de pastas e arquivos críticos |

Use **`Read`** para abrir arquivos listados ali quando a tarefa tocar naquele domínio.

## Regras que não negociamos

- **Auth real:** RLS e políticas no Supabase são lei; o browser não “decide” permissão sozinho.
- **Datas:** preferir helpers do projeto (ex. `localDateISO`) — evitar drift UTC em regra de negócio.
- **Deploy:** após lote com código/config de produção, `pnpm run build` e push Git conforme regra do repo (ver `CLAUDE.md`).

## Subagentes (quando especializar)

| Agente | Quando |
|--------|--------|
| `@design-guardian` | UI/UX, motion, glass, hierarquia visual |
| `@volleyball-coach` | XP, fundamentos, lógica de quadra |
| `@session-lab` | Microciclo de treino, dinâmica professor–turma, UX da sessão |
| `@build-validator` | Validar `tsc` + build |
| `@security-scanner` | Auth, uploads, dados sensíveis, RLS |
| `@memory-logger` | Registrar mudança estrutural no Master Memory |

## Ideias e criação

Esta skill **não** limita escopo: features novas, novos fluxos visuais e experimentos são bem-vindos desde que passem por segurança e build. Em dúvida, propor **Conceito A / B / C** antes de implementar (exceto hotfix crítico).
