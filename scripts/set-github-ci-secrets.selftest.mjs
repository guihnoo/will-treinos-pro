#!/usr/bin/env node
// Self-test da validação de formato de chave em set-github-ci-secrets.mjs.
// Sem framework de teste novo — só node + assert nativo. Nenhum valor real
// de chave é usado aqui, apenas fixtures sintéticas óbvias.

import assert from "node:assert/strict";
import { isLegacyJwtFormat, isPublishableKeyFormat, assertPublishableKey } from "./set-github-ci-secrets.mjs";

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

function assertThrows(fn) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "esperava que a função lançasse um erro, mas não lançou");
}

console.log("=== Self-tests: set-github-ci-secrets (validação de formato) ===\n");

// Fixtures sintéticas — nenhuma é uma chave real.
const FAKE_PUBLISHABLE_KEY = "sb_publishable_" + "x".repeat(40);
const FAKE_LEGACY_JWT = "eyJ" + "a".repeat(20) + "." + "b".repeat(20) + "." + "c".repeat(20);

check("sb_publishable_... é reconhecida como Publishable Key", () => {
  assert.equal(isPublishableKeyFormat(FAKE_PUBLISHABLE_KEY), true);
});

check("sb_publishable_... não é reconhecida como legacy JWT", () => {
  assert.equal(isLegacyJwtFormat(FAKE_PUBLISHABLE_KEY), false);
});

check("eyJ... é reconhecida como legacy JWT", () => {
  assert.equal(isLegacyJwtFormat(FAKE_LEGACY_JWT), true);
});

check("assertPublishableKey aceita sb_publishable_... sem lançar", () => {
  assertPublishableKey(FAKE_PUBLISHABLE_KEY, "fixture");
});

check("assertPublishableKey rejeita formato JWT legacy", () => {
  assertThrows(() => assertPublishableKey(FAKE_LEGACY_JWT, "fixture"));
});

check("assertPublishableKey rejeita valor vazio", () => {
  assertThrows(() => assertPublishableKey("", "fixture"));
});

check("assertPublishableKey rejeita valor ausente (undefined)", () => {
  assertThrows(() => assertPublishableKey(undefined, "fixture"));
});

check("assertPublishableKey rejeita formato desconhecido (nem publishable nem JWT)", () => {
  assertThrows(() => assertPublishableKey("valor-qualquer-sem-prefixo-reconhecido", "fixture"));
});

console.log(`\n${passed} ok, ${failed} falhas`);

if (failed > 0) {
  process.exit(1);
}
