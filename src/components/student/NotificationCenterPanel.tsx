"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle2, CreditCard, Star, RefreshCw, MessageSquare, Trophy, Zap } from "lucide-react";
import type { Notification } from "@/context/types";
import { useNotifications } from "@/context/NotificationsContext";

const TYPE_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  new_student:  { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/8",  border: "border-emerald-500/20" },
  payment_late: { icon: CreditCard,    color: "text-red-400",     bg: "bg-red-500/8",      border: "border-red-500/20"     },
  lesson_soon:  { icon: Bell,          color: "text-blue-400",    bg: "bg-blue-500/8",     border: "border-blue-500/20"    },
  performance:  { icon: Star,          color: "text-amber-400",   bg: "bg-amber-500/8",    border: "border-amber-500/20"   },
  message:      { icon: MessageSquare, color: "text-violet-400",  bg: "bg-violet-500/8",   border: "border-violet-500/20"  },
  broadcast:    { icon: Zap,           color: "text-[#EAB308]",   bg: "bg-amber-500/8",    border: "border-amber-500/20"   },
};

function fmtTime(time: string): string {
  try {
    const d = new Date(time);
    if (isNaN(d.getTime())) return time;
    const now = Date.now();
    const diff = Math.floor((now - d.getTime()) / 60000);
    if (diff < 1)  return "agora";
    if (diff < 60) return `há ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 7)  return `há ${days} dias`;
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  } catch {
    return time;
  }
}

interface Props {
  studentId: string;
  onClose: () => void;
}

export default function NotificationCenterPanel({ studentId, onClose }: Props) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useNotifications();

  const myNotifs = useMemo(() =>
    notifications
      .filter(n => !n.studentId || n.studentId === studentId)
      .sort((a, b) => {
        try {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        } catch { return 0; }
      })
      .slice(0, 50),
  [notifications, studentId]);

  const unreadCount = myNotifs.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-end justify-center"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
          style={{ maxHeight: "88dvh", display: "flex", flexDirection: "column" }}
        >
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-900/60">
                  <Bell size={17} className="text-zinc-300" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EAB308] text-[9px] font-black text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Notificações</h2>
                <p className="text-[10px] text-zinc-500">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? "s" : ""}` : "Tudo lido"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-[10px] font-black text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Marcar todas
                </button>
              )}
              <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
            {myNotifs.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                  <Bell size={22} className="text-zinc-600" />
                </div>
                <p className="text-sm font-bold text-zinc-500">Nenhuma notificação ainda.</p>
                <p className="text-xs text-zinc-700">Avaliações, recados e destaques aparecerão aqui.</p>
              </div>
            )}

            {myNotifs.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.message;
              const Icon = meta.icon;
              return (
                <motion.button
                  key={n.id}
                  layout
                  onClick={() => { if (!n.read) markNotificationRead(n.id); }}
                  className={`w-full flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                    n.read
                      ? "border-zinc-800/40 bg-transparent opacity-60"
                      : `${meta.border} ${meta.bg}`
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${n.read ? "text-zinc-400" : "text-white"}`}>{n.title}</p>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">{fmtTime(n.time)}</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-tight ${n.read ? "text-zinc-600" : "text-zinc-400"}`}>{n.message}</p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#EAB308] mt-1.5" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
