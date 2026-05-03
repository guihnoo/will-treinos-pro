#!/usr/bin/env node

/**
 * Script para preparar migrações
 * Concatena todos os SQLs em um arquivo único para copiar & colar no Supabase Dashboard
 * OU cria um script que instala a CLI e aplica
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  return files.sort();
}

function readMigration(filename) {
  const filepath = path.join(__dirname, "..", "supabase", "migrations", filename);
  return fs.readFileSync(filepath, "utf-8");
}

function main() {
  const files = getMigrationFiles();
  console.log(`📂 Encontradas ${files.length} migrações\n`);

  // Concatenar todos os SQLs
  let concatenated = "-- ═══════════════════════════════════════════════════════\n";
  concatenated += "-- Will Treinos PRO — Todas as Migrações (concatenadas)\n";
  concatenated += "-- Copie & cole no Supabase Dashboard → SQL Editor\n";
  concatenated += "-- Data: " + new Date().toLocaleString("pt-BR") + "\n";
  concatenated += "-- ═══════════════════════════════════════════════════════\n\n";

  files.forEach((file, i) => {
    concatenated += `\n-- ─────────────────────────────────────────────────────\n`;
    concatenated += `-- [${i + 1}/${files.length}] ${file}\n`;
    concatenated += `-- ─────────────────────────────────────────────────────\n\n`;
    concatenated += readMigration(file);
    concatenated += "\n\n";
  });

  // Salvar em arquivo
  const outputPath = path.join(__dirname, "..", "supabase", "MIGRATIONS_COMBINED.sql");
  fs.writeFileSync(outputPath, concatenated);

  console.log(`✅ Arquivo gerado: supabase/MIGRATIONS_COMBINED.sql\n`);
  console.log(`📋 Como usar:\n`);
  console.log(`   1. Abra o arquivo supabase/MIGRATIONS_COMBINED.sql`);
  console.log(`   2. Copie TODO o conteúdo (Ctrl+A → Ctrl+C)`);
  console.log(`   3. Abra https://app.supabase.com → seu projeto → SQL Editor`);
  console.log(`   4. Cole no SQL Editor (Ctrl+V)`);
  console.log(`   5. Clique "RUN" ou pressione Cmd+Enter\n`);
  console.log(`   6. Espere a execução terminar (20-30 segundos)\n`);
  console.log(`   7. Run o script: node scripts/insert-admin.js\n`);
}

main();
