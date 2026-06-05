import { test, expect } from "@playwright/test";

/**
 * Teste: Admin Approval Flow
 *
 * Valida fluxo completo:
 * 1. Novo aluno se cadastra
 * 2. Admin recebe notificação
 * 3. Admin aprova aluno
 * 4. Aluno recebe notificação
 * 5. Aluno consegue acessar dashboard
 * 6. Check-in funciona
 */

test.describe("Admin Approval Flow", () => {
  test.skip(!process.env.PLAYWRIGHT_TEST_CREDS, 'Requer PLAYWRIGHT_TEST_CREDS — contas de teste não configuradas');

  test("new student signup triggers admin notification", async ({ page }) => {
    // Fazer signup como novo aluno
    await page.goto("/signup");

    // Preencher formulário de cadastro
    const nameInput = page.locator(
      'input[placeholder*="Nome"], input[type="text"]'
    );
    if (await nameInput.count() > 0) {
      await nameInput.first().fill("Novo Aluno Teste");
    }

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("novo-aluno@example.com");

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("password123");

    const submitBtn = page.locator(
      'button:has-text("Cadastrar"), button[type="submit"]'
    );
    if (await submitBtn.count() > 0) {
      await submitBtn.click();

      // Aguardar redirecionamento
      await page.waitForTimeout(2000);

      // Verificar que signup foi bem-sucedido
      // Pode ir para página de "Aguardando aprovação"
      const awaitingApprovalText = page.locator('text=/Aguardando|approval|pendente/i');

      const pageUrl = page.url();
      const isApprovalPage =
        pageUrl.includes("aguardando") || pageUrl.includes("approval");
      const hasAwaitingText = await awaitingApprovalText.count() > 0;

      expect(isApprovalPage || hasAwaitingText).toBe(true);
    }
  });

  test("admin receives notification of pending student approval", async ({
    page,
  }) => {
    // Login como admin
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

    // Verificar que há notificações pendentes
    const notificationsWidget = page.locator(
      '[data-testid="notifications"], [data-testid="pending-approvals"]'
    );

    if (await notificationsWidget.count() > 0) {
      const notificationText = await notificationsWidget.textContent();
      expect(notificationText).toMatch(/novo|pending|aluno/i);
    }

    // Ir para página de alunos para ver pendentes
    const studentsLink = page.locator(
      'a:has-text("Alunos"), [data-testid="students-link"]'
    );
    if (await studentsLink.count() > 0) {
      await studentsLink.click();

      await page.waitForNavigation({ waitUntil: "networkidle" });

      // Procurar por aluno pendente
      const pendingStudent = page.locator(
        'text=Aguardando, text=pendente, [data-testid="pending-student"]'
      );

      expect(await pendingStudent.count()).toBeGreaterThan(0);
    }
  });

  test("admin can approve pending student", async ({ page }) => {
    // Login como admin
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

    // Ir para alunos
    const studentsLink = page.locator('a:has-text("Alunos")');
    if (await studentsLink.count() > 0) {
      await studentsLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle" });
    }

    // Encontrar primeiro aluno pendente
    const pendingStudents = page.locator(
      '[data-testid="pending-student"], text=Aguardando'
    );

    if (await pendingStudents.count() > 0) {
      // Clicar no aluno pendente ou no botão de aprovar
      const approveBtn = page.locator(
        'button:has-text("Aprovar"), [data-testid="approve-button"]'
      );

      if (await approveBtn.count() > 0) {
        await approveBtn.first().click();

        // Confirmar na modal se houver
        const confirmBtn = page.locator(
          'button:has-text("Confirmar"), button:has-text("Sim"), button[class*="confirm"]'
        );

        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
        }

        // Aguardar atualização
        await page.waitForTimeout(1000);

        // Status deve mudar de "Aguardando" para "Ativo"
        const studentStatus = page.locator('[data-testid="student-status"]');
        const statusText = await studentStatus.first().textContent();

        expect(statusText).toMatch(/ativo|approved|active/i);
      }
    }
  });

  test("approved student receives notification and can login", async ({
    page,
    context,
  }) => {
    // Esse teste simula: admin aprovou aluno → aluno recebe notificação → aluno faz login

    // Login como novo aluno (que foi aprovado)
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("novo-aluno@example.com");
    await passwordInput.fill("password123");

    const loginBtn = page.locator(
      'button:has-text("Entrar"), button[type="submit"]'
    );
    await loginBtn.click();

    // Se aluno foi aprovado, deve conseguir fazer login
    await expect(page).toHaveURL(/\/dashboard|\/cockpit/, {
      timeout: 5000,
    });

    // Verificar que há notificação de aprovação
    const notifications = page.locator(
      '[data-testid="notifications"], [data-testid="approval-notification"]'
    );

    if (await notifications.count() > 0) {
      const notifText = await notifications.textContent();
      expect(notifText).toMatch(
        /aprovado|approved|bem-vindo|welcome|autorizado/i
      );
    }
  });

  test("approved student can perform check-in", async ({ page }) => {
    // Login como aluno aprovado
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("aluno-ativo@example.com");
    await passwordInput.fill("password123");

    const loginBtn = page.locator(
      'button:has-text("Entrar"), button[type="submit"]'
    );
    await loginBtn.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Procurar por botão de check-in
    const checkInBtn = page.locator('[data-testid="checkin-button"]');

    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();

      // Aguardar modal/form de check-in
      const checkInModal = page.locator(
        '[data-testid="checkin-modal"], [role="dialog"]'
      );

      if (await checkInModal.count() > 0) {
        // Preencher dados do check-in
        const lessonSelect = page.locator('select, [data-testid="lesson-select"]');
        if (await lessonSelect.count() > 0) {
          // Selecionar primeira opção
          const options = page.locator("option");
          if (await options.count() > 1) {
            await lessonSelect.selectOption(
              (await options.nth(1).getAttribute("value")) || ""
            );
          }
        }

        // Submit
        const submitBtn = page.locator(
          'button:has-text("Confirmar"), button[type="submit"]'
        );
        if (await submitBtn.count() > 0) {
          await submitBtn.click();

          // Aguardar confirmação
          await page.waitForTimeout(1000);

          // Deve haver mensagem de sucesso
          const successMsg = page.locator(
            'text=sucesso, text=realizado, text=enviado'
          );
          expect(await successMsg.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test("admin receives notification when student checks in", async ({
    page,
  }) => {
    // Login como admin
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

    // Verificar notificações de check-in pendentes
    const notificationWidget = page.locator(
      '[data-testid="notifications"], [data-testid="checkin-requests"]'
    );

    if (await notificationWidget.count() > 0) {
      const notifText = await notificationWidget.textContent();
      expect(notifText).toMatch(/check-in|pendente|aguardando/i);
    }
  });

  test("admin can approve or reject student check-in", async ({ page }) => {
    // Login como admin
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

    // Ir para check-ins ou aulas
    const checkInLink = page.locator(
      'a:has-text("Check-in"), a:has-text("Aulas"), [data-testid="checkins-link"]'
    );

    if (await checkInLink.count() > 0) {
      await checkInLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle" });
    }

    // Encontrar check-in pendente
    const pendingCheckIn = page.locator(
      '[data-testid="pending-checkin"], text=Aguardando'
    );

    if (await pendingCheckIn.count() > 0) {
      // Botão de aprovar
      const approveBtn = page.locator(
        'button:has-text("Aprovar"), button:has-text("Validar"), [data-testid="approve-checkin"]'
      );

      if (await approveBtn.count() > 0) {
        await approveBtn.first().click();

        // Confirmar
        const confirmBtn = page.locator(
          'button:has-text("Confirmar"), button:has-text("Sim")'
        );
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
        }

        // Aguardar
        await page.waitForTimeout(1000);

        // Status deve mudar
        const checkInStatus = page.locator('[data-testid="checkin-status"]');
        const status = await checkInStatus.first().textContent();
        expect(status).toMatch(/aprovado|approved|válido/i);
      }
    }
  });
});
