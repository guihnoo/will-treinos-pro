"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, CheckCircle2, Clock, AlertTriangle, Coins, Cake, Wifi, PlusCircle, UserCheck, WalletCards } from "lucide-react";
import type { Lesson, Student, Payment } from "@/context/types";
import { useCoachPresenceView } from "@/hooks/usePresenceChannel";

export interface TodayViewProps {
  lessons: Lesson[];
  students: Student[];
  payments: Payment[];
  pendingStudents: Student[];
  latePayments: Payment[];
  birthdayStudents: Student[];
  todayLessons: Lesson[];
  onNavigate: (tab: "hoje" | "turma" | "arsenal") => void;
  onCreateLesson: () => void;
}

interface AlertItem {
  key: string;
  icon: React.JSX.Element;
  label: string;
  badgeColor: string;
  count: number;
  onClick?: () => void;
}

export default function TodayView({
  pendingStudents,
  latePayments,
  birthdayStudents,
  todayLessons,
  onNavigate,
  onCreateLesson,
}: TodayViewProps) {
  const { count: onlineCount } = useCoachPresenceView();

  const totalEnrolled = todayLessons.reduce(
    (sum, l) => sum + (l.enrolledStudents?.length ?? 0),
    0,
  );
  const totalCheckIns = todayLessons.reduce(
    (sum, l) => sum + (l.presentStudents?.length ?? 0),
    0,
  );

  const birthdayNames = birthdayStudents
    .slice(0, 2)
    .map((s) => s.name.split(" ")[0])
    .join(", ");

  const alerts: AlertItem[] = [
    pendingStudents.length > 0 && {
      key: "pending",
      icon: <Clock className="h-3.5 w-3.5" />,
      label: `${pendingStudents.length} aprovação${pendingStudents.length > 1 ? "ões" : ""} pendente${pendingStudents.length > 1 ? "s" : ""}`,
      badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      count: pendingStudents.length,
      onClick: () => onNavigate("turma"),
    },
    latePayments.length > 0 && {
      key: "late",
      icon: <Coins className="h-3.5 w-3.5" />,
      label: `${latePayments.length} pagamento${latePayments.length > 1 ? "s" : ""} atrasado${latePayments.length > 1 ? "s" : ""}`,
      badgeColor: "border-red-500/40 bg-red-500/10 text-red-300",
      count: latePayments.length,
      onClick: () => onNavigate("turma"),
    },
    birthdayStudents.length > 0 && {
      key: "birthday",
      icon: <Cake className="h-3.5 w-3.5" />,
      label: `${birthdayStudents.length} aniversariante${birthdayStudents.length > 1 ? "s" : ""} hoje${birthdayNames ? ` — ${birthdayNames}` : ""}`,
      badgeColor: "border-rose-500/40 bg-rose-500/10 text-rose-300",
      count: birthdayStudents.length,
    },
    onlineCount > 0 && {
      key: "online",
      icon: <Wifi className="h-3.5 w-3.5" />,
      label: `${onlineCount} aluno${onlineCount > 1 ? "s" : ""} online agora`,
      badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      count: onlineCount,
    },
  ]
    .filter((a): a is Exclude<typeof a, false> => Boolean(a))
    .slice(0, 4) as AlertItem[];

  const hasAlerts = alerts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-2xl border border-amber-500/20 bg-zinc-950 px-4 py-4 shadow-[0_4px_32px_rgba(234,179,8,0.06)]"
      data-testid="today-view-card"
    >
      {/* Section 1 — Aulas de Hoje */}
      <div className="mb-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
          Resumo do Dia
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="today-view-lessons-pill"
            onClick={() => onNavigate("hoje")}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/8 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/15"
          >
            <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
            {todayLessons.length} aula{todayLessons.length !== 1 ? "s" : ""} hoje
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-bold text-zinc-300">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            {totalEnrolled} inscrito{totalEnrolled !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            {totalCheckIns} check-in{totalCheckIns !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Section 2 — Alertas */}
      {hasAlerts && (
        <div className="mb-3 space-y-1.5">
          {alerts.map((alert) => (
            <button
              key={alert.key}
              type="button"
              data-testid={`today-view-alert-${alert.key}`}
              onClick={alert.onClick}
              disabled={!alert.onClick}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${alert.badgeColor} ${alert.onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            >
              {alert.icon}
              <span className="flex-1 text-left">{alert.label}</span>
              {alert.onClick && (
                <AlertTriangle className="h-3 w-3 opacity-50" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Section 3 — Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="today-view-create-lesson"
          onClick={() => { onCreateLesson(); }}
          className="flex items-center gap-1.5 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-2 text-[11px] font-black text-amber-200 transition hover:bg-[#EAB308]/18"
        >
          <PlusCircle className="h-3.5 w-3.5 text-[#EAB308]" />
          Criar aula
        </button>
        {pendingStudents.length > 0 && (
          <button
            type="button"
            data-testid="today-view-approve-students"
            onClick={() => onNavigate("turma")}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[11px] font-black text-amber-200 transition hover:bg-amber-500/15"
          >
            <UserCheck className="h-3.5 w-3.5 text-amber-400" />
            Aprovar alunos
          </button>
        )}
        <button
          type="button"
          data-testid="today-view-financeiro"
          onClick={() => onNavigate("turma")}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-3 py-2 text-[11px] font-black text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/50"
        >
          <WalletCards className="h-3.5 w-3.5 text-zinc-400" />
          Ver financeiro
        </button>
      </div>
    </motion.div>
  );
}
