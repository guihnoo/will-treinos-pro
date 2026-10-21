# 🏛️ Architecture Rule: Modal Store & Dynamic Host Pattern
**Will Treinos PRO — Autonomous Engineering Standard**

## Objetivo
Eliminar acoplamento em componentes monolíticos ("God Components") como `WillCockpit.tsx` e `StudentHome.tsx`, garantindo que a renderização de modais não force a re-renderização da árvore inteira da aplicação.

---

## 1. Princípios Arquiteturais (SOLID & React 18/19)
1. **Zero External Dependencies para Estado Global de Modais:**
   - Utilizar o hook nativo `useSyncExternalStore` do React em `src/lib/modalManager.ts`.
   - Modais nunca devem adicionar estados booleanos `useState(false)` ou `useState<string | null>(null)` no corpo dos componentes pai.

2. **Tipagem Estrita de Chaves e Payloads:**
   - Todas as chaves devem ser registradas na união `CockpitModalKey`.
   - Todos os dados passados para modais devem ser declarados no mapa de tipos `CockpitModalPayloadMap`.
   - Chamar `modalManager.openModal(key, payload)` garante contrato seguro em tempo de compilação.

3. **Carregamento Sob Demanda (`next/dynamic`):**
   - No `CockpitModalHost.tsx`, nenhum modal deve ser importado estaticamente.
   - Todo modal secundário/pesado é carregado com:
     ```tsx
     const XPModerationPanel = dynamic(() => import("./XPModerationPanel"), {
       loading: () => null,
       ssr: false,
     });
     ```
   - O JavaScript só é baixado pela rede do usuário no instante em que o modal é aberto.

4. **Acessibilidade e Usabilidade Nativa (PWA):**
   - O `modalManager` mantém um listener global de teclado para fechar no `ESC`.
   - O `isAnyModalOpen` deve ser sincronizado com o hook `useBodyScrollLock` para travar o scroll da página de fundo no mobile/iOS.
