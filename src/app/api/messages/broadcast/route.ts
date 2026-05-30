import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!pub || !priv) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com",
    pub, priv
  );
  return webpush;
}

export interface BroadcastBody {
  message: string;
  targetType: "all" | "category";
  categoryId?: string;        // only when targetType=category
  fromName?: string;          // display name of sender
}

async function verifyStaff(jwt: string): Promise<{ ok: boolean; displayName?: string }> {
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return { ok: false };
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: staffRow } = await sb.from("staff_access").select("role").eq("auth_user_id", user.id).maybeSingle();
  const { data: studentRow } = await sb.from("students").select("name, student_role").eq("auth_user_id", user.id).maybeSingle();
  const isStaff = Boolean(staffRow) || studentRow?.student_role === "professor";
  return { ok: isStaff, displayName: studentRow?.name ?? "Coach" };
}

// GET — preview how many students match target (no side effects)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { ok } = await verifyStaff(jwt);
  if (!ok) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") ?? "all";
  const categoryId = searchParams.get("categoryId");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let query = sb.from("students").select("id", { count: "exact", head: true }).eq("status", "active");
  if (targetType === "category" && categoryId) {
    query = query.contains("categories", [categoryId]);
  }
  const { count } = await query;
  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { ok, displayName } = await verifyStaff(jwt);
  if (!ok) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body: BroadcastBody = await req.json().catch(() => null);
  if (!body?.message?.trim()) return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });

  const message = body.message.trim().slice(0, 1000);
  const fromName = `📢 ${(body.fromName ?? displayName ?? "Coach").slice(0, 40)}`;
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch target students
  let studentsQ = sb
    .from("students")
    .select("id, name, auth_user_id")
    .eq("status", "active")
    .not("auth_user_id", "is", null);

  if (body.targetType === "category" && body.categoryId) {
    studentsQ = studentsQ.contains("categories", [body.categoryId]);
  }

  const { data: students } = await studentsQ;
  if (!students?.length) return NextResponse.json({ inserted: 0, pushSent: 0 });

  // Batch insert coach_messages (one per student)
  const rows = students.map((s: { id: string; name: string; auth_user_id: string }) => ({
    from_name: fromName,
    to_student_id: s.id,
    message,
  }));

  const { error: insertErr } = await sb.from("coach_messages").insert(rows);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Push to all students with subscriptions
  const wp = initWebPush();
  let pushSent = 0;
  if (wp) {
    const authIds = students.map((s: { auth_user_id: string }) => s.auth_user_id).filter(Boolean);
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
      .in("user_id", authIds);

    if (subs?.length) {
      const preview = message.length > 70 ? message.slice(0, 67) + "…" : message;
      const results = await Promise.allSettled(
        (subs as { endpoint: string; p256dh: string; auth: string; user_id: string }[]).map((sub) => {
          const student = students.find((s: { auth_user_id: string }) => s.auth_user_id === sub.user_id);
          const firstName = student?.name?.split(" ")[0] ?? "";
          const titleSuffix = firstName ? ` para ${firstName}` : "";
          const payload = JSON.stringify({
            title: `${fromName}${titleSuffix}`,
            body: preview,
            url: "/dashboard",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.svg",
          });
          return wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        })
      );
      pushSent = results.filter((r) => r.status === "fulfilled").length;
    }
  }

  return NextResponse.json({ inserted: students.length, pushSent });
}
