#!/usr/bin/env node
// Self-tests do gate de Dependency Audit (scripts/ci/check-dependency-audit.mjs).
// Sem frameworks de teste novos — só node + assert nativo, fixtures em
// scripts/ci/fixtures/ (nenhum secret real, apenas metadados públicos de
// advisories reais ou fabricados de forma óbvia para o teste).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { evaluateAudit } from "./check-dependency-audit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(__dirname, relPath), "utf8"));
}

const allowlist = loadJson("../../security/dependency-audit-allowlist.json");

function loadFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok - ${name}`);
    passed++;
  } else {
    console.error(`  FAIL - ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

console.log("=== Self-tests: check-dependency-audit ===\n");

// Caso 1 — audit atual (snapshot real trimmed): PASS, 0 critical, highs só
// allowlisted sob next-pwa.
{
  const audit = loadFixture("case1-pass-current.json");
  const result = evaluateAudit(audit, allowlist);
  console.log("Caso 1 — audit atual (snapshot real)");
  check("resultado ok=true", result.ok === true, `failures=${JSON.stringify(result.failures)}`);
  check("0 critical", result.summary.critical === 0);
  check("nenhum high falhou", result.summary.highFailed === 0, JSON.stringify(result.failures));
  check("highs allowlisted > 0", result.summary.highAllowed > 0);
}

// Caso 2 — critical sintético: FAIL sempre, mesmo com path dentro de next-pwa.
{
  const audit = loadFixture("case2-critical.json");
  const result = evaluateAudit(audit, allowlist);
  console.log("\nCaso 2 — critical sintético");
  check("resultado ok=false", result.ok === false);
  check("causa = critical", result.failures.some((f) => f.cause === "critical"));
}

// Caso 3 — high sintético fora de next-pwa, não allowlisted: FAIL.
{
  const audit = loadFixture("case3-high-outside-next-pwa.json");
  const result = evaluateAudit(audit, allowlist);
  console.log("\nCaso 3 — high fora de next-pwa (não allowlisted)");
  check("resultado ok=false", result.ok === false);
  check("causa = high-not-allowlisted", result.failures.some((f) => f.cause === "high-not-allowlisted"));
}

// Caso 4 — high novo DENTRO de next-pwa mas não allowlisted: FAIL.
{
  const audit = loadFixture("case4-new-high-in-next-pwa-not-allowlisted.json");
  const result = evaluateAudit(audit, allowlist);
  console.log("\nCaso 4 — high novo dentro de next-pwa, não allowlisted");
  check("resultado ok=false", result.ok === false);
  check("causa = high-not-allowlisted", result.failures.some((f) => f.cause === "high-not-allowlisted"));
}

// Caso 5 — advisory allowlisted aparecendo fora da árvore next-pwa: FAIL.
{
  const audit = loadFixture("case5-allowlisted-outside-tree.json");
  const result = evaluateAudit(audit, allowlist);
  console.log("\nCaso 5 — advisory allowlisted fora da árvore next-pwa");
  check("resultado ok=false", result.ok === false);
  check(
    "causa = allowlisted-but-outside-tree",
    result.failures.some((f) => f.cause === "allowlisted-but-outside-tree")
  );
}

console.log(`\n${passed} ok, ${failed} falhas`);

try {
  assert.equal(failed, 0);
} catch {
  process.exit(1);
}
