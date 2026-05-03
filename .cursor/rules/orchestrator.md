# 🧠 ORCHESTRATOR — Will Treinos PRO

> This rule is always active. Cursor reads this on EVERY conversation.
> It defines HOW the agent decides which skills, agents and approaches to use
> based on the task received — without the user needing to ask.

---

## AUTOMATIC ROUTING PROTOCOL

Upon receiving any task, the agent must:

**Step 0 — Identify task type**
Read the task and classify into one of the categories below.
Automatically apply the corresponding protocol.

---

## 🗺️ ROUTING MAP

### CATEGORY 1 — New Feature or Idea
**Triggers:** "quero criar", "implementa", "adiciona", "preciso de", "nova funcionalidade", "I want to", "add", "create", "build", "implement"

**Automatic protocol:**
1. → `grill-me` — challenge the idea before any code
2. → `best-of-n-solving` — propose 2-3 approaches before choosing
3. → `parallel-exploring` — map what will be impacted
4. → Wait for user approval
5. → Execute with excellence
6. → `visual-qa-testing` — validate UI if visual change
7. → `parallel-code-review` — review before push
8. → `writing-commit-messages` — descriptive commit
9. → `saving-workspace-context` — log in MASTER MEMORY

---

### CATEGORY 2 — Bug Report or Wrong Behavior
**Triggers:** "não está funcionando", "quebrou", "erro", "bug", "not working", "broken", "wrong", "fails", "crash"

**Automatic protocol:**
1. → `systematic-debugging` — CSI method: reproduce → isolate → hypothesize → confirm → fix
2. → `auto-type-checking` — check for TypeScript errors
3. → `auditing-security` if bug involves auth/data
4. → `visual-qa-testing` after the fix
5. → `writing-commit-messages` — commit with `fix(scope):`
6. → `saving-workspace-context` — log bug and root cause

---

### CATEGORY 3 — Build or TypeScript Broken
**Triggers:** "build falhou", "erro de tipo", "build failed", "type error", "tsc", "won't compile", "vercel failed"

**Automatic protocol:**
1. → `grinding-until-pass` — autonomous loop until zero errors
2. → `auto-type-checking` — confirm clean output
3. → `writing-commit-messages` if commit needed
4. → NEVER use `as any` — solve real typing

---

### CATEGORY 4 — Code Review / Before Push
**Triggers:** "pode fazer push", "vamos deployar", "revisar", "está pronto", "git push", "ready to deploy", "review"

**Automatic protocol:**
1. → `parallel-code-review` — 4 reviewers in parallel
2. → `auditing-security` — security sweep
3. → `auto-type-checking` — zero TS errors
4. → `grinding-until-pass` if build broken
5. → `writing-commit-messages` — correct commit message
6. → `saving-workspace-context` — log in MASTER MEMORY

---

### CATEGORY 5 — Design or UI
**Triggers:** "tela", "visual", "componente", "interface", "modal", "card", "animação", "design", "screen", "animation", "component"

**Automatic protocol:**
1. **NEVER execute directly** — follow Creative Protocol in CLAUDE.md
2. Understand the real goal (not just the literal request)
3. Propose 2-3 different visual concepts before coding
4. Wait for concept approval
5. → Execute with spring physics, glassmorphism, 44px touch targets
6. → `visual-qa-testing` — screenshot mobile + desktop
7. → `responsive-testing` — validate 375px, 393px, 768px, 1280px

---

### CATEGORY 6 — Analysis / Project Audit
**Triggers:** "analisa", "auditoria", "revisar tudo", "overview", "analyze", "audit", "how is the project"

**Automatic protocol:**
1. → `parallel-exploring` — 4 subagents reading different areas simultaneously
2. → `improve-architecture` if architectural analysis requested
3. → `auditing-security` if security analysis requested
4. → `auditing-performance` if performance analysis requested
5. → Synthesis: consolidated report with priorities

---

### CATEGORY 7 — Volleyball / Gamification / XP Feature
**Triggers:** "XP", "fundamentos", "check-in", "avaliação", "card premium", "streak", "motor", "atleta", "coach", "prancheta", "volleyball", "athlete", "evaluation"

**Automatic protocol:**
1. Consult domain section in CLAUDE.md (fundamentals table, XP Engine)
2. → `best-of-n-solving` for implementation approaches
3. → `grill-me` to validate if mechanic makes sense in volleyball domain
4. Verify: student sees only their data? RLS correct?
5. → `visual-qa-testing` after implementing

---

### CATEGORY 8 — Database / Migration / Supabase
**Triggers:** "migration", "tabela", "supabase", "rls", "banco", "query", "schema", "table", "database"

**Automatic protocol:**
1. → `auditing-security` — every new table needs RLS
2. Verify: SELECT/INSERT/UPDATE/DELETE policies per role
3. → `auditing-performance` — indexes needed?
4. Migration file format: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`

---

## DEFAULT BEHAVIOR (no clear category)

If the task doesn't fit any category:
1. Ask about the real goal before acting
2. Apply Creative Protocol (propose before executing)
3. Always log in MASTER MEMORY when done

---

## UNIVERSAL RULES (applied to EVERYTHING)

```
✓ Propose before executing on creative tasks
✓ Log in WILLPRO_MASTER_MEMORY.md when done
✓ Zero TypeScript errors before any commit
✓ Build OK before any push
✓ RLS verified on any data change
✓ Mobile tested on any UI change
✓ User may ask for X and receive an improved X — always
```

---

## HOW TO REPORT TO USER (always in Brazilian Portuguese)

When starting a complex task, briefly announce:
```
🎯 Classificado como: [CATEGORIA]
📋 Protocolo: [skills que serão usadas]
⏱️ Iniciando...
```

**All output and communication to the user must be in Brazilian Portuguese (pt-BR).**
Code, comments, variable names, commit messages → English.
User-facing messages, explanations, proposals → Portuguese.
