import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth || !body?.role) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Extrai o user_id do bearer token JWT enviado pelo client
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Usa anon client para verificar o JWT e obter o user
  const anonClient = createClient(supabaseUrl!, anonKey!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const client = serviceRoleKey
    ? createClient(supabaseUrl!, serviceRoleKey)
    : anonClient;

  // Security A3: derivar role do servidor (staff_access), nunca aceitar do cliente
  let serverRole = "aluno";
  if (serviceRoleKey) {
    const { data: staffRow } = await client
      .from("staff_access")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (staffRow?.role === "admin") serverRole = "admin";
    else if (staffRow?.role === "coach") serverRole = "coach";
  }

  const { error } = await client
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        role: serverRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint) return NextResponse.json({ error: "endpoint obrigatório" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anonClient = createClient(supabaseUrl!, anonKey!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const client = serviceRoleKey ? createClient(supabaseUrl!, serviceRoleKey) : anonClient;
  await client.from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
