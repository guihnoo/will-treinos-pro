"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, Users, Zap, CheckCircle2, Lock } from "lucide-react";
import type { Lesson } from "@/context/types";
import { useCatalog } from "@/context/CatalogContext";
import { useCheckIn } from "@/context/CheckInContext";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

interface Props {
  lesson: Lesson | null;
  studentCrmId: string;
  onClose: () => void;
}

export default function StudentLessonAgendaSheet({ lesson, studentCrmId, onClose }: Props) {
  const { getCategory, getVenue } = useCatalog();
  const { requestCheckIn } = useCheckIn();
  const [localNow, setLocalNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setLocalNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!lesson) return null;

  const cat = getCategory(lesson.categoryId);
  const venue = getVenue(lesson.venueId);
  const lessonStart = lessonLocalDateTime(lesson.date, lesson.startTime);
  const lessonEnd = lessonLocalDateTime(lesson.date, lesson.endTime);
  const unlockAt = new Date(lessonStart.getTime() - 60 * 60 * 1000);
  const sameDay = lesson.date === localDateISO(localNow);
  const pending = lesson.checkInRequests?.find((r) => r.studentId === studentCrmId);
  const approved = lesson.presentStudents.includes(studentCrmId) || pending?.status === "approved";

  let gate: { state: "approved" | "pending" | "locked" | "open"; label: string; reason: string } = {
    state: "open",
    label: "Check-in liberado",
    reason: "",
  };
  if (approved) gate = { state: "approved", label: "Check-in confirmado", reason: "" };
  else if (pending?.status === "pending") gate = { state: "pending", label: "Aguardando confirmação", reason: "" };
  else if (lesson.status === "completed") gate = { state: "locked", label: "Encerrada", reason: "Aula concluída" };
  else if (!sameDay) gate = { state: "locked", label: "Bloqueado", reason: "Check-in apenas no dia da aula" };
  else if (localNow < unlockAt) {
    gate = {
      state: "locked",
      label: "Bloqueado",
      reason: `Libera às ${unlockAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    };
  } else if (localNow > lessonEnd) gate = { state: "locked", label: "Encerrado", reason: "Janela de check-in encerrada" };

  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da aula ${lesson.title}`}
        className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <span
                className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md uppercase text-black mb-2"
                style={{ background: cat?.color ?? "#EAB308" }}
              >
                {cat?.emoji} {cat?.name}
              </span>
              <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                {lesson.date.split("-").reverse().join("/")} · {lesson.startTime} – {lesson.endTime}
              </p>
            </div>
            <button type="button" onClick={onClose} className={`p-2 rounded-xl text-zinc-500 hover:bg-zinc-900 ${FOCUS_RING_GOLD}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
              <p className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Horário</p>
              <p className="font-bold text-white mt-1">{lesson.startTime} – {lesson.endTime}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
              <p className="text-zinc-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Local</p>
              <p className="font-bold text-white mt-1 truncate">{venue?.name ?? "Quadra"}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3 col-span-2">
              <p className="text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" /> Turma</p>
              <p className="font-bold text-white mt-1">
                {lesson.enrolledStudents.length}/{lesson.maxStudents} alunos · {lesson.status}
              </p>
            </div>
          </div>

          {lesson.notes ? (
            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Observações</p>
              <p className="text-sm text-zinc-300">{lesson.notes}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                gate.state === "open"
                  ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10"
                  : gate.state === "pending"
                    ? "text-[#EAB308] border-[#EAB308]/35 bg-[#EAB308]/10"
                    : gate.state === "approved"
                      ? "text-[#60A5FA] border-[#60A5FA]/35 bg-[#60A5FA]/10"
                      : "text-zinc-500 border-zinc-700 bg-zinc-900/60"
              }`}
            >
              {gate.state === "open" ? "Check-in liberado" : gate.label}
            </span>
            {gate.reason ? <span className="text-[10px] text-zinc-500">{gate.reason}</span> : null}
          </div>

          {gate.state === "open" ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                requestCheckIn(lesson.id, studentCrmId);
                onClose();
              }}
              className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] text-black text-sm font-black py-3 ${ctaClass}`}
            >
              <Zap className="w-4 h-4" /> Registrar chegada
            </motion.button>
          ) : gate.state === "approved" ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/30 bg-[#60A5FA]/10 py-3 text-sm font-bold text-[#60A5FA]">
              <CheckCircle2 className="w-4 h-4" /> Presença confirmada
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 py-3 text-sm font-bold text-zinc-400">
              <Lock className="w-4 h-4" /> {gate.label}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
