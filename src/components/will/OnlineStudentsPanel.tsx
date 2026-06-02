"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import { useCoachPresenceView } from "@/hooks/usePresenceChannel";

function minutesAgo(lastSeen: string): string {
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60_000);
  if (diff < 1) return "Agora";
  if (diff === 1) return "1 min atras";
  return `${diff} min atras`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OnlineStudentsPanel() {
  const { onlineStudents, count } = useCoachPresenceView();

  return (
    <div
      className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-3 py-3"
      data-testid="online-students-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-zinc-300">
          {count > 0 ? `${count} aluno${count > 1 ? "s" : ""} online agora` : "Nenhum aluno no app agora"}
        </span>
        <Radio className="h-3.5 w-3.5 text-zinc-500 ml-auto" />
      </div>

      {/* Student list */}
      <AnimatePresence mode="popLayout">
        {onlineStudents.map((student) => (
          <motion.div
            key={student.studentId}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center gap-2.5 py-1.5"
          >
            {/* Avatar por iniciais */}
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300">
              {getInitials(student.studentName)}
            </div>

            {/* Name + time */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-zinc-200 leading-tight">
                {student.studentName}
              </p>
              <p className="text-[10px] text-zinc-500">{minutesAgo(student.lastSeen)}</p>
            </div>

            {/* Active dot */}
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          </motion.div>
        ))}
      </AnimatePresence>

      {count === 0 && (
        <p className="text-[11px] text-zinc-600 text-center py-1">
          Os alunos aparecem aqui quando abrem o app
        </p>
      )}
    </div>
  );
}
