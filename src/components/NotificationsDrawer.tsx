"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, UserPlus, AlertTriangle, Clock, TrendingUp,
  MessageSquare, CheckCheck, Megaphone, Star
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { studentSeesNotification } from "@/lib/notificationVisibility";

interface Props { open: boolean; onClose: () => void; }

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_student:  { icon: UserPlus,    color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  payment_late: { icon: AlertTriangle,color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  lesson_soon:  { icon: Clock,       color: "#EAB308", bg: "rgba(234,179,8,0.1)" },
  performance:  { icon: TrendingUp,  color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  message:      { icon: MessageSquare,color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  broadcast:    { icon: Megaphone,   color: "#F97316", bg: "rgba(249,115,22,0.1)" },
};

export default function NotificationsDrawer({ open, onClose }: Props) {
  const { user, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  useBodyScrollLock(open);

  // ─── SECURITY: Role-based notification filtering ───────────────────────────
  // Admin/Coach: see ALL notifications
  // Aluno: ONLY own (recipientId) + global broadcasts (isGlobal)
  // NEVER leaks admin-only notifications (studentId without recipientId) to students
  const visibleNotifications = React.useMemo(() => {
    if (!user || user.role === null) return [];
    if (user.role === "admin" || user.role === "coach") {
      return notifications;
    }
    return notifications.filter((n) => studentSeesNotification(n, user.id));
  }, [notifications, user]);

  const unread = visibleNotifications.filter(n => !n.read).length;

  const handleMarkAll = () => {
    visibleNotifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          data-modal-overlay
          aria-label="Notificações"
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}>
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#0A0A0A] border-l border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-zinc-800 p-4 flex items-center justify-between z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#EAB308]" />
                <h2 className="text-lg font-bold text-white">Notificações</h2>
                {unread > 0 && (
                  <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleMarkAll}
                    className="text-xs text-[#EAB308] font-bold hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                  </motion.button>
                )}
                <button onClick={onClose} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
              {visibleNotifications.length === 0 && (
                <div className="text-center py-20">
                  <Bell className="w-10 h-10 mx-auto text-zinc-800 mb-3" />
                  <p className="text-sm text-zinc-600">Nenhuma notificação</p>
                  {user?.role === "aluno" && (
                    <p className="text-xs text-zinc-700 mt-2">Você verá aqui alertas de aulas<br/>e mensagens do professor.</p>
                  )}
                </div>
              )}

              {visibleNotifications.map((notif, i) => {
                const cfg = iconMap[notif.type] || iconMap.message;
                const Icon = cfg.icon;
                return (
                  <motion.div key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`flex gap-3 p-3.5 rounded-xl cursor-pointer transition-all mb-1 ${
                      notif.read
                        ? "hover:bg-zinc-900/30"
                        : "bg-zinc-900/40 hover:bg-zinc-900/60 border-l-2"
                    }`}
                    style={!notif.read ? { borderLeftColor: cfg.color } : {}}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold truncate ${notif.read ? "text-zinc-400" : "text-white"}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">{notif.time}</span>
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${notif.read ? "text-zinc-600" : "text-zinc-400"}`}>
                        {notif.message}
                      </p>
                      {notif.isGlobal && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#F97316] bg-[#F97316]/10 px-1.5 py-0.5 rounded-full mt-1">
                          <Megaphone className="w-2.5 h-2.5"/> Aviso Geral
                        </span>
                      )}
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: cfg.color }} />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer hint for students */}
            {user?.role === "aluno" && (
              <div className="p-4 border-t border-zinc-900 flex-shrink-0">
                <p className="text-[10px] text-zinc-700 text-center">
                  🔒 Você vê apenas suas notificações e avisos gerais
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
