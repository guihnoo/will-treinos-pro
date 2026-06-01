"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson } from "@/context/types";

interface MoodResponseCardProps {
  lessons: Lesson[];
  studentId: string;
}

type MoodValue = "great" | "heavy" | "tired";

const MOODS: Array<{ value: MoodValue; emoji: string; label: string; color: string }> = [
  { value: "heavy", emoji: "😤", label: "Pesado", color: "#F97316" },
  { value: "great", emoji: "😊", label: "Otimo", color: "#22C55E" },
  { value: "tired", emoji: "😴", label: "Cansado", color: "#60A5FA" },
];

function localStorageKey(lessonId: string, studentId: string): string {
  return `wt_mood_${lessonId}_${studentId}`;
}

function hasAlreadyResponded(lessonId: string, studentId: string): boolean {
  try {
    return Boolean(localStorage.getItem(localStorageKey(lessonId, studentId)));
  } catch {
    return false;
  }
}

function markResponded(lessonId: string, studentId: string): void {
  try {
    localStorage.setItem(localStorageKey(lessonId, studentId), "1");
  } catch {
    /* ignore */
  }
}

export default function MoodResponseCard({ lessons, studentId }: MoodResponseCardProps) {
  const [selected, setSelected] = useState<MoodValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [targetLesson, setTargetLesson] = useState<Lesson | null>(null);

  // Find a recently completed lesson (last 6h) where student was present and hasn't responded yet
  const recentLesson = useMemo(() => {
    if (!studentId) return null;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    return (
      lessons.find((l) => {
        if (l.status !== "completed") return false;
        if (!l.presentStudents.includes(studentId)) return false;
        // Use the lesson date + startTime to approximate completion time
        const lessonDateTime = new Date(`${l.date}T${l.endTime || l.startTime}:00`);
        if (lessonDateTime < sixHoursAgo || lessonDateTime > new Date()) return false;
        if (hasAlreadyResponded(l.id, studentId)) return false;
        return true;
      }) ?? null
    );
  }, [lessons, studentId]);

  useEffect(() => {
    if (recentLesson) {
      setTargetLesson(recentLesson);
      setVisible(true);
    }
  }, [recentLesson]);

  const handleMoodSelect = async (mood: MoodValue) => {
    if (submitting || !targetLesson) return;
    setSelected(mood);
    setSubmitting(true);

    try {
      await fetch("/api/student/lesson-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: targetLesson.id, mood, studentId }),
      });
      markResponded(targetLesson.id, studentId);
    } catch {
      /* ignore — mark locally anyway */
      markResponded(targetLesson.id, studentId);
    }

    setSubmitting(false);
    setDone(true);

    // Dismiss after 2s
    setTimeout(() => {
      setVisible(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {visible && targetLesson && (
        <motion.div
          key="mood-card"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="w-full rounded-2xl border border-zinc-800/60 bg-zinc-950 p-4"
          data-testid="mood-response-card"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1">
            Como foi o treino?
          </p>
          <p className="text-sm font-semibold text-white mb-4 truncate">
            {targetLesson.title ?? "Aula"}
          </p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <span className="text-2xl">
                  {selected ? MOODS.find((m) => m.value === selected)?.emoji : "✅"}
                </span>
                <p className="text-sm font-bold text-zinc-300">Obrigado pelo feedback!</p>
              </motion.div>
            ) : (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                {MOODS.map((m) => (
                  <motion.button
                    key={m.value}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { void handleMoodSelect(m.value); }}
                    disabled={submitting}
                    data-testid={`mood-btn-${m.value}`}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-700 transition-colors disabled:opacity-50"
                    style={
                      selected === m.value
                        ? { borderColor: `${m.color}60`, background: `${m.color}12` }
                        : undefined
                    }
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[11px] font-bold text-zinc-400">{m.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
