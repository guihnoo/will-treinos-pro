"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type State = "loading" | "success" | "error" | "expired" | "not_enrolled" | "needs_login";

const QR_MAX_AGE_SECONDS = 300; // 5 min tolerance

export default function QRCheckInPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const lessonId     = params.lessonId as string;
  const ts           = Number(searchParams.get("t") ?? "0");

  const [state, setState]     = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      // Check QR expiry
      const age = Math.floor(Date.now() / 1000) - ts;
      if (ts === 0 || age > QR_MAX_AGE_SECONDS) {
        setState("expired");
        return;
      }

      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();

      if (!session?.user) {
        setState("needs_login");
        return;
      }

      // Resolve student CRM id
      const { data: student } = await sb
        .from("students")
        .select("id, name")
        .eq("auth_user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!student) {
        setState("error");
        setMessage("Perfil de aluno não encontrado.");
        return;
      }

      // Fetch the lesson
      const { data: lesson } = await sb
        .from("lessons")
        .select("id, enrolled_students, present_students, status, title")
        .eq("id", lessonId)
        .maybeSingle();

      if (!lesson) {
        setState("error");
        setMessage("Aula não encontrada.");
        return;
      }

      if (lesson.status === "cancelled") {
        setState("error");
        setMessage("Esta aula foi cancelada.");
        return;
      }

      const enrolled: string[] = Array.isArray(lesson.enrolled_students) ? lesson.enrolled_students : [];
      const present: string[]  = Array.isArray(lesson.present_students)  ? lesson.present_students  : [];

      if (!enrolled.includes(student.id as string)) {
        setState("not_enrolled");
        return;
      }

      if (present.includes(student.id as string)) {
        // Already checked in
        setState("success");
        setMessage("Você já está presente nesta aula!");
        return;
      }

      // Register presence
      const newPresent = [...present, student.id];
      const { error } = await sb
        .from("lessons")
        .update({ present_students: newPresent })
        .eq("id", lessonId);

      if (error) {
        setState("error");
        setMessage("Erro ao registrar presença. Tente novamente.");
        return;
      }

      // Award XP (fire-and-forget)
      fetch("/api/xp/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          studentId: student.id,
          points: 50,
          type: "checkin",
          multiplierType: "none",
          multiplierValue: 1,
          sourceEntity: "lesson",
          sourceId: lessonId,
          createdBy: "qr_checkin",
        }),
      }).catch(() => {});

      setState("success");
      setMessage(`Check-in confirmado! +50 XP`);
    }

    run();
  }, [lessonId, ts]);

  const icons: Record<State, React.ReactNode> = {
    loading:      <Loader2 size={48} className="animate-spin text-[#EAB308]" />,
    success:      <CheckCircle2 size={56} className="text-emerald-400" />,
    error:        <XCircle size={56} className="text-red-400" />,
    expired:      <XCircle size={56} className="text-orange-400" />,
    not_enrolled: <XCircle size={56} className="text-amber-400" />,
    needs_login:  <Loader2 size={48} className="text-zinc-400" />,
  };

  const titles: Record<State, string> = {
    loading:      "Registrando presença…",
    success:      "Presença confirmada!",
    error:        "Não foi possível registrar",
    expired:      "QR Code expirado",
    not_enrolled: "Você não está inscrito",
    needs_login:  "Redirecionando para login…",
  };

  const subtitles: Record<State, string> = {
    loading:      "Aguarde um momento.",
    success:      message || "Bom treino! 🏐",
    error:        message || "Fale com o coach.",
    expired:      "Peça ao coach um novo QR code.",
    not_enrolled: "Somente alunos inscritos podem fazer check-in.",
    needs_login:  "Você precisa estar logado no app.",
  };

  // Redirect to login if needed
  useEffect(() => {
    if (state === "needs_login") {
      setTimeout(() => {
        router.push(`/login?redirect=/checkin/${lessonId}?t=${ts}`);
      }, 1500);
    }
    if (state === "success") {
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  }, [state, lessonId, ts, router]);

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center px-6 text-center gap-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280 }}
      >
        {icons[state]}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h1 className="text-xl font-black text-white">{titles[state]}</h1>
        <p className="text-sm text-zinc-500">{subtitles[state]}</p>
      </motion.div>

      {state === "success" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] text-zinc-600"
        >
          Redirecionando para o app em 3 segundos…
        </motion.p>
      )}

      {(state === "error" || state === "expired" || state === "not_enrolled") && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.push("/dashboard")}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-sm font-black text-zinc-400 hover:text-white transition-colors"
        >
          Voltar ao app
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[10px] text-zinc-700 font-bold tracking-widest uppercase"
      >
        ⚡ Will Treinos PRO
      </motion.div>
    </div>
  );
}
