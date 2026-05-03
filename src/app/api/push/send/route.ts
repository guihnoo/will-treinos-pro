import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export interface SendPushBody {
  payload: PushPayload;
  /** Enviar para todos os usuários com este role */
  targetRole?: "admin" | "professor" | "aluno";
  /** Enviar para um usuário específico */
  targetUserId?: string;
}

export async function POST(req: NextRequest) {
  const body: SendPushBody = await req.json().catch(() => null);
  if (!body?.payload || (!body.targetRole && !body.targetUserId)) {
    return NextResponse.json({ error: "Payload ou alvo inválido" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceRoleKey) {
    // Sem service_role key: notificações push indisponíveis mas não quebra o app
    return NextResponse.json({ sent: 0, reason: "push_not_configured" });
  }

  // Verifica JWT do chamador
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anonClient = createClient(supabaseUrl!, anonKey!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Restrição: aluno só pode notificar admin/professor (não outros alunos)
  const callerSub = await anonClient
    .from("push_subscriptions")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const callerRole = callerSub.data?.role ?? "aluno";
  if (callerRole === "aluno" && body.targetRole === "aluno") {
    return NextResponse.json({ error: "Aluno não pode notificar outros alunos" }, { status: 403 });
  }

  const client = createClient(supabaseUrl!, serviceRoleKey);
  let query = client.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (body.targetRole) query = query.eq("role", body.targetRole);
  if (body.targetUserId) query = query.eq("user_id", body.targetUserId);

  const { data: subs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(body.payload)
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  return NextResponse.json({ sent, failed });
}
