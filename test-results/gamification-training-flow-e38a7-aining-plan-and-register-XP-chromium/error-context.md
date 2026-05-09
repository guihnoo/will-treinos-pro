# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gamification-training-flow.spec.ts >> Gamification + Training Flow E2E >> should complete training plan and register XP
- Location: e2e\gamification-training-flow.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - main [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: ⚡
        - heading "WILL TREINOS PRO" [level=1] [ref=e9]
        - paragraph [ref=e10]: Arena Digital de Elite
      - generic [ref=e11]:
        - button "🛡️ Dono / Gestor Gestão tática e comando de arena profissional. Acessar Painel" [ref=e12] [cursor=pointer]:
          - generic [ref=e13]: 🛡️
          - heading "Dono / Gestor" [level=3] [ref=e14]
          - paragraph [ref=e15]: Gestão tática e comando de arena profissional.
          - generic [ref=e16]: Acessar Painel
        - button "🎓 Professor Prescrição de treinos e acompanhamento técnico. Iniciar Aula" [ref=e17] [cursor=pointer]:
          - generic [ref=e18]: 🎓
          - heading "Professor" [level=3] [ref=e19]
          - paragraph [ref=e20]: Prescrição de treinos e acompanhamento técnico.
          - generic [ref=e21]: Iniciar Aula
        - button "🏆 Atleta VIP Performance extrema e evolução gamificada. Entrar na Arena" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: 🏆
          - heading "Atleta VIP" [level=3] [ref=e24]
          - paragraph [ref=e25]: Performance extrema e evolução gamificada.
          - generic [ref=e26]: Entrar na Arena
      - paragraph [ref=e28]: Est. 2024 · Will Treinos PRO · v2.0 Elite
    - generic [ref=e29]: Servidor Online
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Gamification + Training Flow E2E', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Login como aluno de teste
  6   |     await page.goto('/login');
> 7   |     await page.fill('input[type="email"]', 'student@test.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8   |     await page.fill('input[type="password"]', 'testpass123');
  9   |     await page.click('button:has-text("Entrar")');
  10  |     await page.waitForURL('/dashboard');
  11  |   });
  12  | 
  13  |   test('should complete training plan and register XP', async ({ page }) => {
  14  |     // 1. Navigate to /treinos
  15  |     await page.goto('/treinos');
  16  |     await page.waitForLoadState('networkidle');
  17  | 
  18  |     // 2. Verify training plans are loaded
  19  |     const planCard = page.locator('text=/Meus Treinos/i');
  20  |     await expect(planCard).toBeVisible();
  21  | 
  22  |     // 3. Expand first plan
  23  |     const firstPlan = page.locator('button:has-text("Plano")').first();
  24  |     await firstPlan.click();
  25  |     await page.waitForTimeout(300); // Animation
  26  | 
  27  |     // 4. Open first exercise modal
  28  |     const exerciseBtn = page.locator('button').filter({ hasText: /Série/ }).first();
  29  |     await exerciseBtn.click();
  30  |     await expect(page.locator('role=dialog')).toBeVisible();
  31  | 
  32  |     // 5. Mark all sets as complete
  33  |     const setCheckboxes = page.locator('button').filter({ hasText: /Série \d+/ });
  34  |     const setCount = await setCheckboxes.count();
  35  | 
  36  |     for (let i = 0; i < setCount; i++) {
  37  |       await setCheckboxes.nth(i).click();
  38  |       await page.waitForTimeout(150); // Vibration + animation
  39  |     }
  40  | 
  41  |     // 6. Close modal
  42  |     await page.locator('button:has-text("X")').first().click();
  43  |     await page.waitForTimeout(300);
  44  | 
  45  |     // 7. Verify toast appears when plan completes (if last set completes all exercises)
  46  |     const toastMessage = page.locator('text=/🏆 Plano concluído/i');
  47  |     const isVisible = await toastMessage.isVisible().catch(() => false);
  48  | 
  49  |     if (isVisible) {
  50  |       // 8. Wait for XP log to be persisted
  51  |       await page.waitForTimeout(1000);
  52  | 
  53  |       // 9. Navigate to dashboard to verify XP appears
  54  |       await page.goto('/dashboard');
  55  |       await page.waitForLoadState('networkidle');
  56  | 
  57  |       // 10. Verify GamificationPanel is visible
  58  |       const xpBadge = page.locator('text=/XP/i').first();
  59  |       await expect(xpBadge).toBeVisible();
  60  | 
  61  |       // 11. Verify XP badge shows updated XP
  62  |       const xpValue = page.locator('text=/\\d+ XP/').first();
  63  |       const xpText = await xpValue.textContent();
  64  |       expect(xpText).toMatch(/\d+ XP/);
  65  | 
  66  |       // 12. Verify award cards are displayed
  67  |       const awardCards = page.locator('text=Bronze').or(page.locator('text=Prata'));
  68  |       await expect(awardCards.first()).toBeVisible();
  69  | 
  70  |       // 13. Verify XP history shows the new entry
  71  |       const xpHistory = page.locator('text=/Histórico de XP/i');
  72  |       await expect(xpHistory).toBeVisible();
  73  | 
  74  |       const historyEntry = page.locator('text=/Ação Social|Plano completado/i');
  75  |       await expect(historyEntry).toBeVisible();
  76  |     }
  77  |   });
  78  | 
  79  |   test('should display XP calculations correctly', async ({ page }) => {
  80  |     await page.goto('/dashboard');
  81  |     await page.waitForLoadState('networkidle');
  82  | 
  83  |     // Verify XP badge structure
  84  |     const xpBadge = page.locator('text=/Pontuação de XP/i');
  85  |     await expect(xpBadge).toBeVisible();
  86  | 
  87  |     // Verify level display
  88  |     const levelText = page.locator('text=/Nível \\d+/i');
  89  |     await expect(levelText).toBeVisible();
  90  | 
  91  |     // Verify progress bar exists
  92  |     const progressBar = page.locator('div').filter({ has: page.locator('div[style*="bg-gradient"]') }).first();
  93  |     await expect(progressBar).toBeVisible();
  94  |   });
  95  | 
  96  |   test('should display all award tiers', async ({ page }) => {
  97  |     await page.goto('/dashboard');
  98  |     await page.waitForLoadState('networkidle');
  99  | 
  100 |     const tiers = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Elite'];
  101 | 
  102 |     for (const tier of tiers) {
  103 |       const tierCard = page.locator(`text=${tier}`);
  104 |       await expect(tierCard).toBeVisible();
  105 |     }
  106 |   });
  107 | 
```