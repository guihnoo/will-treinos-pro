"use client";

import { motion } from "framer-motion";
import { useStudents } from "@/context/StudentsContext";
import { useAuth } from "@/context/AuthContext";
import { Users, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export function ApprovalQueueIndicator() {
  const { user } = useAuth();
  const { students } = useStudents();

  const queueData = useMemo(() => {
    const pendingStudents = students.filter(
      (s) => s.status === "pending" || s.status === "trial"
    );

    const userIndex = pendingStudents.findIndex(
      (s) => s.id === user?.id || s.authUserId === user?.authSubjectId
    );

    const position = userIndex >= 0 ? userIndex + 1 : null;
    const total = pendingStudents.length;

    return { position, total, pendingStudents };
  }, [students, user?.id, user?.authSubjectId]);

  if (!queueData.position || queueData.position === 0) {
    return null;
  }

  const percentage = (queueData.position / queueData.total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/10 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex-shrink-0"
        >
          <Users className="w-5 h-5 text-[#EAB308]" />
        </motion.div>
        <div>
          <p className="text-sm font-bold text-white">Você é #<span className="text-[#EAB308]">{queueData.position}</span> na fila</p>
          <p className="text-xs text-white/60">De {queueData.total} alunos aguardando aprovação</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#EAB308] to-[#F97316]"
          />
        </div>
      </div>

      {/* Avatar Queue */}
      <div className="mb-4">
        <p className="text-xs text-white/50 font-bold mb-2 uppercase tracking-widest">Fila de aprovação</p>
        <div className="flex items-center gap-2">
          {queueData.pendingStudents.slice(0, 5).map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                student.id === user?.id || student.authUserId === user?.authSubjectId
                  ? "bg-[#EAB308] text-black border-[#EAB308]"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
              title={student.name || "Aluno"}
            >
              {idx + 1}
            </motion.div>
          ))}
          {queueData.total > 5 && (
            <div className="text-[10px] text-white/60 font-bold px-2">
              +{queueData.total - 5}
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
        <div className="flex gap-2">
          <TrendingUp className="w-4 h-4 text-[#EAB308] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/70 leading-relaxed">
            Sua aprovação está em processo. O administrador análisa cada novo aluno para garantir a qualidade da equipe.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
