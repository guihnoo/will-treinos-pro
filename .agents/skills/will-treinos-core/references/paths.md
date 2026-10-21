# Referências rápidas — Will Treinos PRO

Use `Read` na raiz do repositório com estes caminhos relativos.

## Contrato e estado

- `CLAUDE.md` — cérebro do projeto (sempre)
- `WILLPRO_MASTER_MEMORY.md` — log vivo e decisões
- `MANUAL_WILL.md` — regras de negócio (se existir na raiz)

## App Router

- `src/app/layout.tsx` — providers
- `src/app/dashboard/page.tsx` — cockpit principal
- `src/middleware.ts` — gates de rota

## Contextos

- `src/context/AppContext.tsx` — núcleo (não recolocar o que já foi migrado para providers especializados)
- `src/context/types.ts` — tipos de domínio

## Supabase

- `src/lib/supabasePersistence.ts` — sync / storage
- `supabase/migrations/` — SQL e RLS

## UI / marca

- `src/components/ui/` — átomos
- `src/components/will/` — painel admin / Engine

## Agentes e comandos (este repo)

- `.claude/agents/*.md` — especialistas (`@nome`)
- `.claude/commands/*.md` — slash commands (`/sprint`, `/xp`, …)
