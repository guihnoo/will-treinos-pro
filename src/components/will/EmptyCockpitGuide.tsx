"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarPlus, UserPlus, ClipboardCheck, Copy } from "lucide-react";
import { useAppConfig } from "@/context/AppConfigContext";
import { useToast } from "@/components/Toast";
import { useLessons } from "@/context/LessonsContext";

interface Props {
  onCreateLesson: () => void;
  onInviteStudent: () => void;
}

const containerV = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const;

const stepV = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 22 },
  },
} as const;

export default function EmptyCockpitGuide({ onCreateLesson, onInviteStudent }: Props) {
  const { cadastroInviteUrl } = useAppConfig();
  const { lessons } = useLessons();
  const { toast } = useToast();

  const hasLesson = lessons.length > 0;

  const steps: {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    active: boolean;
    locked: boolean;
    action?: React.ReactNode;
  }[] = [
    {
      icon: CalendarPlus,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/15 border-amber-500/30",
      title: "Criar primeira aula",
      description: "Defina data, horário e categoria da sua primeira sessão.",
      active: true,
      locked: false,
      action: (
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          data-testid="empty-guide-create-lesson"
          onClick={onCreateLesson}
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-[11px] font-black text-amber-200 transition-all hover:bg-amber-500/25"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Criar aula agora →
        </motion.button>
      ),
    },
    {
      icon: UserPlus,
      iconColor: hasLesson ? "text-emerald-400" : "text-zinc-500",
      iconBg: hasLesson
        ? "bg-emerald-500/15 border-emerald-500/30"
        : "bg-zinc-800/50 border-zinc-700/40",
      title: "Convidar um aluno",
      description: "Compartilhe o link de convite exclusivo com o atleta.",
      active: hasLesson,
      locked: false,
      action: hasLesson ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="truncate rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-1.5 font-mono text-[10px] text-zinc-300 max-w-[180px]">
            {cadastroInviteUrl || "Configure o link nas configurações"}
          </span>
          {cadastroInviteUrl ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              data-testid="empty-guide-copy-invite"
              onClick={() => {
                void navigator.clipboard.writeText(cadastroInviteUrl);
                toast("Link copiado!");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
              aria-label="Copiar link de convite"
            >
              <Copy className="h-3.5 w-3.5" />
            </motion.button>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-zinc-600">Disponível após criar a primeira aula.</p>
      ),
    },
    {
      icon: ClipboardCheck,
      iconColor: "text-zinc-500",
      iconBg: "bg-zinc-800/50 border-zinc-700/40",
      title: "Fazer a primeira avaliação",
      description: "Após o primeiro treino, avalie o atleta nos fundamentos.",
      active: false,
      locked: true,
      action: (
        <span className="mt-2 inline-flex items-center rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-1 text-[10px] font-bold text-zinc-500">
          Disponível após criar aluno
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="rounded-3xl border border-zinc-800/70 bg-zinc-950 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4 text-5xl select-none"
          aria-hidden
        >
          🏐
        </motion.span>
        <h2 className="text-xl font-black text-[#EAB308]">Bem-vindo ao Will Treinos PRO!</h2>
        <p className="mt-1.5 text-sm text-zinc-400">Vamos configurar seu espaço em 3 passos simples.</p>
      </div>

      {/* Steps timeline */}
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="visible"
        className="relative space-y-0"
      >
        {/* Vertical connector line */}
        <div className="absolute left-5 top-6 bottom-6 w-px bg-zinc-800/80" aria-hidden />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div key={idx} variants={stepV} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Step icon */}
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.iconBg} transition-all`}
              >
                <Icon className={`h-4.5 w-4.5 ${step.iconColor}`} size={18} />
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-[13px] font-black ${
                      step.active ? "text-white" : step.locked ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.active && !step.locked && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                      Ativo
                    </span>
                  )}
                  {step.locked && (
                    <span className="rounded-full border border-zinc-700/50 bg-zinc-800/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                      Bloqueado
                    </span>
                  )}
                </div>
                <p
                  className={`mt-0.5 text-[11px] ${step.active ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  {step.description}
                </p>
                {step.action}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
