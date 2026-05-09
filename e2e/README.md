# E2E Tests — Will Treinos PRO

End-to-end tests for critical user flows using Playwright.

## Setup

```bash
# Install Playwright if not already done
pnpm install

# Install browsers (required once)
pnpm exec playwright install
```

## Running Tests

```bash
# Run all tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test gamification-ui.spec.ts

# Run in UI mode (watch mode with visual inspector)
pnpm exec playwright test --ui

# Run with headed browser (see what's happening)
pnpm exec playwright test --headed

# Debug mode
pnpm exec playwright test --debug
```

## Test Files

### `gamification-ui.spec.ts` — Component & Integration Tests
Tests that validate Gamification UI components render correctly and integrate properly:
- XPBadge structure and responsiveness
- AwardShowcase displays all 5 tiers
- GamificationPanel layout
- Training + Gamification integration
- Dashboard displays gamification data

**Status:** ✅ Ready to run (UI tests, no backend mocking needed)

### `gamification-training-flow.spec.ts` — Full Flow Test
End-to-end test simulating:
1. Student logs in
2. Navigates to /treinos
3. Completes a training plan
4. XP is logged to Supabase
5. Dashboard updates in real-time
6. Award tiers reflect new XP

**Status:** ⚠️ Requires test user credentials (see `playwright.config.ts`)

## Configuration

See `playwright.config.ts` for:
- Base URL (localhost:3000 for dev, deployed URL for staging)
- Browser settings (Chromium, Firefox, Webkit)
- Timeout settings
- Screenshot/video on failure

## CI/CD Integration

To add to GitHub Actions:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
```

## Next Steps

1. **Run UI tests** to verify component rendering:
   ```bash
   pnpm exec playwright test gamification-ui.spec.ts
   ```

2. **Update test credentials** in `.env.test` if full flow test is needed

3. **Add to CI/CD** pipeline for automated testing on every push

4. **Expand coverage** for:
   - Coach features (evaluation, check-in flow)
   - Admin cockpit
   - Payment flow
   - Real-time Supabase features (Realtime subscriptions)
