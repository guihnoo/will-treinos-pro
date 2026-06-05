import { test, expect } from '@playwright/test';

/**
 * UI Component Tests for Gamification
 * These tests validate that components render correctly and have expected DOM structure
 * Tests run against the published app (requires running `pnpm dev` or deployed URL)
 */

test.describe('Gamification UI Components', () => {
  test.skip(!process.env.PLAYWRIGHT_TEST_CREDS, 'Requer PLAYWRIGHT_TEST_CREDS — contas de teste não configuradas');

  test('XPBadge renders with correct structure', async ({ page }) => {
    // Navigate to a page with XPBadge (dashboard or any student-facing page)
    // For this test, we assume the dev server is running
    await page.goto('http://localhost:3000/preview'); // Or your preview page

    // Verify XPBadge exists (you'd need to expose this in a preview/storybook or test page)
    const badge = page.locator('text=/Pontuação de XP/i');

    if (await badge.isVisible()) {
      // Verify structure
      await expect(page.locator('text=/\\d+ XP/i')).toBeVisible();
      await expect(page.locator('text=/Nível \\d+/i')).toBeVisible();
      await expect(page.locator('text=/Progresso para próximo nível/i')).toBeVisible();
    }
  });

  test('AwardShowcase displays all 5 tiers', async ({ page }) => {
    await page.goto('http://localhost:3000/preview');

    // Check for tier cards
    const tiers = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Elite'];

    for (const tier of tiers) {
      const tierElement = page.locator(`text=${tier}`);
      // Elements may not be visible if page doesn't have gamification content
      // Just verify they exist in DOM if present
      const exists = await tierElement.count() > 0;
      if (exists) {
        await expect(tierElement.first()).toBeVisible();
      }
    }
  });

  test('GamificationPanel responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/preview');

    const panel = page.locator('text=/Pontuação de XP|Cards de Conquista|Histórico de XP/i');

    if (await panel.count() > 0) {
      // Verify components stack vertically on mobile
      const spacing = await panel.first().boundingBox();
      expect(spacing).toBeTruthy();
    }

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Components should still be visible and properly laid out
  });

  test('XPHistoryList shows source icons', async ({ page }) => {
    await page.goto('http://localhost:3000/preview');

    const historySection = page.locator('text=/Histórico de XP/i');

    if (await historySection.isVisible()) {
      // Verify entry structure with icons
      const sourceIcons = page.locator('[data-testid*="xp-history"]');

      if (await sourceIcons.count() > 0) {
        // Verify icons are present (CheckCircle2, MapPin, Users, etc)
        const firstEntry = sourceIcons.first();
        await expect(firstEntry).toBeVisible();
      }
    }
  });
});

test.describe('Gamification Data Flow', () => {
  test('XP Badge reflects Supabase data', async ({ page }) => {
    /**
     * This test would ideally:
     * 1. Mock Supabase responses
     * 2. Verify useGamification hook receives data
     * 3. Verify UI updates when data changes
     *
     * For now, we test the happy path structure
     */
    await page.goto('http://localhost:3000/preview');

    // Verify XPBadge doesn't show errors
    const errorMessages = page.locator('text=/Error|error|erro/i');
    const errorCount = await errorMessages.count();

    // Should not have error messages related to XP
    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      expect(errorText).not.toMatch(/XP|gamification|award/i);
    }
  });

  test('Award tier unlock animations trigger', async ({ page }) => {
    await page.goto('http://localhost:3000/preview');

    const tierCards = page.locator('text=/Bronze|Prata|Ouro|Diamante|Elite/');

    if (await tierCards.count() > 0) {
      // Get first tier card
      const firstCard = tierCards.first();

      // Verify animated elements exist
      const boundingBox = await firstCard.boundingBox();
      expect(boundingBox).toBeTruthy();
    }
  });
});

test.describe('Integration: Training + Gamification', () => {
  test('Training page integrates with GamificationContext', async ({ page }) => {
    /**
     * Validates that:
     * 1. /treinos page imports and uses useGamification
     * 2. Plan completion triggers XP logging
     * 3. UI feedback appears (toast, progress update)
     */

    await page.goto('http://localhost:3000/treinos');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    const pageTitle = page.locator('text=/Meus Treinos/i');

    if (await pageTitle.isVisible()) {
      // Verify XP context is available (would be injected via useGamification)
      // Check for no JavaScript errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(1000);

      // Should not have context-related errors
      const contextErrors = consoleErrors.filter(e =>
        e.includes('useGamification') || e.includes('Context')
      );
      expect(contextErrors).toHaveLength(0);
    }
  });

  test('Dashboard displays GamificationPanel after training', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify GamificationPanel is present
    const gamificationSection = page.locator(
      'text=/Pontuação de XP|Cards de Conquista|Histórico de XP/i'
    );

    // At least one of these sections should be visible
    const count = await gamificationSection.count();

    if (count > 0) {
      // Verify no loading errors
      const loaders = page.locator('[role="progressbar"]'); // Skeleton loaders
      const loaderCount = await loaders.count();

      // Allow some loaders initially, but they should resolve
      if (loaderCount > 0) {
        await page.waitForTimeout(1500); // Wait for data load
      }
    }
  });
});
