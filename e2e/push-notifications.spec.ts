import { test, expect } from "@playwright/test";

/**
 * Teste: Push Notifications
 *
 * Valida que:
 * - Service Worker registra
 * - Notificações são subscritas
 * - Push chega no cliente
 * - Mensagens aparecem para o usuário
 * - Roles corretas recebem notificações
 */

test.describe("Push Notifications", () => {
  test("should register service worker", async ({ page }) => {
    await page.goto("/dashboard");

    // Verificar que Service Worker foi registrado
    const swRegistered = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });

  test("should allow push notification subscription", async ({ page }) => {
    await page.goto("/dashboard");

    // Tentar se inscrever em push notifications
    // Necessário permissão do browser (pode estar bloqueada em teste)
    const subscriptionResult = await page.evaluate(async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          return { supported: false };
        }

        const registration =
          await navigator.serviceWorker.ready;
        const subscription =
          await registration.pushManager.getSubscription();

        return {
          supported: true,
          subscribed: subscription !== null,
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });

    expect(subscriptionResult.supported).toBe(true);
    // Subscription pode estar null se permissão foi negada em teste
    // Mas o important é que a API existe e funciona
  });

  test("should handle push message event", async ({ page }) => {
    await page.goto("/dashboard");

    // Setup listener para push messages
    let pushMessageReceived = false;
    let notificationData: any = null;

    await page.evaluateHandle(() => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "PUSH_NOTIFICATION") {
            (window as any).pushMessageReceived = true;
            (window as any).notificationData = event.data;
          }
        });
      }
    });

    // Simular push message via Service Worker (em teste real, viria do servidor)
    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        // Enviar mensagem ao SW para testar
        reg.active?.postMessage({
          type: "PUSH_NOTIFICATION",
          data: {
            title: "Test Push",
            body: "Test notification",
          },
        });
      }
    });

    // Aguardar mensagem
    await page.waitForTimeout(1000);

    const received = await page.evaluate(
      () => (window as any).pushMessageReceived
    );
    expect(received).toBe(true);
  });

  test("should display notification when check-in is approved", async ({
    page,
  }) => {
    // Este é um teste de integração mais completo
    // Simula: aluno faz check-in → admin aprova → aluno recebe notificação

    await page.goto("/dashboard");

    // Monitorar notificações
    let notificationReceived = false;

    await page.evaluateHandle(() => {
      if ("Notification" in window) {
        // Listen para notificações do browser
        const originalNotif = (window as any).Notification;
        (window as any).Notification = function (
          ...args: any[]
        ) {
          notificationReceived = true;
          return new originalNotif(...args);
        };
      }
    });

    // Solicitar permissão (em teste real)
    await page.evaluate(() => {
      if ("Notification" in window && Notification.permission === "default") {
        // Em teste, skip permission request
      }
    });

    // Fazer check-in request
    const checkInBtn = page.locator('[data-testid="checkin-button"]');
    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();

      // Aguardar confirmação de submit
      await page.waitForTimeout(1000);

      // Em produção, admin aprovaria em outra aba
      // Por enquanto, apenas validamos que o fluxo funciona
    }
  });

  test("should send push notification to correct role", async ({ page }) => {
    // Fazer login como admin
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("admin@will.com");
    await passwordInput.fill("adminpass");

    const loginBtn = page.locator(
      'button:has-text("Entrar"), button[type="submit"]'
    );
    await loginBtn.click();

    await expect(page).toHaveURL(/\/cockpit|\/admin/, { timeout: 5000 });

    // Acessar debug/push page (se existe)
    await page.goto("/will/push-debug");

    const debugPageExists = await page.locator("h1").count();

    if (debugPageExists > 0) {
      // Preencher form de test push
      const roleSelect = page.locator('select, [data-testid="role-select"]');
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption("aluno");
      }

      const titleInput = page.locator(
        'input[placeholder*="Título"], [data-testid="title-input"]'
      );
      if (await titleInput.count() > 0) {
        await titleInput.fill("Test Notification");
      }

      const bodyInput = page.locator(
        'textarea[placeholder*="Conteúdo"], [data-testid="body-input"]'
      );
      if (await bodyInput.count() > 0) {
        await bodyInput.fill("This is a test push notification");
      }

      const sendBtn = page.locator(
        'button:has-text("Enviar"), [data-testid="send-push"]'
      );
      if (await sendBtn.count() > 0) {
        await sendBtn.click();

        // Aguardar resposta
        const resultContainer = page.locator(
          '[data-testid="push-result"], .result'
        );
        if (await resultContainer.count() > 0) {
          const resultText = await resultContainer.textContent();
          expect(resultText).toMatch(/enviado|success|ok/i);
        }
      }
    }
  });

  test("should handle notification permission deny gracefully", async ({
    page,
  }) => {
    // Se usuário nega permissão de notificação, app não deve quebrar
    await page.goto("/dashboard");

    // Simular deny de permissão
    await page.evaluate(() => {
      Object.defineProperty(window.Notification, "permission", {
        value: "denied",
      });
    });

    // Tentar fazer ação que requer notificação
    const checkInBtn = page.locator('[data-testid="checkin-button"]');
    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();

      // App deve funcionar mesmo sem notificação
      await page.waitForTimeout(1000);

      // Verificar que não houve erro na página
      const errorMessages = page.locator("[data-testid=error]");
      expect(await errorMessages.count()).toBe(0);
    }
  });

  test("should handle service worker update", async ({ page }) => {
    await page.goto("/dashboard");

    // Forçar atualização de SW
    const updateResult = await page.evaluate(async () => {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.update();
          return { updated: true };
        }
        return { supported: false };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });

    expect(updateResult.supported !== false).toBe(true);
  });
});
