#!/usr/bin/env node
// Self-test do helper de token assinado de check-in QR
// (src/lib/qrCheckinToken.ts). Sem framework de teste novo — usa o
// compilador TypeScript já presente como devDependency (typescript) para
// transpilar o módulo em memória, e node + assert nativo para as
// assertions. Nenhum segredo real é usado — só uma string de teste óbvia.

import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const SRC_PATH = new URL("../src/lib/qrCheckinToken.ts", import.meta.url);
const source = readFileSync(SRC_PATH, "utf8");

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const tmpDir = mkdtempSync(join(tmpdir(), "qr-checkin-token-"));
const tmpFile = join(tmpDir, "qrCheckinToken.mjs");
writeFileSync(tmpFile, transpiled, "utf8");

const { signQrCheckinToken, verifyQrCheckinToken } = await import(`file://${tmpFile.replace(/\\/g, "/")}`);

const TEST_SECRET = "test-secret-" + "x".repeat(32); // fixture sintética, não é um segredo real
const OTHER_SECRET = "other-secret-" + "y".repeat(32);
const LESSON_ID = "lesson-fixture-123";

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

console.log("=== Self-tests: qrCheckinToken (HMAC-SHA256) ===\n");

check("token válido é aceito e retorna o lessonId correto", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const result = verifyQrCheckinToken(token, TEST_SECRET, now + 1000); // 1s depois
  assert.equal(result.ok, true);
  assert.equal(result.lessonId, LESSON_ID);
});

check("assinatura alterada é rejeitada (bad_signature)", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const [payloadB64] = token.split(".");
  const tampered = `${payloadB64}.${"a".repeat(43)}`; // assinatura falsa, mesmo tamanho aproximado
  const result = verifyQrCheckinToken(tampered, TEST_SECRET, now + 1000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

check("lessonId alterado no payload é rejeitado (invalida a assinatura)", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const [payloadB64, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  payload.lessonId = "outra-aula-nao-autorizada";
  const tamperedPayloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const tampered = `${tamperedPayloadB64}.${signature}`;
  const result = verifyQrCheckinToken(tampered, TEST_SECRET, now + 1000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

check("token expirado é rejeitado", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const farFuture = now + 10 * 60 * 1000; // 10 minutos depois — além do TTL de 5 min
  const result = verifyQrCheckinToken(token, TEST_SECRET, farFuture);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "expired");
});

check("token emitido no futuro (além da tolerância) é rejeitado", () => {
  const now = Date.now();
  const future = now + 60_000; // assinado 60s no "futuro" em relação ao verificador
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, future);
  const result = verifyQrCheckinToken(token, TEST_SECRET, now);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_yet_valid");
});

check("token malformado (sem separador) é rejeitado", () => {
  const result = verifyQrCheckinToken("isso-nao-e-um-token-valido", TEST_SECRET);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "malformed");
});

check("token vazio/ausente é rejeitado", () => {
  const result = verifyQrCheckinToken("", TEST_SECRET);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "malformed");
});

check("payload alterado (exp estendido manualmente) é rejeitado", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const [payloadB64, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  payload.exp = payload.exp + 100000; // tenta prolongar a validade
  const tamperedPayloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const tampered = `${tamperedPayloadB64}.${signature}`;
  const result = verifyQrCheckinToken(tampered, TEST_SECRET, now + 1000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

check("verificar com o segredo errado é rejeitado (equivalente a segredo ausente/rotacionado)", () => {
  const now = Date.now();
  const token = signQrCheckinToken(LESSON_ID, TEST_SECRET, now);
  const result = verifyQrCheckinToken(token, OTHER_SECRET, now + 1000);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

console.log(`\n${passed} ok, ${failed} falhas`);

if (failed > 0) {
  process.exit(1);
}
