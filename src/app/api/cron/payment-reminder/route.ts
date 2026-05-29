import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs on 5th and 20th of each month at 11:00 UTC (08h BRT)
// vercel.json schedule: "0 11 5,20 * *"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

type PaymentRow = {
  student_id: string;
  amount: number;
  status: string;
  reference: string;
};

type StudentRow = {
  id: string;
  name: string;
  auth_user_id: string | null;
};

type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
};

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

function ptMonth(isoRef: string): string {
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const m = parseInt(isoRef.split("-")[1], 10) - 1;
  return months[m] ?? isoRef;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wp = initWebPush();
  if (!wp || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const currentRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = ptMonth(currentRef);

  // Fetch pending/late payments for current month
  const { data: payments } = await sb
    .from("payments")
    .select("student_id, amount, status, reference")
    .eq("reference", currentRef)
    .in("status", ["pending", "late"]);

  if (!payments || payments.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_pending_payments" });
  }

  const studentIds = [...new Set((payments as PaymentRow[]).map((p) => p.student_id))];

  // Fetch student names + auth_user_ids
  const { data: students } = await sb
    .from("students")
    .select("id, name, auth_user_id")
    .in("id", studentIds);

  const studentMap = new Map(
    ((students ?? []) as StudentRow[]).map((s) => [s.id, s])
  );

  // Build auth_user_id list for push_subscriptions lookup
  const authUserIds = ((students ?? []) as StudentRow[])
    .filter((s) => s.auth_user_id)
    .map((s) => s.auth_user_id!);

  if (authUserIds.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_auth_users" });
  }

  // Fetch push subscriptions
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", authUserIds);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscriptions" });
  }

  // Build user_id → student map
  const authUserToStudent = new Map(
    ((students ?? []) as StudentRow[])
      .filter((s) => s.auth_user_id)
      .map((s) => [s.auth_user_id!, s])
  );

  // Send personalized payment reminder to each subscriber
  const results = await Promise.allSettled(
    (subs as PushSub[]).map((sub) => {
      const student = authUserToStudent.get(sub.user_id);
      if (!student) return Promise.resolve();

      const payment = (payments as PaymentRow[]).find((p) => p.student_id === student.id);
      if (!payment) return Promise.resolve();

      const firstName = student.name.split(" ")[0];
      const amount = payment.amount > 0 ? ` (R$${payment.amount.toFixed(0)})` : "";
      const urgency = payment.status === "late" ? "está atrasada" : "está pendente";

      const payload = JSON.stringify({
        title: `💳 ${firstName}, sua mensalidade de ${monthLabel} ${urgency}`,
        body: `Regularize sua mensalidade${amount} para continuar os treinos. Toque para acessar. 🏐`,
        url: "/treinos",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });

      return wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  console.log(`[cron/payment-reminder] month=${currentRef} pending=${payments.length} sent=${sent} failed=${failed}`);
  return NextResponse.json({ sent, failed, month: currentRef, pendingCount: payments.length });
}
