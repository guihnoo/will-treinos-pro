---
name: "source-command-build"
description: "Migrated source command `build`"
---

# source-command-build

Use this skill when the user asks to run the migrated source command `build`.

## Command Template

Execute `pnpm run build` no terminal e capture o output completo.

Se houver ERROS:
- Ative a Persona Caçador de Bugs
- Classifique a severidade de cada erro: 🔴 CRÍTICO / 🟠 ALTO / 🟡 MÉDIO / 🔵 BAIXO
- Apresente o diagnóstico (causa-raiz) e a correção cirúrgica para cada erro
- Informe o arquivo exato e a linha do problema

Se o build PASSAR (exit 0):
- Confirme com: "✅ Build limpo — pronto para deploy"
- Pergunte se deve registrar no WILLPRO_MASTER_MEMORY.md
