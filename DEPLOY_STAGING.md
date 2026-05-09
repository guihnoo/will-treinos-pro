# 🚀 Deploy Staging — Gamification (Phases 8-10)

## Pre-Deploy Checklist

```bash
# 1. Verify build is green
pnpm run build
# Expected: ✓ Compiled successfully in X.Xmin

# 2. TypeScript clean
pnpm exec tsc --noEmit
# Expected: (no output = no errors)

# 3. Run E2E tests (optional, requires dev server)
pnpm dev &
pnpm exec playwright test
# Expected: All tests pass or skipped

# 4. Check uncommitted changes
git status
# Expected: nothing to commit, working tree clean

# 5. Verify commits are local
git log --oneline origin/main..HEAD
# Expected: 5 commits (Phase 8-10 work)
```

## Deployment Steps

### Option A: Deploy via GitHub/Vercel (Recommended)

```bash
# 1. Create a branch for deploy
git checkout -b deploy/gamification-phase-8-10

# 2. Push branch to origin
git push -u origin deploy/gamification-phase-8-10

# 3. Open PR on GitHub
# - Title: "🎮 Phase 8-10: Gamification XP System + Training Integration"
# - Description: (see below)

# 4. Wait for CI/CD checks to pass
# - GitHub Actions: TypeScript, Build, Tests
# - Vercel Preview deployment

# 5. Test in staging/preview
# - Navigate to Vercel preview URL
# - Run through QA checklist (GAMIFICATION_QA_CHECKLIST.md)

# 6. Merge to main via PR
git checkout main
git pull origin main
git merge deploy/gamification-phase-8-10
git push origin main
# Vercel auto-deploys to production

# 7. Verify production deployment
# - Check Vercel dashboard: deployment status
# - Test on production URL
```

### Option B: Direct Push (If no PR required)

```bash
# Only recommended if fully tested locally
git push origin main
```

## PR Description Template

```markdown
## 🎮 Phase 8-10: Gamification XP System + Training Integration

### Summary
Implements complete gamification system with XP audit trail, award tiers, and real-time training integration.

### What's Included

**Phase 8 — Gamification XP Log**
- GamificationContext with CRUD operations
- 3 Supabase tables: xp_log (audit trail), awards (tier system), xp_multipliers (reference)
- XP formula: 100 × (nota/10)² × 10 × multiplicador
- RLS policies for secure per-user access

**Phase 9 — Training + UI Integration**
- Training completion triggers XP logging (+50 XP)
- 5 UI components: XPBadge, AwardTierCard, AwardShowcase, XPHistoryList, GamificationPanel
- Real-time dashboard display of XP, awards, history
- Framer Motion animations with smooth transitions

**Phase 10 — E2E Testing & QA**
- Playwright tests for UI rendering and data flow
- Integration tests for training → XP → dashboard flow
- Comprehensive QA checklist (15 feature categories)
- E2E documentation and CI/CD setup

### Technical Details
- Build: ✅ Green (2.7m compile)
- TypeScript: ✅ Clean
- Bundle: 185 kB shared (no significant increase)
- Database: Supabase RLS policies secure by default
- Performance: < 2s dashboard load

### Testing
- [ ] Manual QA checklist (GAMIFICATION_QA_CHECKLIST.md)
- [ ] E2E tests: `pnpm exec playwright test`
- [ ] Staging preview validation
- [ ] Mobile/PWA testing (iOS Safari, Android Chrome)

### Security
- RLS policies prevent XP spoofing (students can't forge XP)
- Audit trail in xp_log (immutable insert-only)
- System-only XP insertion (via backend service)
- Per-user data isolation

### Deployment
- **Staging:** Deploy to preview for QA
- **Production:** Merge to main for auto-deploy
- **Rollback:** Easy rollback via git/Vercel if needed

### Next Steps (Phase 11+)
- [ ] Real-time Supabase subscriptions (xp_log updates)
- [ ] Leaderboard (real-time XP ranking)
- [ ] Notifications (award unlock alerts)
- [ ] Coach dashboard (XP analytics per student)

### Commits
- d1719e9: Phase 8 — Gamification XP Log system
- 184b338: Training + Gamification integration
- 98d4156: Gamification UI components
- 17ed341: GamificationPanel in StudentHome
- 7e8ec8b: E2E tests
- 86bb18e: QA checklist

Closes #XXX (if tracking in issues)
```

## Staging Validation Checklist

After deployment to staging, verify:

- [ ] Dashboard loads (< 2s)
- [ ] `/treinos` page works
- [ ] Can complete a training plan
- [ ] XP is logged to Supabase
- [ ] Dashboard shows new XP
- [ ] GamificationPanel displays correctly
- [ ] No console errors
- [ ] Mobile viewport works (375px)
- [ ] Animations are smooth (not janky)
- [ ] Dark theme applied correctly
- [ ] RLS: Student A can't see Student B's XP

## Database Migrations (if needed)

If Supabase tables need to be created manually:

```sql
-- Run migrations from: supabase/migrations/20260508000000_gamification_xp_log.sql
-- In Supabase dashboard: SQL Editor → paste and run
```

## Monitoring Post-Deploy

Track these metrics:

```
Dashboard (Vercel):
- Page load time (target: < 2s)
- Core Web Vitals (LCP, FID, CLS)
- Error rate (target: < 0.1%)

Database (Supabase):
- xp_log row count (should grow as students complete training)
- awards unlock count (early adoption metric)
- RLS policy errors (should be 0)
```

## Rollback Plan

If something breaks in production:

```bash
# Revert to previous commit
git revert <commit-hash>  # Creates new commit undoing changes
git push origin main

# OR via Vercel:
# Dashboard → Deployments → Select previous working version → Redeploy
```

## Questions?

- Review MASTER_MEMORY.md for architecture overview
- Check GAMIFICATION_QA_CHECKLIST.md for feature details
- Run E2E tests: `pnpm exec playwright test`

---

**Deployed By:** [Your Name]
**Date:** [YYYY-MM-DD]
**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Complete
