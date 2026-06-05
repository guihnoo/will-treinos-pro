/**
 * Gera PDF da apresentação comercial para o cliente.
 * Uso: pnpm exec tsx scripts/export-apresentacao-pdf.ts
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "docs", "product-guide", "WILL-TREINOS-PRO-APRESENTACAO-CLIENTE.html");
const pdfPath = path.join(root, "docs", "product-guide", "WILL-TREINOS-PRO-APRESENTACAO-CLIENTE.pdf");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });
  await browser.close();
  console.log("PDF gerado:", pdfPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
