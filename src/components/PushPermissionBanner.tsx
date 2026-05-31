"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { subscribeToPush, isPushSupported } from "@/lib/pushClient";

type Role = "admin" | "professor" | "aluno";

interface Props {
  role: Role;
}

const MESSAGES: Record<Role, { title: string; body: string }> = {
  admin: {
    title: "Fique por dentro de tudo",
    body: "Receba alertas de novos alunos e check-ins diretamente aqui.",
  },
  professor: {
    title: "Alertas da quadra",
    body: "Receba notificações de check-in dos atletas em tempo real.",
  },
  aluno: {
    title: "Seu professor avaliou um treino",
    body: "Ative para receber novas avaliações e comunicados da equipe.",
  },
};

const STORAGE_KEY = "push_banner_dismissed_v2";

export default function PushPermissionBanner({ role }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === "granted") return; // already subscribed
    if (Notification.permission === "denied") return;  // blocked — no point asking
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch { /* private mode */ }

    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
    setVisible(false);
  }

  async function handleEnable() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
    await subscribeToPush(role);
  }

  const msg = MESSAGES[role];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50 pointer-events-auto"
          style={{ maxWidth: 420, margin: "0 auto" }}
        >
          <div className="backdrop-blur-md bg-black/80 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/60">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Bell className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-white leading-snug">{msg.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{msg.body}</p>
              </div>
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="flex-1 h-9 rounded-xl bg-yellow-500 text-black text-xs font-bold active:scale-[0.97] transition-transform"
              >
                Ativar Notificações
              </button>
              <button
                onClick={dismiss}
                className="h-9 px-4 rounded-xl border border-white/10 text-zinc-400 text-xs font-medium active:scale-[0.97] transition-transform"
              >
                Agora não
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
