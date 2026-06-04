"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Bell, CheckCheck, ChevronDown,
  UserPlus, AlertTriangle, Clock, TrendingUp, MessageSquare, Megaphone,
  Inbox, AlarmClock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { filterNotificationsForUser } from "@/lib/notificationVisibility";
import { buildGroups, groupLabelFor } from "@/lib/notificationGrouping";
import {
  tabsByRole, typeToTabStaff, typeToTabAluno, type TabLabel, RECADOS_DASHBOARD_URL,
} from "@/lib/notificationActions";
import NotificationActionCard from "@/components/notifications/NotificationActionCard";
import NotificationDetailModal from "@/components/NotificationDetailModal";
import type { Notification } from "@/context/types";

interface Props { open: boolean; onClose: () => void; }

/* ── Icon + colour per type ── */
const TYPE_ICON: Record<string, React.ElementType> = {
  new_student: UserPlus, payment_late: AlertTriangle, lesson_soon: Clock,
  performance: TrendingUp, message: MessageSquare, broadcast: Megaphone,
};
const TYPE_COLOR: Record<string, string> = {
  new_student: "#06B6D4", payment_late: "#F87171", lesson_soon: "#EAB308",
  performance: "#34D399", message: "#A78BFA", broadcast: "#FB923C",
};

/* ── Empty state config ── */
const EMPTY: Record<TabLabel, { icon: React.ElementType; title: string; sub: string }> = {
  "Ação":      { icon: Inbox,          title: "Tudo em dia",      sub: "Nenhuma ação pendente"   },
  "Lembretes": { icon: AlarmClock,     title: "Sem lembretes",    sub: "Nenhum lembrete ativo"   },
  "Recados":   { icon: MessageSquare,  title: "Sem recados",      sub: "Nenhum recado no momento" },
  "Avisos":    { icon: Megaphone,      title: "Nenhum aviso",     sub: "Você está em dia"        },
};

export default function NotificationPulseSheet({ open, onClose }: Props) {
  const { user } = useAuth();
  const {
    notifications, markNotificationRead, crmStudentId, coachMessagesUnread,
  } = useNotifications();
  const router = useRouter();
  const dragControls = useDragControls();

  const isAluno  = user?.role === "aluno";
  const roleKey  = (user?.role === "admin" || user?.role === "coach") ? user.role : isAluno ? "aluno" : "visitor";
  const tabs     = tabsByRole[roleKey] as readonly TabLabel[];
  const typeToTab = isAluno ? typeToTabAluno : typeToTabStaff;

  const [activeTab, setActiveTab]         = useState<TabLabel>(tabs[0]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [detailNotif, setDetailNotif]     = useState<Notification | null>(null);
  const [isDragging, setIsDragging]       = useState(false);

  useBodyScrollLock(open);

  const visible = React.useMemo(
    () => filterNotificationsForUser(notifications, user, crmStudentId),
    [notifications, user, crmStudentId],
  );

  const tabNotifs = React.useMemo(
    () => visible.filter(n => typeToTab[n.type] === activeTab),
    [visible, activeTab, typeToTab],
  );

  const { groups, readItems } = React.useMemo(
    () => buildGroups(tabNotifs),
    [tabNotifs],
  );

  const unreadTotal = visible.filter(n => !n.read).length;

  const handleMarkAll = useCallback(() => {
    visible.filter(n => !n.read).forEach(n => markNotificationRead(n.id));
  }, [visible, markNotificationRead]);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 38, mass: 0.85 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_, i) => {
                setIsDragging(false);
                if (i.offset.y > 100 || i.velocity.y > 450) onClose();
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Notificações"
              className="fixed bottom-0 left-0 right-0 z-[120] mx-auto max-w-lg flex flex-col rounded-t-3xl border border-zinc-800/60 border-b-0 shadow-[0_-24px_80px_rgba(0,0,0,0.8)]"
              style={{
                background: "rgba(9,9,11,0.97)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                maxHeight: "75dvh",
              }}
            >
              {/* Handle — arraste p/ fechar */}
              <div
                className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
                onPointerDown={e => dragControls.start(e)}
              >
                <motion.div
                  className="rounded-full"
                  animate={{
                    width: isDragging ? 48 : 32,
                    height: 4,
                    opacity: isDragging ? 1 : 0.55,
                    background: isDragging
                      ? "linear-gradient(90deg,#EAB308,#CA8A04)"
                      : "linear-gradient(90deg,#52525b,#3f3f46)",
                    boxShadow: isDragging ? "0 0 8px rgba(234,179,8,0.35)" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-[#EAB308]" />
                  <h2 className="text-base font-black text-white tracking-tight">Notificações</h2>
                  {unreadTotal > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                    >
                      {unreadTotal}
                    </motion.span>
                  )}
                </div>
                {unreadTotal > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMarkAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#EAB308] hover:text-yellow-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                  </motion.button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pb-3 flex-shrink-0">
                {tabs.map(tab => {
                  const count = visible.filter(n => typeToTab[n.type] === tab && !n.read).length;
                  const active = activeTab === tab;
                  return (
                    <motion.button
                      key={tab}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab)}
                      className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                      style={{ color: active ? "#EAB308" : "#71717a" }}
                    >
                      {active && (
                        <motion.div
                          layoutId="pulse-tab-pill"
                          className="absolute inset-0 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tab}</span>
                      {count > 0 && (
                        <span
                          className={[
                            "relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none",
                            active
                              ? "bg-[#EAB308]/20 text-[#EAB308]"
                              : "bg-zinc-800 text-zinc-500",
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 no-scrollbar">
                {/* Coach messages CTA (aluno, aba Recados) */}
                {isAluno && activeTab === "Recados" && coachMessagesUnread > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { router.push(RECADOS_DASHBOARD_URL); onClose(); }}
                    className="w-full mb-3 flex items-center gap-3 p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">
                        {coachMessagesUnread} recado{coachMessagesUnread > 1 ? "s" : ""} do coach
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Toque para abrir a caixa de recados</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 -rotate-90 flex-shrink-0" />
                  </motion.button>
                )}

                {/* Empty */}
                {tabNotifs.length === 0 &&
                  !(isAluno && activeTab === "Recados" && coachMessagesUnread > 0) && (
                    <EmptyTab tab={activeTab} />
                  )}

                <AnimatePresence mode="popLayout">
                  {/* Grupos não-lidos */}
                  {groups.map(group => {
                    const GIcon  = TYPE_ICON[group.type] ?? Bell;
                    const color  = TYPE_COLOR[group.type] ?? "#EAB308";
                    const isExp  = expandedGroups.has(group.id);

                    if (group.isSingle) {
                      return (
                        <NotificationActionCard
                          key={group.items[0].id}
                          notif={group.items[0]}
                          onClose={onClose}
                        />
                      );
                    }

                    return (
                      <motion.div key={group.id} layout className="mb-2">
                        {/* Group header — stack-shadow visual */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.05] border border-zinc-800/60"
                          style={{
                            boxShadow:
                              "0 3px 0 0 rgba(18,18,20,0.95), 0 6px 0 0 rgba(18,18,20,0.75)",
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}18` }}
                          >
                            <GIcon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {groupLabelFor(group.type, group.unreadCount)}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {isExp ? "Recolher" : "Expandir tudo"}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: isExp ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                          </motion.div>
                        </motion.button>

                        {/* Accordion */}
                        <AnimatePresence>
                          {isExp && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-1.5 pl-3 border-l border-zinc-800/50 ml-4 mt-1">
                                {group.items.map(n => (
                                  <NotificationActionCard
                                    key={n.id}
                                    notif={n}
                                    onClose={onClose}
                                    compact
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Lidas */}
                  {readItems.length > 0 && (
                    <motion.div layout key="read-divider">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2 mt-3 px-0.5">
                        Lidas
                      </p>
                      {readItems.map(n => (
                        <NotificationActionCard key={n.id} notif={n} onClose={onClose} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail modal — fluxo longo (aprovação c/ notas) */}
      <NotificationDetailModal
        notification={detailNotif}
        open={!!detailNotif}
        onClose={() => setDetailNotif(null)}
      />
    </>
  );
}

function EmptyTab({ tab }: { tab: TabLabel }) {
  const cfg  = EMPTY[tab] ?? EMPTY["Avisos"];
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-3 text-center"
    >
      <Icon className="w-10 h-10 text-zinc-700" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-bold text-zinc-500">{cfg.title}</p>
        <p className="text-xs text-zinc-700 mt-0.5">{cfg.sub}</p>
      </div>
    </motion.div>
  );
}
