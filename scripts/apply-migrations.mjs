/**
 * apply-migrations.mjs
 * Aplica todas as migrations Supabase via REST API (service role key).
 * Uso: node scripts/apply-migrations.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados.");
  console.error("    Certifique-se de rodar: node --env-file=.env.local scripts/apply-migrations.mjs");
  process.exit(1);
}

// Project ref extraído da URL
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

// Endpoint direto de execução de SQL (Management API via service role)
const SQL_ENDPOINT = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

async function runSQL(sql, label) {
  // Tenta via RPC exec_sql primeiro
  const res = await fetch(SQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "apikey": SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  });

  if (res.ok) return { ok: true };

  // Se exec_sql não existe, usa a Supabase Management API
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const mgmtRes = await fetch(mgmtUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!mgmtRes.ok) {
    const body = await mgmtRes.text();
    return { ok: false, error: body };
  }

  return { ok: true };
}

async function main() {
  const migrationsDir = resolve("supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`\n🚀  Aplicando ${files.length} migrations em ${SUPABASE_URL}\n`);

  let applied = 0;
  let failed = 0;

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8").trim();
    if (!sql) continue;

    process.stdout.write(`  → ${file} ... `);

    const result = await runSQL(sql, file);
    if (result.ok) {
      console.log("✅");
      applied++;
    } else {
      console.log(`❌  ${result.error?.slice(0, 120)}`);
      failed++;
    }
  }

  console.log(`\n📊  Resultado: ${applied} ok · ${failed} com erro\n`);

  if (failed > 0) {
    console.log("ℹ️   Erros esperados: migration já aplicada (duplicate table/column) — não é problema.");
    console.log("    Erros inesperados: verifique o SQL Editor do Supabase.\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
