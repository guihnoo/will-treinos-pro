"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type State =
  | "loading"
  | "success"
  | "already_checked_in"
  | "expired"
  | "invalid_qr"
  | "not_enrolled"
  | "cancelled"
  | "needs_login"
  | "generic_error";

export default function QRCheckInPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const lessonId     = params.lessonId as string;
  const token        = searchParams.get("token") ?? "";

  const [state, setState]     = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  useEffect(() => {
    async function run() {
      if (!token) {
        setState("invalid_qr");
        return;
      }

      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();

      if (!session?.user) {
        setState("needs_login");
        return;
      }

      // Toda a validação (assinatura, expiração, enrollment, presença,
      // aula cancelada, XP) acontece no servidor — o client só envia o
      // token e interpreta o estado retornado.
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          state?: State;
          xpEarned?: number;
          message?: string;
        };

        const nextState: State = json.state ?? "generic_error";
        setState(nextState);
        if (typeof json.xpEarned === "number") setXpEarned(json.xpEarned);
        if (json.message) setMessage(json.message);
      } catch {
        setState("generic_error");
        setMessage("Falha de rede. Verifique sua conexão e tente novamente.");
      }
    }

    run();
  }, [lessonId, token]);

  const icons: Record<State, React.ReactNode> = {
    loading:           <Loader2 size={48} className="animate-spin text-[#EAB308]" />,
    success:           <CheckCircle2 size={56} className="text-emerald-400" />,
    already_checked_in:<CheckCircle2 size={56} className="text-emerald-400" />,
    expired:           <XCircle size={56} className="text-orange-400" />,
    invalid_qr:        <XCircle size={56} className="text-red-400" />,
    not_enrolled:      <XCircle size={56} className="text-amber-400" />,
    cancelled:         <XCircle size={56} className="text-red-400" />,
    needs_login:       <Loader2 size={48} className="text-zinc-400" />,
    generic_error:     <XCircle size={56} className="text-red-400" />,
  };

  const titles: Record<State, string> = {
    loading:            "Registrando presença…",
    success:            "Presença confirmada!",
    already_checked_in: "Você já está presente!",
    expired:            "QR Code expirado",
    invalid_qr:         "QR Code inválido",
    not_enrolled:       "Você não está inscrito",
    cancelled:          "Aula cancelada",
    needs_login:        "Redirecionando para login…",
    generic_error:      "Não foi possível registrar",
  };

  const subtitles: Record<State, string> = {
    loading:            "Aguarde um momento.",
    success:            xpEarned ? `Bom treino! +${xpEarned} XP 🏐` : "Bom treino! 🏐",
    already_checked_in: "Sua presença já tinha sido registrada nesta aula.",
    expired:            "Peça ao coach um novo QR code.",
    invalid_qr:         "Peça ao coach para exibir o código correto.",
    not_enrolled:       "Somente alunos inscritos podem fazer check-in.",
    cancelled:          "Esta aula foi cancelada.",
    needs_login:        "Você precisa estar logado no app.",
    generic_error:      message || "Fale com o coach.",
  };

  // Redirect to login if needed
  useEffect(() => {
    if (state === "needs_login") {
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(`/checkin/${lessonId}?token=${token}`)}`);
      }, 1500);
    }
    if (state === "success" || state === "already_checked_in") {
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  }, [state, lessonId, token, router]);

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

      {(state === "success" || state === "already_checked_in") && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] text-zinc-600"
        >
          Redirecionando para o app em 3 segundos…
        </motion.p>
      )}

      {(state === "generic_error" || state === "expired" || state === "invalid_qr" || state === "not_enrolled" || state === "cancelled") && (
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
