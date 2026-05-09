# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should redirect to login when not authenticated
- Location: e2e\auth.spec.ts:25:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login|\/auth/
Received string:  "http://localhost:3000/dashboard"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e12]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Teste: Authentication Flow
  5  |  *
  6  |  * Valida que usuários conseguem fazer login
  7  |  * e que a sessão é mantida
  8  |  */
  9  | 
  10 | test.describe("Authentication", () => {
  11 |   test("should show login page", async ({ page }) => {
  12 |     await page.goto("/login");
  13 | 
  14 |     // Verificar que página de login carregou
  15 |     await expect(page.locator("text=Will Treinos PRO")).toBeVisible();
  16 | 
  17 |     // Verificar que inputs de email/password estão presentes
  18 |     const emailInput = page.locator('input[type="email"]');
  19 |     const passwordInput = page.locator('input[type="password"]');
  20 | 
  21 |     await expect(emailInput).toBeVisible();
  22 |     await expect(passwordInput).toBeVisible();
  23 |   });
  24 | 
  25 |   test("should redirect to login when not authenticated", async ({ page }) => {
  26 |     // Tentar acessar dashboard sem autenticação
  27 |     await page.goto("/dashboard");
  28 | 
  29 |     // Deve redirecionar para login
> 30 |     await expect(page).toHaveURL(/\/login|\/auth/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  31 |   });
  32 | 
  33 |   test("should show signup button on login page", async ({ page }) => {
  34 |     await page.goto("/login");
  35 | 
  36 |     // Procurar por link de signup (cadastro)
  37 |     const signupLink = page.locator('a:has-text("Entrar no cadastro"), a:has-text("Cadastro"), a:has-text("não tem conta")');
  38 | 
  39 |     // Se não encontrar, é ok — pode estar em outro lugar
  40 |     if (await signupLink.count() > 0) {
  41 |       await expect(signupLink).toBeVisible();
  42 |     }
  43 |   });
  44 | 
  45 |   test("should show error on invalid credentials", async ({ page }) => {
  46 |     await page.goto("/login");
  47 | 
  48 |     // Preencher com credenciais inválidas
  49 |     await page.locator('input[type="email"]').fill("invalid@test.com");
  50 |     await page.locator('input[type="password"]').fill("wrongpassword");
  51 | 
  52 |     // Clicar em login
  53 |     const loginButton = page.locator('button:has-text("Entrar"), button:has-text("Login"), button[type="submit"]').first();
  54 |     await loginButton.click();
  55 | 
  56 |     // Esperar por erro (pode ser message ou toast)
  57 |     // Timeout curto já que esperamos erro
  58 |     await expect(page).toHaveURL(/\/login/, { timeout: 3000 }).catch(() => {
  59 |       // Ok se ficar na página
  60 |     });
  61 |   });
  62 | });
  63 | 
  64 | test.describe("Session Persistence", () => {
  65 |   test("should maintain session after page refresh", async ({ page, context }) => {
  66 |     // Este teste requer um usuário autenticado
  67 |     // Em produção, você faria login aqui primeiro
  68 |     // Por enquanto, apenas verifica que localStorage funciona
  69 | 
  70 |     await page.goto("/dashboard");
  71 | 
  72 |     // Verificar se localStorage está sendo usado
  73 |     const storageData = await context.storageState();
  74 | 
  75 |     // Storage pode ter cookies ou localStorage
  76 |     // O importante é que qualquer coisa persista
  77 |     expect(storageData).toBeDefined();
  78 |   });
  79 | });
  80 | 
```