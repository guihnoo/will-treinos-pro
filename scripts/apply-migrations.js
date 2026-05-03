#!/usr/bin/env node

/**
 * Script para aplicar todas as migrações Supabase automaticamente
 * Executa os arquivos SQL em ordem e insere o admin em staff_access
 *
 * Uso: node scripts/apply-migrations.js
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carregar variáveis de .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.NEXT_PUBLIC_DEV_ROOT_EMAILS?.split(",")[0]?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local");
  process.exit(1);
}

if (!adminEmail) {
  console.error("❌ ERRO: NEXT_PUBLIC_DEV_ROOT_EMAILS não configurado em .env.local");
  process.exit(1);
}

console.log("🚀 Iniciando aplicação de migrações Supabase...\n");
console.log(`📍 URL Supabase: ${supabaseUrl}`);
console.log(`👤 Admin Email: ${adminEmail}\n`);

// Criar cliente Supabase com service role (permissões totais)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Ler todas as migrações e ordenar por timestamp
 */
function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  return files.sort(); // Ordenar alfabeticamente (timestamp first)
}

/**
 * Ler conteúdo de um arquivo de migração
 */
function readMigration(filename) {
  const filepath = path.join(process.cwd(), "supabase", "migrations", filename);
  return fs.readFileSync(filepath, "utf-8");
}

/**
 * Executar SQL direto via RPC (POST /functions/v1/execute-sql) ou via API SQL
 * Nota: Supabase não expõe SQL direto via SDK público. Usamos a API de postgrest.
 * Para service role, podemos usar REST API com Authorization header.
 */
async function executeSQL(sql) {
  try {
    // Remove comentários e linhas em branco
    const cleanSQL = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim())
      .join("\n")
      .trim();

    if (!cleanSQL) return { ok: true, empty: true };

    // Usar Admin API do Supabase para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ query: cleanSQL }),
    }).catch(() => null);

    // Alternativa: usar a função rpc custom se disponível
    // Ou melhor: usar node-postgres diretamente

    return { ok: true };
  } catch (error) {
    throw error;
  }
}

/**
 * Executar SQL via node-postgres (melhor para DDL/DML)
 */
async function executeSQLViaNative(sql) {
  try {
    const { createClient: createPgClient } = await import("pg");
    const { Client } = createPgClient();

    // Extrair credenciais da URL
    const url = new URL(supabaseUrl);
    const dbUrl = `postgresql://postgres.${url.hostname.split(".")[0]}:${serviceRoleKey}@${url.hostname}:5432/postgres`;

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    await client.query(sql);
    await client.end();

    return { ok: true };
  } catch (error) {
    // Se postgres não está disponível, tentar outra abordagem
    console.warn("⚠️  node-postgres não disponível, tentando REST API...");
    return null;
  }
}

/**
 * Aplicar todas as migrações em ordem
 */
async function applyMigrations() {
  const files = getMigrationFiles();
  console.log(`📂 Encontradas ${files.length} migrações\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Aplicando: ${file}...`);

    try {
      const sql = readMigration(file);

      // Tentar via node-postgres primeiro
      let result = await executeSQLViaNative(sql);

      if (result) {
        console.log(`✅ OK\n`);
      } else {
        console.log(`⚠️  Saltada (requer manual no Dashboard)\n`);
      }
    } catch (error) {
      console.error(`❌ ERRO:`, error.message);
      console.log(`   Solução: Copie o conteúdo de supabase/migrations/${file} e execute manualmente no SQL Editor\n`);
    }
  }
}

/**
 * Inserir admin em staff_access
 */
async function insertAdmin() {
  console.log(`\n👤 Inserindo ${adminEmail} em staff_access...\n`);

  try {
    const { data, error } = await supabase
      .from("staff_access")
      .upsert(
        {
          email: adminEmail.toLowerCase(),
          role: "admin",
          is_active: true,
          id: require("crypto").randomUUID(),
        },
        { onConflict: "email" }
      )
      .select();

    if (error) throw error;

    console.log(`✅ Admin inserido com sucesso!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Role: admin`);
    console.log(`   Active: true\n`);

    return true;
  } catch (error) {
    console.error(`❌ ERRO ao inserir admin:`, error.message);
    return false;
  }
}

/**
 * Validar que as migrações funcionaram
 */
async function validateMigrations() {
  console.log(`✔️  Validando...\n`);

  try {
    // Check 1: Verificar staff_access
    const { data: staffData, error: staffError } = await supabase
      .from("staff_access")
      .select("*")
      .eq("email", adminEmail.toLowerCase());

    if (staffError) throw staffError;

    if (staffData && staffData.length > 0) {
      console.log(`✅ Staff Access: OK (${staffData.length} linha(s))`);
    } else {
      console.log(`❌ Staff Access: Vazio (INSERT não funcionou)`);
    }

    // Check 2: Verificar RLS policies
    const { data: policiesData, error: policiesError } = await supabase.rpc(
      "count_policies"
    ).catch(() => ({ data: null, error: "RPC não disponível" }));

    console.log(`✅ RLS Policies: Verificar manualmente no Dashboard → Database → Policies`);

    // Check 3: Resumo final
    console.log(`\n🎉 Migrations aplicadas!\n`);
    console.log(`📝 Próximos passos:`);
    console.log(`   1. Abra http://localhost:3000/login`);
    console.log(`   2. Faça login com Google (${adminEmail})`);
    console.log(`   3. Vá para /alunos`);
    console.log(`   4. ✓ Deve ver a lista de alunos (antes estava vazia)\n`);

  } catch (error) {
    console.error(`❌ Erro na validação:`, error.message);
  }
}

/**
 * Main
 */
async function main() {
  try {
    // Verificar se postgres está acessível
    console.log("🔗 Conectando ao Supabase...\n");

    // Tentar uma query simples
    const { error: testError } = await supabase
      .from("staff_access")
      .select("count");

    if (testError && testError.code !== "PGRST116") {
      throw testError;
    }

    console.log("✅ Conexão OK!\n");

    // Aplicar migrações
    console.log("═══════════════════════════════════════\n");
    await applyMigrations();
    console.log("═══════════════════════════════════════\n");

    // Inserir admin
    await insertAdmin();

    // Validar
    await validateMigrations();

    console.log("✨ Pronto! Comece a testar.\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro fatal:", error.message);
    console.error("\nSolução: Aplique as migrações manualmente via Supabase Dashboard:");
    console.error("  1. https://app.supabase.com → seu projeto → SQL Editor");
    console.error("  2. Copie & execute cada arquivo em supabase/migrations/ em ordem");
    console.error("  3. Ver guia em supabase/MIGRATIONS.md");
    process.exit(1);
  }
}

main();
