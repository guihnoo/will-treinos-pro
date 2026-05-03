# ARSENAL FINAL — Will Treinos PRO
# Claude Code + Cursor — Dual Powerhouse
# Análise profunda de 3890+ skills de Coding & Development
# ============================================================

## HOW EACH AI DISCOVERS SKILLS

### Cursor
- Reads: `.cursor/skills/*.md` (auto-discovered)
- Reads: `.cursor/rules/*.md` (always active)
- Activation: @skill-name in chat

### Claude Code
- Reads: `.claude/skills/*.md` (auto-discovered)
- Reads: `CLAUDE.md` (every session)
- Reads: `.claude/agents/*.md` (subagents)
- Activation: already active — reads on startup

### npx add-skill (from awesomeskills.dev)
- Installs to `.claude/skills/` by default (Claude Code)
- Some install to both `.cursor/` and `.claude/` automatically

### Our sync script
- `.claude/sync-skills.ps1` → copies `.cursor/skills/` to `.claude/skills/`
- Run after creating any new skill manually

---

## NEW DISCOVERIES — Deep Analysis of 3890+ Coding Skills

### TIER GOD — Must install immediately

#### 1. addyosmani/agent-skills
**Who:** Addy Osmani — Google Chrome DevRel Lead, author of "Learning Patterns"
**What:** Production-grade engineering skills from one of the world's top web engineers
**Install:** `npx add-skill addyosmani/agent-skills`
**Why it's gold:** Addy wrote the book on web performance. These skills embed his
decades of Google-level engineering knowledge directly into our agent.

#### 2. microsoft/skills
**What:** Skills, MCP servers, Custom Agents, Agents.md for Microsoft SDKs
**Install:** `npx add-skill microsoft/skills`
**Why it's gold:** Microsoft's official skills — includes TypeScript best practices,
Azure patterns, and VS Code integration that align perfectly with our stack.

#### 3. smorky850612/Aurakit
**What:** All-in-one Claude Code skill — 33 modes, 6-layer security, 23 hooks, 75% token savings
**Install:** `npx add-skill smorky850612/Aurakit`
**Why it's gold:** 75% token savings alone pays for itself. Works with Cursor,
Codex, and Claude Code simultaneously. 33 operation modes.

#### 4. muratcankoylan/agent-skills-for-context-engineering
**What:** Complete collection of Context Engineering skills:
- `context-fundamentals` — master context window design
- `context-compression` — summarize and compress without losing info
- `context-optimization` — KV-cache, token budgeting, efficiency
- `context-degradation` — diagnose "lost-in-middle" problems
- `memory-systems` — Mem0, Zep, LangMem, knowledge graphs
- `filesystem-context` — offload context to files, just-in-time loading
- `tool-design` — design MCP tools correctly
**Install:** `npx add-skill muratcankoylan/agent-skills-for-context-engineering`
**Why it's gold:** This is an entire PhD curriculum on how LLMs process context,
compressed into actionable skills. The most scientifically grounded set found.

#### 5. cwinvestments/memstack
**What:** 112 skills + auto-trigger commands + session memory + project handoffs
**Install:** `npx add-skill cwinvestments/memstack`
**Why it's gold:** 112 skills in one package. Automatic triggering. Complete
session handoff protocol. The most complete skill framework found.

#### 6. kayba-ai/recursive-improve
**What:** Makes agents recursively self-improve — the agent improves its own skills
**Install:** `npx add-skill kayba-ai/recursive-improve`
**Why it's gold:** Self-improving agent = every session is better than the last.
The compound effect over time is enormous.

#### 7. 0xquinto/supabase-realtime-skill
**What:** Agent Skill + MCP server specifically for Supabase Realtime/CDC
**Install:** `npx add-skill 0xquinto/supabase-realtime-skill`
**Why it's gold:** DIRECTLY applies to Will Treinos PRO. Supabase Realtime
for live check-in, XP updates, and coach notifications — with expert guidance.

#### 8. xueyangeng/frontend-code-audit
**What:** Comprehensive frontend code quality audit for React/Vue/Next.js projects
**Install:** `npx add-skill xueyangeng/frontend-code-audit`
**Why it's gold:** Built specifically for Next.js projects. Audits exactly
what we use — React components, hooks, state management, bundle size.

#### 9. mattnowdev/thinking-partner
**What:** 150+ mental models, orientation detection, cognitive operations
Works with Claude Code, Cursor, Windsurf, Cline, GitHub Copilot
**Install:** `npx add-skill mattnowdev/thinking-partner`
**Why it's gold:** 150 mental models available on-demand. When facing a
complex architectural decision, the agent reasons with frameworks like
First Principles, Inversion, Systems Thinking — not just intuition.

#### 10. Nadav011/apex-skills
**What:** 25 portable skills enforcing code quality across Claude Code, Gemini, Kiro, Cursor
Blocks TypeScript shortcuts, security holes, and more
**Install:** `npx add-skill Nadav011/apex-skills`
**Why it's gold:** Cross-platform enforcement. Works in both Cursor AND Claude Code.
Blocks the exact anti-patterns we want to avoid (as any, ts-ignore, etc).

#### 11. christopherlouet/wcag-audit
**What:** WCAG 2.1/2.2 AA audit — 64 rules across 11 categories, inspired by axe-core
**Install:** `npx add-skill christopherlouet/wcag-audit`
**Why it's gold:** Will Treinos PWA needs accessibility. Athletes using on phone
in a gym with sun glare need a11y-compliant UI. This automates the audit.

#### 12. rokabytedev/proofrun
**What:** Teaches the agent to PROVE its own work — evidence, not claims
**Install:** `npx add-skill rokabytedev/proofrun`
**Why it's gold:** Eliminates the #1 problem with AI agents — hallucinating
that something works when it doesn't. Agent must show evidence before saying "done."

#### 13. khendzel/skills-janitor
**What:** Audit, track usage, and manage skills — 7 slash commands, zero dependencies
**Install:** `npx add-skill khendzel/skills-janitor`
**Why it's gold:** As our skill library grows to 40+ packages, this manages them.
Finds unused skills, duplicates, and conflicting instructions.

#### 14. 10CG/aria-plugin
**What:** 28 Skills + 11 Agents + Hooks — full DDD (Domain-Driven Design) plugin for Claude Code
**Install:** `npx add-skill 10CG/aria-plugin`
**Why it's gold:** DDD aligns perfectly with our domain model (Athlete, Coach,
Admin, XP Engine, Volleyball Fundamentals). Agents designed around business domains.

---

## COMPLETE INSTALL SCRIPT — Second Wave

```powershell
# Run in terminal after the first install-arsenal.ps1 finishes:
# powershell -ExecutionPolicy Bypass -File ".cursor\install-arsenal-wave2.ps1"

$wave2 = @(
    "addyosmani/agent-skills",
    "microsoft/skills",
    "smorky850612/Aurakit",
    "muratcankoylan/agent-skills-for-context-engineering",
    "cwinvestments/memstack",
    "kayba-ai/recursive-improve",
    "0xquinto/supabase-realtime-skill",
    "xueyangeng/frontend-code-audit",
    "mattnowdev/thinking-partner",
    "Nadav011/apex-skills",
    "christopherlouet/wcag-audit",
    "rokabytedev/proofrun",
    "khendzel/skills-janitor",
    "10CG/aria-plugin"
)
```

---

## HOW CLAUDE CODE READS ALL SKILLS

### Automatic (reads on every startup):
1. `CLAUDE.md` — project bible
2. `.claude/skills/*.md` — all skills installed here
3. `.claude/agents/*.md` — subagents

### Make Claude Code aware of .cursor/skills:
Run sync script: `powershell -ExecutionPolicy Bypass -File ".claude\sync-skills.ps1"`

### Claude Code activation prompt:
```
Read CLAUDE.md, WILLPRO_MASTER_MEMORY.md, and all files in .claude/skills/

Confirm:
1. How many skills you found and list all names
2. What you know about the project (5 key points)
3. Your operation protocol going forward
4. The single highest-impact technical priority right now
```

---

## THE TWO SYSTEMS COMPARED

| Feature | Cursor | Claude Code |
|---|---|---|
| Skills location | `.cursor/skills/` | `.claude/skills/` |
| Rules (always active) | `.cursor/rules/` | `CLAUDE.md` sections |
| Subagents | via @skill-name | `.claude/agents/` |
| Best for | Real-time coding + autocomplete | Autonomous long tasks + CLI |
| Sync needed | No (manual creation) | Yes (copy from .cursor/skills) |

## FINAL STATUS
- Wave 1: 25 packages (install-arsenal.ps1)
- Wave 2: 14 packages (install-arsenal-wave2.ps1)
- Local skills: 16 manually crafted (already in .cursor/skills/)
- Total arsenal: ~55 skill packages + 16 custom skills

**Both Cursor and Claude Code will now operate at elite level.**
