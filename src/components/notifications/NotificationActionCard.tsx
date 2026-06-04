"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, AlertTriangle, Clock, TrendingUp,
  MessageSquare, Megaphone, Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStudents } from "@/context/StudentsContext";
import { useNotifications } from "@/context/NotificationsContext";
import { formatNotificationDisplayTime } from "@/lib/dateUtils";
import { notificationActionMap } from "@/lib/notificationActions";
import type { Notification } from "@/context/types";

interface Props {
  notif: Notification;
  onClose: () => void;
  compact?: boolean;
}

export const TYPE_CFG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  new_student:  { icon: UserPlus,       color: "#06B6D4", bg: "rgba(6,182,212,0.10)"   },
  payment_late: { icon: AlertTriangle,  color: "#F87171", bg: "rgba(248,113,113,0.10)" },
  lesson_soon:  { icon: Clock,          color: "#EAB308", bg: "rgba(234,179,8,0.10)"   },
  performance:  { icon: TrendingUp,     color: "#34D399", bg: "rgba(52,211,153,0.10)"  },
  message:      { icon: MessageSquare,  color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  broadcast:    { icon: Megaphone,      color: "#FB923C", bg: "rgba(251,146,60,0.10)"  },
};

export default function NotificationActionCard({
  notif, onClose, compact = false,
}: Props) {
  const router   = useRouter();
  const { approveStudent } = useStudents();
  const { markNotificationRead } = useNotifications();
  const [done, setDone] = useState(false);

  const cfg     = TYPE_CFG[notif.type] ?? TYPE_CFG.message;
  const Icon    = cfg.icon;
  const actions = notificationActionMap[notif.type] ?? [];
  const isRead  = notif.read || done;

  const markRead = (id: string) => {
    markNotificationRead(id);
    setDone(true);
  };

  const navigate = (url: string) => router.push(url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      className={[
        "relative rounded-r-2xl rounded-l-none mb-2 overflow-hidden",
        isRead
          ? "border-l-2 border-zinc-800/60 bg-white/[0.02]"
          : "border-l-2 bg-white/[0.06]",
        compact ? "mb-1.5" : "",
      ].join(" ")}
      style={!isRead ? { borderLeftColor: cfg.color } : undefined}
    >
      <div className={compact ? "p-3 flex gap-2.5" : "p-3.5 flex gap-3"}>
        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: cfg.bg }}
        >
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={[
                "text-sm font-bold leading-tight",
                isRead ? "text-zinc-500" : "text-white",
              ].join(" ")}
            >
              {notif.title}
            </span>
            <span className="text-[10px] text-zinc-600 flex-shrink-0 mt-0.5">
              {formatNotificationDisplayTime(notif.time)}
            </span>
          </div>

          <p
            className={[
              "text-xs mt-0.5 leading-relaxed",
              isRead ? "text-zinc-700" : "text-zinc-400",
            ].join(" ")}
          >
            {notif.message}
          </p>

          {/* Inline CTAs */}
          {actions.length > 0 && !done && !notif.read && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {actions.map(({ def, execute }) => (
                <motion.button
                  key={def.label}
                  whileTap={{ scale: 0.93 }}
                  onClick={() =>
                    execute({ notif, approveStudent, markRead, navigate, onClose })
                  }
                  className={[
                    "text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors",
                    def.variant === "gold"
                      ? "bg-[#EAB308]/15 text-[#EAB308] hover:bg-[#EAB308]/25 border border-[#EAB308]/20"
                      : def.variant === "zinc"
                      ? "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 border border-zinc-700/40"
                      : "text-zinc-500 hover:text-zinc-300",
                  ].join(" ")}
                >
                  {def.label}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => markRead(notif.id)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Depois
              </motion.button>
            </div>
          )}

        </div>

        {/* Unread dot */}
        <AnimatePresence>
          {!isRead && (
            <motion.div
              initial={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
              style={{ background: cfg.color }}
            />
          )}
        </AnimatePresence>

        {/* Done tick */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center mt-0.5"
            >
              <Check className="w-3 h-3 text-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
