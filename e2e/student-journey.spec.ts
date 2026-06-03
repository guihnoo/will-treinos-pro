import { test, expect } from "@playwright/test";

// ─── Smoke tests — jornada do aluno ──────────────────────────────────────────
// Estes testes validam os pontos críticos da jornada sem precisar de dados reais.
// Não realizam login real — apenas verificam que as páginas carregam sem crash.

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Will Treinos/);
  // Verifica que existe ao menos um elemento interativo (login ou cadastro)
  const hasAction = await page
    .locator("a[href*='login'], a[href*='signup'], button")
    .first()
    .isVisible()
    .catch(() => false);
  expect(hasAction).toBeTruthy();
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  // Página deve carregar sem crash — título ou body presente
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  expect(bodyText).not.toContain("Application error");
});

test("protected routes redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  // Deve redirecionar (não ficar em /dashboard sem auth)
  await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), {
    timeout: 10_000,
  });
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test("privacy page loads", async ({ page }) => {
  await page.goto("/privacidade");
  // Deve carregar sem crash
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  // Verifica h1 ou título de privacidade (se a página existe)
  const h1 = page.locator("h1").first();
  const h1Visible = await h1.isVisible().catch(() => false);
  if (h1Visible) {
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toMatch(/privacidade|privacy/i);
  }
});

test("terms page loads", async ({ page }) => {
  await page.goto("/termos");
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  const h1 = page.locator("h1").first();
  const h1Visible = await h1.isVisible().catch(() => false);
  if (h1Visible) {
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toMatch(/termos|terms/i);
  }
});

test("signup page renders", async ({ page }) => {
  await page.goto("/signup");
  // Verifica que carrega sem crash (pode ter gate de convite)
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  expect(bodyText).not.toContain("Application error");
  // Página deve ter conteúdo
  expect(bodyText?.trim().length).toBeGreaterThan(0);
});

test("password recovery pages render", async ({ page }) => {
  for (const path of ["/esqueci-senha", "/nova-senha"] as const) {
    await page.goto(path);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("Internal Server Error");
  }
});

test("ranking page renders", async ({ page }) => {
  await page.goto("/ranking");
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
});

test("leaderboard API responds", async ({ request }) => {
  const res = await request.get("/api/leaderboard?period=week");
  expect(res.status()).toBeLessThan(500);
});

test("public athlete profile 404 handled gracefully", async ({ page }) => {
  await page.goto("/atleta/nonexistent-id-000");
  // Não deve mostrar crash — deve mostrar estado de erro ou not found
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  expect(bodyText).not.toContain("Application error");
});

test("cadastro page renders", async ({ page }) => {
  await page.goto("/cadastro");
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Internal Server Error");
  expect(bodyText).not.toContain("Application error");
});

test("feed route redirects without auth", async ({ page }) => {
  await page.goto("/feed");
  await page.waitForURL((url) => !url.pathname.startsWith("/feed"), { timeout: 10_000 });
  await expect(page).not.toHaveURL(/\/feed$/);
});

test("health API responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBeLessThan(500);
});
