"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  LogOut, Settings, ChevronRight, User, Shield, Star,
  CalendarCheck, Zap, Bell,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useLessons } from "@/context/LessonsContext";
import { useGamification } from "@/context/GamificationContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import UserAvatar from "@/components/ui/UserAvatar";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";

interface Props { open: boolean; onClose: () => void; onOpenNotifs?: () => void; unreadCount?: number; }

const ROLE_LABEL: Record<string, string> = {
  admin:   "Administrador",
  coach:   "Coach",
  aluno:   "Atleta",
  visitor: "Visitante",
};
const ROLE_COLOR: Record<string, string> = {
  admin:   "#EAB308",
  coach:   "#06B6D4",
  aluno:   "#34D399",
  visitor: "#A1A1AA",
};

export default function ProfileSheet({ open, onClose, onOpenNotifs, unreadCount = 0 }: Props) {
  const { user, logout } = useAuth();
  const { students } = useStudents();
  const { lessons } = useLessons();
  const { totalXP } = useGamification();
  const router = useRouter();
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  useBodyScrollLock(open);

  const profile = students.find(s => s.authUserId === user?.id || s.id === user?.id);
  const isAluno = user?.role === "aluno";

  const completedLessons = isAluno
    ? lessons.filter(l => l.presentStudents.includes(user?.id || "")).length
    : null;

  const xp = totalXP > 0 ? totalXP : (completedLessons ?? 0) * 120;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const xpInLevel = xp % 1000;
  const xpPct = Math.round((xpInLevel / 1000) * 100);

  const roleColor = ROLE_COLOR[user?.role ?? "visitor"] ?? "#A1A1AA";

  const handleLogout = () => {
    onClose();
    logout();
    router.push("/login");
  };

  return (
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
              if (i.offset.y > 80 || i.velocity.y > 400) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Perfil"
            className="fixed bottom-0 left-0 right-0 z-[120] mx-auto max-w-lg flex flex-col rounded-t-3xl border border-zinc-800/60 border-b-0 bg-[#0A0A0A] shadow-[0_-24px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={e => dragControls.start(e)}
            >
              <div className={`w-10 h-1 rounded-full transition-colors ${isDragging ? "bg-zinc-400" : "bg-zinc-700"}`} />
            </div>

            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 flex flex-col gap-5">
              {/* Identity */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar
                    name={user?.name ?? ""}
                    photo={profile?.avatar || user?.avatar}
                    size="lg"
                    className="h-16 w-16"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                    style={{ background: roleColor }}
                  >
                    {user?.role === "admin" ? "⚡" : user?.role === "coach" ? "🏐" : `L${level}`}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-lg leading-tight truncate">{user?.name}</p>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                    style={{ background: roleColor + "22", color: roleColor }}
                  >
                    {user?.role === "admin" ? <Shield className="h-3 w-3" /> : user?.role === "coach" ? <Star className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {ROLE_LABEL[user?.role ?? "visitor"]}
                  </span>
                </div>
              </div>

              {/* XP bar — só para atletas */}
              {isAluno && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400">Nível {level}</span>
                    <span className="text-[11px] font-bold text-[#EAB308]">{xp.toLocaleString("pt-BR")} XP total</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#EAB308] to-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-600">{xpInLevel} / 1000 XP neste nível</span>
                    {completedLessons !== null && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <CalendarCheck className="h-3 w-3" /> {completedLessons} aulas
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-col gap-1">
                {onOpenNotifs && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenNotifs(); }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors w-full ${FOCUS_RING_GOLD}`}
                  >
                    <span className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-zinc-400" />
                      Notificações
                    </span>
                    {unreadCount > 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="bg-[#EF4444] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount}</span>
                        <ChevronRight className="h-4 w-4 text-zinc-600" />
                      </span>
                    ) : <ChevronRight className="h-4 w-4 text-zinc-600" />}
                  </button>
                )}

                <Link
                  href="/perfil"
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors ${FOCUS_RING_GOLD}`}
                >
                  <span className="flex items-center gap-3">
                    <User className="h-4 w-4 text-zinc-400" />
                    Editar perfil
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <Link
                  href="/configuracoes"
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors ${FOCUS_RING_GOLD}`}
                >
                  <span className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-zinc-400" />
                    Configurações
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <div className="h-px bg-zinc-800/60 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/8 transition-colors w-full ${FOCUS_RING_GOLD}`}
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
