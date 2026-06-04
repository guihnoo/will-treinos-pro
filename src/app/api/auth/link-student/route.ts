import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Linka auth_user_id na linha do aluno quando foi adicionado manualmente pelo coach (sem signup).
// Só atualiza se auth_user_id ainda é NULL e o email bate com o JWT do chamador.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace("Bearer ", "").trim();
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verificar JWT e obter o usuário autenticado
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Apenas linka a própria linha do aluno (email do JWT = email da linha) e só se NULL
  const { error } = await supabase
    .from("students")
    .update({ auth_user_id: user.id })
    .eq("email", user.email.trim().toLowerCase())
    .is("auth_user_id", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
