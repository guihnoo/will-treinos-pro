"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import type { LessonRating } from "@/context/types";

const LS_PREFIX = "wt_";

const ls = {
  get: <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const d = localStorage.getItem(LS_PREFIX + key);
      if (!d) return fallback;
      const parsed = JSON.parse(d);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed as T;
    } catch {
      return fallback;
    }
  },
  set: (key: string, val: unknown) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  },
};

type LessonRatingsContextValue = {
  lessonRatings: LessonRating[];
  addLessonRating: (r: Omit<LessonRating, "id" | "createdAt">) => void;
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
    (r: Omit<LessonRating, "id" | "createdAt">) => {
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
