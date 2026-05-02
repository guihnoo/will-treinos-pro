"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp, type AppContextType } from "@/context/AppContext";
import type { Lesson } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";
import { useCalendarTick } from "@/context/CalendarTickContext";

type LessonsContextValue = {
  lessons: Lesson[];
  todayLessons: Lesson[];
  todayEnrolledCount: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  addLesson: AppContextType["addLesson"];
  updateLesson: AppContextType["updateLesson"];
  deleteLesson: AppContextType["deleteLesson"];
  addToWaitlist: AppContextType["addToWaitlist"];
  promoteFromWaitlist: AppContextType["promoteFromWaitlist"];
};

const LessonsContext = createContext<LessonsContextValue | undefined>(undefined);

export function LessonsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const calendarTick = useCalendarTick();
  const todayStr = useMemo(() => localDateISO(), [calendarTick, app.lessons]);
  const todayLessons = useMemo(
    () => app.lessons.filter((lesson) => lesson.date === todayStr),
    [app.lessons, todayStr],
  );
  const value = useMemo<LessonsContextValue>(
    () => ({
      lessons: app.lessons,
      todayLessons,
      todayEnrolledCount: todayLessons.reduce((sum, lesson) => sum + lesson.enrolledStudents.length, 0),
      todayPresentCount: todayLessons.reduce((sum, lesson) => sum + lesson.presentStudents.length, 0),
      todayAbsentCount: todayLessons.reduce((sum, lesson) => sum + lesson.absentStudents.length, 0),
      addLesson: app.addLesson,
      updateLesson: app.updateLesson,
      deleteLesson: app.deleteLesson,
      addToWaitlist: app.addToWaitlist,
      promoteFromWaitlist: app.promoteFromWaitlist,
    }),
    [
      app.lessons,
      todayLessons,
      app.addLesson,
      app.updateLesson,
      app.deleteLesson,
      app.addToWaitlist,
      app.promoteFromWaitlist,
    ],
  );

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>;
}

export function useLessons() {
  const ctx = useContext(LessonsContext);
  if (!ctx) throw new Error("useLessons deve ser usado dentro de LessonsProvider");
  return ctx;
}
