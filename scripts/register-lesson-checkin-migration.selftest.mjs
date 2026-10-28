#!/usr/bin/env node
// Self-test estrutural de
// supabase/migrations/20260916010000_register_lesson_checkin_rpc.sql —
// sem framework novo, sem conexão com banco (a migration não foi aplicada
// remotamente). Lê o SQL como texto e confirma, por inspeção estática, o
// hardening de acesso pedido na revisão do PR #17:
//   - a função fixa search_path (evita sequestro via search_path da sessão)
//   - EXECUTE é revogado de PUBLIC, anon e authenticated
//   - EXECUTE é concedido só a service_role
//   - a função continua SECURITY INVOKER (não DEFINER) — só é segura por
//     ser chamada com a service role, que já ignora RLS; virar DEFINER
//     ampliaria a superfície de escalonamento sem necessidade.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MIGRATION_PATH = new URL(
  "../supabase/migrations/20260916010000_register_lesson_checkin_rpc.sql",
  import.meta.url,
);
const sql = readFileSync(MIGRATION_PATH, "utf8");
// Remove comentários de linha (`-- ...`) antes de checar — o arquivo tem
// comentários explicando POR QUE a função não é SECURITY DEFINER, e essas
// linhas de comentário contêm literalmente a string "SECURITY DEFINER".
const withoutComments = sql
  .split("\n")
  .map((line) => line.replace(/--.*$/, ""))
  .join("\n");
// Comparação case-insensitive — SQL não é case-sensitive para keywords.
const lower = withoutComments.toLowerCase();

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok - ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL - ${name}: ${err.message}`);
    failed++;
  }
}

console.log("=== Self-test estrutural: register_lesson_checkin_rpc.sql ===\n");

check("função continua SECURITY INVOKER (sem SECURITY DEFINER)", () => {
  assert.doesNotMatch(lower, /security\s+definer/, "não deve haver SECURITY DEFINER nesta função");
});

check("função fixa set search_path = public", () => {
  assert.match(lower, /set\s+search_path\s*=\s*public/, "esperava 'set search_path = public' na definição da função");
});

check("EXECUTE é revogado de PUBLIC", () => {
  assert.match(
    lower,
    /revoke\s+execute\s+on\s+function\s+public\.register_lesson_checkin\([^)]*\)\s+from\s+public/,
    "esperava REVOKE EXECUTE ... FROM public",
  );
});

check("EXECUTE é revogado de anon", () => {
  assert.match(
    lower,
    /revoke\s+execute\s+on\s+function\s+public\.register_lesson_checkin\([^)]*\)\s+from\s+anon/,
    "esperava REVOKE EXECUTE ... FROM anon",
  );
});

check("EXECUTE é revogado de authenticated", () => {
  assert.match(
    lower,
    /revoke\s+execute\s+on\s+function\s+public\.register_lesson_checkin\([^)]*\)\s+from\s+authenticated/,
    "esperava REVOKE EXECUTE ... FROM authenticated",
  );
});

check("EXECUTE é concedido a service_role", () => {
  assert.match(
    lower,
    /grant\s+execute\s+on\s+function\s+public\.register_lesson_checkin\([^)]*\)\s+to\s+service_role/,
    "esperava GRANT EXECUTE ... TO service_role",
  );
});

check("REVOKEs vêm antes do GRANT (ordem defensiva: fecha tudo, depois abre só o necessário)", () => {
  const revokeAnonIdx = lower.indexOf("revoke execute on function public.register_lesson_checkin");
  const grantIdx = lower.lastIndexOf("grant execute on function public.register_lesson_checkin");
  assert.ok(revokeAnonIdx !== -1 && grantIdx !== -1, "não encontrei REVOKE e/ou GRANT no arquivo");
  assert.ok(revokeAnonIdx < grantIdx, "esperava que os REVOKEs apareçam antes do GRANT no arquivo");
});

console.log(`\n${passed} ok, ${failed} falhas`);

if (failed > 0) {
  process.exit(1);
}
