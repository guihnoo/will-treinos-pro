"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Lesson } from "@/context/types";
import { Card } from "@/design-system";
import { MotionTokens } from "@/design-system";
import { localDateISO, formatDateShort } from "@/lib/dateUtils";

interface WeeklyCalendarGridProps {
  weekStart: Date;
  lessons: Lesson[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onCreateLesson: () => void;
  theme?: "admin" | "coach";
}

export default function WeeklyCalendarGrid({
  weekStart,
  lessons,
  selectedDate,
  onSelectDate,
  onSelectLesson,
  onCreateLesson,
  theme = "admin",
}: WeeklyCalendarGridProps) {
  // Generate 7 days starting from weekStart
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  // Group lessons by date (ISO string)
  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    lessons.forEach((lesson) => {
      const iso = localDateISO(lesson.date);
      if (!map.has(iso)) {
        map.set(iso, []);
      }
      map.get(iso)!.push(lesson);
    });
    return map;
  }, [lessons]);

  // Day labels
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MotionTokens.springs[theme]}
      className="space-y-4"
    >
      {/* Header: Week navigation */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Semana de {formatDateShort(weekStart)}
          </p>
        </div>

        <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const iso = localDateISO(day);
          const dayLessons = lessonsByDate.get(iso) || [];
          const isSelected = selectedDate === iso;
          const isToday = iso === localDateISO(new Date());

          return (
            <motion.div
              key={iso}
              layoutId={`calendar-day-${iso}`}
              className={`
                rounded-lg border transition-all cursor-pointer min-h-[120px] p-2
                ${isSelected ? "border-gold-DEFAULT bg-gold-DEFAULT/10" : "border-zinc-700 bg-zinc-900/30"}
                ${isToday ? "ring-2 ring-gold-glow" : ""}
              `}
              onClick={() => onSelectDate(iso)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Date header */}
              <div className="mb-2">
                <p className="text-xs font-bold text-zinc-400">{dayNames[idx]}</p>
                <p className={`text-lg font-bold ${isToday ? "text-gold-DEFAULT" : "text-white"}`}>
                  {day.getDate()}
                </p>
              </div>

              {/* Lessons stack */}
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {dayLessons.slice(0, 2).map((lesson) => (
                    <motion.div
                      key={lesson.id}
                      layoutId={`lesson-${lesson.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-[10px] px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700 truncate cursor-pointer hover:bg-zinc-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLesson?.(lesson.id);
                      }}
                    >
                      <p className="font-semibold truncate">{lesson.title}</p>
                      <p className="text-zinc-500 truncate">
                        {lesson.startTime}
                      </p>
                    </motion.div>
                  ))}

                  {dayLessons.length > 2 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-gold-DEFAULT font-semibold px-2"
                    >
                      +{dayLessons.length - 2} mais
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create lesson button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateLesson}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-gold-DEFAULT bg-gold-DEFAULT/5 hover:bg-gold-DEFAULT/10 transition-colors"
      >
        <Plus className="w-4 h-4 text-gold-DEFAULT" />
        <span className="text-sm font-semibold text-gold-DEFAULT">Criar aula</span>
      </motion.button>
    </motion.div>
  );
}
