import { getSupabaseClient } from "@/lib/supabaseClient";

/** Envia push para todos os usuários de um role. Fire-and-forget — nunca lança exceção. */
export async function sendPushToRole(
  role: "admin" | "professor" | "aluno",
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ payload, targetRole: role }),
    });
  } catch {
    // push é best-effort — nunca interfere no fluxo principal
  }
}
