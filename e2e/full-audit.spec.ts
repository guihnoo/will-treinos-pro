import { test, expect, Page } from "@playwright/test";

/**
 * WILL TREINOS PRO — Auditoria Completa E2E
 * Testa todas as áreas, páginas e fluxos do app.
 * Captura screenshots, detecta erros de console e elementos quebrados.
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "guihmonteiro.2014@gmail.com";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || "";

const errors: { area: string; error: string; severity: "bug" | "warning" | "info" }[] = [];

function logError(area: string, error: string, severity: "bug" | "warning" | "info" = "bug") {
  console.log(`[${severity.toUpperCase()}] ${area}: ${error}`);
  errors.push({ area, error, severity });
}

// Helper: captura console errors durante um bloco
async function withConsoleCapture(page: Page, fn: () => Promise<void>) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  await fn();
  return consoleErrors;
}

// Helper: screenshot com nome descritivo
async function snap(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/${name.replace(/\s+/g, "_")}.png`,
    fullPage: true,
  });
}

// Helper: espera página carregar completamente
async function waitForLoad(page: Page, timeout = 8000) {
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
}

// ---------------------------------------------------------
// ÁREA 1: PÁGINAS PÚBLICAS
// ---------------------------------------------------------
test.describe("01 — Páginas Públicas", () => {
  test("Landing page (/) carrega corretamente", async ({ page }) => {
    const consoleErrs = await withConsoleCapture(page, async () => {
      await page.goto("/");
      await waitForLoad(page);
    });

    await snap(page, "01_landing");

    // Verificar que não é tela branca
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);

    if (consoleErrs.length > 0) {
      logError("/", `Console errors: ${consoleErrs.join(" | ")}`, "warning");
    }
  });

  test("Login page (/login) carrega com formulário funcional", async ({ page }) => {
    const consoleErrs = await withConsoleCapture(page, async () => {
      await page.goto("/login");
      await waitForLoad(page);
    });

    await snap(page, "02_login");

    // Verificar elementos essenciais
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")').first();

    const hasEmail = await emailInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;
    const hasSubmit = await submitBtn.count() > 0;

    if (!hasEmail) logError("/login", "Input de email ausente", "bug");
    if (!hasPassword) logError("/login", "Input de senha ausente", "bug");
    if (!hasSubmit) logError("/login", "Botão de submit ausente", "bug");

    expect(hasEmail).toBe(true);
    expect(hasPassword).toBe(true);

    if (consoleErrs.length > 0) {
      logError("/login", `Console errors: ${consoleErrs.join(" | ")}`, "warning");
    }
  });

  test("Login com credenciais inválidas mostra erro (não trava)", async ({ page }) => {
    await page.goto("/login");
    await waitForLoad(page);

    await page.locator('input[type="email"]').fill("teste-invalido@test.com");
    await page.locator('input[type="password"]').fill("senhaerrada123");

    const btn = page.locator('button[type="submit"], button:has-text("Entrar")').first();
    await btn.click();

    // Aguardar resposta (erro do Supabase)
    await page.waitForTimeout(3000);
    await snap(page, "03_login_erro");

    // Deve permanecer no login E mostrar algum feedback de erro
    const url = page.url();
    const stillOnLogin = url.includes("login");
    const hasError = await page.locator('[class*="error"], [class*="red"], [class*="danger"], text=/inválid|incorret|erro|failed|wrong/i').count() > 0;

    if (!stillOnLogin) logError("/login", "Após credencial inválida, redirecionou para outra página", "bug");
    if (!hasError) logError("/login", "Nenhuma mensagem de erro visível após credencial inválida", "warning");
  });

  test("Cadastro (/cadastro) carrega e exibe formulário", async ({ page }) => {
    const consoleErrs = await withConsoleCapture(page, async () => {
      await page.goto("/cadastro");
      await waitForLoad(page);
    });

    await snap(page, "04_cadastro");

    const pageText = await page.locator("body").textContent();
    const hasContent = pageText && pageText.length > 100;

    if (!hasContent) logError("/cadastro", "Página parece vazia ou com conteúdo mínimo", "warning");

    if (consoleErrs.length > 0) {
      logError("/cadastro", `Console errors: ${consoleErrs.join(" | ")}`, "warning");
    }
  });

  test("Rotas privadas redirecionam para login quando não autenticado", async ({ page }) => {
    const privateRoutes = ["/dashboard", "/agenda", "/alunos", "/financeiro", "/feed", "/will/court"];

    for (const route of privateRoutes) {
      await page.goto(route);
      await waitForLoad(page);

      const url = page.url();
      const redirectedToLogin = url.includes("login") || url.includes("aguardando") || url.includes("signup");

      if (!redirectedToLogin) {
        logError(route, `Rota privada ${route} acessível sem autenticação (URL atual: ${url})`, "bug");
      }
    }
  });
});

// ---------------------------------------------------------
// ÁREA 2: ADMIN / COCKPIT (requer auth)
// ---------------------------------------------------------
test.describe("02 — Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navega para login e usa credencial de desenvolvimento
    await page.goto("/login");
    await waitForLoad(page);
    // Injetar sessão dev via localStorage (modo admin dev)
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "admin");
      localStorage.setItem("will-role", "admin");
    });
    await page.goto("/dashboard");
    await waitForLoad(page);
  });

  test("Dashboard admin (/dashboard) carrega sem erros", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/dashboard");
    await waitForLoad(page);
    await snap(page, "05_admin_dashboard");

    const url = page.url();
    const isOnDashboard = url.includes("dashboard") || url.includes("will");

    if (!isOnDashboard) {
      logError("/dashboard", `Redirecionado para ${url} em vez do dashboard`, "warning");
    }

    if (consoleErrs.length > 0) {
      logError("/dashboard", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("WillCockpit — Área do Admin (/will/court)", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/will/court");
    await waitForLoad(page);
    await snap(page, "06_will_cockpit");

    const body = await page.locator("body").textContent();
    if (!body || body.length < 100) {
      logError("/will/court", "Cockpit carregou com conteúdo mínimo", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/will/court", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Agenda (/agenda) carrega corretamente", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/agenda");
    await waitForLoad(page);
    await snap(page, "07_agenda");

    const url = page.url();
    if (url.includes("login")) {
      logError("/agenda", "Redirecionou para login — autenticação não persistiu", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/agenda", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Alunos (/alunos) carrega lista de alunos", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/alunos");
    await waitForLoad(page);
    await snap(page, "08_alunos");

    const url = page.url();
    if (url.includes("login")) {
      logError("/alunos", "Redirecionou para login — autenticação não persistiu", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/alunos", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Financeiro (/financeiro) carrega sem crash", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/financeiro");
    await waitForLoad(page);
    await snap(page, "09_financeiro");

    const url = page.url();
    if (url.includes("login")) {
      logError("/financeiro", "Redirecionou para login — autenticação não persistiu", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/financeiro", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Feed (/feed) carrega posts", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/feed");
    await waitForLoad(page);
    await snap(page, "10_feed");

    const url = page.url();
    if (url.includes("login")) {
      logError("/feed", "Redirecionou para login — autenticação não persistiu", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/feed", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Configurações (/configuracoes) carrega abas", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/configuracoes");
    await waitForLoad(page);
    await snap(page, "11_configuracoes");

    const url = page.url();
    if (url.includes("login")) {
      logError("/configuracoes", "Redirecionado para login", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/configuracoes", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Perfil (/perfil) carrega e exibe form de edição", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/perfil");
    await waitForLoad(page);
    await snap(page, "12_perfil");

    if (consoleErrs.length > 0) {
      logError("/perfil", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Ranking (/ranking) carrega leaderboard", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/ranking");
    await waitForLoad(page);
    await snap(page, "13_ranking");

    const body = await page.locator("body").textContent();
    if (!body || body.length < 50) {
      logError("/ranking", "Página parece vazia", "warning");
    }

    if (consoleErrs.length > 0) {
      logError("/ranking", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });
});

// ---------------------------------------------------------
// ÁREA 3: ÁREA DO ALUNO
// ---------------------------------------------------------
test.describe("03 — Área do Aluno", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await waitForLoad(page);
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "aluno");
      localStorage.setItem("will-role", "aluno");
    });
    await page.goto("/dashboard");
    await waitForLoad(page);
  });

  test("StudentHome carrega área gamificada", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/dashboard");
    await waitForLoad(page);
    await snap(page, "14_student_home");

    if (consoleErrs.length > 0) {
      logError("/dashboard (aluno)", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Treinos do aluno (/treinos)", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/(student)/treinos");
    // Tentar URL alternativa
    const url1 = page.url();
    if (url1.includes("not-found") || url1.includes("404")) {
      await page.goto("/treinos");
    }
    await waitForLoad(page);
    await snap(page, "15_treinos_aluno");

    if (consoleErrs.length > 0) {
      logError("/treinos", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Feed do aluno (/feed) carrega posts e reações", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/feed");
    await waitForLoad(page);
    await snap(page, "16_feed_aluno");

    const url = page.url();
    if (url.includes("login")) {
      logError("/feed (aluno)", "Aluno redirecionado para login ao acessar feed", "bug");
    }

    if (consoleErrs.length > 0) {
      logError("/feed (aluno)", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Financeiro do aluno (/financeiro) exibe mensalidades", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/financeiro");
    await waitForLoad(page);
    await snap(page, "17_financeiro_aluno");

    if (consoleErrs.length > 0) {
      logError("/financeiro (aluno)", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });

  test("Ranking (/ranking) exibe leaderboard ao aluno", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/ranking");
    await waitForLoad(page);
    await snap(page, "18_ranking_aluno");

    if (consoleErrs.length > 0) {
      logError("/ranking (aluno)", `Console errors: ${consoleErrs.slice(0, 3).join(" | ")}`, "warning");
    }
  });
});

// ---------------------------------------------------------
// ÁREA 4: NAVEGAÇÃO E UX
// ---------------------------------------------------------
test.describe("04 — Navegação e UX", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await waitForLoad(page);
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "admin");
      localStorage.setItem("will-role", "admin");
    });
  });

  test("Navegação principal não tem links quebrados", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForLoad(page);

    // Verificar todos os links de navegação
    const navLinks = await page.locator("nav a, [role='navigation'] a").all();
    const brokenLinks: string[] = [];

    for (const link of navLinks) {
      const href = await link.getAttribute("href");
      if (href && href.startsWith("/") && !href.includes("#")) {
        await page.goto(href);
        await waitForLoad(page);

        const is404 = await page.locator("text=/404|not found|página não encontrada/i").count() > 0;
        if (is404) {
          brokenLinks.push(href);
          logError("Navegação", `Link quebrado (404): ${href}`, "bug");
        }
        await page.goto("/dashboard");
        await waitForLoad(page);
      }
    }

    if (brokenLinks.length > 0) {
      console.log("Links quebrados:", brokenLinks);
    }
  });

  test("Mobile: navegação inferior funciona em viewport 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await waitForLoad(page);
    await snap(page, "19_mobile_nav");

    // Verificar que nav inferior existe em mobile
    const mobileNav = page.locator('[class*="mobile"], [class*="bottom"], nav').first();
    const exists = await mobileNav.count() > 0;

    if (!exists) {
      logError("Mobile Nav", "Nenhuma navegação inferior visível em mobile 390px", "warning");
    }
  });

  test("Rota /dev/monitor protegida (não acessível a alunos)", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "aluno");
      localStorage.setItem("will-role", "aluno");
    });

    await page.goto("/dev/monitor");
    await waitForLoad(page);
    await snap(page, "20_dev_monitor_aluno");

    const url = page.url();
    const isProtected = url.includes("login") || url.includes("dashboard") || url.includes("aguardando");
    const has403 = await page.locator("text=/403|não autorizado|acesso negado/i").count() > 0;

    if (!isProtected && !has403) {
      logError("/dev/monitor", "Rota de dev acessível a usuário aluno em produção", "bug");
    }
  });

  test("Rota /will/push-debug protegida em produção", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "aluno");
      localStorage.setItem("will-role", "aluno");
    });

    await page.goto("/will/push-debug");
    await waitForLoad(page);
    await snap(page, "21_push_debug_aluno");

    const url = page.url();
    const isProtected = url.includes("login") || url.includes("dashboard") || !url.includes("push-debug");

    if (!isProtected) {
      logError("/will/push-debug", "Rota de debug de push acessível a aluno", "bug");
    }
  });
});

// ---------------------------------------------------------
// ÁREA 5: FORMULÁRIOS CRÍTICOS
// ---------------------------------------------------------
test.describe("05 — Formulários e Modais Críticos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await waitForLoad(page);
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "admin");
      localStorage.setItem("will-role", "admin");
    });
  });

  test("Modal de Criar Aula abre e tem campos corretos", async ({ page }) => {
    await page.goto("/agenda");
    await waitForLoad(page);

    // Procurar botão de criar aula
    const createBtn = page.locator('button:has-text("Nova aula"), button:has-text("Criar aula"), button:has-text("+ Aula"), button:has-text("Agendar")').first();

    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await snap(page, "22_criar_aula_modal");

      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      const modalVisible = await modal.count() > 0;

      if (!modalVisible) {
        logError("Criar Aula", "Botão de criar aula clicado mas modal não abriu", "bug");
      } else {
        // Verificar campos essenciais
        const hasDataField = await page.locator('input[type="date"], input[type="time"], input[placeholder*="data"], input[placeholder*="hora"]').count() > 0;
        if (!hasDataField) {
          logError("Criar Aula", "Modal sem campo de data/hora", "warning");
        }
      }
    } else {
      logError("Agenda", "Botão de criar aula não encontrado na página", "warning");
    }
  });

  test("Página de Alunos — filtros e busca funcionam", async ({ page }) => {
    await page.goto("/alunos");
    await waitForLoad(page);
    await snap(page, "23_alunos_filtros");

    // Verificar se existe campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquis"], input[placeholder*="nome"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill("test");
      await page.waitForTimeout(500);
      await snap(page, "23b_alunos_busca");
    } else {
      logError("/alunos", "Nenhum campo de busca encontrado na lista de alunos", "info");
    }
  });

  test("Feed — compor novo post funciona", async ({ page }) => {
    await page.goto("/feed");
    await waitForLoad(page);
    await snap(page, "24_feed_composer");

    // Verificar se há área de composição de post
    const composer = page.locator('textarea, input[placeholder*="post"], input[placeholder*="escreva"], [class*="composer"]').first();

    if (await composer.count() > 0) {
      await composer.click();
      await composer.fill("Teste de post E2E — verificando composição");
      await snap(page, "24b_feed_texto");
    } else {
      logError("/feed", "Área de composição de post não encontrada", "info");
    }
  });

  test("Financeiro — modal de pagamento abre para aluno", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "aluno");
      localStorage.setItem("will-role", "aluno");
    });

    await page.goto("/financeiro");
    await waitForLoad(page);
    await snap(page, "25_financeiro_payment_btn");

    // Verificar se há botão de ver/pagar mensalidade
    const payBtn = page.locator('button:has-text("Pagar"), button:has-text("Ver"), button:has-text("Comprovante"), button:has-text("PIX")').first();

    if (await payBtn.count() > 0) {
      await payBtn.click();
      await page.waitForTimeout(1000);
      await snap(page, "25b_financeiro_modal");
    } else {
      logError("/financeiro (aluno)", "Nenhum botão de pagamento visível para aluno", "warning");
    }
  });
});

// ---------------------------------------------------------
// ÁREA 6: PWA e PERFORMANCE
// ---------------------------------------------------------
test.describe("06 — PWA e Recursos Técnicos", () => {
  test("Manifest.json está acessível e válido", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await page.evaluate(() => document.body.textContent);
    try {
      const parsed = JSON.parse(manifest || "");
      if (!parsed.name) logError("PWA", "manifest.json sem campo 'name'", "warning");
      if (!parsed.icons?.length) logError("PWA", "manifest.json sem ícones", "warning");
      if (!parsed.start_url) logError("PWA", "manifest.json sem start_url", "warning");
    } catch {
      logError("PWA", "manifest.json inválido (não é JSON válido)", "bug");
    }
  });

  test("Service Worker registrado na home", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);

    const swRegistered = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.length > 0;
      }
      return false;
    });

    if (!swRegistered) {
      logError("PWA", "Service Worker não registrado após carregar a home", "warning");
    }
  });

  test("Offline.html existe e carrega", async ({ page }) => {
    const response = await page.goto("/offline.html");
    const status = response?.status();

    if (status !== 200) {
      logError("PWA", `offline.html retornou status ${status}`, "warning");
    } else {
      await snap(page, "26_offline_page");
    }
  });

  test("Meta tags essenciais presentes", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);

    const viewport = await page.locator('meta[name="viewport"]').count();
    const themeColor = await page.locator('meta[name="theme-color"]').count();
    const manifest = await page.locator('link[rel="manifest"]').count();

    if (!viewport) logError("SEO/PWA", "Meta viewport ausente", "warning");
    if (!themeColor) logError("SEO/PWA", "Meta theme-color ausente", "warning");
    if (!manifest) logError("SEO/PWA", "Link manifest ausente", "warning");
  });

  test("Ícones PNG existem (192 e 512)", async ({ page }) => {
    const icons = ["/icons/icon-192.png", "/icons/icon-512.png"];

    for (const icon of icons) {
      const response = await page.goto(icon);
      const status = response?.status();

      if (status !== 200) {
        logError("PWA Ícones", `Ícone ${icon} não encontrado (status ${status})`, "bug");
      }
    }
  });
});

// ---------------------------------------------------------
// ÁREA 7: ACESSIBILIDADE E RESPONSIVIDADE
// ---------------------------------------------------------
test.describe("07 — Acessibilidade e Responsividade", () => {
  const viewports = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 14 Pro", width: 393, height: 852 },
    { name: "Samsung Galaxy S21", width: 412, height: 915 },
    { name: "iPad", width: 768, height: 1024 },
    { name: "Desktop 1440", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`Login responsivo em ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");
      await waitForLoad(page);
      await snap(page, `27_login_${vp.name.replace(/\s+/g, "_")}`);

      // Verificar overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        logError(`Responsividade (${vp.name})`, `Overflow horizontal na página de login em ${vp.width}px`, "warning");
      }

      // Verificar que email input é visível
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        const box = await emailInput.boundingBox();
        if (!box || box.width < 100) {
          logError(`Responsividade (${vp.name})`, "Input de email muito pequeno ou fora da tela", "warning");
        }
      }
    });
  }

  test("Dashboard responsivo em mobile (390px)", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("wt_dev_impersonation", "admin");
      localStorage.setItem("will-role", "admin");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await waitForLoad(page);
    await snap(page, "28_dashboard_mobile");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      logError("Dashboard Mobile", "Overflow horizontal no dashboard em 390px", "bug");
    }
  });
});

// ---------------------------------------------------------
// ÁREA 8: ROTAS ESPECIAIS E EDGE CASES
// ---------------------------------------------------------
test.describe("08 — Edge Cases e Rotas Especiais", () => {
  test("Página 404 customizada existe", async ({ page }) => {
    await page.goto("/pagina-que-nao-existe-12345");
    await waitForLoad(page);
    await snap(page, "29_404");

    const is404 = await page.locator("text=/404|não encontrad/i").count() > 0;
    const isBlank = (await page.locator("body").textContent())?.length ?? 0 < 50;

    if (isBlank) {
      logError("404", "Página 404 está em branco", "bug");
    }
  });

  test("Página /aguardando funciona para aluno pendente", async ({ page }) => {
    await page.goto("/aguardando");
    await waitForLoad(page);
    await snap(page, "30_aguardando");

    const body = await page.locator("body").textContent();
    if (!body || body.length < 50) {
      logError("/aguardando", "Página de espera parece vazia", "warning");
    }
  });

  test("Preview page (/preview) carrega", async ({ page }) => {
    await page.goto("/preview");
    await waitForLoad(page);
    await snap(page, "31_preview");
  });

  test("Callback de OAuth (/auth/callback) não quebra ao acessar direto", async ({ page }) => {
    const consoleErrs: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });

    await page.goto("/auth/callback");
    await waitForLoad(page);

    // Deve redirecionar para algum lugar (não ficar em branco)
    const body = await page.locator("body").textContent();
    if (!body || body.length < 10) {
      logError("/auth/callback", "Página em branco ao acessar diretamente", "bug");
    }
  });

  test("Sessão expirada redireciona graciosamente", async ({ page, context }) => {
    // Limpar toda sessão
    await context.clearCookies();
    await page.goto("/dashboard");
    await waitForLoad(page);

    const url = page.url();
    const redirectedOk = url.includes("login") || url.includes("aguardando") || url.includes("signup");

    if (!redirectedOk) {
      logError("Sessão expirada", `Dashboard acessível sem sessão (URL: ${url})`, "bug");
    }
  });
});
