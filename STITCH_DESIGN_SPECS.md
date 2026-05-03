# 🎨 STITCH DESIGN SPECS — Will Treinos PRO

**Status:** 🔄 Em Refinamento (Stitch)  
**Last Update:** 2026-05-03  
**Focus:** Login + Cadastro (Entry Point)

---

## 📍 REFERÊNCIAS

- **Design HTML Mockup:** `C:\Users\monte\Downloads\will Treinos Pro\`
- **Projeto Git:** `C:\Users\monte\Desktop\will-treinos-pro\`
- **Master Prompt Enviado:** ✅ Stitch (aguardando refinamento)

---

## 🎯 FASES

### **FASE 1: Stitch Refinement (Você)**

Status: ⏳ Em progresso

**Deliverables esperados:**
- [ ] Login page refinada (3 role cards + OAuth)
- [ ] Cadastro step-by-step (4 etapas)
- [ ] Componentes prototipados (Button, Input, Card)
- [ ] Animações testadas (SVG stroke, fade, glow pulse)
- [ ] Design tokens exportados (JSON)
- [ ] Responsive layouts (mobile/tablet/desktop)
- [ ] Redline specs (padding, colors, fonts, shadows)
- [ ] SVG assets (quadra animada)
- [ ] Component states (default, hover, focus, active, disabled, loading, error)

---

## 📋 DESIGN TOKENS (A PREENCHER APÓS STITCH)

### **Cores**
```json
{
  "colors": {
    "gold": "#EAB308",
    "orange": "#F97316",
    "green": "#22C55E",
    "red": "#EF4444",
    "blue": "#60A5FA",
    "purple": "#A78BFA",
    "darkBg": "#0c0c18",
    "darkBg2": "#14141f",
    "textPrimary": "#ffffff",
    "textSecondary": "rgba(255, 255, 255, 0.6)",
    "textTertiary": "rgba(255, 255, 255, 0.3)"
  }
}
```

### **Tipografia**
```json
{
  "typography": {
    "fontFamilies": {
      "body": "'Lexend', sans-serif",
      "heading": "'Space Grotesk', sans-serif"
    },
    "sizes": {
      "xs": "9px",
      "sm": "10px",
      "base": "14px",
      "lg": "16px",
      "xl": "18px",
      "2xl": "20px",
      "3xl": "24px"
    },
    "weights": {
      "thin": 300,
      "light": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700,
      "extrabold": 800,
      "black": 900
    }
  }
}
```

### **Espaçamento**
```json
{
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "48px"
  }
}
```

### **Sombras & Bordas**
```json
{
  "shadows": {
    "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px rgba(0, 0, 0, 0.1)",
    "goldGlow": "0 0 20px rgba(234, 179, 8, 0.15)",
    "goldGlowActive": "0 0 40px rgba(234, 179, 8, 0.35)"
  },
  "borderRadius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "18px",
    "full": "9999px"
  }
}
```

### **Animações**
```json
{
  "animations": {
    "fadeUp": {
      "duration": "400ms",
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
      "from": "opacity: 0; transform: translateY(12px)",
      "to": "opacity: 1; transform: translateY(0)"
    },
    "shimmer": {
      "duration": "3s",
      "easing": "linear infinite",
      "keyframes": "background-position: -200% center → 200% center"
    },
    "scaleTap": {
      "duration": "200ms",
      "active": "transform: scale(0.97)"
    },
    "glowPulse": {
      "duration": "3s",
      "easing": "ease-in-out infinite",
      "keyframes": "box-shadow: 0 0 20px rgba(234,179,8,.15) → 0 0 40px rgba(234,179,8,.35)"
    },
    "strokeReveal": {
      "duration": "1.2s",
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
      "from": "stroke-dashoffset: 400; opacity: 0",
      "to": "stroke-dashoffset: 0; opacity: 1"
    }
  }
}
```

---

## 🖼️ COMPONENTES SPECS

### **1. Button (CTA Gold)**
```
Estado: Default
  └─ Background: linear-gradient(135deg, #EAB308, #CA8A04)
  └─ Color: #000
  └─ Padding: 14px (vertical)
  └─ Border Radius: 12px
  └─ Font: Bold 14px Lexend
  └─ Letter Spacing: 0.03em

Estado: Hover
  └─ Opacity: 0.9

Estado: Active/Tap
  └─ Transform: scale(0.97)

Estado: Disabled
  └─ Opacity: 0.5
  └─ Cursor: not-allowed
```

### **2. Input (Flutuante + Icon)**
```
Estado: Default
  └─ Background: rgba(0, 0, 0, 0.4)
  └─ Border: 1px solid rgba(255, 255, 255, 0.08)
  └─ Border Radius: 12px
  └─ Padding: 14px 16px 14px 44px (icon placeholder)
  └─ Color: #ffffff
  └─ Font: 14px Lexend
  └─ Placeholder: rgba(255, 255, 255, 0.3)

Estado: Focus
  └─ Border Color: rgba(234, 179, 8, 0.5)
  └─ Box Shadow: 0 0 0 3px rgba(234, 179, 8, 0.08)

Estado: Error
  └─ Border Color: #EF4444
  └─ Box Shadow: 0 0 0 3px rgba(239, 68, 68, 0.08)
```

### **3. Card (Role Selector)**
```
Variant: Glassmorphism
  └─ Background: rgba(255, 255, 255, 0.05)
  └─ Backdrop Filter: blur(20px)
  └─ Border: 1px solid rgba(255, 255, 255, 0.1)
  └─ Border Radius: 16px
  └─ Padding: 20px
  └─ Transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1)

Estado: Active
  └─ Background: rgba(234, 179, 8, 0.1)
  └─ Border Color: rgba(234, 179, 8, 0.5)

Estado: Active Tap
  └─ Transform: scale(0.97)
```

### **4. Hero (SVG Quadra Animada)**
```
SVG: Court outline
  └─ Stroke: #EAB308
  └─ Stroke Width: 2px
  └─ Stroke Dasharray: 400
  └─ Animation: courtReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1)
  └─ (stroke-dashoffset: 400 → 0)

Container:
  └─ Background: #0c0c18
  └─ Height: 320px (mobile) | 400px (desktop)
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile (375px):
  └─ Full width container
  └─ Padding: 16px
  └─ Font sizes: -2px
  └─ Button height: 44px (tap target)

Tablet (768px):
  └─ Max width: 600px
  └─ Padding: 24px
  └─ Font sizes: base

Desktop (1440px):
  └─ Max width: 900px
  └─ Padding: 32px
  └─ Font sizes: +2px
```

---

## 🎬 PÁGINAS A REFINAR (Checklist Stitch)

### **Login Page**
- [ ] Hero com quadra SVG (stroke reveal animation)
- [ ] 3 role cards (Aluno / Professor / Dono) com estado active
- [ ] OAuth buttons (Google + Facebook) com ícones
- [ ] Email/senha fallback (inputs flutuantes)
- [ ] Responsividade mobile/desktop
- [ ] Estados: default, hover, focus, loading, error
- [ ] Animações: fade-up, scale-tap, glow-pulse

### **Cadastro (4 Steps)**
- [ ] Step 1: Avatar upload + nome (preview)
- [ ] Step 2: Contato (email, telefone com máscara)
- [ ] Step 3: Dados esportivos (nível, posição, frequência)
- [ ] Step 4: Confirmação (invite link copy)
- [ ] Progress indicator (step visual)
- [ ] Back/Next buttons com validação
- [ ] Success screen (avatar + invite link)

### **Modal Aprovação (Admin)**
- [ ] Avatar real + identidade (foto, nome, email, phone)
- [ ] Plano/financeiro (valor, frequência, categoria)
- [ ] Checklist pré-aprovação
- [ ] Botões: Aprovar | Rejeitar | Editar

---

## 📤 EXPORTAÇÃO DO STITCH

Quando tiver pronto, compartilhe:

1. **Figma/Stitch Link** (público ou compartilhado)
   ```
   https://www.figma.com/design/...
   ```

2. **Design Tokens (JSON)**
   ```json
   {
     "colors": { ... },
     "typography": { ... },
     "spacing": { ... },
     "shadows": { ... },
     "animations": { ... }
   }
   ```

3. **Componentes Spec**
   - Button variants (default, hover, active, disabled, loading)
   - Input states (default, focus, error, disabled)
   - Card variants (glass, flat, active)
   - Modal overlay specs

4. **SVG Assets**
   - `court.svg` (quadra com stroke-dasharray)
   - `icons.svg` (Google, Facebook, etc)

5. **Redline Specs**
   - Padding/margin exatos por componente
   - Font weights/sizes exatos
   - Shadow values RGB/HSL exatos
   - Animation timings (ms + easing)

---

## 🔗 PRÓXIMAS FASES

### **FASE 2: Claude Code Implementation (Eu)**
```
├─ Criar Login.tsx (Hero + RoleSelector + OAuth)
├─ Criar Cadastro.tsx (4 steps com validação)
├─ Implementar design tokens em Tailwind config
├─ Adicionar animações (Framer Motion)
├─ Testar OAuth + Supabase integration
└─ Deploy para Vercel
```

### **FASE 3: QA + Refinement (Você + Eu)**
```
├─ Visual comparison (design vs código)
├─ Mobile testing (375px)
├─ Desktop testing (1440px)
├─ Interação (OAuth, cadastro steps, validações)
├─ Performance (bundle size, load time)
└─ Deploy production
```

---

## 📝 NOTAS

- **Fonte:** Importar via Google Fonts (Lexend + Space Grotesk) — já está no `src/app/layout.tsx`
- **Ícones:** Usar SVG inline ou React components (heroicons, lucide-react)
- **Animações:** Framer Motion para React (não CSS puro)
- **Estado:** Zustand ou React Context (já temos AppContext)
- **Validação:** Zod + react-hook-form (cadastro)

---

## 📞 STATUS ATUAL

**🔄 Aguardando output do Stitch...**

Quando tiver pronto, coloque aqui e aviso Claude Code para começar implementação!

