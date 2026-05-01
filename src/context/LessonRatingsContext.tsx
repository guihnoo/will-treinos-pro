"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
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
  const getLessonRating = useCallback(
    (lessonId: string, studentId: string) =>
      app.lessonRatings.find((row) => row.lessonId === lessonId && row.studentId === studentId),
    [app.lessonRatings],
  );
  const value = useMemo<LessonRatingsContextValue>(
    () => ({
      lessonRatings: app.lessonRatings,
      addLessonRating: app.addLessonRating,
      getLessonRating,
    }),
    [app.lessonRatings, app.addLessonRating, getLessonRating],
  );

  return <LessonRatingsContext.Provider value={value}>{children}</LessonRatingsContext.Provider>;
}

export function useLessonRatings() {
  const ctx = useContext(LessonRatingsContext);
  if (!ctx) throw new Error("useLessonRatings deve ser usado dentro de LessonRatingsProvider");
  return ctx;
}
