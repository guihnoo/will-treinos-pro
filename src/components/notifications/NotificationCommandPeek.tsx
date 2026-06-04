"use client";

/**
 * NotificationCommandPeek (B)
 * Desktop: popover acima do sino (hover 400ms → aparece; mouseleave → some)
 * Mobile: strip fina animada acima da bottom nav quando unread > 0
 * Mostra até 3 itens urgentes com CTA rápido. Clique em qualquer item → abre o PulseSheet.
 */

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, AlertTriangle, Clock, TrendingUp, MessageSquare, Megaphone,
  ArrowRight, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useStudents } from "@/context/StudentsContext";
import { filterNotificationsForUser } from "@/lib/notificationVisibility";
import { peekItems } from "@/lib/notificationGrouping";
import { notificationActionMap } from "@/lib/notificationActions";
import type { Notification } from "@/context/types";

/* ─ types ─ */
const TYPE_ICON: Record<string, React.ElementType> = {
  new_student: UserPlus, payment_late: AlertTriangle, lesson_soon: Clock,
  performance: TrendingUp, message: MessageSquare, broadcast: Megaphone,
};
const TYPE_COLOR: Record<string, string> = {
  new_student: "#06B6D4", payment_late: "#F87171", lesson_soon: "#EAB308",
  performance: "#34D399", message: "#A78BFA", broadcast: "#FB923C",
};

interface Props {
  /** Desktop: mostrar o popover acima do sino */
  showDesktop: boolean;
  /** Mobile: mostrar strip acima da bottom nav */
  showMobile: boolean;
  onOpenSheet: () => void;
  onDismiss?: () => void;
}

export default function NotificationCommandPeek({
  showDesktop, showMobile, onOpenSheet, onDismiss,
}: Props) {
  const { user }   = useAuth();
  const { notifications, markNotificationRead, crmStudentId } = useNotifications();
  const { approveStudent } = useStudents();
  const router = useRouter();

  const visible = React.useMemo(
    () => filterNotificationsForUser(notifications, user, crmStudentId),
    [notifications, user, crmStudentId],
  );

  const items = React.useMemo(() => peekItems(visible, 3), [visible]);

  if (items.length === 0) return null;

  return (
    <>
      {/* ── DESKTOP POPOVER ── */}
      <AnimatePresence>
        {showDesktop && (
          <motion.div
            key="peek-desktop"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="hidden lg:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 rounded-2xl border border-zinc-800/70 shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden z-50"
            style={{
              background: "rgba(9,9,11,0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <PeekList items={items} onOpenSheet={onOpenSheet} showDismiss={false}
              approveStudent={approveStudent} markRead={markNotificationRead}
              navigate={url => router.push(url)} onDismiss={onDismiss} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE STRIP (acima da bottom nav) ── */}
      <AnimatePresence>
        {showMobile && (
          <motion.div
            key="peek-mobile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-2 right-2 z-[105] rounded-2xl border border-zinc-800/70 shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
            style={{
              background: "rgba(9,9,11,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <PeekList items={items} onOpenSheet={onOpenSheet} showDismiss
              approveStudent={approveStudent} markRead={markNotificationRead}
              navigate={url => router.push(url)} onDismiss={onDismiss} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Peek list (shared between desktop + mobile) ── */
function PeekList({
  items, onOpenSheet, showDismiss, approveStudent, markRead, navigate, onDismiss,
}: {
  items: Notification[];
  onOpenSheet: () => void;
  showDismiss: boolean;
  approveStudent: (id: string) => void;
  markRead: (id: string) => void;
  navigate: (url: string) => void;
  onDismiss?: () => void;
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60">
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Urgentes
        </span>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenSheet}
            className="flex items-center gap-1 text-[11px] font-bold text-[#EAB308] hover:text-yellow-300 transition-colors"
          >
            Ver tudo <ArrowRight className="w-3 h-3" />
          </motion.button>
          {showDismiss && onDismiss && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              aria-label="Fechar avisos"
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Items */}
      {items.map((notif, i) => {
        const Icon  = TYPE_ICON[notif.type] ?? MessageSquare;
        const color = TYPE_COLOR[notif.type] ?? "#EAB308";
        const firstAction = (notificationActionMap[notif.type] ?? [])[0];

        return (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900/80 last:border-0 hover:bg-white/[0.03] transition-colors"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{notif.title}</p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{notif.message}</p>
            </div>

            {firstAction && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  firstAction.execute({
                    notif, approveStudent, markRead, navigate,
                    onClose: () => {},
                  })
                }
                className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/20 hover:bg-[#EAB308]/25 transition-colors"
              >
                {firstAction.def.label}
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
