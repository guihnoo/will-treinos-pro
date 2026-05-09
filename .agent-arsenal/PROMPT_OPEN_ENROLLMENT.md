# 🔓 WILL TREINOS PRO — OPEN ENROLLMENT + ROLE SELECTION
# Cole este prompt no Claude Code para implementar o novo fluxo de cadastro.
# Responda em Português (pt-BR) durante toda a sessão.

---

You are **Antigravity-Engine**, senior engineer of **Will Treinos PRO**.

Your mission: **Redesign the entire enrollment flow** to remove the invite gate and add a role selection screen with 3 user types.

> ⚠️ **LANGUAGE:** Respond exclusively in **Brazilian Portuguese (pt-BR)**.
> ⚠️ **SAFETY:** Do NOT touch auth logic, Supabase RLS, or production data. Only modify the frontend enrollment flow.
> ⚠️ **FIRST STEP:** Verify directory: `C:\Users\monte\Desktop\will-treinos-pro` then run `Get-Location`.

---

## 📖 STEP 0 — READ CONTEXT

```bash
# Read the current enrollment files to understand the existing code
cat src/app/cadastro/page.tsx | Select-String -Pattern "invite|inviteGate|blocked" -Context 3
cat src/context/types.ts | Select-String -Pattern "StudentRole|StudentStatus|role"
cat src/middleware.ts
```

Report back in pt-BR what you found about: current invite gate logic, existing roles, and middleware.

---

## 🎯 THE BUSINESS REQUIREMENT

**Current flow (to be replaced):**
```
Admin shares invite link (?invite=token) → User accesses /cadastro → Blocked without token
```

**New flow (to implement):**
```
1. User accesses app login URL (no invite needed)
2. Login page: "Não tem conta? → Criar conta"
3. /cadastro opens with ROLE SELECTION SCREEN (first thing user sees)
4. User picks: ALUNO | PROFESSOR | COMUNIDADE
5. Based on role, different form + different post-registration behavior
```

---

## 🏗️ PHASE 1 — UNDERSTAND EXISTING ROLES

First, read the types file to see what roles exist:

```bash
cat src/context/types.ts
```

The existing `StudentRole` type likely has: `"admin" | "professor" | "aluno" | "visitor"`

The new "COMUNIDADE" role maps to `"visitor"` — users who only access feed + profile.

**Role mapping:**
- ALUNO → role: `"aluno"`, status: `"pending"` (awaits admin approval)
- PROFESSOR → role: `"professor"`, status: `"pending"` (awaits admin approval)  
- COMUNIDADE → role: `"visitor"`, status: `"active"` (immediate access, no approval needed)

If `"visitor"` doesn't exist in types, add it:
```typescript
export type StudentRole = "admin" | "professor" | "aluno" | "visitor";
```

---

## 🔓 PHASE 2 — REMOVE THE INVITE GATE

### 2.1 — Make invite optional (not blocking)

In `src/lib/enrollmentSession.ts` (or wherever `cadastroInviteRequired` is defined):

```typescript
// Change from:
export function cadastroInviteRequired(): boolean {
  return true; // or some env check
}

// Change to:
export function cadastroInviteRequired(): boolean {
  return false; // Invite no longer required — open enrollment
}
```

### 2.2 — Remove EnrollmentInviteBlocked from cadastro page

In `src/app/cadastro/page.tsx`, find and remove the invite gate check:

```typescript
// REMOVE these lines:
const inviteGate = useEnrollmentInviteGate();
if (!inviteGate.ready) { return <LoadingSpinner /> }
if (inviteGate.blocked) { return <EnrollmentInviteBlocked reason={inviteGate.reason} /> }
```

Replace with: Simply remove them. The form should always be accessible.

### 2.3 — Keep invite token as optional bonus (not required)

If an invite token exists in URL, still store it (for analytics), but don't block without it.

---

## 🎨 PHASE 3 — ADD ROLE SELECTION SCREEN

This is the most important visual change. Create a beautiful role selection as the FIRST step of /cadastro.

### 3.1 — Add role state to the form

```typescript
type SelectedRole = "aluno" | "professor" | "visitor" | null;

const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
const [step, setStep] = useState<"role" | "form">("role"); // Start on role selection
```

### 3.2 — Create the Role Selection Screen

**Visual Design (implement exactly as described):**

```
FULL SCREEN DARK BACKGROUND (#020202)
Gold radial glow in background (subtle, breathing)

TOP:
- "WILL" logo (Bebas Neue or bold, gold)
- "TREINOS PRO" smaller, zinc-400
- Subtitle: "Qual é o seu papel na arena?" (white, medium)

ROLE CARDS (3 cards, stacked vertically on mobile):
Each card is a pressable dark glass card with:
- Large emoji or Lucide icon (colored)
- Title (bold, white, large)
- Subtitle (zinc-400, small)
- 3 bullet points showing what they can access (small, zinc-500)
- Gold border appears on hover/selection
- Selected: gold border glow + slight scale up + checkmark appears

CARD 1 — ALUNO:
icon: Zap (gold/yellow)
title: "Aluno"
subtitle: "Estou aqui para treinar e evoluir"
bullets:
  ✓ Treinos personalizados & avaliações
  ✓ Sistema de XP, ranking e conquistas
  ✓ Feed da equipe e comunicados
note: "Aprovação necessária pelo coach" (small amber badge)

CARD 2 — PROFESSOR:
icon: Shield (blue/cyan)  
title: "Professor"
subtitle: "Sou coach e vou gerenciar turmas"
bullets:
  ✓ Gestão de alunos e turmas
  ✓ Avaliações e planos de treino
  ✓ Cockpit completo de aulas
note: "Aprovação necessária pelo admin" (small amber badge)

CARD 3 — COMUNIDADE:
icon: Globe or Users2 (purple/violet)
title: "Comunidade"
subtitle: "Acompanho o time e interajo com a arena"
bullets:
  ✓ Feed de posts, fotos e campeonatos
  ✓ Interagir, comentar e compartilhar
  ✓ Perfil público na comunidade
note: "Acesso imediato após cadastro" (small green badge) ← IMPORTANT DIFFERENTIATOR

BOTTOM:
- "Continuar →" button (gold, disabled until role selected)
- Already have account? "Entrar" link
```

**Implementation:**

```tsx
// Role selection step - shows before the form
function RoleSelectionStep({ onSelect }: { onSelect: (role: SelectedRole) => void }) {
  const [selected, setSelected] = useState<SelectedRole>(null);

  const roles = [
    {
      id: "aluno" as const,
      icon: Zap,
      iconColor: "#EAB308",
      title: "Aluno",
      subtitle: "Estou aqui para treinar e evoluir",
      perks: [
        "Treinos personalizados & avaliações",
        "XP, ranking e conquistas",
        "Feed da equipe e comunicados",
      ],
      badge: "Aprovação necessária",
      badgeColor: "#F59E0B",
    },
    {
      id: "professor" as const,
      icon: Shield,
      iconColor: "#06B6D4",
      title: "Professor",
      subtitle: "Sou coach e vou gerenciar turmas",
      perks: [
        "Gestão de alunos e turmas",
        "Avaliações e planos de treino",
        "Cockpit completo de aulas",
      ],
      badge: "Aprovação necessária",
      badgeColor: "#F59E0B",
    },
    {
      id: "visitor" as const,
      icon: Globe,
      iconColor: "#8B5CF6",
      title: "Comunidade",
      subtitle: "Acompanho o time e interajo com a arena",
      perks: [
        "Feed de posts, fotos e campeonatos",
        "Interagir, comentar e compartilhar",
        "Perfil público na comunidade",
      ],
      badge: "Acesso imediato",
      badgeColor: "#22C55E",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-[#EAB308] tracking-tight">WILL</h1>
        <p className="text-sm tracking-[0.3em] text-zinc-500 uppercase">TREINOS PRO</p>
        <p className="text-lg text-white font-semibold mt-4">
          Qual é o seu papel na arena?
        </p>
      </div>

      {/* Role Cards */}
      <div className="w-full max-w-md space-y-3">
        {roles.map((role, i) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? "border-[#EAB308]/60 bg-[#EAB308]/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${role.iconColor}20`, border: `1px solid ${role.iconColor}30` }}
                >
                  <Icon className="w-5 h-5" style={{ color: role.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-base">{role.title}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: role.badgeColor, background: `${role.badgeColor}20` }}
                    >
                      {role.badge}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-5 h-5 bg-[#EAB308] rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-black" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{role.subtitle}</p>
                  <ul className="space-y-1">
                    {role.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span style={{ color: role.iconColor }}>✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className="w-full max-w-md mt-6 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: selected ? "linear-gradient(135deg, #EAB308, #CA8A04)" : "#27272A",
          color: selected ? "black" : "#71717A",
        }}
      >
        Continuar →
      </motion.button>

      <p className="text-xs text-zinc-600 mt-4">
        Já tem conta?{" "}
        <a href="/login" className="text-[#EAB308] hover:underline">
          Entrar
        </a>
      </p>
    </motion.div>
  );
}
```

---

## 📝 PHASE 4 — UPDATE FORM SUBMISSION LOGIC

When the user submits the form, use the `selectedRole` to determine status and role:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... existing validation ...

  const studentStatus = selectedRole === "visitor" ? "active" : "pending";
  const studentRole = selectedRole ?? "aluno";

  await addStudent({
    name: form.name,
    phone: form.phone,
    email: studentEmail,
    instagram: form.instagram,
    avatar,
    status: studentStatus,      // "active" for visitor, "pending" for aluno/professor
    role: studentRole,           // "aluno" | "professor" | "visitor"
    plan: "mensal",
    monthlyValue: 0,
    paymentDay: 10,
    categories: [],
    joinedAt: new Date().toISOString().split("T")[0],
    frequency: 0,
    totalClasses: 0,
    notes: `Perfil selecionado: ${studentRole}`,
    authUserId: authUid ?? null,
  });

  // Different post-registration behavior:
  if (selectedRole === "visitor") {
    // Immediate redirect to feed (no waiting)
    toast("✅ Bem-vindo à Comunidade! Acesso liberado.");
    router.push("/feed");
  } else {
    // Show waiting screen
    setSubmitted(true);
    toast("✅ Cadastro enviado! Aguarde aprovação do coach.");
  }
};
```

---

## 🔄 PHASE 5 — UPDATE LOGIN PAGE

Add a "Não tem conta? Criar conta" link on the login page that goes to `/cadastro`:

Read `src/app/login/page.tsx` first, then add:

```tsx
// At the bottom of the login form, add:
<p className="text-center text-sm text-zinc-500 mt-4">
  Não tem conta?{" "}
  <Link href="/cadastro" className="text-[#EAB308] font-bold hover:underline">
    Criar conta grátis
  </Link>
</p>
```

---

## 🛡️ PHASE 6 — UPDATE MIDDLEWARE (visitor access)

Check `src/middleware.ts` to ensure visitors can access `/feed` and `/perfil`:

```typescript
// Ensure visitor role can access these routes:
const VISITOR_ALLOWED_ROUTES = ["/feed", "/perfil", "/login", "/cadastro", "/"];

// If user.role === "visitor" and trying to access other routes → redirect to /feed
```

Also verify in `src/components/Navigation.tsx` that visitors see only feed + profile in the nav.

---

## 🔔 PHASE 7 — UPDATE ADMIN NOTIFICATIONS

When a professor or aluno registers (not visitor), send admin notification:

```typescript
// Only notify admin for aluno and professor, not visitor
if (selectedRole !== "visitor") {
  await insertNotificationRemote(supabase, {
    type: "new_student",
    title: `Novo ${selectedRole === "professor" ? "Professor" : "Aluno"} na Fila`,
    message: `${form.name} fez o cadastro como ${selectedRole} e aguarda aprovação!`,
    time: "agora",
    read: false,
    isGlobal: true,
  });
}
```

---

## ✅ PHASE 8 — VALIDATION

After implementation:

```bash
# 1. TypeScript check
pnpm exec tsc --noEmit

# 2. Build check
pnpm run build

# 3. Manual test checklist:
# □ Access /cadastro directly (no invite) → role selection screen shows
# □ Select ALUNO → form shows → submit → /aguardando
# □ Select PROFESSOR → form shows → submit → /aguardando
# □ Select COMUNIDADE → form shows → submit → redirect to /feed
# □ Login page has "Criar conta" link
# □ Visitor can only access /feed and /perfil
# □ Admin sees aluno/professor in pending list (not visitor)
```

---

## 📋 SUMMARY OF FILES TO MODIFY

| File | Change |
|------|--------|
| `src/lib/enrollmentSession.ts` | Return `false` from `cadastroInviteRequired()` |
| `src/app/cadastro/page.tsx` | Add role selection step, remove invite gate |
| `src/app/login/page.tsx` | Add "Criar conta" link |
| `src/middleware.ts` | Allow visitor access to feed/perfil |
| `src/context/types.ts` | Ensure `"visitor"` role exists |
| `src/components/Navigation.tsx` | Limit nav items for visitor role |

---

## 🧠 IMPORTANT RULES

1. **Do NOT break existing admin/aluno/professor flows** — only ADD the visitor path and role selection
2. **Do NOT change Supabase RLS** — only frontend changes
3. **Propose before executing** — for each phase, describe what you'll do, then ask: "Posso implementar?"
4. **Test mentally for mobile** — the role selection must work on 375px width
5. **Keep the premium aesthetic** — dark background, gold accents, smooth Framer Motion transitions

---

## 🚀 START

Leia os arquivos primeiro, depois me apresente em pt-BR:

1. O estado atual do invite gate (o que precisa mudar exatamente)
2. Os roles existentes no types.ts
3. Se o middleware já tem suporte para visitor
4. Confirme o plano de implementação em 5 bullet points

Depois peça aprovação para começar pela Phase 1.

Responda em Português. Vamos lá!
