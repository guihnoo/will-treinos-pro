import type { AppConfig } from "@/context/types";

/**
 * Slug novo para `/cadastro?invite=` — offline, primeiro bootstrap ou «Gerar novo código».
 * Fonte única de aleatoriedade (evita drift com outros call sites).
 */
export function generateNewEnrollmentInviteCode(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
    : `wt_${Date.now().toString(36)}`;
}

/**
 * Resolve o código de convite após `fetchEnrollmentInviteRemote`:
 * — se o Supabase devolveu código, usa esse (sem gravar de volta);
 * — se veio vazio, usa o já persistido no cliente ou gera um novo (`shouldPersistToSupabase: true`).
 */
export function resolveEnrollmentInviteCode(
  inviteRemote: string | null | undefined,
  prevLocalCode: string | undefined,
): { code: string; shouldPersistToSupabase: boolean } {
  const remote = inviteRemote?.trim() || "";
  if (remote) {
    return { code: remote, shouldPersistToSupabase: false };
  }
  let code = (prevLocalCode || "").trim() || "";
  if (!code) {
    code = generateNewEnrollmentInviteCode();
  }
  return { code, shouldPersistToSupabase: true };
}

/**
 * Aplica o resultado de `fetchEnrollmentInviteRemote` ao `AppConfig` (puro + `upsertCode` para Supabase).
 */
export function reduceAppConfigAfterInviteRemote(
  inviteRemote: string | null | undefined,
  prev: AppConfig,
): { next: AppConfig; upsertCode: string | null } {
  const { code, shouldPersistToSupabase } = resolveEnrollmentInviteCode(
    inviteRemote,
    prev.enrollmentInviteCode,
  );
  const upsertCode = shouldPersistToSupabase ? code : null;
  if (code === prev.enrollmentInviteCode) {
    return { next: prev, upsertCode };
  }
  return { next: { ...prev, enrollmentInviteCode: code }, upsertCode };
}
