"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Lesson } from "@/context/types";

type LessonsContextValue = {
  lessons: Lesson[];
  todayLessons: Lesson[];
  addLesson: ReturnType<typeof useApp>["addLesson"];
  updateLesson: (id: string, patch: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addToWaitlist: (lessonId: string, studentId: string) => void;
  promoteFromWaitlist: (lessonId: string, studentId: string) => void;
};

const LessonsContext = createContext<LessonsContextValue | undefined>(undefined);

export function LessonsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<LessonsContextValue>(
    () => ({
      lessons: app.lessons,
      todayLessons: app.todayLessons,
      addLesson: app.addLesson,
      updateLesson: app.updateLesson,
      deleteLesson: app.deleteLesson,
      addToWaitlist: app.addToWaitlist,
      promoteFromWaitlist: app.promoteFromWaitlist,
    }),
    [
      app.lessons,
      app.todayLessons,
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
