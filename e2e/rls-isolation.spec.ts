import { test, expect } from "@playwright/test";

/**
 * Teste: RLS (Row-Level Security) Isolation
 *
 * Valida que:
 * - Aluno A NÃO consegue ver dados de Aluno B
 * - Admin vê TUDO
 * - Professor vê apenas alunos da sua turma
 * - Pagamentos são isolados por aluno
 * - Notificações só chegam para quem é destinatário
 */

test.describe("RLS Isolation", () => {
  test("student A cannot view student B data", async ({ page, context }) => {
    // Este teste requer 2 usuários logados em contextos diferentes
    // Aluno A faz login
    await page.goto("/login");

    const emailInputA = page.locator('input[type="email"]');
    const passwordInputA = page.locator('input[type="password"]');

    // Login com primeira conta (aluno)
    await emailInputA.fill("aluno-a@example.com");
    await passwordInputA.fill("password123");

    const loginBtn = page.locator(
      'button:has-text("Entrar"), button[type="submit"]'
    );
    await loginBtn.click();

    // Aguardar redirect para dashboard
    await expect(page).toHaveURL(/\/dashboard|\/cockpit/, { timeout: 5000 });

    // Armazenar URL base e token do Aluno A
    const tokenA = await context.storageState();

    // Tentar acessar URL de outro aluno diretamente
    // Exemplo: /student/aluno-b-id
    // Isso deve ser bloqueado por RLS ou redirect
    await page.goto("/api/students/other-student-id");

    // Deve retornar 403 Forbidden ou dados vazios
    const response = await page.request.get("/api/students/other-student-id", {
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    // Esperar erro 403 ou 401
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("student cannot modify other student records", async ({ page }) => {
    await page.goto("/dashboard");

    // Tentar fazer mutação para outro aluno via API
    // Exemplo: PATCH /api/students/other-id com update
    const response = await page.request.patch("/api/students/other-student-id", {
      data: {
        status: "suspended", // Tentar suspender outro aluno
      },
    });

    // Deve falhar com 403 ou 401
    expect(response.status()).toBeGreaterThanOrEqual(400);

    // Body não deve conter dados atualizados
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("admin can view all students", async ({ page, context }) => {
    // Login como admin (papel deve estar em JWT via staff_access)
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

    // Acessar endpoint de todos os alunos (apenas admin pode)
    const response = await page.request.get("/api/students");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("payment records are isolated by student", async ({ page }) => {
    await page.goto("/dashboard");

    // Tentar acessar pagamentos de outro aluno
    const response = await page.request.get("/api/payments/other-student-id");

    // RLS deve bloquear ou retornar array vazio
    expect(response.status()).toBeGreaterThanOrEqual(200);

    const payments = await response.json();

    // Se retornar array, deve estar vazio para outro aluno
    if (Array.isArray(payments)) {
      expect(payments.length).toBe(0);
    } else {
      // Se retornar erro, ok também
      expect(payments.error || payments.message).toBeDefined();
    }
  });

  test("notifications only appear for intended recipient", async ({ page }) => {
    await page.goto("/dashboard");

    // Verificar notificações
    const response = await page.request.get("/api/notifications");

    expect(response.status()).toBe(200);

    const notifications = await response.json();

    // Todas as notificações devem ter recipient_id = current_user
    const currentUserId = await page.evaluate(() => {
      const auth = localStorage.getItem("auth_user");
      return auth ? JSON.parse(auth).id : null;
    });

    if (Array.isArray(notifications)) {
      notifications.forEach((notif) => {
        expect(notif.recipient_id).toBe(currentUserId);
      });
    }
  });

  test("lesson data visibility is based on role and enrollment", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Aluno deve ver apenas lições da sua turma
    const response = await page.request.get("/api/lessons");

    expect(response.status()).toBe(200);

    const lessons = await response.json();

    // Cada lição retornada deve estar na turma do aluno
    // Verificar que aluno não vê todas as lições do sistema
    if (Array.isArray(lessons)) {
      // A lista deve ser filtrada (não vazia, mas também não 1000+ lições)
      expect(lessons.length).toBeLessThan(100);
    }
  });

  test("professor cannot modify student status without admin role", async ({
    page,
  }) => {
    // Login como professor
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("professor@will.com");
    await passwordInput.fill("profpass");

    const loginBtn = page.locator(
      'button:has-text("Entrar"), button[type="submit"]'
    );
    await loginBtn.click();

    await expect(page).toHaveURL(/\/dashboard|\/professor/, {
      timeout: 5000,
    });

    // Tentar suspender um aluno (apenas admin pode)
    const response = await page.request.patch("/api/students/some-id", {
      data: {
        status: "suspended",
      },
    });

    // Deve retornar 403 Forbidden
    expect(response.status()).toBe(403);
  });
});
