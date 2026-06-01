"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ChevronRight, CreditCard, UserPlus,
  CalendarPlus, Bell, Zap, X,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: CreditCard,
    color: "text-emerald-400",
    bg:   "bg-emerald-500/10",
    border: "border-emerald-500/30",
    title: "Configure a chave PIX",
    desc:  "Vá em Configurações → Financeiro e adicione sua chave PIX. Os alunos usam para pagar a mensalidade.",
    action: { label: "Ir para Configurações", href: "/configuracoes" },
  },
  {
    icon: UserPlus,
    color: "text-[#EAB308]",
    bg:   "bg-amber-500/10",
    border: "border-amber-500/30",
    title: "Convide o primeiro aluno",
    desc:  "Na aba Arsenal, copie o link de matrícula e envie por WhatsApp. O aluno se cadastra e aparece na fila de aprovação.",
    action: null,
  },
  {
    icon: CalendarPlus,
    color: "text-blue-400",
    bg:   "bg-blue-500/10",
    border: "border-blue-500/30",
    title: "Crie a primeira aula",
    desc:  "Na Grade Semanal (aba Hoje), clique em qualquer dia vazio para criar uma aula. Defina categoria, horário e vagas.",
    action: null,
  },
  {
    icon: Bell,
    color: "text-violet-400",
    bg:   "bg-violet-500/10",
    border: "border-violet-500/30",
    title: "Ative as notificações push",
    desc:  "Vá no Arsenal → configurações de push para receber alertas de check-in, pagamentos e novos alunos em tempo real.",
    action: null,
  },
  {
    icon: Zap,
    color: "text-[#EAB308]",
    bg:   "bg-amber-500/10",
    border: "border-amber-500/30",
    title: "Você está pronto!",
    desc:  "O Will Treinos PRO está configurado. Explore o Cockpit, avalie atletas e acompanhe a evolução da turma.",
    action: null,
  },
] as const;

const LS_KEY = "wt_coach_onboarding_done_v1";

interface Props { onClose: () => void }

export default function CoachOnboarding({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === STEPS.length - 1;

  function handleDone() {
    try { localStorage.setItem(LS_KEY, "1"); } catch { /* private mode */ }
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden"
      >
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-[#EAB308]" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-6 space-y-4"
          >
            {/* Icon */}
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${current.border} ${current.bg}`}>
              <Icon size={26} className={current.color} />
            </div>

            {/* Step counter */}
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Passo {step + 1} de {STEPS.length}
            </p>

            {/* Title & desc */}
            <div>
              <h2 className="text-lg font-black text-white">{current.title}</h2>
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{current.desc}</p>
            </div>

            {/* Action link */}
            {current.action && (
              <Link
                href={current.action.href}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#EAB308] hover:text-amber-300 transition-colors"
              >
                {current.action.label} →
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 pb-6">
          <button
            onClick={handleDone}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Pular
          </button>
          <div className="flex-1" />
          {isLast ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDone}
              className="flex items-center gap-2 rounded-2xl bg-[#EAB308] px-5 py-3 text-sm font-black text-black hover:bg-amber-400 transition-colors"
            >
              <CheckCircle2 size={16} /> Começar!
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-black text-white hover:border-zinc-600 transition-colors"
            >
              Próximo <ChevronRight size={14} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function shouldShowOnboarding(): boolean {
  try { return !localStorage.getItem(LS_KEY); } catch { return false; }
}
