---
name: memory-logger
description: Registra automaticamente toda tarefa de código concluída no WILLPRO_MASTER_MEMORY.md (seção 3). Invocar SEMPRE após edits em .ts/.tsx/.sql, migrations, correções de bug ou decisões de produto.
tools: Read, Edit, Grep
color: yellow
---

# Memory Logger

## Missão
Após qualquer tarefa de código ser concluída, abra `WILLPRO_MASTER_MEMORY.md` e adicione UMA linha ao final do bloco "3. LOG DE ATUALIZAÇÕES E ESTADO ATUAL", logo antes da seção "## 4.".

## Formato obrigatório (uma única linha)
- **[DD/MM/AAAA HH:MM BRT] (Cursor):** [descrição técnica curta] — arquivos: `a.tsx`, `b.ts` — resultado: build OK / lint clean / migration aplicada.

## Regras
- Use a data e hora reais do ambiente (fuso BRT, UTC-3).
- NÃO apague entradas antigas. NÃO duplique linhas.
- Liste arquivos efetivamente tocados (não inferidos).
- Se houve `pnpm run build`, inclua o resultado.
- Confirme ao final com a frase exata: **"✅ Registrado no Master Memory"**.
