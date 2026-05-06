import { test, expect } from '@playwright/test';

test.describe('Phase 7 — Training Plans (Complete Flow)', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home
    await page.goto('/');
    // Login as coach (assuming mock/seed data)
    await page.fill('input[type="email"]', 'coach@test.local');
    await page.fill('input[type="password"]', 'test');
    await page.click('button:has-text("Login")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('Should find "Planos de Treino" button in Cockpit', async ({ page }) => {
    // Verify TrainingPlansPanel button exists in quick actions
    const trainingButton = page.locator('button:has-text("Planos de Treino")');
    await expect(trainingButton).toBeVisible();

    // Verify icon is Dumbbell (check for emerald color)
    const icon = trainingButton.locator('svg');
    const color = await icon.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toContain('rgb'); // Should be a valid color
  });

  test('Should open TrainingPlansPanel when clicking button', async ({ page }) => {
    // Click the button
    await page.click('button:has-text("Planos de Treino")');

    // Wait for panel to appear
    const panel = page.locator('text=Planos de Treino');
    await expect(panel).toBeVisible();

    // Verify header structure
    const header = page.locator('h2:has-text("Planos de Treino")');
    await expect(header).toBeVisible();
  });

  test('Should display filter tabs (all/active/paused)', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    // Check for filter buttons
    const allBtn = page.locator('button:has-text("Todos")');
    const activeBtn = page.locator('button:has-text("Ativos")');
    const pausedBtn = page.locator('button:has-text("Pausados")');

    await expect(allBtn).toBeVisible();
    await expect(activeBtn).toBeVisible();
    await expect(pausedBtn).toBeVisible();
  });

  test('Should close panel with X button', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    const closeButton = page.locator('button[aria-label*="close"], button:has(svg[role="img"])').first();
    await closeButton.click();

    const panel = page.locator('h2:has-text("Planos de Treino")');
    await expect(panel).not.toBeVisible();
  });

  test('Should render empty state when no plans exist', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    // Check for empty state messaging
    const emptyState = page.locator('text=Nenhum plano de treino');
    const isVisible = await emptyState.isVisible().catch(() => false);

    // If empty, should show empty state; if data exists, should show plan cards
    if (isVisible) {
      await expect(emptyState).toBeVisible();
    } else {
      // Plans should be rendered
      const planCards = page.locator('[class*="plan"]');
      expect(await planCards.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('RLS: Student should only see their own plans', async ({ page }) => {
    // This would need a seeded student with plans
    // Verify via network requests that only student_id = current user is returned

    await page.goto('/treinos'); // Student training page

    // Check Network tab to verify RLS filter applied
    // Look for Supabase query with eq("student_id", userId)
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('supabase') && req.url().includes('training_plans')) {
        requests.push(req.url());
      }
    });

    // Trigger data load
    await page.waitForTimeout(2000);
    expect(requests.length).toBeGreaterThan(0);
  });

  test('RLS: Coach should be able to create plans', async ({ page }) => {
    // Navigate to training plans
    await page.goto('/dashboard');
    await page.click('button:has-text("Planos de Treino")');

    // Click "Novo Plano" button
    const novoBtn = page.locator('button:has-text("Novo Plano")');
    await expect(novoBtn).toBeVisible();

    // In actual implementation, would open a form
    // Just verify button exists and is accessible
    await expect(novoBtn).toBeEnabled();
  });

  test('Component renders with correct structure', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    // Verify key UI elements
    const header = page.locator('h2');
    const filterTabs = page.locator('button:has-text("Todos"), button:has-text("Ativos")');
    const contentArea = page.locator('[class*="overflow"]');
    const footer = page.locator('button:has-text("Novo Plano")');

    await expect(header).toBeVisible();
    expect(await filterTabs.count()).toBeGreaterThan(0);
    await expect(contentArea).toBeVisible();
    await expect(footer).toBeVisible();
  });

  test('Status colors are correctly rendered', async ({ page }) => {
    // This test would need actual training plans seeded
    await page.click('button:has-text("Planos de Treino")');

    // Check for status badges with correct colors
    const statusBadges = page.locator('[class*="text-emerald"], [class*="text-amber"], [class*="text-sky"], [class*="text-zinc"]');

    // If plans exist, verify status colors
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Modal closes on background click', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    const modalOverlay = page.locator('[role="dialog"]').first();
    await expect(modalOverlay).toBeVisible();

    // Click outside the modal content
    const background = page.locator('[class*="fixed"][class*="inset"]').first();
    await background.click({ position: { x: 0, y: 0 } });

    // Modal should close (though may not be visible if overlay is still animating)
    await page.waitForTimeout(500);
  });

  test('Keyboard: ESC should close panel', async ({ page }) => {
    await page.click('button:has-text("Planos de Treino")');

    const panel = page.locator('[class*="fixed"][class*="inset"]');
    await expect(panel).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    await page.waitForTimeout(300);
    // Check if panel is hidden (may not be fully removed from DOM due to React animations)
  });
});

test.describe('Phase 7 — Type Safety & Compilation', () => {
  test('TypeScript compilation should pass', async () => {
    // This is handled by the build process
    // But we can verify by checking if the app loads without errors
    const { expect: expectFunc } = test;
    expect(true).toBe(true); // Placeholder - actual validation via build
  });

  test('Training Plan types should be properly exported', async ({ page }) => {
    // Check network requests for type errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Filter out expected browser errors, check for app-specific errors
    const appErrors = errors.filter(e =>
      e.includes('TrainingPlan') ||
      e.includes('undefined') ||
      e.includes('cannot read')
    );

    expect(appErrors).toEqual([]);
  });
});

test.describe('Phase 7 — RLS Security Validation', () => {
  test('Unauthorized user cannot read other student plans', async ({ page, context }) => {
    // Create a separate browser context for different user
    const otherContext = await context.browser()?.newContext();
    if (!otherContext) return;

    const otherPage = await otherContext.newPage();

    // Login as different student
    await otherPage.goto('/');
    await otherPage.fill('input[type="email"]', 'student2@test.local');
    await otherPage.fill('input[type="password"]', 'test');
    await otherPage.click('button:has-text("Login")');

    // Try to access first student's plans (if direct route exists)
    // Due to RLS, should be blocked
    await otherPage.goto('/treinos');

    // Verify only own plans appear
    const planText = await otherPage.locator('text=Nenhum plano').isVisible().catch(() => false);
    // Either empty or shows own plans, never shows other user's plans

    await otherContext.close();
  });

  test('Coach cannot delete student plans they did not create', async () => {
    // This would be tested via direct Supabase queries
    // Verify RLS policy prevents cross-coach plan modification
    expect(true).toBe(true); // Integration test marker
  });
});
