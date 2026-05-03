"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Lesson, WithoutId } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { createLessonRemote, deleteLessonRemote, updateLessonRemote } from "@/lib/supabasePersistence";
import { logDevEvent } from "@/lib/devEventsLogger";
import { willUid } from "@/lib/willUid";

export function useLessonMutations(options: {
  usingSupabaseSession: boolean;
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
}) {
  const { usingSupabaseSession, setLessons, setCriticalDataError } = options;

  const addLesson = useCallback(
    (l: WithoutId<Lesson>) => {
      const next: Lesson = { ...l, id: `l_${willUid()}` };
      if (!usingSupabaseSession) {
        setLessons((p) => [...p, next]);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para criar aula.");
        return;
      }
      void createLessonRemote(supabase, next)
        .then((created) => {
          setLessons((p) => [...p, created]);
          void logDevEvent("lesson_created", "lesson", created.id, {
            venueId: created.venueId,
            lessonType: created.lessonType,
            maxStudents: created.maxStudents,
          });
        })
        .catch((error) =>
          setCriticalDataError(error instanceof Error ? error.message : "Falha ao criar aula no Supabase."),
        );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const updateLesson = useCallback(
    (id: string, u: Partial<Lesson>) => {
      if (!usingSupabaseSession) {
        setLessons((p) => p.map((lesson) => (lesson.id === id ? { ...lesson, ...u } : lesson)));
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para atualizar aula.");
        return;
      }
      void updateLessonRemote(supabase, id, u)
        .then(() => setLessons((p) => p.map((lesson) => (lesson.id === id ? { ...lesson, ...u } : lesson))))
        .catch((error) =>
          setCriticalDataError(error instanceof Error ? error.message : "Falha ao atualizar aula no Supabase."),
        );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const deleteLesson = useCallback(
    (id: string) => {
      if (!usingSupabaseSession) {
        setLessons((p) => p.filter((lesson) => lesson.id !== id));
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para remover aula.");
        return;
      }
      void deleteLessonRemote(supabase, id)
        .then(() => setLessons((p) => p.filter((lesson) => lesson.id !== id)))
        .catch((error) =>
          setCriticalDataError(error instanceof Error ? error.message : "Falha ao remover aula no Supabase."),
        );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const addToWaitlist = useCallback((lessonId: string, studentId: string) => {
    setLessons((p) =>
      p.map((l) =>
        l.id === lessonId
          ? { ...l, waitlist: [...new Set([...(l.waitlist || []), studentId])] }
          : l,
      ),
    );
  }, [setLessons]);

  const promoteFromWaitlist = useCallback((lessonId: string, studentId: string) => {
    setLessons((p) =>
      p.map((l) => {
        if (l.id !== lessonId) return l;
        return {
          ...l,
          waitlist: (l.waitlist || []).filter((wid) => wid !== studentId),
          enrolledStudents: [...new Set([...l.enrolledStudents, studentId])],
        };
      }),
    );
  }, [setLessons]);

  return { addLesson, updateLesson, deleteLesson, addToWaitlist, promoteFromWaitlist };
}
