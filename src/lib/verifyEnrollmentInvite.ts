/**
 * Confere o código de convite contra o valor em `app_settings` (via RPC no Supabase).
 * Usado quando `NEXT_PUBLIC_REQUIRE_CADASTRO_INVITE=true`.
 */

export async function verifyEnrollmentInviteWithServer(code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch("/api/enrollment/verify-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const j = (await res.json()) as { valid?: boolean };
    return Boolean(j.valid);
  } catch {
    return false;
  }
}
