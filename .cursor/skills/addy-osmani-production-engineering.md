# Skill: Addy Osmani Production Engineering — Will Treinos PRO
# Source: github.com/addyosmani/agent-skills (Google Chrome DevRel Lead)
# Install full repo: git clone https://github.com/addyosmani/agent-skills.git .cursor/addyosmani-skills
# This file is a summary of the 20-skill lifecycle for quick agent reference

## When to use
When any phase of development requires a structured, production-grade approach.
This skill maps the complete software lifecycle: DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP

---

## 7 Slash Commands (full lifecycle)

| Command | Phase | Core Principle |
|---|---|---|
| `/spec` | Define | **Spec before code** — write PRD covering objectives, commands, structure, code style, testing |
| `/plan` | Plan | **Small, atomic tasks** — decompose into verifiable units with acceptance criteria |
| `/build` | Build | **One slice at a time** — thin vertical slices, feature flags, rollback-friendly |
| `/test` | Verify | **Tests are proof** — Red-Green-Refactor, test pyramid (80/15/5), Beyonce Rule |
| `/review` | Review | **Improve code health** — five-axis review, severity labels (Nit/Optional/FYI) |
| `/code-simplify` | Review | **Clarity over cleverness** — Chesterton's Fence, Rule of 500 |
| `/ship` | Ship | **Faster is safer** — staged rollouts, feature flags, monitoring setup |

---

## 20 Skills Map (auto-activate based on context)

### DEFINE — Clarify what to build
- `idea-refine` → Turn vague ideas into concrete proposals (divergent/convergent thinking)
- `spec-driven-development` → Write PRD BEFORE any code

### PLAN — Break it down
- `planning-and-task-breakdown` → Atomic tasks with dependency ordering

### BUILD — Write the code
- `incremental-implementation` → Feature flags, safe defaults, rollback-friendly
- `test-driven-development` → Red-Green-Refactor, DAMP over DRY
- `context-engineering` → Right info at right time, session switching
- `source-driven-development` → Every framework decision grounded in official docs
- **`frontend-ui-engineering`** → Component architecture, design systems, WCAG 2.1 AA ← **critical for us**
- `api-and-interface-design` → Contract-first, Hyrum's Law, One-Version Rule

### VERIFY — Prove it works
- `browser-testing-with-devtools` → Chrome DevTools MCP: DOM, console, network, performance
- `debugging-and-error-recovery` → Five-step triage: reproduce → localize → reduce → fix → guard

### REVIEW — Quality gates
- `code-review-and-quality` → Five-axis review, ~100 line change size limit
- `code-simplification` → Remove complexity while preserving exact behavior
- **`security-and-hardening`** → OWASP Top 10, auth patterns, three-tier boundary system ← **critical for us**
- **`performance-optimization`** → Core Web Vitals, bundle analysis, measure-first ← **critical for us**

### SHIP — Go live
- `git-workflow-and-versioning` → Trunk-based, atomic commits, commit-as-save-point
- `ci-cd-and-automation` → Shift Left, Faster is Safer, feature flags
- `deprecation-and-migration` → Code-as-liability mindset
- `documentation-and-adrs` → Architecture Decision Records, document the WHY
- `shipping-and-launch` → Pre-launch checklists, staged rollouts, rollback procedures

---

## 3 Agent Personas (specialist reviewers)

| Agent | Role | Standard |
|---|---|---|
| `code-reviewer` | Senior Staff Engineer | "Would a staff engineer approve this?" |
| `test-engineer` | QA Specialist | Prove-It pattern — evidence required |
| `security-auditor` | Security Engineer | OWASP, threat modeling, vulnerability detection |

---

## Applied to Will Treinos PRO — Priority Skills

### Before implementing any feature:
1. `/spec` → Write PRD for the feature (even a short one)
2. `/plan` → Break into atomic tasks (max ~100 lines per task)

### While building:
3. `frontend-ui-engineering` → Component architecture, 44px touch targets, WCAG 2.1 AA
4. `incremental-implementation` → Thin slices, build incrementally, verify each slice

### Before pushing:
5. `security-and-hardening` → RLS, auth, input sanitization (maps to our `auditing-security` skill)
6. `performance-optimization` → Core Web Vitals (maps to our `auditing-performance` skill)
7. `code-review-and-quality` → Five-axis review (maps to our `parallel-code-review` skill)
8. `/ship` → Staged rollout via git push main → Vercel preview → production

---

## Key Google Engineering Principles Encoded

| Principle | Applied in Will Treinos PRO |
|---|---|
| **Hyrum's Law** | Never expose internal implementation details in APIs |
| **Beyonce Rule** | "If you liked it, put a test on it" — tests own the behavior |
| **Chesterton's Fence** | Understand WHY before removing any code |
| **Shift Left** | Catch bugs as early as possible (TypeScript, RLS at schema level) |
| **Trunk-based development** | Always work on main, use feature flags for WIP |

---

## Install Full Skill Pack (recommended)

To get all 20 skills with slash commands, run in Claude Code terminal:
```bash
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

Or clone manually:
```bash
git clone https://github.com/addyosmani/agent-skills.git .cursor/addyosmani-skills
```
