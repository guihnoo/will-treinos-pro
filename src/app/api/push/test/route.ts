import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/push/test?role=admin&title=...&body=...
 *
 * Admin-only endpoint para testar push notifications em tempo real.
 * Exemplo:
 * curl -X POST "http://localhost:3000/api/push/test?role=aluno&title=Teste&body=Notificação de teste" \
 *   -H "Authorization: Bearer $JWT"
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Validar JWT
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Verificar se é admin (via role no JWT ou staff_access)
  const decodedJwt = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
  const callerRole = decodedJwt.role;
  const isAdmin = callerRole === "admin";

  if (!isAdmin) {
    return NextResponse.json({ error: "Apenas admin pode usar este endpoint" }, { status: 403 });
  }

  // Extrair parâmetros de query
  const url = new URL(req.url);
  const targetRole = url.searchParams.get("role") ?? "aluno";
  const title = url.searchParams.get("title") ?? "Teste Will Treinos";
  const body = url.searchParams.get("body") ?? "Esta é uma notificação de teste";

  // Disparar push via /api/push/send
  const pushResponse = await fetch(new URL("/api/push/send", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      payload: { title, body, url: "/dashboard" },
      targetRole,
    }),
  });

  const pushResult = await pushResponse.json();

  return NextResponse.json({
    success: true,
    message: `Push enviado para ${targetRole}`,
    result: pushResult,
    debugInfo: {
      vapidConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      targetRole,
      callerRole,
    },
  });
}
