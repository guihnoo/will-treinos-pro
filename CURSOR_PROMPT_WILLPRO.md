# MASTER INSTRUCTION FOR CURSOR: REBUILDING "WILLPRO" DESIGN

---

## Master Memory — registro de interações (data/hora)

O histórico datado de interações e decisões fica na pasta **`WILLPRO - MASTER MEMORY/`**, arquivo **`REGISTRO_INTERACOES.md`**.

**Regra para o assistente:** após alterações relevantes, **acrescentar entrada no topo** daquele arquivo com data/hora completas e fuso (ex.: `-03:00`). Não duplicar o log aqui.

---

**Context for AI (Cursor):**
You are a Senior Frontend Developer specializing in React Native Web, Expo Router, and TailwindCSS. We have a fully functional application in the `artifacts/willtreinos/app/login.tsx` file using Expo, but the design is outdated. Your goal is to rewrite the `login.tsx` file to perfectly reproduce the "WILLPRO" design (a premium mockup made in Vite), keeping all authentication and navigation logic intact.

## 🎨 Design Specifications (Premium Design System)

**1. Background and Typography:**
- Screen Background: Deep Black (`#000000`).
- Primary Font: Modern sans-serif (Inter or System), antialiased.
- Primary Text Color: Off-white/Zinc (`text-zinc-100` / `#F4F4F5`).

**2. Header (Logo and Titles):**
- **Logo Box:** A rounded square (e.g., `w-20 h-20 rounded-2xl`) in the center, with a vertical gradient background from bright yellow to orange.
- **Logo Icon:** A white/translucent volleyball icon in the center of the gradient.
- **Main Title:** "WILLPRO" (All caps, heavy font, e.g., `text-3xl font-black tracking-tight`).
- **Subtitle:** "Plataforma Premium de Gestão de Vôlei" (Smaller text, gray, e.g., `text-zinc-400 text-sm`).

**3. Access Cards (Login Buttons):**
- Each user profile will have a button formatted as a horizontal Card, wide (almost full width), with highly rounded corners (`rounded-3xl` or `rounded-2xl`).
- Card Background: Slightly lighter black than the background (e.g., `#0A0A0A` or `bg-zinc-900/50`) with an extremely subtle border (`border border-white/5`).
- Hover/Press Effect: The card must have a micro-interaction when pressed (use `TouchableOpacity` or Framer Motion if you prefer).

**4. Internal Card Styling:**
Cards have a grid structure: [ Icon with Glow ] + [ Texts ] + [ Right Arrow ].

- **Admin Card:**
  - Icon: Security shield (`Shield` from Lucide Icons) in Gold/Yellow (`#EAB308`).
  - Icon Background: A smaller rounded square with a very subtle yellow glow/background (e.g., `bg-yellow-500/10`).
  - Title: "Administrador" (white text, strong font).
  - Subtitle: "Gestão Total — Financeiro, Aprovações, Agenda, Feed" (very dark/discreet gray text).

- **Teacher Card:**
  - Icon: Graduation cap/Whistle (`GraduationCap`) in Cyan/Blue (`#06B6D4` or `#3B82F6`).
  - Icon Background: Subtle cyan background (`bg-cyan-500/10`).
  - Title: "Professor".
  - Subtitle: "Check-in de Presença, Feedback, Agenda de Aulas".

- **Student Card:**
  - Icon: Volleyball or crossed circles (`Dribbble` or similar icon) in Purple (`#A855F7`).
  - Icon Background: Subtle purple background (`bg-purple-500/10`).
  - Title: "Aluno".
  - Subtitle: "Meus Treinos, Feed Oficial, Performance".

**5. Footer:**
- Centered text at the bottom: "© 2026 Will Treinos PRO — v2.0". Small and very discreet font (`text-zinc-600 text-xs`).

## ⚙️ Code and Logic Rules

1. **DO NOT ALTER THE LOGIC:** You will modify the `artifacts/willtreinos/app/login.tsx` file. The file already has states for `studentMode` (to open the student form), `handleSocialLogin`, `loginMutation`, etc. Keep them.
2. **Button Mapping:**
   - The **Admin Card** should set the login mode to admin and show the form.
   - The **Teacher Card** should set the login mode to teacher.
   - The **Student Card** should trigger the student mode toggle (`setStudentMode("login")`).
3. When clicking a Card, display the Email and Password form (with the beautiful inputs that already exist), but adapt the form colors to match the selected Card (yellow "Entrar" button for admin, etc.).

**Your Exact Task Now:**
Rewrite `artifacts/willtreinos/app/login.tsx` focusing on making the initial screen identical to the description above, ensuring the design is "WOW" and extremely premium. Use your intelligence to choose the most luxurious hex colors. Execute the modification in the code now.
