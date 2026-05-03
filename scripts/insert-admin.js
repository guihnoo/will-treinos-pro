#!/usr/bin/env node

/**
 * Inserir admin em staff_access após migrações serem aplicadas
 * Usa Supabase SDK (seguro, rápido)
 *
 * Uso: node scripts/insert-admin.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

// Carregar .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const devEmails = process.env.NEXT_PUBLIC_DEV_ROOT_EMAILS || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local\n");
  process.exit(1);
}

if (!devEmails) {
  console.error("❌ ERRO: NEXT_PUBLIC_DEV_ROOT_EMAILS não configurado em .env.local\n");
  process.exit(1);
}

const adminEmails = devEmails.split(",").map((e) => e.trim());

console.log("🔐 Configurando staff_access...\n");
console.log(`📍 Supabase: ${supabaseUrl}`);
console.log(`👥 Emails a inserir: ${adminEmails.join(", ")}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function insertAdmins() {
  console.log("⏳ Conectando ao Supabase...\n");

  try {
    // Testar conexão
    const { error: testError } = await supabase
      .from("staff_access")
      .select("id")
      .limit(1);

    if (testError && testError.code !== "PGRST116") {
      throw new Error(`Erro ao conectar: ${testError.message}`);
    }

    console.log("✅ Conexão OK!\n");

    // Inserir cada admin
    console.log("📝 Inserindo admins...\n");

    for (const email of adminEmails) {
      try {
        const { data, error } = await supabase
          .from("staff_access")
          .upsert(
            {
              id: randomUUID(),
              email: email.toLowerCase(),
              role: "admin",
              is_active: true,
            },
            { onConflict: "email" }
          )
          .select();

        if (error) throw error;

        console.log(`✅ ${email}`);
        console.log(`   ID: ${data?.[0]?.id || "unknown"}`);
        console.log(`   Role: admin`);
        console.log(`   Active: true\n`);
      } catch (error) {
        console.error(`❌ Erro ao inserir ${email}:`);
        console.error(`   ${error.message}\n`);
      }
    }

    // Validar
    console.log("✔️  Validando...\n");

    const { data: staffData, error: staffError } = await supabase
      .from("staff_access")
      .select("email, role, is_active")
      .in("email", adminEmails.map((e) => e.toLowerCase()));

    if (staffError) throw staffError;

    if (staffData && staffData.length === adminEmails.length) {
      console.log(`✅ Validação OK! ${staffData.length} admin(s) inserido(s)\n`);
      console.log("─────────────────────────────────────");
      staffData.forEach((s) => {
        console.log(`📧 ${s.email} (${s.role}) ${s.is_active ? "✓ ativo" : "✗ inativo"}`);
      });
      console.log("─────────────────────────────────────\n");
    } else {
      console.error(`❌ Validação falhou: esperava ${adminEmails.length} admins, encontrou ${staffData?.length || 0}\n`);
      process.exit(1);
    }

    // Instrucções finais
    console.log("🎉 Staff Access configurado!\n");
    console.log("📝 Próximos passos:\n");
    console.log("   1. Abra http://localhost:3000/login");
    console.log(`   2. Faça login com Google (${adminEmails[0]})`);
    console.log("   3. Você deve ir para /dashboard (não /cadastro)");
    console.log("   4. Clique em 'Alunos' no menu");
    console.log("   5. ✓ Deve ver lista de alunos (antes estava vazia!)\n");
    console.log("   6. Clique no sino (notificações)");
    console.log("   7. Teste cadastrando um novo aluno em incógnito\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro fatal:", error.message);
    console.error("\nSolução: Verifique que as migrações foram aplicadas");
    console.error("  1. Abra https://app.supabase.com → seu projeto");
    console.error("  2. Vá em SQL Editor → Verifique se há tabela 'staff_access'");
    console.error("  3. Se não existir, aplicar primeiro: supabase/MIGRATIONS_COMBINED.sql\n");
    process.exit(1);
  }
}

insertAdmins();
