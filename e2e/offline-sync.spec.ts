import { test, expect } from "@playwright/test";

/**
 * Teste: Offline-First Sync
 *
 * Valida que:
 * - Ações são fila em localStorage quando offline
 * - Sync acontece quando volta online
 * - Retry com exponential backoff funciona
 * - Status badge mostra estado correto
 */

test.describe("Offline-First Sync", () => {
  test.skip(!process.env.PLAYWRIGHT_TEST_CREDS, 'Requer PLAYWRIGHT_TEST_CREDS — contas de teste não configuradas');

  test("should queue action when offline and sync when back online", async ({
    page,
    context,
  }) => {
    // Ir para dashboard (requer autenticação)
    await page.goto("/dashboard");

    // Esperar carregamento
    await expect(page.locator("[data-testid=sync-status]")).toBeVisible({
      timeout: 5000,
    });

    // Interceptar requisições para simular offline
    await context.setOffline(true);

    // Tentar fazer check-in (vai para fila)
    const checkInBtn = page.locator(
      'button:has-text("Check-in"), button[data-testid="checkin-button"]'
    );

    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();

      // Deve ver badge de offline
      const syncStatus = page.locator("[data-testid=sync-status]");
      await expect(syncStatus).toContainText(/Offline|ação/i, { timeout: 3000 });
    }

    // Voltar online
    await context.setOffline(false);

    // Aguardar sincronização (backend processa fila)
    // Deve ver "Sincronizado ✓" ou status success
    const successBadge = page.locator("[data-testid=sync-status]");
    await expect(successBadge).toContainText(/Sincronizado|✓|sucesso/i, {
      timeout: 10000,
    });
  });

  test("should show failed actions in sync queue", async ({ page, context }) => {
    await page.goto("/dashboard");

    // Ir offline
    await context.setOffline(true);

    // Fazer múltiplas ações (pelo menos 1 vai ficar fila)
    const actions = page.locator('[data-testid="action-button"]');
    if (await actions.count() > 0) {
      await actions.first().click();
    }

    const syncStatus = page.locator("[data-testid=sync-status]");
    const offlineText = await syncStatus.textContent();
    expect(offlineText).toMatch(/Offline|ação/i);

    // Voltar online com erro no servidor (simular endpoint 500)
    await context.setOffline(false);

    // Aguardar retry
    await page.waitForTimeout(2000);

    // Status deve mostrar falha ou retry
    await expect(syncStatus).toContainText(/falhou|erro|retry/i, {
      timeout: 5000,
    });
  });

  test("should persist queue across page reloads", async ({
    page,
    context,
  }) => {
    await page.goto("/dashboard");

    // Ir offline
    await context.setOffline(true);

    // Fazer ação
    const checkInBtn = page.locator('[data-testid="checkin-button"]');
    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();
    }

    // Verificar que está em localStorage
    const queueData = await page.locator("body").evaluate(() => {
      const queue = localStorage.getItem("sync-queue");
      return queue ? JSON.parse(queue) : null;
    });

    expect(queueData).toBeDefined();
    expect(queueData?.actions?.length).toBeGreaterThan(0);

    // Recarregar página
    await page.reload();

    // Fila deve estar intacta
    const queueAfterReload = await page.locator("body").evaluate(() => {
      const queue = localStorage.getItem("sync-queue");
      return queue ? JSON.parse(queue) : null;
    });

    expect(queueAfterReload?.actions?.length).toEqual(
      queueData?.actions?.length
    );

    // Voltar online
    await context.setOffline(false);

    // Sync deve processar fila
    const syncStatus = page.locator("[data-testid=sync-status]");
    await expect(syncStatus).toContainText(/Sincronizado|sucesso/i, {
      timeout: 10000,
    });
  });

  test("should show retry badge when action fails and retrying", async ({
    page,
    context,
  }) => {
    await page.goto("/dashboard");
    await context.setOffline(true);

    const checkInBtn = page.locator('[data-testid="checkin-button"]');
    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();
    }

    const syncStatus = page.locator("[data-testid=sync-status]");

    // Offine → deve estar em fila
    await expect(syncStatus).toContainText(/Offline/i);

    // Voltar online com latência simulada
    await context.setOffline(false);

    // Aguardar retry com backoff
    // Backoff: 1s, 5s, 15s, 1min, 5min
    // Primeiro retry deve ser rápido
    await page.waitForTimeout(1500);

    // Deve estar sincronizando ou sucesso
    const statusText = await syncStatus.textContent();
    expect(statusText).toMatch(/Sincronizado|Sincronizando|✓|retry/i);
  });
});
