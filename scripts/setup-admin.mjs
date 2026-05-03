#!/usr/bin/env node

/**
 * Setup Admin — Simples & Rápido
 * Insere admin em staff_access via Supabase REST API (sem dependências)
 *
 * Uso: node scripts/setup-admin.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ler .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const [key, ...valueParts] = trimmed.split("=");
  envVars[key] = valueParts.join("=");
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const devRootEmails = (envVars.NEXT_PUBLIC_DEV_ROOT_EMAILS || "").split(",");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local\n");
  process.exit(1);
}

const adminEmails = devRootEmails.filter((e) => e.trim()).map((e) => e.trim());

if (adminEmails.length === 0) {
  console.error("❌ Erro: NEXT_PUBLIC_DEV_ROOT_EMAILS não configurado em .env.local\n");
  process.exit(1);
}

console.log("🔐 Configurando Staff Access...\n");
console.log(`📍 Supabase: ${supabaseUrl}`);
console.log(`👥 Admins: ${adminEmails.join(", ")}\n`);

async function insertAdmins() {
  console.log("⏳ Conectando ao Supabase...\n");

  for (const email of adminEmails) {
    try {
      console.log(`📝 Inserindo: ${email}`);

      const response = await fetch(`${supabaseUrl}/rest/v1/staff_access`, {
        method: "POST",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          id: randomUUID(),
          email: email.toLowerCase(),
          role: "admin",
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se erro de constraint, pode ser que já existe — tenta UPDATE
        if (data.code === "23505") {
          // Unique constraint
          console.log(`   (Já existe — atualizando...)`);

          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/staff_access?email=eq.${encodeURIComponent(email.toLowerCase())}`,
            {
              method: "PATCH",
              headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ is_active: true }),
            }
          );

          if (updateResponse.ok) {
            console.log(`✅ ${email} (atualizado)\n`);
          } else {
            throw new Error(await updateResponse.text());
          }
        } else {
          throw new Error(data.message || JSON.stringify(data));
        }
      } else {
        console.log(`✅ ${email}\n`);
      }
    } catch (error) {
      console.error(`❌ Erro: ${error.message}\n`);
      process.exit(1);
    }
  }

  // Validação
  console.log("✔️  Validando...\n");

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/staff_access?email=in.(${adminEmails.map((e) => `"${e.toLowerCase()}"`).join(",")})`,
      {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const staff = await response.json();

    if (Array.isArray(staff) && staff.length === adminEmails.length) {
      console.log(`✅ Validação OK! ${staff.length} admin(s) ativo(s)\n`);
      console.log("─────────────────────────────────────");
      staff.forEach((s) => {
        console.log(`📧 ${s.email} (${s.role}) ${s.is_active ? "✓ ativo" : "✗ inativo"}`);
      });
      console.log("─────────────────────────────────────\n");
    } else {
      console.error(`⚠️  Aviso: Encontrou ${staff?.length || 0} admins (esperava ${adminEmails.length})`);
      console.error(`   Tente executar novamente após aplicar as migrações no Supabase Dashboard\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`⚠️  Aviso: Não conseguiu validar (tabela pode não existir ainda)`);
    console.error(`   Certifique-se que executou as migrações no Supabase Dashboard\n`);
    process.exit(1);
  }

  // Sucesso!
  console.log("🎉 Staff Access configurado!\n");
  console.log("📝 Próximos passos:\n");
  console.log("   1. Abra http://localhost:3000/login");
  console.log(`   2. Faça login com Google (${adminEmails[0]})`);
  console.log("   3. ✓ Deve ir para /dashboard (não /cadastro)");
  console.log("   4. Clique em 'Alunos' no menu");
  console.log("   5. ✓ Deve ver lista de alunos (ou vazia se nenhum cadastrado)\n");
  console.log("   6. Teste criar novo aluno em incógnito\n");

  process.exit(0);
}

insertAdmins().catch((error) => {
  console.error(`\n❌ Erro fatal: ${error.message}`);
  console.error(`\n⚠️  PRÓXIMAS AÇÕES:`);
  console.error(`   1. Certifique-se que aplicou as migrações no Supabase Dashboard`);
  console.error(`      → https://app.supabase.com → SQL Editor`);
  console.error(`      → Cole supabase/MIGRATIONS_COMBINED.sql → RUN`);
  console.error(`   2. Espere a execução terminar (20-30 segundos)`);
  console.error(`   3. Execute novamente: node scripts/setup-admin.mjs\n`);
  process.exit(1);
});
