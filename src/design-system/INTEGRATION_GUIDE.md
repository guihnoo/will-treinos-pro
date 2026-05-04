# 🔗 Integration Guide — Aplicando o Design System no App

> **Este guia mostra como refatorar componentes existentes para usar o novo Design System.**

---

## 📋 Mapeamento: Componentes → Temas

| Componente Existente | Theme | Razão |
|---|---|---|
| `WillCockpit` (Admin) | `admin` | Painel de controle, sem froufrou |
| `CoachDashboard` | `coach` | Interface técnica, outdoors |
| `StudentArea` | `student` | Gamificada, playful |
| `PremiumSection` | `premium` | Conteúdo exclusivo, luxo |
| `Modals` (genéricos) | Herança | Usar theme do contexto |
| `Buttons` (genéricos) | Herança | Usar theme do contexto |

---

## 🔄 Exemplo 1: Refatorar um Card Existente

### **Antes (Genérico)**

```tsx
// components/StudentCard.tsx
export const StudentCard = ({ student }) => (
  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500">
    <h3 className="text-lg font-bold">{student.name}</h3>
    <p className="text-sm text-gray-400">{student.status}</p>
    <div className="mt-4 flex gap-2">
      <button className="px-3 py-1 bg-blue-600 rounded text-white">
        Ver
      </button>
    </div>
  </div>
);
```

### **Depois (Design System)**

```tsx
"use client";

import { Card, CardBody, CardFooter, Button, Badge } from "@/design-system";

export const StudentCard = ({ student }) => (
  <Card theme="student" padding="md" interactive animated>
    <CardBody>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">
          {student.name}
        </h3>
        {student.isVip && (
          <Badge className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded">
            ⭐ Premium
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-400">{student.status}</p>
      
      {/* XP Progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">XP Progress</span>
          <span className="text-emerald-400 font-semibold">
            {student.xp} / {student.xpGoal}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ width: `${(student.xp / student.xpGoal) * 100}%` }}
          />
        </div>
      </div>
    </CardBody>

    <CardFooter>
      <Button theme="student" variant="solid" fullWidth>
        Ver Avaliações
      </Button>
    </CardFooter>
  </Card>
);
```

**Ganhos:**
- ✅ Animação automática no mount (`animated`)
- ✅ Hover com scale + glow (Emerald)
- ✅ Spring physics do tema
- ✅ Consistência com paleta student

---

## 🔄 Exemplo 2: Refatorar um Modal

### **Antes (Genérico)**

```tsx
// components/EvaluationModal.tsx
export const EvaluationModal = ({ isOpen, onClose, student }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Avaliar {student.name}</h2>
        
        <input
          type="range"
          min="0"
          max="10"
          defaultValue={5}
          className="w-full mb-4"
        />
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 rounded text-white"
          >
            Cancelar
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 rounded text-white">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
```

### **Depois (Design System)**

```tsx
"use client";

import { Modal, Button, ColorTokens } from "@/design-system";
import { useState } from "react";

export const EvaluationModal = ({ isOpen, onClose, student }) => {
  const [rating, setRating] = useState(5);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Avaliar ${student.name}`}
      theme="coach"
      size="md"
    >
      <div className="space-y-4">
        {/* Rating input */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Nota (0-10)
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="text-center mt-2">
            <span
              className="text-3xl font-bold"
              style={{ color: ColorTokens.coach.accent }}
            >
              {rating}/10
            </span>
          </div>
        </div>

        {/* Fundamento selector */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Fundamento
          </label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option>Ataque</option>
            <option>Levantamento</option>
            <option>Bloqueio</option>
            <option>Defesa</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button
            theme="coach"
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            theme="coach"
            variant="solid"
            fullWidth
          >
            Salvar Avaliação
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

**Ganhos:**
- ✅ Glassmorphism automático (coach theme)
- ✅ Animação de entrada fluida
- ✅ Header + dismissible button
- ✅ Backdrop blur com tema coach (cyan glow)

---

## 🔄 Exemplo 3: XP Counter Animado (Student)

### **Antes (Estático)**

```tsx
// components/XPCounter.tsx
export const XPCounter = ({ xp, level }) => (
  <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-700">
    <div className="text-3xl font-bold text-yellow-400">{xp} XP</div>
    <div className="text-sm text-gray-400">Level {level}</div>
  </div>
);
```

### **Depois (Animado com Design System)**

```tsx
"use client";

import { motion } from "framer-motion";
import { MotionTokens, ColorTokens } from "@/design-system";
import { useEffect, useState } from "react";

export const XPCounter = ({ xp, level, onLevelUp }) => {
  const [displayXp, setDisplayXp] = useState(xp);
  const xpPerLevel = 1000;
  const xpInLevel = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;

  useEffect(() => {
    if (displayXp !== xp) {
      // Animar contador de XP
      const interval = setInterval(() => {
        setDisplayXp((prev) => {
          const next = prev + Math.ceil((xp - prev) / 20);
          return next >= xp ? xp : next;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [xp, displayXp]);

  return (
    <div className="relative">
      {/* Background card */}
      <motion.div
        className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-emerald-600 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={MotionTokens.springs.student}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0"
          animate={{ x: [0, 400, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Level badge */}
          <motion.div
            className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500 rounded-full text-sm font-semibold text-emerald-300 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={MotionTokens.springs.student}
          >
            Level {level}
          </motion.div>

          {/* XP number */}
          <motion.div
            className="text-4xl font-bold text-emerald-400 font-mono mb-2"
            key={xp}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={MotionTokens.springs.student}
          >
            {displayXp.toLocaleString()} XP
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${(xpInLevel / nextLevelXp) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>{xpInLevel.toLocaleString()}</span>
            <span>{nextLevelXp.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* XP pop animation (quando ganha XP) */}
      {displayXp !== xp && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          variants={MotionTokens.xpPop}
          initial="initial"
          animate="animate"
        >
          <span className="text-2xl font-bold text-emerald-300">
            +{Math.abs(xp - displayXp)} XP
          </span>
        </motion.div>
      )}
    </div>
  );
};
```

**Ganhos:**
- ✅ Contador animado (não salta, cresce fluidamente)
- ✅ Pop animation quando ganha XP
- ✅ Progresso visual com glow
- ✅ Spring physics student (bouncy)

---

## 🔄 Exemplo 4: Admin Dashboard (Brutalist)

### **Antes (Genérico)**

```tsx
// components/AdminDashboard.tsx
export const AdminDashboard = ({ stats }) => (
  <div className="grid grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div key={stat.id} className="bg-gray-900 p-4 rounded border border-gray-700">
        <h3 className="text-sm text-gray-400 mb-1">{stat.label}</h3>
        <div className="text-2xl font-bold">{stat.value}</div>
      </div>
    ))}
  </div>
);
```

### **Depois (Brutalist Admin)**

```tsx
"use client";

import { Card, CardBody, TypographyTokens } from "@/design-system";

export const AdminDashboard = ({ stats }) => (
  <div className="grid grid-cols-4 gap-6">
    {stats.map((stat, i) => (
      <Card
        key={stat.id}
        theme="admin"
        padding="lg"
        animated
        animationTheme="admin"
        style={{ animationDelay: `${i * 50}ms` }}
      >
        <CardBody>
          <p
            style={TypographyTokens.label.md}
            className="text-red-400 uppercase mb-3"
          >
            {stat.label}
          </p>
          <div
            style={TypographyTokens.display.sm}
            className="text-white font-mono"
          >
            {stat.value}
          </div>
          {stat.change && (
            <p className="text-xs text-gray-400 mt-2">
              {stat.change > 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
            </p>
          )}
        </CardBody>
      </Card>
    ))}
  </div>
);
```

**Ganhos:**
- ✅ Red accent ao invés de genérico gray
- ✅ Borders pesadas + sombras
- ✅ Animação rápida/snappy (admin spring)
- ✅ Stagger animation (cada card entra sequencial)

---

## 🎯 Roteiro de Refatoração

### **Fase 1 — Componentes Base** (2-3 dias)

```
[ ] Refatorar Card → CardComponent.tsx
[ ] Refatorar Modal → ModalComponent.tsx
[ ] Refatorar Button → ButtonComponent.tsx
[ ] Criar Badge/Badge.tsx (para XP, nivel, status)
[ ] Testar em Storybook
```

### **Fase 2 — Áreas Temáticas** (3-4 dias)

```
[ ] Admin: WillCockpit (cards com red, brutalist)
[ ] Coach: CoachDashboard (glassmorphism cyan)
[ ] Student: StudentArea (playful, XP animations)
[ ] Premium: PremiumSection (neumorphism purple)
```

### **Fase 3 — Micro-interações** (3-4 dias)

```
[ ] Unlock confetti (student card flip)
[ ] XP counter pop animation
[ ] Check-in flow (haptics + celebration)
[ ] Notification toast por tema
[ ] Swipe gestures (PWA)
```

### **Fase 4 — Icons Customizados** (2-3 dias)

```
[ ] Criar 15 SVGs de voleibol
[ ] Integrar em componentes (Button, Card, Nav)
[ ] Documentar no Storybook
```

---

## 🧪 Testing & Validation

### **Checklist Visual**

```
[ ] Admin cards têm red accent visível
[ ] Coach modals têm cyan glow
[ ] Student cards têm emerald glow + bounce
[ ] Premium cards têm purple + neumorphism (sem blur)
[ ] Gold (#EAB308) visível em todos (botão CTA, badge, border)
```

### **Checklist de Performance**

```
[ ] Spring animations não fazem jank (60fps)
[ ] Modal backdrop blur não está pesado
[ ] XP counter animado não causamMemory leak
[ ] Icons SVG carregam rápido (inline)
```

### **Checklist de Acessibilidade**

```
[ ] Contraste de cores OK (WCAG AA)
[ ] Botões com focus states visíveis
[ ] Aria-labels em elementos interativos
[ ] Keyboard navigation funciona
```

---

## 📚 Próximas Referências

- `src/design-system/README.md` — Full API documentation
- `CLAUDE.md` — Project guidelines
- Design Guardian agentId — Para validações visuais

---

**Última atualização:** 2026-05-04  
**Status:** ✅ Pronto para integração
