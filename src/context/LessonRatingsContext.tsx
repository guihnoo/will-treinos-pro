"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { LessonRating } from "@/context/types";

type LessonRatingsContextValue = {
  lessonRatings: LessonRating[];
  addLessonRating: (r: Omit<LessonRating, "id" | "createdAt">) => void;
  getLessonRating: (lessonId: string, studentId: string) => LessonRating | undefined;
};

const LessonRatingsContext = createContext<LessonRatingsContextValue | undefined>(undefined);

export function LessonRatingsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<LessonRatingsContextValue>(
    () => ({
      lessonRatings: app.lessonRatings,
      addLessonRating: app.addLessonRating,
      getLessonRating: app.getLessonRating,
    }),
    [app.lessonRatings, app.addLessonRating, app.getLessonRating],
  );

  return <LessonRatingsContext.Provider value={value}>{children}</LessonRatingsContext.Provider>;
}

export function useLessonRatings() {
  const ctx = useContext(LessonRatingsContext);
  if (!ctx) throw new Error("useLessonRatings deve ser usado dentro de LessonRatingsProvider");
  return ctx;
}
