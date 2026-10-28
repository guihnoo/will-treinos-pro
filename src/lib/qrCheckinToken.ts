/**
 * Token assinado (HMAC-SHA256) para check-in via QR code.
 *
 * Server-only: nunca importar este módulo de um Client Component. O segredo
 * (QR_CHECKIN_SECRET) é sempre passado explicitamente pelo chamador — este
 * módulo nunca lê `process.env` diretamente, o que também o torna testável
 * sem precisar mockar variáveis de ambiente.
 *
 * Formato do token: `<payload-base64url>.<assinatura-base64url>`, onde
 * payload é o JSON `{ v, lessonId, iat, exp }` codificado em base64url.
 * `v` (versão) permite evoluir o formato no futuro sem quebrar tokens já
 * emitidos durante a transição.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const QR_CHECKIN_TOKEN_VERSION = 1;
export const QR_CHECKIN_TTL_SECONDS = 300; // 5 minutos — mesmo TTL do QR atual
const FUTURE_TOLERANCE_SECONDS = 10; // tolerância a pequeno desvio de relógio

interface QrCheckinPayload {
  v: number;
  lessonId: string;
  iat: number; // issued at (epoch seconds)
  exp: number; // expires at (epoch seconds)
}

export type QrCheckinVerifyReason =
  | "malformed"
  | "bad_signature"
  | "expired"
  | "not_yet_valid"
  | "unsupported_version";

export type QrCheckinVerifyResult =
  | { ok: true; lessonId: string }
  | { ok: false; reason: QrCheckinVerifyReason };

/** Type predicate explícito — usar em vez de `!result.ok` no código chamador. */
export function isQrCheckinFailure(
  result: QrCheckinVerifyResult,
): result is { ok: false; reason: QrCheckinVerifyReason } {
  return result.ok === false;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string | null {
  try {
    return Buffer.from(input, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/**
 * Compara duas strings em tempo constante (evita timing attack na
 * verificação de assinatura). Retorna false imediatamente para tamanhos
 * diferentes — vazar o tamanho da assinatura esperada não é um segredo.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Assina um novo token de check-in para `lessonId`. O servidor decide a
 * hora atual (`now`, default = Date.now()) — nunca confiar em timestamp
 * vindo do client.
 */
export function signQrCheckinToken(lessonId: string, secret: string, now: number = Date.now()): string {
  const nowSeconds = Math.floor(now / 1000);
  const payload: QrCheckinPayload = {
    v: QR_CHECKIN_TOKEN_VERSION,
    lessonId,
    iat: nowSeconds,
    exp: nowSeconds + QR_CHECKIN_TTL_SECONDS,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

/**
 * Verifica um token de check-in. Rejeita: formato malformado, assinatura
 * alterada, lessonId alterado (invalida a assinatura, cai em bad_signature),
 * token expirado, e token emitido no futuro além de uma pequena tolerância
 * de relógio. Nunca lança exceção — sempre retorna um resultado tipado.
 */
export function verifyQrCheckinToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): QrCheckinVerifyResult {
  if (!token || typeof token !== "string") return { ok: false, reason: "malformed" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return { ok: false, reason: "malformed" };

  const expectedSignature = sign(payloadB64, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return { ok: false, reason: "bad_signature" };
  }

  const payloadJson = base64UrlDecode(payloadB64);
  if (!payloadJson) return { ok: false, reason: "malformed" };

  let payload: QrCheckinPayload;
  try {
    payload = JSON.parse(payloadJson) as QrCheckinPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    typeof payload.v !== "number" ||
    typeof payload.lessonId !== "string" ||
    !payload.lessonId ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  if (payload.v !== QR_CHECKIN_TOKEN_VERSION) {
    return { ok: false, reason: "unsupported_version" };
  }

  const nowSeconds = Math.floor(now / 1000);
  if (payload.iat > nowSeconds + FUTURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "not_yet_valid" };
  }
  if (nowSeconds > payload.exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, lessonId: payload.lessonId };
}
