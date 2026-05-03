# 🧪 E2E Testing — Playwright Guide

Complete end-to-end test suite validating: authentication, offline sync, RLS isolation, push notifications, and admin approval flows.

---

## 📋 Quick Start

### 1. Install Playwright (Already Done)

```bash
pnpm add -D @playwright/test playwright
```

### 2. Run All Tests Locally

```bash
# Headless (CI-like)
pnpm exec playwright test

# With UI (debug)
pnpm exec playwright test --ui

# Single browser
pnpm exec playwright test --project=chromium

# Single test file
pnpm exec playwright test e2e/auth.spec.ts

# Watch mode (re-run on changes)
pnpm exec playwright test --watch
```

### 3. View Test Report

```bash
pnpm exec playwright show-report
```

---

## 🗂️ Test Files

### `e2e/auth.spec.ts` — Authentication

Tests login flow, redirects, signup button, invalid credentials, and session persistence.

**Key scenarios:**
- ✅ Login page loads with email/password inputs
- ✅ Unauthenticated users redirected to login
- ✅ Invalid credentials show error
- ✅ Session persists after page refresh

**Run:**
```bash
pnpm exec playwright test e2e/auth.spec.ts
```

---

### `e2e/offline-sync.spec.ts` — Offline-First Architecture

Tests that actions are queued locally when offline, then synced when connectivity returns.

**Key scenarios:**
- ✅ Action queued to localStorage when offline
- ✅ Queue persists across page reloads
- ✅ Sync occurs when coming back online
- ✅ Retry with exponential backoff works (1s → 5s → 15s → 1m → 5m)
- ✅ Failed actions show in sync status

**Run:**
```bash
pnpm exec playwright test e2e/offline-sync.spec.ts

# Watch mode for debugging
pnpm exec playwright test e2e/offline-sync.spec.ts --debug
```

**Manual Testing (Airplane Mode):**
1. Open DevTools → Network tab → set to "Offline"
2. Make an action (check-in, post, payment)
3. Observe `SyncQueueStatus` shows "Offline · 1 ação"
4. Toggle offline → watch sync badge update
5. Check browser console for retry logs

---

### `e2e/rls-isolation.spec.ts` — Row-Level Security

Tests that row-level security policies prevent unauthorized data access.

**Key scenarios:**
- ✅ Aluno A cannot read Aluno B's data
- ✅ Student cannot modify other student records
- ✅ Admin can read all students
- ✅ Payment records isolated by student
- ✅ Notifications only show for recipient
- ✅ Lessons filtered by enrollment
- ✅ Professor cannot suspend students

**Run:**
```bash
pnpm exec playwright test e2e/rls-isolation.spec.ts
```

**What it validates:**
- API endpoints return 403 Forbidden for unauthorized access
- Queries are filtered by RLS policies
- Admin role bypasses RLS (can read all)
- Student sees only their own data

---

### `e2e/push-notifications.spec.ts` — Web Push API

Tests service worker registration, push subscription, and notification delivery.

**Key scenarios:**
- ✅ Service worker registers successfully
- ✅ Push subscription API available
- ✅ Push messages handled by SW
- ✅ Notifications display to user
- ✅ Only correct roles receive notifications
- ✅ Permission deny handled gracefully
- ✅ Service worker updates work

**Run:**
```bash
pnpm exec playwright test e2e/push-notifications.spec.ts
```

**Manual Testing (Real Push):**
1. Go to `/will/push-debug` (admin only)
2. Select role: "aluno"
3. Enter title: "Test Notification"
4. Enter body: "Testing push messages"
5. Click "Enviar"
6. Check notification appears on screen/mobile

---

### `e2e/admin-approval-flow.spec.ts` — Full Feature Flow

Tests complete flows: student signup → admin approval → check-in → notifications.

**Key scenarios:**
- ✅ New student signup visible to admin
- ✅ Admin receives pending notification
- ✅ Admin can approve pending student
- ✅ Approved student receives notification
- ✅ Approved student can login and access dashboard
- ✅ Approved student can perform check-in
- ✅ Admin receives check-in notification
- ✅ Admin can approve/reject check-in

**Run:**
```bash
pnpm exec playwright test e2e/admin-approval-flow.spec.ts
```

---

## 🔧 Configuration

**File:** `playwright.config.ts`

Key settings:
- **Base URL:** `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile:** Pixel 5, iPhone 12
- **Retries:** 0 local, 2 in CI
- **Parallel:** Yes (all browsers at once)
- **Screenshots:** Only on failure
- **Trace:** On first retry (captures full trace)
- **Reporter:** HTML (open with `playwright show-report`)

---

## 🚀 CI/CD Integration

**File:** `.github/workflows/test.yml`

Runs on every push to `main` or `develop`:

1. **TypeScript Check** — `tsc --noEmit` (catches type errors)
2. **Build Validation** — `pnpm run build` (full Next.js build)
3. **Playwright E2E** — Full test suite across 3 browsers
4. **RLS Audit** — Runs `supabase/rls-audit.sql` (validates security policies)

All jobs run in parallel. If any job fails, PR cannot be merged.

**View Results:**
1. Go to GitHub → Actions tab
2. Click on workflow run
3. Review logs for failures
4. Download artifact: `playwright-report-[browser]`

---

## 📊 Test Coverage

| Area | Coverage | Files |
|------|----------|-------|
| Authentication | Login, logout, session | `auth.spec.ts` |
| Offline | Queue, sync, retry | `offline-sync.spec.ts` |
| Security | RLS, isolation, roles | `rls-isolation.spec.ts` |
| Notifications | Service Worker, push, display | `push-notifications.spec.ts` |
| Workflows | Signup → approval → check-in | `admin-approval-flow.spec.ts` |

**Total:** 25+ test scenarios covering critical paths.

---

## 🐛 Debugging Tests

### 1. Run Single Test

```bash
pnpm exec playwright test e2e/auth.spec.ts -g "should show login page"
```

### 2. Debug Mode (Inspector)

```bash
pnpm exec playwright test --debug
```

Launches browser with debugger. Step through, inspect elements, check console.

### 3. Headed Mode (See Browser)

```bash
pnpm exec playwright test --headed
```

### 4. Generate Trace

```bash
pnpm exec playwright test --trace on
```

Opens trace viewer: see every action, network request, and screenshot.

### 5. Slow Motion

```bash
pnpm exec playwright test --headed --slow-mo 1000
```

Slows down actions to 1s each (easier to watch).

---

## 🔍 Troubleshooting

### Tests Fail Locally But Pass in CI

**Cause:** Timing differences (CI is faster).

**Fix:** Add explicit waits:
```typescript
await page.waitForNavigation({ waitUntil: "networkidle" });
await page.locator("[data-testid=element]").waitFor({ timeout: 5000 });
```

### Flaky Tests (Sometimes Pass, Sometimes Fail)

**Cause:** Race conditions or network delays.

**Fix:**
- Use `waitFor()` instead of `count()`
- Avoid hardcoded `setTimeout` (use Playwright waits)
- Use `data-testid` attributes instead of text selectors

Example:
```typescript
// ❌ Bad
await page.waitForTimeout(1000);

// ✅ Good
await page.locator("[data-testid=success]").waitFor();
```

### Service Worker Not Registering

**Cause:** Local dev server not configured for SW.

**Fix:** Ensure `next.config.mjs` has PWA config with service worker path.

### Push Notifications Permission Denied

**Cause:** Browser denied permission, test can't request it interactively.

**Fix:** Tests handle this gracefully. For real testing, manually grant permission in browser settings.

---

## 📈 Best Practices

### 1. Use `data-testid` Attributes

```tsx
// Add to components
<button data-testid="checkin-button">Check-in</button>

// Query in tests
const btn = page.locator('[data-testid="checkin-button"]');
```

### 2. Wait for Network

```typescript
await page.waitForNavigation({ waitUntil: "networkidle" });
```

### 3. Handle Modals

```typescript
const modal = page.locator('[role="dialog"], .modal');
await expect(modal).toBeVisible();
```

### 4. Check Status Codes

```typescript
const response = await page.request.get("/api/endpoint");
expect(response.status()).toBe(200);
```

### 5. Test Role-Based Access

```typescript
// Login as different roles and verify access
await loginAs("aluno");
await expect(page).toHaveURL(/dashboard/);

await logout();
await loginAs("admin");
await expect(page).toHaveURL(/cockpit/);
```

---

## 🚨 Pre-Deployment Checklist

Before pushing to production:

- [ ] All E2E tests pass locally: `pnpm exec playwright test`
- [ ] TypeScript check passes: `pnpm exec tsc --noEmit`
- [ ] Build succeeds: `pnpm run build`
- [ ] RLS audit passes: Check `/supabase/rls-audit.sql`
- [ ] Environment variables set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for API routes)
  - `VAPID_PRIVATE_KEY` (for push API)
- [ ] GitHub Actions workflow passes on PR
- [ ] Manual smoke test: login → check-in → approve
- [ ] Verify push notifications work on real device

---

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging](https://playwright.dev/docs/debug)

---

**Status:** 🟢 E2E TESTING SUITE COMPLETE

Next: Deploy to production with confidence! 🚀
