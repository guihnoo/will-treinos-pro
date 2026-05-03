# MISSION: Complete Skills & Plugins Installation — Will Treinos PRO
# Claude Code: execute this mission autonomously
# This is a self-contained autonomous task — no user input needed during execution

---

## CONTEXT

You are the autonomous development system for **Will Treinos PRO** — a high-performance
volleyball SaaS platform (Next.js 15 + Supabase + Framer Motion + Vercel).

Your mission is to analyze all skill sources, select the best ones for this project,
and install them into both Cursor (`.cursor/skills/`) and Claude Code (`.claude/skills/`).

**Read first:**
- `.cursor/SKILLS_SOURCES/sources.md` — all reference URLs and repos
- `CLAUDE.md` — project context
- `.cursor/skills/` — skills already installed (do NOT reinstall duplicates)

---

## PHASE 1 — ANALYZE (WebSearch + Read)

Use WebFetch or your browser tool to analyze each source URL in `sources.md`.

For each source, identify skills that match our stack:
- **Next.js 15 / React** — component patterns, App Router, Server Components
- **Supabase** — RLS, realtime, migrations, auth
- **TypeScript** — strict typing, zero `any`
- **Framer Motion** — animation patterns, spring physics
- **PWA** — service workers, offline, push notifications
- **Performance** — Core Web Vitals, bundle optimization
- **Security** — OWASP, auth, data protection
- **Sports/Gamification** — XP systems, streaks, athlete management
- **Vercel** — deployment, edge functions, analytics

---

## PHASE 2 — INSTALL

For each selected skill/plugin:

### Option A — npx (preferred for registered packages)
```bash
npx add-skill <org/repo>
```

### Option B — Claude Code Plugin Marketplace
```
/plugin marketplace add <org/repo>
/plugin install <repo-name>@<plugin-name>
```

### Option C — Git Clone (for repos not on registry)
```bash
git clone https://github.com/<org>/<repo>.git .claude/skills/<repo-name>
```

### Option D — Manual extraction
If none of the above work: fetch the SKILL.md content from GitHub raw URL,
create a new file in `.cursor/skills/<skill-name>.md` with the content
adapted for Will Treinos PRO context.

---

## PHASE 3 — SYNC

After installing, sync everything to Claude Code:
```bash
# Copy .cursor/skills/ → .claude/skills/
Get-ChildItem ".cursor\skills\*.md" | Copy-Item -Destination ".claude\skills\" -Force
```

Or use the sync script:
```bash
powershell -ExecutionPolicy Bypass -File ".claude\sync-skills.ps1"
```

---

## PHASE 4 — VERIFY & REPORT

After completing installation, generate a report:

```
INSTALLATION REPORT — Will Treinos PRO Skills Arsenal

Skills installed this session: [N]
Total skills in .cursor/skills/: [N]
Total skills in .claude/skills/: [N]

Installed:
- [skill-name] from [source] via [method]
- ...

Skipped (already installed):
- [skill-name] — already exists
- ...

Failed (with reason):
- [skill-name] — [reason]

Recommended manual actions:
- [any skills that need manual steps]

New capabilities unlocked:
- [what the agent can now do that it couldn't before]
```

---

## PRIORITY TARGETS (install these first)

In order of impact for Will Treinos PRO:

1. `addyosmani/agent-skills` — 20 Google-grade engineering skills
   ```
   /plugin marketplace add addyosmani/agent-skills
   ```

2. `Yeachan-Heo/oh-my-claudecode` — 12,700 stars, 32 agents, smart model routing
   ```
   /plugin marketplace add Yeachan-Heo/oh-my-claudecode
   ```

3. `muratcankoylan/agent-skills-for-context-engineering` — context engineering collection
   ```
   npx add-skill muratcankoylan/agent-skills-for-context-engineering
   ```

4. `kayba-ai/recursive-improve` — self-improving agent
   ```
   npx add-skill kayba-ai/recursive-improve
   ```

5. `0xquinto/supabase-realtime-skill` — Supabase Realtime specific
   ```
   npx add-skill 0xquinto/supabase-realtime-skill
   ```

6. `liamdmcgarrigle/agent-config-sync` — auto-sync Claude Code ↔ Cursor
   ```
   npx add-skill liamdmcgarrigle/agent-config-sync
   ```

7. `ychampion/claude-self-learning` — autonomous skill generation via /learn
   ```
   npx add-skill ychampion/claude-self-learning
   ```

8. `Nadav011/apex-skills` — 25 quality enforcement skills
   ```
   npx add-skill Nadav011/apex-skills
   ```

9. `christopherlouet/wcag-audit` — WCAG 2.1 AA audit (PWA accessibility)
   ```
   npx add-skill christopherlouet/wcag-audit
   ```

10. `rokabytedev/proofrun` — agent proves its own work
    ```
    npx add-skill rokabytedev/proofrun
    ```

---

## ADDITIONAL SOURCES TO EXPLORE (WebFetch these URLs)

```
https://www.awesomeskills.dev/en/collection/community/coding-development
https://www.awesomeskills.dev/en/collection/community/testing
https://www.awesomeskills.dev/en/collection/community/security
https://github.com/hesreallyhim/awesome-claude-code
https://github.com/spencerpauly/awesome-cursor-skills
```

For each page: find skills relevant to Next.js, Supabase, TypeScript, PWA, Framer Motion.
Select top 5 per page. Install. Report.

---

## CONSTRAINTS

- DO NOT install skills unrelated to our stack (blockchain, mobile native, Python, Java)
- DO NOT reinstall skills already in `.cursor/skills/`
- DO NOT break existing project files
- DO install any skill that touches: Next.js, React, TypeScript, Supabase, PWA, performance, security, UI/UX, testing, CI/CD, Vercel
- After each install: verify the file exists in `.cursor/skills/` or `.claude/skills/`
- If a skill install fails 3 times: skip it, log it, continue

---

## START

Begin with Phase 1. Read `.cursor/SKILLS_SOURCES/sources.md` first,
then WebFetch each URL, then execute Phase 2 → 3 → 4.

Report progress in Brazilian Portuguese as you go.
Execute autonomously — no user confirmation needed between installs.
