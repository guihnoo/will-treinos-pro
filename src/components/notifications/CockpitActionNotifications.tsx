"use client";

/**
 * CockpitActionNotifications (C)
 * Strip horizontal de cards de ação no dashboard staff.
 * Exibe apenas: new_student pending, payment_late, lesson_soon.
 * Máx 6 cards. CTA inline. Scroll horizontal em mobile.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, AlertTriangle, Clock, ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useStudents } from "@/context/StudentsContext";
import { filterNotificationsForUser } from "@/lib/notificationVisibility";
import { ACTION_TYPES, notificationActionMap } from "@/lib/notificationActions";
import type { Notification } from "@/context/types";

const CARD_CFG: Record<
  string,
  { icon: React.ElementType; color: string; gradient: string; label: string }
> = {
  new_student:  {
    icon: UserPlus,      color: "#06B6D4",
    gradient: "linear-gradient(135deg,rgba(6,182,212,0.15),rgba(6,182,212,0.05))",
    label: "Cadastro",
  },
  payment_late: {
    icon: AlertTriangle, color: "#F87171",
    gradient: "linear-gradient(135deg,rgba(248,113,113,0.15),rgba(248,113,113,0.05))",
    label: "Pagamento",
  },
  lesson_soon:  {
    icon: Clock,         color: "#EAB308",
    gradient: "linear-gradient(135deg,rgba(234,179,8,0.15),rgba(234,179,8,0.05))",
    label: "Aula",
  },
};

interface Props {
  onOpenSheet?: () => void;
}

export default function CockpitActionNotifications({ onOpenSheet }: Props) {
  const { user }      = useAuth();
  const { notifications, markNotificationRead, crmStudentId } = useNotifications();
  const { approveStudent } = useStudents();
  const router = useRouter();

  const visible = React.useMemo(
    () => filterNotificationsForUser(notifications, user, crmStudentId),
    [notifications, user, crmStudentId],
  );

  const actionNotifs = React.useMemo(
    () =>
      visible
        .filter(n => !n.read && ACTION_TYPES.has(n.type))
        .slice(0, 6),
    [visible],
  );

  if (actionNotifs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.15 }}
      className="mb-6"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Ações de hoje
          </h3>
        </div>
        {onOpenSheet && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenSheet}
            className="text-[11px] font-bold text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
        <AnimatePresence mode="popLayout">
          {actionNotifs.map((notif, i) => (
            <ActionCard
              key={notif.id}
              notif={notif}
              index={i}
              approveStudent={approveStudent}
              markRead={markNotificationRead}
              navigate={url => router.push(url)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Individual action card ── */
function ActionCard({
  notif, index, approveStudent, markRead, navigate,
}: {
  notif: Notification;
  index: number;
  approveStudent: (id: string) => void;
  markRead: (id: string) => void;
  navigate: (url: string) => void;
}) {
  const cfg     = CARD_CFG[notif.type];
  if (!cfg) return null;

  const Icon    = cfg.icon;
  const actions = notificationActionMap[notif.type] ?? [];
  const primary = actions[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, x: 12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 340, damping: 28 }}
      className="flex-shrink-0 snap-start w-52 rounded-2xl border border-zinc-800/60 p-4 relative overflow-hidden"
      style={{ background: cfg.gradient }}
    >
      {/* Pulse ring for high urgency */}
      {notif.type === "payment_late" && (
        <motion.div
          animate={{ opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.3)" }}
        />
      )}

      {/* Icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${cfg.color}20` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1">
        {notif.title}
      </p>
      <p className="text-[10px] text-zinc-500 line-clamp-1 mb-3">{notif.message}</p>

      {/* Primary CTA */}
      {primary && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() =>
            primary.execute({
              notif, approveStudent, markRead,
              navigate, onClose: () => {},
            })
          }
          className="w-full text-xs font-bold py-2 rounded-xl transition-colors"
          style={{
            background: `${cfg.color}20`,
            color: cfg.color,
            border: `1px solid ${cfg.color}30`,
          }}
        >
          {primary.def.label}
        </motion.button>
      )}
    </motion.div>
  );
}
