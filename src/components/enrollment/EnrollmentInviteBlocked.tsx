"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

type Reason = "missing" | "invalid";

export function EnrollmentInviteBlocked({ reason }: { reason?: Reason }) {
  const invalid = reason === "invalid";

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#050505] p-6"
      style={{ fontFamily: "'Lexend', sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EAB308] opacity-[0.05] blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-10 text-center backdrop-blur-xl"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/10">
          <Mail className="h-8 w-8 text-[#EAB308]" />
        </div>
        <h2 className="mb-2 text-xl font-black uppercase italic text-white">
          {invalid ? "Convite inválido" : "Convite obrigatório"}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/50">
          {invalid
            ? "Este link não corresponde ao código ativo da academia ou expirou após um novo código ser gerado. Peça ao Will Treinos um link atualizado."
            : "Use o link de matrícula enviado pela equipe Will Treinos. Entre por /cadastro com o convite ou volte ao login e siga o fluxo indicado pelo clube."}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/cadastro"
            className={`inline-flex ${TOUCH_TARGET_MIN} items-center justify-center rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-6 text-sm font-semibold text-[#EAB308] transition-all hover:bg-[#EAB308]/15 ${FOCUS_RING_GOLD}`}
          >
            Abrir matrícula
          </Link>
          <Link
            href="/login"
            className={`inline-flex ${TOUCH_TARGET_MIN} items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white/70 transition-all hover:border-[#EAB308]/40 hover:bg-[#EAB308]/5 hover:text-[#EAB308] ${FOCUS_RING_GOLD}`}
          >
            Voltar ao login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
