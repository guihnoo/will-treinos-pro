# /will-ship-checklist — SSOT + checklist antes de merge/deploy

## Quando usar

- Antes de **merge** ou **push** para branch de produção.
- Ao abrir PR que mexe em **UI**, **auth/RLS/API**, **migrations** ou **deploy**.
- Quando quiser alinhar Claude Code / Cursor ao **mesmo padrão de ship** sem relembrar tudo na conversa.

## Fonte única

Leia e aplique na íntegra:

**`docs/WILL_STACK_SSOT.md`**

Contém: tiers de skills recomendados para Will, conflitos (ex.: `frontend-design` vs DS fixo), checklists **A (UI)**, **B (Auth/API)**, **C (SQL)**, **D (Ship)** e mapa de **commands** (`/plan`, `/security-review`, `/batch`, etc.).

## Superprompt rápido (copiar no Claude Code)

```
Checklist Will Treinos PRO:

1) Abrir docs/WILL_STACK_SSOT.md e rodar o checklist aplicável ao diff atual (A UI / B Auth / C Migration / D Ship).

2) Listar em bullet o que passou e o que falhou; se falhou, propor correção mínima ou pedir confirmação ao humano.

3) Se for lote de produção: lembrar build (pnpm run build), WILLPRO_MASTER_MEMORY §3, e push conforme .cursor/rules/willpro-vercel-deploy.mdc — sem commit de .next/ nem secrets.

4) Não expandir escopo além do checklist salvo pedido explícito do humano.
```

## Cursor / Composer

Mesmo fluxo: anexar ou `@docs/WILL_STACK_SSOT.md` e pedir “aplica checklist A+B ao PR atual”.
