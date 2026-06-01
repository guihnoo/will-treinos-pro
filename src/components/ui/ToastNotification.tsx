"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X, Trophy, Zap } from "lucide-react";
import type { ToastItem } from "@/hooks/useToast";
import { dismissToast } from "@/hooks/useToast";

function getToastMeta(type: ToastItem["type"]) {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        color: "#22C55E",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/[0.08]",
        iconBg: "bg-emerald-500/15",
        progressColor: "bg-emerald-500",
      };
    case "xp":
      return {
        icon: Zap,
        color: "#EAB308",
        border: "border-amber-500/35",
        bg: "bg-amber-500/[0.07]",
        iconBg: "bg-amber-500/15",
        progressColor: "bg-amber-400",
      };
    case "achievement":
      return {
        icon: Trophy,
        color: "#A78BFA",
        border: "border-violet-500/35",
        bg: "bg-violet-500/[0.07]",
        iconBg: "bg-violet-500/15",
        progressColor: "bg-violet-500",
      };
    case "error":
      return {
        icon: AlertTriangle,
        color: "#EF4444",
        border: "border-red-500/35",
        bg: "bg-red-500/[0.07]",
        iconBg: "bg-red-500/15",
        progressColor: "bg-red-500",
      };
    default:
      return {
        icon: Info,
        color: "#71717A",
        border: "border-zinc-600/35",
        bg: "bg-zinc-800/60",
        iconBg: "bg-zinc-700/50",
        progressColor: "bg-zinc-500",
      };
  }
}

interface ToastNotificationProps {
  toast: ToastItem;
}

export function ToastNotification({ toast }: ToastNotificationProps) {
  const meta = getToastMeta(toast.type);
  const Icon = meta.icon;
  const duration = toast.duration ?? (toast.type === "error" ? 8000 : toast.type === "xp" || toast.type === "achievement" ? 6000 : 4000);

  // Progress bar from 100 -> 0
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const isXP = toast.type === "xp";
  const isAchievement = toast.type === "achievement";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`relative overflow-hidden flex items-start gap-3 rounded-2xl border ${meta.border} ${meta.bg} backdrop-blur-xl px-3.5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto w-[min(320px,calc(100vw-2rem))]`}
      data-testid="toast-notification"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center`}>
        {isXP ? (
          <motion.div
            animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.25, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Icon className="w-5 h-5" style={{ color: meta.color }} />
          </motion.div>
        ) : isAchievement ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <Icon className="w-5 h-5" style={{ color: meta.color }} />
          </motion.div>
        ) : (
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isXP && toast.xpAmount ? (
          <p className="text-sm font-black leading-tight" style={{ color: meta.color }}>
            {toast.title}
          </p>
        ) : (
          <p className="text-sm font-bold text-white leading-tight truncate">{toast.title}</p>
        )}
        {toast.subtitle && (
          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{toast.subtitle}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
        data-testid="toast-close"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/20">
        <div
          className={`h-full ${meta.progressColor} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
