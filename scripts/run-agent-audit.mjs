import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();

// Cores ANSI para saída no terminal
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  gold: "\x1b[38;2;234;179;8m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  zinc: "\x1b[90m",
  white: "\x1b[97m",
};

console.log(`\n${c.gold}${c.bold}================================================================${c.reset}`);
console.log(`${c.gold}${c.bold}   🏐 WILL TREINOS PRO — RELATÓRIO DO FISCAL DE ARQUITETURA     ${c.reset}`);
console.log(`${c.gold}${c.bold}================================================================${c.reset}\n`);

// 1. Análise de God Components
function analyzeComponent(filePath) {
  if (!fs.existsSync(filePath)) {
    return { lines: 0, useStates: 0, exists: false };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").length;
  const useStates = (content.match(/useState\s*(<[^>]+>)?\s*\(/g) || []).length;
  return { lines, useStates, exists: true };
}

const cockpitPath = path.join(rootDir, "src/components/will/WillCockpit.tsx");
const studentHomePath = path.join(rootDir, "src/components/StudentHome.tsx");

const cockpitStats = analyzeComponent(cockpitPath);
const studentHomeStats = analyzeComponent(studentHomePath);

// 2. Análise do CockpitModalHost
const modalHostPath = path.join(rootDir, "src/components/will/CockpitModalHost.tsx");
let registeredModalsCount = 0;
if (fs.existsSync(modalHostPath)) {
  const hostContent = fs.readFileSync(modalHostPath, "utf-8");
  // Contar dynamic imports
  const dynamicImports = (hostContent.match(/dynamic\s*\(\s*\(\)\s*=>\s*import/g) || []).length;
  // Ou contar casos do switch
  const caseMatches = (hostContent.match(/case\s+"[^"]+":/g) || []).length;
  registeredModalsCount = Math.max(dynamicImports, caseMatches);
}

// 3. Verificação do AuthWrapper
const authWrapperPath = path.join(rootDir, "src/components/AuthWrapper.tsx");
let authRoutesCheck = { termos: false, privacidade: false, offline: false };
if (fs.existsSync(authWrapperPath)) {
  const authContent = fs.readFileSync(authWrapperPath, "utf-8");
  authRoutesCheck.termos = authContent.includes('"/termos"');
  authRoutesCheck.privacidade = authContent.includes('"/privacidade"');
  authRoutesCheck.offline = authContent.includes('"/offline.html"');
}

// 4. Execução do TypeScript Gatekeeper
console.log(`${c.cyan}⏳ Executando validação de tipos (pnpm exec tsc --noEmit)...${c.reset}`);
let tscSuccess = false;
let tscErrorMsg = "";
try {
  execSync("pnpm exec tsc --noEmit", { stdio: "pipe", cwd: rootDir });
  tscSuccess = true;
} catch (err) {
  tscSuccess = false;
  tscErrorMsg = err.stdout?.toString() || err.stderr?.toString() || err.message;
}

// Exibição da Tabela de Métricas
console.log(`\n${c.bold}📊 MÉTRICAS DE COMPONENTES E DESACOPLAMENTO:${c.reset}`);
console.log("┌───────────────────────────────────┬──────────────┬───────────────┐");
console.log("│ Componente                        │ Linhas       │ useStates     │");
console.log("├───────────────────────────────────┼──────────────┼───────────────┤");
console.log(`│ WillCockpit.tsx                   │ ${cockpitStats.lines.toString().padEnd(12)} │ ${cockpitStats.useStates.toString().padEnd(13)} │`);
console.log(`│ StudentHome.tsx                   │ ${studentHomeStats.lines.toString().padEnd(12)} │ ${studentHomeStats.useStates.toString().padEnd(13)} │`);
console.log("└───────────────────────────────────┴──────────────┴───────────────┘");

console.log(`\n${c.bold}📦 CENTRAL DE MODAIS DESACOPLADA (CockpitModalHost.tsx):${c.reset}`);
console.log(`  • Modais sob demanda registrados: ${c.gold}${c.bold}${registeredModalsCount}${c.reset}`);

console.log(`\n${c.bold}🛡️ SEGURANÇA E ROTAS PÚBLICAS (AuthWrapper.tsx):${c.reset}`);
const checkMark = (ok) => ok ? `${c.green}✅ Presente${c.reset}` : `${c.red}❌ Faltando${c.reset}`;
console.log(`  • /termos:       ${checkMark(authRoutesCheck.termos)}`);
console.log(`  • /privacidade:  ${checkMark(authRoutesCheck.privacidade)}`);
console.log(`  • /offline.html: ${checkMark(authRoutesCheck.offline)}`);

console.log(`\n${c.bold}🚦 GATEKEEPER DE QUALIDADE (TypeScript Compiler):${c.reset}`);
if (tscSuccess) {
  console.log(`  ${c.green}${c.bold}✅ 0 ERROS — Compilação estrita aprovada com sucesso!${c.reset}\n`);
} else {
  console.log(`  ${c.red}${c.bold}❌ FALHA NA COMPILAÇÃO — Erros detectados:${c.reset}`);
  console.log(tscErrorMsg.slice(0, 500) + "\n");
}

if (!tscSuccess || !authRoutesCheck.termos || !authRoutesCheck.privacidade || !authRoutesCheck.offline) {
  process.exit(1);
} else {
  process.exit(0);
}
