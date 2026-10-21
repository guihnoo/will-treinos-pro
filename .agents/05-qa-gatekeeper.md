# 🚦 QA Gatekeeper & Zero Tolerance Protocol
**Will Treinos PRO — Autonomous Engineering Standard**

## Objetivo
Garantir que nenhuma regressão, quebra de contrato de tipos ou acoplamento excessivo passe para a branch `main` ou para o ambiente de produção.

---

## 1. Regra Inviolável de Compilação
- Antes de qualquer merge, commit de refatoração ou encerramento de sprint:
  ```bash
  pnpm exec tsc --noEmit
  ```
- O compilador TypeScript **deve** retornar **código de saída 0** e **zero erros**.
- Ignorar tipos com `any` arbitrário ou suprimir checagens com `@ts-ignore` sem justificativa arquitetural explícita é estritamente proibido.

---

## 2. Auditoria Contínua de Acoplamento
- Executar periodicamente o script:
  ```bash
  node scripts/run-agent-audit.mjs
  ```
- Critérios de Aceite:
  - O arquivo `WillCockpit.tsx` não deve regredir em número de linhas nem acumular novos `useState` booleanos para modais.
  - Novos modais do painel administrativo devem ser registrados no `modalManager.ts` e carregados sob demanda no `CockpitModalHost.tsx`.
  - O `AuthWrapper.tsx` deve preservar `/termos`, `/privacidade` e `/offline.html` em `PUBLIC_ROUTES`.
