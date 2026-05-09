"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useCheckIn } from "@/context/CheckInContext";
import { Calendar, Zap, AlertCircle, Flame } from "lucide-react";
import { useMemo } from "react";
import { localDateISO } from "@/lib/dateUtils";

export function YourDayCard() {
  const { user } = useAuth();
  const { lessons } = useLessons();
  const { checkIns } = useCheckIn();

  const dayData = useMemo(() => {
    const today = localDateISO(new Date());

    // Aulas de hoje
    const todayLessons = lessons.filter((l) => {
      const lessonDate = l.date?.split("T")[0];
      return lessonDate === today && l.enrolledStudents?.includes(user?.id || "");
    });

    // Check-ins de hoje
    const todayCheckIns = checkIns.filter((ci) => {
      const ciDate = ci.createdAt?.split("T")[0];
      return ciDate === today && ci.studentId === user?.id;
    });

    // Calcula sequência de dias (simplificado - apenas mostra número)
    // Em produção, seria calculado do histórico
    const streak = Math.floor(Math.random() * 20) + 1; // Placeholder

    return {
      todayLessons,
      todayCheckIns,
      streak,
      checkInsNeeded: todayLessons.length,
      checkInsDone: todayCheckIns.length,
    };
  }, [lessons, checkIns, user?.id]);

  const atRisk = dayData.checkInsDone < dayData.checkInsNeeded;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${
        atRisk
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-green-500/30 bg-green-500/5"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#EAB308]" />
          <span className="text-sm font-bold text-white">Seu Dia</span>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#EAB308]/20 border border-[#EAB308]/30"
        >
          <Flame className="w-4 h-4 text-[#EAB308]" />
          <span className="text-xs font-bold text-[#EAB308]">{dayData.streak}d</span>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/70 font-medium">Check-ins Completados</span>
            <span className="text-xs font-bold text-[#EAB308]">
              {dayData.checkInsDone}/{dayData.checkInsNeeded}
            </span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  dayData.checkInsNeeded === 0
                    ? 100
                    : (dayData.checkInsDone / dayData.checkInsNeeded) * 100
                }%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#EAB308] to-[#F97316]"
            />
          </div>
        </div>

        {/* Aulas de Hoje */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <p className="text-[11px] text-white/60 font-bold mb-1 uppercase tracking-widest">
            Aulas Agendadas
          </p>
          {dayData.todayLessons.length === 0 ? (
            <p className="text-xs text-white/50">Nenhuma aula agendada hoje</p>
          ) : (
            <ul className="space-y-1">
              {dayData.todayLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="text-xs text-white/70 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                  {lesson.startTime
                    ? `${lesson.startTime.slice(0, 5)}`
                    : "Horário flexível"}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Risk Alert */}
        {atRisk && dayData.checkInsNeeded > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex gap-2"
          >
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-400/80">
              Risco de quebrar sequência! Faça check-in nas próximas 6h.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
