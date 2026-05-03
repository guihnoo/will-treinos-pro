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
    code =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
        : `wt_${Date.now().toString(36)}`;
  }
  return { code, shouldPersistToSupabase: true };
}
