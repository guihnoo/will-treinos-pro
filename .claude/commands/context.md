# /context — Scaffold de Domain Context (Provider + Hook)

## Uso
`/context [NomeDoContext] [entidade-principal] [operacoes]`

## Exemplo
`/context XP xpBalance,xpHistory addXP,getMonthlyXP,resetCycle`

## O que faz
Cria um Context especializado seguindo o padrão da arquitetura Will Treinos PRO:
- Delega estado ao `AppContext` (fonte única de verdade)
- Exporta Provider e Hook tipados
- Segue o padrão dos contextos existentes (StudentsContext, PaymentsContext, etc.)

## Template Gerado

```tsx
'use client'

import { createContext, useContext, useMemo } from 'react'
import { useApp } from '@/context/AppContext'

// --- Types ---
interface [Nome]ContextType {
  // [entidade-principal]: [Tipo][]
  // [operacao]: (params) => void
}

// --- Context ---
const [Nome]Context = createContext<[Nome]ContextType | null>(null)

// --- Provider ---
export function [Nome]Provider({ children }: { children: React.ReactNode }) {
  const app = useApp()

  const value = useMemo<[Nome]ContextType>(() => ({
    // Mapear propriedades do app para este contexto
  }), [
    // Dependencies
  ])

  return (
    <[Nome]Context.Provider value={value}>
      {children}
    </[Nome]Context.Provider>
  )
}

// --- Hook ---
export function use[Nome]() {
  const ctx = useContext([Nome]Context)
  if (!ctx) throw new Error('use[Nome] deve ser usado dentro de [Nome]Provider')
  return ctx
}
```

## Passos após criar
1. Registrar o Provider em `src/app/layout.tsx` (na hierarquia correta)
2. Atualizar `WILLPRO_MASTER_MEMORY.md` via `/log`
3. Migrar consumidores de `useApp()` para o novo hook especializado
