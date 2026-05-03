# /modal — Scaffold de Modal Glassmorphism

## Uso
`/modal [NomeDoModal] [descricao-do-que-ele-faz]`

## Exemplo
`/modal AtletaPerfilModal exibir ficha completa do atleta com XP e histórico`

## O que faz
Cria um componente de modal completo seguindo o padrão Will Treinos PRO:
- Glassmorphism (`backdrop-blur-md bg-black/40 border border-white/5`)
- Framer Motion com spring physics
- Scroll lock mobile (`useBodyScrollLock`)
- `AnimatePresence` para enter/exit
- Acessibilidade (`role="dialog"`, `aria-modal`, `Esc` para fechar)
- Motion tokens de `src/components/ui/motionTokens.ts`

## Template Gerado

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { SPRING_PREMIUM, MODAL_OVERLAY, PRESS_SCALE } from '@/components/ui/motionTokens'

interface [NomeDoModal]Props {
  isOpen: boolean
  onClose: () => void
  // Props específicas do modal
}

export function [NomeDoModal]({ isOpen, onClose }: [NomeDoModal]Props) {
  useBodyScrollLock(isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            {...MODAL_OVERLAY}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRING_PREMIUM}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50
                       max-h-[calc(100dvh-2rem)] flex flex-col
                       backdrop-blur-md bg-black/80 border border-white/10
                       rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">[Título do Modal]</h2>
              <motion.button
                {...PRESS_SCALE}
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-2 rounded-lg text-zinc-400 hover:text-white
                           hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px]
                           flex items-center justify-center"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Body (scrollável) */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {/* Conteúdo aqui */}
            </div>

            {/* Footer (opcional) */}
            <div className="p-4 border-t border-white/5">
              {/* Ações aqui */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

## Local de criação
`src/components/[NomeDoModal].tsx`

## Após criar
Registrar no `WILLPRO_MASTER_MEMORY.md` via `/log`
