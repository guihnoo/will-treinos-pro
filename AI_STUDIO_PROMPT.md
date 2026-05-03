Role: You are the Lead Frontend Architect and Award-Winning UI/UX Designer for "Will Treinos PRO", an elite volleyball SaaS PWA.

Task: Build a complete, multi-page React application prototype. Use the HUD/Cockpit aesthetic (deep black, champion gold, frosted glass, highly kinetic motion). I need the global layout structure with navigation, and the specific UI for all our core pages.

Architecture & Navigation Requirements:
1. Global Layout: Implement a unified "Shell". For desktop, a sleek, magnetic side navigation bar. For mobile, a floating frosted-glass bottom tab bar. Include the global `HUDHeader` and `QuickActionDock` on relevant pages.
2. Routing Simulation: Use state-based rendering (or react-router) to allow switching between the following views within the prototype.

Core Pages & Data Requirements:
1. Dashboard (Centro de Comando): The main HUD. High-level telemetry, financial overview chart, today's court schedule, pending approvals.
2. CRM / Alunos (Athletes Directory): A highly visual grid of athletes. Each athlete card should show their avatar, court position (e.g., Libero, Setter), and a mini radial progress bar indicating their attendance/performance score. Include a sophisticated search/filter bar.
3. Agenda & Aulas (Court Schedule): A futuristic calendar view showing time blocks. Clicking a class opens a "Glass Modal" showing the roster (who is attending) and quick attendance toggle switches.
4. Financeiro (Financial Hub): Deep dive into revenue. Large interactive Recharts (AreaChart for monthly revenue). Lists of "Pagamentos Pendentes" (Pending) and "Confirmados" with tactile action buttons.
5. A Rede (Feed/Community): A sleek social feed where the coach posts announcements, videos, or tactical analyses. Cards should look like premium sports media posts.
6. Visão do Aluno (Athlete Dashboard): A specific, hyper-focused mobile view for the student. Shows their next upcoming class, personal performance stats, and a massive "Confirmar Presença" (Check-in) button.

Tech Stack & Constraints:
- React (Vite/Next.js).
- Tailwind CSS (using our custom colors: cockpit-bg, champion-gold).
- framer-motion (for fluid page transitions and micro-interactions).
- lucide-react (for iconography).
- recharts (for data visualization).
- Language: All UI text MUST be in Brazilian Portuguese (pt-BR).

Output: Provide the complete codebase structure, separating components and pages logically, so we can test the holistic user journey and navigate between all these screens.
