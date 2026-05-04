# 🎨 WILL TREINOS PRO — Design System

> **Design with intention. Animate with physics. Brand with gold.**

Um design system modular, escalável e tema-específico para Will Treinos PRO. Cada área (Admin, Coach, Aluno, Premium) respira sozinha, mas mantém a identidade Gold invariável.

---

## 🏗️ Estrutura

```
design-system/
├── tokens/
│   ├── colors.ts          # Paletas por tema (admin/coach/student/premium)
│   ├── motionTokens.ts    # Spring physics presets
│   └── typography.ts      # Escalas Lexend + Space Grotesk
├── components/
│   ├── Card.tsx           # Glassmorphism + Brutalist + Neumorphism
│   ├── Modal.tsx          # Tema-aware com animações
│   ├── Button.tsx         # 4 variantes × 4 temas
│   └── [mais componentes]
├── icons/                 # SVG customizados de voleibol
├── hooks/                 # useTheme(), useMotion(), etc.
└── index.ts              # Central export
```

---

## 🎯 4 Temas — Cada Um Conta Uma História

### 🔴 **ADMIN** — Control Room (Red + Gold + Brutalist)

Painel de controle estratégico. Rápido, preciso, sem decoração.

```tsx
<Card theme="admin" padding="lg">
  <h2>Dashboard Executivo</h2>
  <p>Controle total da plataforma</p>
</Card>

<Button theme="admin" variant="solid">
  Executar Ação
</Button>
```

**Cores:**
- Accent: `#EF4444` (Red)
- Glow: `rgba(239, 68, 68, 0.3)`
- Sem glassmorphism (sólido)

**Animação:**
- Spring: `stiffness: 350, damping: 35` (snappy)
- Hover scale: `1.02`

---

### 🔵 **COACH** — Quadra Técnica (Cyan + Gold + Glassmorphism)

Interface técnica e fluida. Coach está outdoors, precisa de precisão e clareza.

```tsx
<Card theme="coach" interactive animated>
  <h2>Prancheta de Avaliações</h2>
  <p>Avalie o desempenho em tempo real</p>
</Card>

<Modal theme="coach" isOpen={isOpen} onClose={closeModal}>
  <h3>Registrar Avaliação</h3>
  {/* conteúdo */}
</Modal>
```

**Cores:**
- Accent: `#06B6D4` (Cyan)
- Glow: `rgba(6, 182, 212, 0.3)`
- Glassmorphism: `backdrop-blur-xl`

**Animação:**
- Spring: `stiffness: 200, damping: 25` (smooth)
- Hover scale: `1.03`

---

### 🟢 **ALUNO** — Gamificação Imersiva (Emerald + Gold + Playful)

Celebração visual, XP fluindo, cards desbloqueando. Lúdico, recompensador.

```tsx
<Card theme="student" interactive animated animationTheme="student">
  <Badge>⭐ Bronze Card</Badge>
  <p>500 XP até o próximo nível</p>
</Card>

<Button theme="student" variant="solid">
  Desbloquear Card
</Button>
```

**Cores:**
- Accent: `#10B981` (Emerald)
- Glow: `rgba(16, 185, 129, 0.3)`
- Efeitos: Confetti, bounce, pulse

**Animação:**
- Spring: `stiffness: 100, damping: 10` (bouncy)
- Hover scale: `1.05`
- Unlock animation: `cardFlip`

---

### ⭐ **PREMIUM** — Exclusividade Luxuosa (Purple + Gold + Neumorphism)

Solidez visual, sombras profundas, tangibilidade. Ouro real, não vidro.

```tsx
<Card theme="premium" padding="xl" interactive>
  <h2>Acesso VIP</h2>
  <p>Recursos exclusivos desbloqueados</p>
</Card>

<Modal theme="premium" size="lg">
  <h3>Premium Unlock</h3>
  {/* conteúdo de luxo */}
</Modal>
```

**Cores:**
- Accent: `#A78BFA` (Purple)
- Glow: `rgba(167, 139, 250, 0.3)`
- Neumorphism: Sombras inset profundas
- Sem blur (sólido, confiável)

**Animação:**
- Spring: `stiffness: 120, damping: 40` (deliberate)
- Hover scale: `1.03`

---

## 💎 Gold é INVARIÁVEL

Em **todas** as themes, Gold `#EAB308` está presente:
- Botão CTA primário
- Badge/XP counter
- Borda de destaque
- Glow effect

```tsx
// Gold nunca sai
<button className="bg-[#EAB308] hover:bg-[#ca8a04]">
  Ação Principal
</button>
```

---

## 🎬 Motion — Spring Physics

**Nunca use `linear` ou `duration` fixo.** Sempre spring, sempre tema-específico.

```tsx
import { MotionTokens } from "@/design-system";

// Obter spring de um tema
const adminSpring = MotionTokens.springs.admin;
// → { type: "spring", stiffness: 350, damping: 35, mass: 0.3 }

// Usar em motion
<motion.div
  animate={{ x: 100 }}
  transition={MotionTokens.springs.student}
>
  Bouncy motion
</motion.div>

// Presets prontos
<motion.div variants={MotionTokens.fadeUp("admin")}>
  Fade up com spring admin
</motion.div>
```

### Presets Disponíveis

- `fadeUp(theme)` — Aparece de baixo
- `scaleIn(theme)` — Aparece com zoom
- `slideInRight(theme)` — Aparece da direita
- `slideInLeft(theme)` — Aparece da esquerda
- `bounce()` — Bounce puro (student)
- `cardFlip` — Card flip 3D (premium/student)
- `xpPop` — XP counter pop (student)

---

## 🎨 Tipografia

Lexend (body humanista) + Space Grotesk (display geométrica).

```tsx
import { TypographyTokens } from "@/design-system";

// Display: 56px → 30px
<h1 style={TypographyTokens.display.lg}>
  WILL TREINOS PRO
</h1>

// Heading: 24px → 16px
<h2 style={TypographyTokens.heading.xl}>
  Seção Principal
</h2>

// Body: 18px → 12px
<p style={TypographyTokens.body.md}>
  Descrição do conteúdo...
</p>

// Label: Uppercase, 14px → 10px
<span style={TypographyTokens.label.md}>
  AÇÃO CRÍTICA
</span>
```

---

## 📦 Componentes

### **Card** — Versátil e Tema-Aware

```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/design-system";

<Card theme="student" padding="md" interactive animated>
  <CardHeader>
    <h3>Título do Card</h3>
  </CardHeader>
  
  <CardBody>
    <p>Conteúdo principal</p>
  </CardBody>
  
  <CardFooter>
    <Button theme="student">Ação</Button>
  </CardFooter>
</Card>
```

**Props:**
- `theme` — "admin" | "coach" | "student" | "premium"
- `padding` — "sm" | "md" | "lg" | "xl"
- `interactive` — Ativa hover/hover-glow
- `animated` — Faz fade-in ao montar

---

### **Modal** — Diálogos com Glassmorphism/Neumorphism

```tsx
import { Modal } from "@/design-system";
import { useState } from "react";

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Título do Modal"
        theme="student"
        size="md"
        dismissible
      >
        <p>Conteúdo do modal</p>
        <Button theme="student" fullWidth>
          Confirmar
        </Button>
      </Modal>
    </>
  );
};
```

**Props:**
- `theme` — "admin" | "coach" | "student" | "premium"
- `size` — "sm" | "md" | "lg" | "xl"
- `dismissible` — Mostra X e permite click backdrop
- `title` — Título no header

---

### **Button** — 4 Variantes × 4 Temas

```tsx
import { Button } from "@/design-system";

// Solid (CTA primary)
<Button theme="student" variant="solid" size="lg" fullWidth>
  Click Me
</Button>

// Outline (secondary)
<Button theme="coach" variant="outline">
  Secondary Action
</Button>

// Ghost (tertiary)
<Button theme="admin" variant="ghost">
  Tertiary Link
</Button>

// Danger (destructive)
<Button theme="student" variant="danger" isLoading>
  Deletando...
</Button>
```

**Props:**
- `theme` — "admin" | "coach" | "student" | "premium"
- `variant` — "solid" | "outline" | "ghost" | "danger"
- `size` — "sm" | "md" | "lg" | "xl"
- `fullWidth` — Expand to 100%
- `isLoading` — Loading spinner
- `loadingText` — Custom loading message

---

## 🚀 Início Rápido

### 1. Importar tokens em um componente

```tsx
"use client";

import { Card, Button, ColorTokens, MotionTokens } from "@/design-system";

export const MyCard = () => (
  <Card theme="student" interactive animated>
    <h2>Olá!</h2>
    <Button theme="student">Clique</Button>
  </Card>
);
```

### 2. Usar em Tailwind (se preferir classes)

```tsx
<div className="bg-[#EAB308] text-[#000000] rounded-2xl p-6">
  Gold button
</div>
```

### 3. Definir contexto de tema globalmente

```tsx
// app/layout.tsx
"use client";

export default function RootLayout({ children }) {
  // Assumir tema baseado em rota ou user role
  const theme = useUserTheme(); // admin | coach | student | premium

  return (
    <html data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🎯 Próximas Etapas

- [ ] Implementar `useTheme` hook para contexto global
- [ ] Criar 15 ícones customizados de voleibol
- [ ] Adicionar variante `hero` (large card para landing)
- [ ] Implementar `Confetti` para unlock de cards (student)
- [ ] Criar `ProgressBar` com glow (XP, level up)
- [ ] Documentar em Storybook
- [ ] Dark/Light mode toggle (baseado em `prefers-color-scheme`)

---

## 📚 Referência Rápida

| Componente | Tema | Use Case |
|---|---|---|
| Card | Todos | Containers, cards de dados |
| Modal | Todos | Diálogos, confirmações, forms |
| Button | Todos | CTAs, ações, navegação |
| Badge | Student | XP, nivel, status |
| Badge | Premium | VIP, unlock, exclusividade |
| Tooltip | Coach | Dicas, help inline |
| Notification | Student | Celebração, unlock, achievement |

---

## 🤝 Suporte

Para dúvidas sobre o design system, consulte:
- `src/design-system/tokens/` — Definições de cores, motion, tipografia
- `CLAUDE.md` — Visão geral do projeto
- Design Guardian agentId: `a91672e04eb0193c4` — Validação visual

---

**Última atualização:** 2026-05-04  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para usar
