"use client";

import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { updateLessonRemote } from "@/lib/supabasePersistence";
import { sendPushToRole, sendPushToUser } from "@/lib/pushRoleBroadcast";
import type { Lesson, RepositionRequest, Student } from "@/context/types";

interface UseRepositionActionsArgs {
  usingSupabaseSession: boolean;
  students: Student[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  setCriticalDataError: (msg: string) => void;
}

export function useRepositionActions({
  usingSupabaseSession,
  students,
  setLessons,
  setCriticalDataError,
}: UseRepositionActionsArgs) {

  const requestReposition = useCallback(
    (targetLessonId: string, studentId: string, fromLessonId: string) => {
      const student = students.find(s => s.id === studentId);
      const studentName = student?.name || "Aluno";
      const requestedAt = new Date().toISOString();

      let patch: Partial<Lesson> | null = null;

      setLessons(p =>
        p.map(l => {
          if (l.id !== targetLessonId) return l;
          const existing = (l.repositionRequests || []).find(r => r.studentId === studentId);
          if (existing && existing.status !== "declined") return l;
          const req: RepositionRequest = { studentId, fromLessonId, requestedAt, status: "pending" };
          const repositionRequests = [
            ...(l.repositionRequests || []).filter(r => r.studentId !== studentId),
            req,
          ];
          patch = { repositionRequests };
          return { ...l, repositionRequests };
        }),
      );

      if (!patch) return;
      const finalPatch = patch as Partial<Lesson>;

      if (usingSupabaseSession) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void updateLessonRemote(supabase, targetLessonId, finalPatch).catch(err =>
            setCriticalDataError(err instanceof Error ? err.message : "Falha ao solicitar reposição."),
          );
        }
      }

      void sendPushToRole("admin", {
        title: `🔄 Reposição solicitada`,
        body: `${studentName} quer repor uma aula. Approve no app.`,
        url: "/will",
      });
    },
    [usingSupabaseSession, students, setLessons, setCriticalDataError],
  );

  const approveReposition = useCallback(
    (targetLessonId: string, studentId: string, approvedBy: string) => {
      const student = students.find(s => s.id === studentId);
      const respondedAt = new Date().toISOString();
      let patch: Partial<Lesson> | null = null;

      setLessons(p =>
        p.map(l => {
          if (l.id !== targetLessonId) return l;
          const repositionRequests = (l.repositionRequests || []).map(r =>
            r.studentId === studentId
              ? { ...r, status: "approved" as const, respondedAt, respondedBy: approvedBy }
              : r,
          );
          const enrolledStudents = l.enrolledStudents.includes(studentId)
            ? l.enrolledStudents
            : [...l.enrolledStudents, studentId];
          patch = { repositionRequests, enrolledStudents };
          return { ...l, repositionRequests, enrolledStudents };
        }),
      );

      if (!patch) return;
      const finalPatch = patch as Partial<Lesson>;

      if (usingSupabaseSession) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void updateLessonRemote(supabase, targetLessonId, finalPatch).catch(err =>
            setCriticalDataError(err instanceof Error ? err.message : "Falha ao aprovar reposição."),
          );
        }
      }

      if (student?.authUserId) {
        void sendPushToUser(student.authUserId, {
          title: "✅ Reposição aprovada!",
          body: "Sua solicitação de reposição foi aprovada. Você já está na aula!",
          url: "/dashboard",
        });
      }
    },
    [usingSupabaseSession, students, setLessons, setCriticalDataError],
  );

  const declineReposition = useCallback(
    (targetLessonId: string, studentId: string, declinedBy: string) => {
      const student = students.find(s => s.id === studentId);
      const respondedAt = new Date().toISOString();
      let patch: Partial<Lesson> | null = null;

      setLessons(p =>
        p.map(l => {
          if (l.id !== targetLessonId) return l;
          const repositionRequests = (l.repositionRequests || []).map(r =>
            r.studentId === studentId
              ? { ...r, status: "declined" as const, respondedAt, respondedBy: declinedBy }
              : r,
          );
          patch = { repositionRequests };
          return { ...l, repositionRequests };
        }),
      );

      if (!patch) return;
      const finalPatch = patch as Partial<Lesson>;

      if (usingSupabaseSession) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void updateLessonRemote(supabase, targetLessonId, finalPatch).catch(err =>
            setCriticalDataError(err instanceof Error ? err.message : "Falha ao recusar reposição."),
          );
        }
      }

      if (student?.authUserId) {
        void sendPushToUser(student.authUserId, {
          title: "❌ Reposição não disponível",
          body: "Essa vaga não está disponível. Tente outra data.",
          url: "/dashboard",
        });
      }
    },
    [usingSupabaseSession, students, setLessons, setCriticalDataError],
  );

  return { requestReposition, approveReposition, declineReposition };
}
