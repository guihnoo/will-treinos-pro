#!/usr/bin/env node
// Self-test da validação de formato de chave em set-github-ci-secrets.mjs.
// Sem framework de teste novo — só node + assert nativo. Nenhum valor real
// de chave é usado aqui, apenas fixtures sintéticas óbvias que seguem a
// estrutura documentada pelo Supabase: sb_publishable_<22 chars>_<8 chars>.

import assert from "node:assert/strict";
import {
  isLegacyJwtFormat,
  isPublishableKeyFormat,
  assertPublishableKey,
  PUBLISHABLE_KEY_SEARCH_PATTERN,
} from "./set-github-ci-secrets.mjs";

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

// Fixtures sintéticas — nenhuma é uma chave real. Estrutura documentada:
// sb_publishable_ + 22 chars random + "_" + 8 chars de checksum.
const RANDOM_22 = "a".repeat(22);
const CHECKSUM_8 = "b".repeat(8);

const VALID_KEY = `sb_publishable_${RANDOM_22}_${CHECKSUM_8}`;
const FAKE_LEGACY_JWT = "eyJ" + "a".repeat(20) + "." + "b".repeat(20) + "." + "c".repeat(20);
const PREFIX_ONLY_NO_PAYLOAD = "sb_publishable_";
const RANDOM_21_CHARS = `sb_publishable_${"a".repeat(21)}_${CHECKSUM_8}`;
const RANDOM_23_CHARS = `sb_publishable_${"a".repeat(23)}_${CHECKSUM_8}`;
const CHECKSUM_7_CHARS = `sb_publishable_${RANDOM_22}_${"b".repeat(7)}`;
const CHECKSUM_9_CHARS = `sb_publishable_${RANDOM_22}_${"b".repeat(9)}`;
const MISSING_SEPARATOR = `sb_publishable_${RANDOM_22}${CHECKSUM_8}`; // sem "_" entre os segmentos
const INVALID_CHARACTER = `sb_publishable_${"a".repeat(21)}!_${CHECKSUM_8}`; // "!" no segmento random
const LEADING_WHITESPACE = ` ${VALID_KEY}`;
const TRAILING_WHITESPACE = `${VALID_KEY} `;
const EMBEDDED_WHITESPACE = `sb_publishable_${"a".repeat(10)} ${"a".repeat(11)}_${CHECKSUM_8}`; // espaço no segmento random

// --- Formato exato válido -------------------------------------------------

check("formato exato válido (22 random + 8 checksum) é aceito (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(VALID_KEY), true);
});

check("formato exato válido não é reconhecido como legacy JWT", () => {
  assert.equal(isLegacyJwtFormat(VALID_KEY), false);
});

check("assertPublishableKey aceita o formato exato válido sem lançar", () => {
  assertPublishableKey(VALID_KEY, "fixture");
});

// --- Segmento random com tamanho errado -----------------------------------

check("random com 21 caracteres é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(RANDOM_21_CHARS), false);
});
check("assertPublishableKey rejeita random com 21 caracteres", () => {
  assertThrows(() => assertPublishableKey(RANDOM_21_CHARS, "fixture"));
});

check("random com 23 caracteres é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(RANDOM_23_CHARS), false);
});
check("assertPublishableKey rejeita random com 23 caracteres", () => {
  assertThrows(() => assertPublishableKey(RANDOM_23_CHARS, "fixture"));
});

// --- Checksum com tamanho errado -------------------------------------------

check("checksum com 7 caracteres é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(CHECKSUM_7_CHARS), false);
});
check("assertPublishableKey rejeita checksum com 7 caracteres", () => {
  assertThrows(() => assertPublishableKey(CHECKSUM_7_CHARS, "fixture"));
});

check("checksum com 9 caracteres é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(CHECKSUM_9_CHARS), false);
});
check("assertPublishableKey rejeita checksum com 9 caracteres", () => {
  assertThrows(() => assertPublishableKey(CHECKSUM_9_CHARS, "fixture"));
});

// --- Separador ausente, prefixo sem payload, caractere inválido -----------

check("prefixo sb_publishable_ sem payload é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(PREFIX_ONLY_NO_PAYLOAD), false);
});
check("assertPublishableKey rejeita prefixo sem payload", () => {
  assertThrows(() => assertPublishableKey(PREFIX_ONLY_NO_PAYLOAD, "fixture"));
});

check("separador _ ausente entre random e checksum é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(MISSING_SEPARATOR), false);
});
check("assertPublishableKey rejeita separador _ ausente", () => {
  assertThrows(() => assertPublishableKey(MISSING_SEPARATOR, "fixture"));
});

check("caractere inválido (!) no segmento random é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(INVALID_CHARACTER), false);
});
check("assertPublishableKey rejeita caractere inválido no payload", () => {
  assertThrows(() => assertPublishableKey(INVALID_CHARACTER, "fixture"));
});

// --- Whitespace -------------------------------------------------------------

check("whitespace no início é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(LEADING_WHITESPACE), false);
});
check("assertPublishableKey rejeita whitespace no início", () => {
  assertThrows(() => assertPublishableKey(LEADING_WHITESPACE, "fixture"));
});

check("whitespace no fim é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(TRAILING_WHITESPACE), false);
});
check("assertPublishableKey rejeita whitespace no fim", () => {
  assertThrows(() => assertPublishableKey(TRAILING_WHITESPACE, "fixture"));
});

check("whitespace embutido no segmento random é rejeitado (isPublishableKeyFormat)", () => {
  assert.equal(isPublishableKeyFormat(EMBEDDED_WHITESPACE), false);
});
check("assertPublishableKey rejeita whitespace embutido", () => {
  assertThrows(() => assertPublishableKey(EMBEDDED_WHITESPACE, "fixture"));
});

// --- JWT legacy e string vazia ----------------------------------------------

check("eyJ... é reconhecida como legacy JWT", () => {
  assert.equal(isLegacyJwtFormat(FAKE_LEGACY_JWT), true);
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

// --- Padrão de auto-descoberta em bundle -----------------------------------

check("PUBLISHABLE_KEY_SEARCH_PATTERN encontra uma chave válida embutida em texto de bundle", () => {
  const fakeBundleChunk = `var e={anonKey:"${VALID_KEY}",url:"https://example.supabase.co"};`;
  const match = fakeBundleChunk.match(PUBLISHABLE_KEY_SEARCH_PATTERN);
  assert.ok(match, "esperava encontrar a fixture válida no texto simulado do bundle");
  assert.equal(match[0], VALID_KEY);
});

check("PUBLISHABLE_KEY_SEARCH_PATTERN não encontra nada quando só há JWT legacy no bundle", () => {
  const fakeBundleChunk = `var e={anonKey:"${FAKE_LEGACY_JWT}"};`;
  const match = fakeBundleChunk.match(PUBLISHABLE_KEY_SEARCH_PATTERN);
  assert.equal(match, null);
});

console.log(`\n${passed} ok, ${failed} falhas`);

if (failed > 0) {
  process.exit(1);
}
