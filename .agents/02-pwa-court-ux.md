# 🏐 Sports UX & PWA Court Protocol: Modo Quadra
**Will Treinos PRO — Autonomous Engineering Standard**

## Objetivo
Garantir que a experiência de uso pelo treinador ou atleta na quadra de vôlei — sob luz solar intensa, mãos com suor, sinal oscilante de 4G/5G — seja rápida, resiliente e tenha sensação 100% nativa de app móvel.

---

## 1. Ergonomia e Áreas de Toque (Touch Targets)
1. **Dimensão Mínima de Botões em Quadra:**
   - Todo botão de ação rápida (presença, falta, nota, check-in) deve ter `min-height: 56px` (`min-h-14`) e padding amplo.
   - Espaçamento adequado entre botões para evitar toques acidentais (`gap-3` a `gap-4`).
2. **Contraste de Alta Visibilidade:**
   - Fundo Deep Black (`#000000` / `zinc-950`) contrastando com Gold (`#EAB308` / `amber-400`), Emerald (`emerald-400`) e Pure White (`text-white`).
   - Evitar textos menores que 14px em elementos acionáveis durante a aula.
3. **Feedback Tátil Imediato (Haptic Engine):**
   - Importar `@/lib/hapticFeedback` e invocar:
     - `triggerHapticImpact("light")` ou `haptic(16)` para seleções e filtros.
     - `triggerHapticCelebration()` para conclusões de aula, metas batidas e subidas de nível.

---

## 2. Resiliência Offline-First
1. **Precache de Rotas Críticas:**
   - Rotas essenciais (`/`, `/dashboard`, `/agenda`, `/offline.html`) devem estar disponíveis no Service Worker.
2. **Operações Otimistas com Fila de Sincronia:**
   - Check-in e chamada nunca devem travar com spinners infinitos se a conexão cair.
   - Gravar no `localStorage` / IndexedDB via envelope com timestamp e disparar sincronização em background quando o evento `online` for detectado.
