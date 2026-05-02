"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import type { LessonRating, LessonRatingDraft } from "@/context/types";
import { wtLs as ls } from "@/lib/willLocalStorage";

type LessonRatingsContextValue = {
  lessonRatings: LessonRating[];
  addLessonRating: (r: LessonRatingDraft) => void;
  getLessonRating: (lessonId: string, studentId: string) => LessonRating | undefined;
};

const LessonRatingsContext = createContext<LessonRatingsContextValue | undefined>(undefined);

export function LessonRatingsProvider({ children }: { children: React.ReactNode }) {
  const { addNotification } = useNotifications();
  const [lessonRatings, setLessonRatings] = useState<LessonRating[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setLessonRatings(ls.get("lessonRatings", []));
  }, []);

  useEffect(() => {
    if (isMounted) ls.set("lessonRatings", lessonRatings);
  }, [lessonRatings, isMounted]);

  const addLessonRating = useCallback(
    (r: LessonRatingDraft) => {
      const newRating: LessonRating = {
        ...r,
        id: `lr_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setLessonRatings((prev) => {
        const filtered = prev.filter(
          (x) => !(x.lessonId === r.lessonId && x.studentId === r.studentId),
        );
        return [...filtered, newRating];
      });
      addNotification({
        type: "performance",
        title: "Feedback de Treino",
        message: `Aluno avaliou o treino. Média: ${((r.intensidade + r.tecnica + r.didatica + r.evolucao) / 4).toFixed(1)}/5.`,
        time: "agora",
        read: false,
        studentId: r.studentId,
      });
    },
    [addNotification],
  );

  const getLessonRating = useCallback(
    (lessonId: string, studentId: string) =>
      lessonRatings.find((row) => row.lessonId === lessonId && row.studentId === studentId),
    [lessonRatings],
  );

  const value = useMemo<LessonRatingsContextValue>(
    () => ({
      lessonRatings,
      addLessonRating,
      getLessonRating,
    }),
    [lessonRatings, addLessonRating, getLessonRating],
  );

  return <LessonRatingsContext.Provider value={value}>{children}</LessonRatingsContext.Provider>;
}

export function useLessonRatings() {
  const ctx = useContext(LessonRatingsContext);
  if (!ctx) throw new Error("useLessonRatings deve ser usado dentro de LessonRatingsProvider");
  return ctx;
}
