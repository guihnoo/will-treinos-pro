import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST { "code": string } → { ok, valid } — validação server-side do convite de matrícula.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, valid: false }, { status: 400 });
  }

  const code = typeof body === "object" && body !== null && "code" in body
    ? String((body as { code?: unknown }).code ?? "")
    : "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json({ ok: false, valid: false, error: "not_configured" }, { status: 503 });
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.rpc("verify_enrollment_invite", { p_code: code });

  if (error) {
    console.error("[verify-invite] rpc", error.message);
    return NextResponse.json({ ok: false, valid: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, valid: Boolean(data) });
}
