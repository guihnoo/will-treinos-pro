const { chromium } = require('./node_modules/playwright');

const BASE = 'http://localhost:3000';

const PAGES = [
  { path: '/',               name: 'Landing' },
  { path: '/login',          name: 'Login' },
  { path: '/cadastro',       name: 'Cadastro' },
  { path: '/signup',         name: 'Signup' },
  { path: '/dashboard',      name: 'Dashboard' },
  { path: '/feed',           name: 'Feed' },
  { path: '/ranking',        name: 'Ranking' },
  { path: '/perfil',         name: 'Perfil' },
  { path: '/configuracoes',  name: 'Configurações' },
  { path: '/financeiro',     name: 'Financeiro' },
  { path: '/treinos',        name: 'Treinos' },
  { path: '/privacidade',    name: 'Privacidade' },
  { path: '/termos',         name: 'Termos' },
  { path: '/aguardando',     name: 'Aguardando' },
  { path: '/will/status',    name: 'Will Status' },
  { path: '/will/court',     name: 'Will Court' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });

  for (const page_def of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    const consoleErrors = [];
    
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    
    try {
      const res = await page.goto(BASE + page_def.path, { timeout: 15000, waitUntil: 'networkidle' });
      const status = res ? res.status() : '?';
      const url = page.url();
      const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
      
      const hasAppError = bodyText.includes('Application error') || 
                          bodyText.includes('Internal Server Error') ||
                          bodyText.toLowerCase().includes('unhandled') ||
                          errors.length > 0;
      
      const redirected = url !== BASE + page_def.path ? ` → ${url.replace(BASE,'')}` : '';
      const icon = hasAppError ? '❌' : (status === 200 ? '✅' : '⚠️');
      
      console.log(`${icon} [${status}] ${page_def.name} (${page_def.path})${redirected}`);
      if (errors.length) console.log(`   ⛔ PAGE ERR: ${errors[0].slice(0,150)}`);
      if (consoleErrors.length) console.log(`   🔴 CONSOLE: ${consoleErrors[0].slice(0,150)}`);
      if (hasAppError && !errors.length) console.log(`   BODY: ${bodyText.slice(0,200)}`);
    } catch (e) {
      console.log(`❌ CRASH: ${page_def.name} (${page_def.path}) — ${e.message.slice(0,120)}`);
    }
    await page.close();
  }
  
  await browser.close();
})();
