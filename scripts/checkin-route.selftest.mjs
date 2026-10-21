#!/usr/bin/env node
// Self-test estrutural de src/app/api/checkin/route.ts — sem framework novo.
//
// Não há Supabase real neste ambiente para testar o INSERT de fato, então
// esta validação lê o código-fonte e garante, por inspeção estática, que:
//   - xp_log.student_id recebe user.id (auth user id) — nunca student.id
//     (CRM id). xp_log.student_id é FK para students(auth_user_id), ver
//     supabase/migrations/20260505150000_xp_log.sql.
//   - a RPC de presença (register_lesson_checkin) continua recebendo
//     student.id (CRM id) — é o formato usado em
//     lessons.enrolled_students/present_students.
// Isso não substitui um teste de integração real, mas impede a regressão
// específica corrigida nesta PR (misturar os dois identificadores) de
// voltar silenciosamente.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROUTE_PATH = new URL("../src/app/api/checkin/route.ts", import.meta.url);
const source = readFileSync(ROUTE_PATH, "utf8");

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

console.log("=== Self-test estrutural: src/app/api/checkin/route.ts ===\n");

// Isola o bloco do insert em xp_log para não confundir com outros usos de
// "student.id"/"user.id" no arquivo (ex.: a RPC de presença).
const xpInsertMatch = source.match(/\.from\("xp_log"\)\.insert\(\{[\s\S]*?\}\);/);

check("bloco de insert em xp_log existe no arquivo", () => {
  assert.ok(xpInsertMatch, "não encontrei .from(\"xp_log\").insert({ ... }) no arquivo");
});

check("xp_log.student_id usa user.id (auth user id), não student.id", () => {
  const block = xpInsertMatch[0];
  assert.match(block, /student_id:\s*user\.id\b/, "esperava 'student_id: user.id' dentro do insert de xp_log");
  assert.doesNotMatch(
    block,
    /student_id:\s*student\.id\b/,
    "encontrei 'student_id: student.id' dentro do insert de xp_log — isso é o CRM id, xp_log.student_id é FK para students(auth_user_id)",
  );
});

// Isola a chamada da RPC de presença.
const rpcMatch = source.match(/\.rpc\("register_lesson_checkin",\s*\{[\s\S]*?\}\)/);

check("chamada da RPC register_lesson_checkin existe no arquivo", () => {
  assert.ok(rpcMatch, "não encontrei .rpc(\"register_lesson_checkin\", { ... }) no arquivo");
});

check("RPC de presença (register_lesson_checkin) continua usando student.id (CRM id)", () => {
  const block = rpcMatch[0];
  assert.match(
    block,
    /p_student_id:\s*student\.id\b/,
    "esperava 'p_student_id: student.id' na chamada da RPC — presença usa o CRM id, não o auth user id",
  );
});

console.log(`\n${passed} ok, ${failed} falhas`);

if (failed > 0) {
  process.exit(1);
}
