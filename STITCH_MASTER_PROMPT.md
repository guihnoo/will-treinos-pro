# 🎨 STITCH MASTER PROMPT — Will Treinos PRO

**Copie e cole este prompt no Stitch para refinamento de design**

---

## 📋 PROMPT MASTER (Copiar/Colar)

```
╔════════════════════════════════════════════════════════════════════════╗
║         WILL TREINOS PRO — MASTER DESIGN BRIEF PARA STITCH            ║
╚════════════════════════════════════════════════════════════════════════╝

PROJETO: Will Treinos PRO — Plataforma de Vôlei de Alta Performance
CLIENT: Monte / guihmonteiro.2014@gmail.com
FOCO: Login + Cadastro (Entry Point)
REFERÊNCIA: C:\Users\monte\Downloads\will Treinos Pro\

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 DESIGN SYSTEM

Cores:
  • Gold: #EAB308 (CTA, highlights, active states)
  • Orange: #F97316 (accents, hover states)
  • Dark BG: #0c0c18 (primary background)
  • Dark BG2: #14141f (secondary background)
  • White/Text: #ffffff (primary), rgba(255,255,255,0.6) (secondary), 
                rgba(255,255,255,0.3) (tertiary)
  • Green: #22C55E (success)
  • Red: #EF4444 (error)
  • Blue: #60A5FA (info)
  • Purple: #A78BFA (accent)

Tipografia:
  • Body/Heading: Lexend (Google Fonts)
  • Labels/Small Caps: Space Grotesk (Google Fonts)
  • Weights: 300, 400, 500, 600, 700, 800, 900
  • Sizes: 9px (xs) → 24px (3xl)

Espaçamento:
  • Base unit: 4px
  • Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px

Border Radius:
  • Small: 8px
  • Medium: 12px (inputs, buttons)
  • Large: 16px (cards)
  • Extra: 18px (navigation), 9999px (pill shape)

Shadows:
  • Subtle: 0 1px 2px rgba(0,0,0,0.05)
  • Medium: 0 4px 6px rgba(0,0,0,0.1)
  • Gold Glow: 0 0 20px rgba(234,179,8,0.15)
  • Gold Glow (active): 0 0 40px rgba(234,179,8,0.35)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 PÁGINAS A REFINAR

1️⃣ LOGIN PAGE
   Seções:
   ├─ Top: Hero com quadra SVG animada
   │  └─ SVG stroke reveal animation (1.2s, cubic-bezier)
   │  └─ Fundo: #0c0c18
   │  └─ Height: 320px (mobile) | 400px (desktop)
   ├─ Middle: 3 Role Cards (glassmorphism)
   │  ├─ Aluno (default selected)
   │  ├─ Professor
   │  └─ Dono
   │  └─ Design: Glass background + blur + subtle border
   │  └─ States: default, hover, active (gold highlight), tap (scale 0.97)
   ├─ Bottom: OAuth Buttons
   │  ├─ Google OAuth
   │  ├─ Facebook OAuth
   │  └─ Design: CTA Gold gradient, scale-tap feedback
   └─ Fallback: Email/Senha inputs (hidden by default, toggle "Usar email")
      └─ Inputs: flutuante icon + focus state (gold border + subtle glow)

2️⃣ CADASTRO (ALUNO) — 4 STEPS

   Step 1: Avatar + Nome
   ├─ Avatar upload preview (circular, 120px)
   ├─ Name input (text flutuante)
   └─ Next button (disabled até foto + nome)

   Step 2: Contato
   ├─ Email input (flutuante)
   ├─ Phone input (flutuante, máscara (XX) 9XXXX-XXXX)
   └─ Next button

   Step 3: Dados Esportivos
   ├─ Nível (dropdown: Iniciante | Intermediário | Avançado)
   ├─ Posição (radio buttons: Levantadora | Atacante | Líbero | Universal)
   ├─ Frequência (slider: 1x/semana → 5x/semana)
   └─ Next button

   Step 4: Confirmação
   ├─ Resumo dos dados (read-only, botão "Editar")
   ├─ Invite link (copyable, com ícone copy + toast feedback)
   └─ Finish button (completa cadastro + redireciona para home)

   Progress Indicator:
   └─ Horizontal step bar (1/4 → 2/4 → 3/4 → 4/4)
   └─ Estilo: thin bar com gold filled section

3️⃣ MODAL APROVAÇÃO (ADMIN) — Componente adicional

   Seções:
   ├─ Header: Avatar real + nome do aluno
   ├─ Identity Confirmation
   │  └─ Avatar (120px)
   │  └─ Nome
   │  └─ Email
   │  └─ Phone (masked)
   ├─ Plan/Financeiro
   │  ├─ Plano (dropdown: Trial | Bronze | Prata | Ouro | Diamante | Elite)
   │  ├─ Valor mensal (BRL input)
   │  ├─ Frequência (radio: 1x | 2x | 3x | 4x | 5x)
   │  └─ Categoria (multi-select: Turma | Individual | Dupla | Reposição)
   ├─ Pre-Approval Checklist
   │  ├─ ☐ Identidade confirmada
   │  ├─ ☐ Telefone válido
   │  ├─ ☐ Contato extra preenchido
   │  └─ ☐ Foto de perfil
   └─ Actions
      ├─ Approve button (gold, only if all checked)
      ├─ Reject button (outline)
      └─ Edit button (pencil icon)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ COMPONENTES REUTILIZÁVEIS

Button (CTA)
├─ Variant: Gold (gradient) | Outline (transparent border)
├─ States: default, hover (opacity 0.9), active (scale 0.97), 
           disabled (opacity 0.5, cursor not-allowed), loading (spinner)
├─ Padding: 14px 20px (horizontal) × 14px (vertical)
├─ Border Radius: 12px
├─ Font: Bold 14px Lexend
├─ Letter Spacing: 0.03em
└─ Min-height: 44px (tap target mobile)

Input (Flutuante)
├─ States: default, focus (gold border + subtle glow), 
           error (red border), disabled (opacity 0.5)
├─ Background: rgba(0,0,0,0.4) | #111111 (dark variant)
├─ Border: 1px solid rgba(255,255,255,0.08)
├─ Border Radius: 12px
├─ Padding: 14px 16px 14px 44px (icon space)
├─ Icon: 20px left-aligned (inside input)
├─ Focus Shadow: 0 0 0 3px rgba(234,179,8,0.08)
└─ Placeholder: rgba(255,255,255,0.3)

Card (Role Selector)
├─ Variant: Glassmorphism (blur 20px) | Flat (#111)
├─ Background: rgba(255,255,255,0.05) | #111111
├─ Border: 1px solid rgba(255,255,255,0.1) | #222
├─ Border Radius: 16px
├─ Padding: 20px
├─ States: default (subtle), hover, active (gold highlight + border), 
           tap (scale 0.97)
├─ Transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1)
└─ Active state: background: rgba(234,179,8,0.1), border: gold

Modal
├─ Background: rgba(0,0,0,0.8) | #0c0c18
├─ Border: 1px solid rgba(255,255,255,0.1)
├─ Border Radius: 16px
├─ Padding: 24px
├─ Max-width: 600px (mobile: 100vw - 32px)
├─ Backdrop: blur(20px)
└─ Shadow: 0 20px 25px rgba(0,0,0,0.1)

Progress Bar (Step Indicator)
├─ Background: rgba(255,255,255,0.1)
├─ Fill: #EAB308 (gold)
├─ Height: 2px
├─ Border Radius: 1px
└─ Transition: width 0.3s ease

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 ANIMAÇÕES & EFEITOS

Entrance Animations:
├─ fadeUp (Slide Up + Fade)
│  └─ Duration: 400ms
│  └─ Easing: cubic-bezier(0.22, 1, 0.36, 1)
│  └─ From: opacity: 0; transform: translateY(12px)
│  └─ To: opacity: 1; transform: translateY(0)
├─ strokeReveal (SVG Quadra)
│  └─ Duration: 1.2s
│  └─ Easing: cubic-bezier(0.22, 1, 0.36, 1)
│  └─ From: stroke-dashoffset: 400; opacity: 0
│  └─ To: stroke-dashoffset: 0; opacity: 1
└─ shimmer (Gold Text Gradient)
   └─ Duration: 3s linear infinite
   └─ Gradient: gold → orange → white → orange → gold
   └─ Background-position: -200% → 200%

Interaction Animations:
├─ scaleTap (Button/Card tap feedback)
│  └─ Duration: 200ms
│  └─ Transform: scale(0.97)
├─ glowPulse (Gold glow breathing)
│  └─ Duration: 3s ease-in-out infinite
│  └─ Box-shadow: 0 0 20px rgba(234,179,8,.15) ↔ 0 0 40px rgba(234,179,8,.35)
└─ floatY (Subtle floating)
   └─ Duration: 3s ease-in-out infinite
   └─ Transform: translateY(0) ↔ translateY(-10px)

Micro-interactions:
├─ Input focus: border gold + shadow gold (no harsh glow)
├─ Button hover: opacity 0.9 (não mudar cor)
├─ Card active: background gold-tinted + border gold
└─ Modal enter: fade + scale (backdrop blur)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 RESPONSIVIDADE

Mobile (375px):
├─ Full width container
├─ Padding: 16px sides
├─ Font sizes: base ou -2px se crowded
├─ Button height: 44px (tap target)
├─ Card padding: 16px
├─ Hero height: 320px
└─ Inputs: full width stack

Tablet (768px):
├─ Max width: 600px
├─ Padding: 24px
├─ Hero height: 360px
└─ 2-col layout para alguns componentes (se apropriado)

Desktop (1440px):
├─ Max width: 900px
├─ Padding: 32px
├─ Hero height: 400px
├─ Font sizes: +2px (comfort reading)
└─ Layout: centered, whitespace generoso

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CHECKLIST DESIGN REFINEMENT

Cores & Contrast:
  ☐ Gold (#EAB308) contra dark background = legível (WCAG AA)
  ☐ Texto white (ou rgba .6) contra #0c0c18 = legível
  ☐ Error red diferente de orange
  ☐ Success green contra dark = visível

Tipografia:
  ☐ Lexend em body/headings (weights: 400, 500, 600, 700, 800)
  ☐ Space Grotesk em labels/caps (weights: 400, 500, 600, 700)
  ☐ Sizes escalados: 9px → 10px → 14px → 16px → 20px → 24px
  ☐ Line-height apropriado (1.4-1.6 para body, 1.2 para headings)
  ☐ Letter-spacing: 0.03em (buttons), 0.1em (labels), 0.2em (caps)

Componentes:
  ☐ Button: gradient gold, scale-tap feedback, 44px min height
  ☐ Input: dark background + gold focus state, icon left-aligned
  ☐ Card: glassmorphism + active gold state, smooth transitions
  ☐ Modal: centered, backdrop blur, shadow apropriado
  ☐ SVG: quadra com stroke-dasharray, reveal animation

Animações:
  ☐ Entrada: slide-up fade (400ms, cubic-bezier)
  ☐ SVG: stroke reveal (1.2s, cubic-bezier)
  ☐ Text: shimmer contínuo (3s)
  ☐ Tap: scale 0.97 (200ms)
  ☐ Glow: pulsing suave (3s ease-in-out)
  ☐ Nenhuma animação > 500ms (mobile friendly)

Responsividade:
  ☐ Mobile 375px: full width, readable, tap-friendly
  ☐ Tablet 768px: centered, ~600px max width
  ☐ Desktop 1440px: centered, ~900px max width, generous whitespace
  ☐ Fonts não muito pequenas em mobile (min 14px body)
  ☐ Buttons min 44px height (tap target)

Acessibilidade:
  ☐ Contraste >4.5:1 para texto principal
  ☐ Focus states visíveis (gold border + shadow)
  ☐ Disabled states claros (opacity, cursor)
  ☐ Error messages em cor + ícone (não só cor)
  ☐ SVG tem aria-labels (quadra descrição)

States Completos:
  ☐ Button: default, hover, focus, active, disabled, loading
  ☐ Input: default, focus, error, disabled, filled
  ☐ Card: default, hover, focus, active, disabled
  ☐ Modal: open/close, overlay interactive ou not

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 ENTREGA ESPERADA (Stitch → Claude)

1. Figma/Stitch Link (público ou compartilhado)
2. Design Tokens JSON (colors, typography, spacing, shadows, animations)
3. Component Specs (padding, border-radius, font-weight exatos por componente)
4. Animation Timings (durations em ms, easing functions)
5. Responsive Grids (breakpoints, layout changes)
6. SVG Assets (court.svg com stroke-dasharray)
7. Screenshot specs ou Figma exports (high-res pngs para referência)
8. State Variants (default, hover, focus, active, disabled, error, loading)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 FASE 2: IMPLEMENTAÇÃO

Após este design estar pronto no Stitch, Claude Code implementará em Next.js:

✓ Login.tsx (Hero + RoleSelector + OAuth)
✓ Cadastro.tsx (4 steps com validação Zod)
✓ Componentes reutilizáveis (Button, Input, Card, Modal)
✓ Design tokens em Tailwind config
✓ Animações em Framer Motion
✓ OAuth Google integration (Supabase Auth)
✓ Testes de cadastro com RLS Supabase
✓ Deploy em Vercel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTATO & REFERÊNCIAS

Email: guihmonteiro.2014@gmail.com
GitHub: https://github.com/guihnoo/will-treinos-pro
Design Reference: C:\Users\monte\Downloads\will Treinos Pro\
Projeto Local: C:\Users\monte\Desktop\will-treinos-pro\
Status Doc: STITCH_DESIGN_SPECS.md (no projeto)

Pronto para começar! 🚀
```

---

## 📋 PRÓXIMOS PASSOS

1. **Copie o prompt acima** (do início `╔════...` até o final)
2. **Cole no Stitch** com instruções claras
3. **Refinamento:** Você trabalha no design
4. **Exportação:** Quando pronto, compartilhe:
   - Link Figma/Stitch
   - JSON com design tokens
   - Componentes specs
   - SVG assets

5. **Notifique Claude Code** quando tiver pronto
6. **Implementação:** Começamos o código React/Next.js

---

## ✅ CHECKPOINTS

- [ ] Prompt enviado ao Stitch
- [ ] Design em refinamento (cores, animações, componentes)
- [ ] Tokens exportados (JSON)
- [ ] Componentes finalizados
- [ ] SVG assets prontos
- [ ] Redline specs completo
- [ ] Ready para Claude Code começar implementação

