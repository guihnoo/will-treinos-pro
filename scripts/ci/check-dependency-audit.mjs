#!/usr/bin/env node
// Gate de Dependency Audit — Sprint 0D-B.1
//
// Lê o JSON de `pnpm audit --json` (schema estilo npm-audit-v1: advisories
// indexadas por id numérico, cada uma com severity/module_name/
// github_advisory_id/findings[].paths[]) e aplica um gate real:
//
//   A) Qualquer CRITICAL -> FAIL sempre.
//   B) HIGH só passa se: o GHSA está na allowlist, o pacote bate, e TODOS os
//      caminhos de dependência daquele advisory entram pela árvore
//      @ducanh2912/next-pwa (allowlist.required_path_prefix). Um HIGH não
//      listado, ou um HIGH allowlisted que apareça por fora dessa árvore,
//      derruba o gate.
//   C) moderate/low: apenas reportado, nunca bloqueia nesta fase.
//
// Não imprime nada além de severidade/pacote/GHSA/caminho de dependência —
// dados públicos do advisory, sem segredos.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function pathEntersAllowedTree(path, requiredPrefix) {
  // path tem o formato ".>pkgA>pkgB>...>pkgN" (raiz do projeto é ".").
  const segments = path.split(">");
  return segments.length >= 2 && segments[1] === requiredPrefix;
}

/**
 * @param {object} auditJson  saída de `pnpm audit --json`
 * @param {object} allowlist  conteúdo de security/dependency-audit-allowlist.json
 * @returns {{ ok: boolean, summary: object, failures: object[], allowed: object[], reported: object[] }}
 */
export function evaluateAudit(auditJson, allowlist) {
  const advisories = Object.values(auditJson.advisories ?? {});
  const requiredPrefix = allowlist.required_path_prefix;
  const allowMap = new Map(
    (allowlist.entries ?? []).map((e) => [`${e.ghsa}::${e.package}`, e])
  );

  const failures = [];
  const allowed = [];
  const reported = [];

  for (const advisory of advisories) {
    const severity = advisory.severity;
    const ghsa = advisory.github_advisory_id ?? null;
    const pkg = advisory.module_name ?? null;
    const paths = (advisory.findings ?? []).flatMap((f) => f.paths ?? []);

    const record = { severity, package: pkg, ghsa, paths };

    if (severity === "critical") {
      failures.push({ ...record, cause: "critical" });
      continue;
    }

    if (severity === "high") {
      const key = `${ghsa}::${pkg}`;
      const allowEntry = allowMap.get(key);

      if (!allowEntry) {
        failures.push({ ...record, cause: "high-not-allowlisted" });
        continue;
      }

      const allPathsInTree = paths.length > 0 && paths.every((p) => pathEntersAllowedTree(p, requiredPrefix));
      if (!allPathsInTree) {
        failures.push({ ...record, cause: "allowlisted-but-outside-tree", requiredPrefix });
        continue;
      }

      allowed.push(record);
      continue;
    }

    // moderate/low/info — apenas reportado.
    reported.push(record);
  }

  const summary = {
    critical: advisories.filter((a) => a.severity === "critical").length,
    high: advisories.filter((a) => a.severity === "high").length,
    highAllowed: allowed.length,
    highFailed: failures.filter((f) => f.severity === "high").length,
    moderate: advisories.filter((a) => a.severity === "moderate").length,
    low: advisories.filter((a) => a.severity === "low").length,
  };

  return { ok: failures.length === 0, summary, failures, allowed, reported };
}

function printReport(result) {
  const { summary, failures, allowed, reported } = result;

  console.log("=== Dependency Audit Gate ===");
  console.log(
    `critical=${summary.critical} high=${summary.high} (allowed=${summary.highAllowed} failed=${summary.highFailed}) moderate=${summary.moderate} low=${summary.low}`
  );

  if (allowed.length > 0) {
    console.log("\n-- HIGH tolerados (baseline legacy next-pwa/workbox) --");
    for (const a of allowed) {
      console.log(`  [ALLOWED] ${a.package} ${a.ghsa}`);
      for (const p of a.paths) console.log(`      path: ${p}`);
    }
  }

  if (reported.length > 0) {
    console.log("\n-- moderate/low (reportado, não bloqueia) --");
    for (const r of reported) {
      console.log(`  [INFO] ${r.severity} ${r.package} ${r.ghsa ?? "(sem GHSA)"}`);
    }
  }

  if (failures.length > 0) {
    console.log("\n-- FALHAS --");
    for (const f of failures) {
      console.log(`  [FAIL:${f.cause}] severity=${f.severity} package=${f.package} ghsa=${f.ghsa ?? "(sem GHSA)"}`);
      for (const p of f.paths) console.log(`      path: ${p}`);
    }
  }

  console.log(`\nResultado: ${result.ok ? "PASS" : "FAIL"}`);
}

function main() {
  const auditPath = process.argv[2];
  const allowlistPath = process.argv[3] ?? "security/dependency-audit-allowlist.json";

  if (!auditPath) {
    console.error("Uso: node scripts/ci/check-dependency-audit.mjs <audit.json> [allowlist.json]");
    process.exit(2);
  }

  const auditJson = JSON.parse(readFileSync(auditPath, "utf8"));
  const allowlist = JSON.parse(readFileSync(allowlistPath, "utf8"));

  const result = evaluateAudit(auditJson, allowlist);
  printReport(result);

  process.exit(result.ok ? 0 : 1);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
