# Will Treinos PRO - Design System

## 1. Brand Identity & Vibe
- **Product:** A premium, high-performance SaaS PWA for elite volleyball training.
- **Vibe:** Intense, athletic, professional, kinetic. Think Nike Run Club or Gymshark, but exclusively tailored for volleyball athletes and coaches.
- **Core Aesthetics:** Dark mode only. Immersive, depth-driven UI using glassmorphism over subtle athletic textures.

## 2. Color Palette
- **Backgrounds:** Deep Black (`#000000`) and very dark zinc/charcoal (`#09090b` to `#18181b`).
- **Primary Action (Brand Color):** Champion Gold (`#EAB308`). Used for primary CTAs, active states, and glowing accents. Must feel energetic.
- **Text:** Pure White (`#FFFFFF`) for primary headings, Zinc-400 (`#A1A1AA`) for secondary text.
- **Borders/Dividers:** Very subtle `white/10` or `zinc-800`.
- **Destructive/Error:** Red-500 (`#EF4444`).
- **Success:** Green-500 (`#22C55E`).

## 3. Typography
- **Font Family:** Modern, kinetic sans-serif (e.g., Inter, Outfit, or Roboto).
- **Headings:** Bold, often italicized to convey speed and motion. High contrast.
- **Body:** Clean, highly readable, strictly functional.

## 4. UI Components & Glassmorphism
- **Cards & Modals:** Do not use flat dark gray boxes. Use frosted glass (Glassmorphism): `bg-black/40`, `backdrop-blur-md`, and a 1px border of `white/10`.
- **Inputs:** Dark inputs (`bg-zinc-900/50`) that glow with a Gold border (`focus:border-yellow-500 focus:ring-yellow-500/20`) when active.
- **Buttons:** Mobile-first touch targets (minimum height `44px`). Primary buttons use the Gold background with black text for maximum contrast.

## 5. Animation & Motion (Framer Motion)
- **Library:** Framer Motion (`framer-motion`).
- **Micro-interactions:** All clickable elements must have tactile feedback (`whileTap={{ scale: 0.97 }}` and `whileHover={{ scale: 1.02 }}`).
- **Entry Animations:** Fluid spring animations (e.g., elements sliding up from `y: 20` and fading in). No abrupt loading.

## 6. Technical Stack
- **Framework:** React (Next.js App Router).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React (`strokeWidth={1.5}`).
- **Language:** All generated visible UI text MUST be in Brazilian Portuguese (pt-BR).
