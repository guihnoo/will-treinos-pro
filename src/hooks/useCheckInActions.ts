"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Lesson, Notification, Student, WithoutId } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { updateLessonRemote } from "@/lib/supabasePersistence";
import { logDevEvent } from "@/lib/devEventsLogger";
import { sendPushToRole } from "@/lib/pushRoleBroadcast";

export function useCheckInActions(options: {
  usingSupabaseSession: boolean;
  students: Student[];
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
  addNotification: (n: WithoutId<Notification>) => void;
}) {
  const { usingSupabaseSession, students, setLessons, setCriticalDataError, addNotification } = options;

  const checkInStudent = useCallback(
    (lessonId: string, studentId: string, present: boolean) => {
      let remotePatch: Partial<Lesson> | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const ps = present
            ? [...new Set([...l.presentStudents, studentId])]
            : l.presentStudents.filter((id) => id !== studentId);
          const as_ = !present
            ? [...new Set([...l.absentStudents, studentId])]
            : l.absentStudents.filter((id) => id !== studentId);
          remotePatch = { presentStudents: ps, absentStudents: as_ };
          return { ...l, presentStudents: ps, absentStudents: as_ };
        }),
      );
      if (!usingSupabaseSession || !remotePatch) return;
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para registrar presença.");
        return;
      }
      void updateLessonRemote(supabase, lessonId, remotePatch).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar presença na aula."),
      );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const requestCheckIn = useCallback(
    (lessonId: string, studentId: string) => {
      const arrivedAt = new Date().toISOString();
      const arrivedTime = new Date(arrivedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const studentName = students.find((s) => s.id === studentId)?.name || "Aluno";

      let added: { checkInRequests: NonNullable<Lesson["checkInRequests"]> } | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const existing = (l.checkInRequests || []).find((r) => r.studentId === studentId);
          if (existing) return l;
          const req = { studentId, arrivedAt, status: "pending" as const };
          const checkInRequests = [...(l.checkInRequests || []), req];
          added = { checkInRequests };
          return { ...l, checkInRequests };
        }),
      );

      if (!added) return;

      if (usingSupabaseSession) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void updateLessonRemote(supabase, lessonId, { checkInRequests: added.checkInRequests })
            .then(() => {
              void logDevEvent("check_in_requested", "check_in", studentId, {
                lessonId,
                studentName,
              });
            })
            .catch((error) =>
              setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar check-in no Supabase."),
            );
        } else {
          setCriticalDataError("Cliente Supabase indisponível para registrar check-in.");
        }
      }

      addNotification({
        type: "message",
        title: `✅ Check-in: ${studentName}`,
        message: `${studentName} registrou chegada às ${arrivedTime}. Confirme a presença no app.`,
        time: "agora",
        read: false,
        studentId,
      });

      void sendPushToRole("admin", {
        title: `✅ Check-in: ${studentName}`,
        body: `Chegou às ${arrivedTime}. Confirme no app.`,
        url: "/will/court",
      });
    },
    [usingSupabaseSession, students, addNotification],
  );

  const approveCheckIn = useCallback(
    (lessonId: string, studentId: string, approvedBy: string) => {
      const approvedAt = new Date().toISOString();
      let patch: Partial<Lesson> | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const reqs = (l.checkInRequests || []).map((r) =>
            r.studentId === studentId ? { ...r, status: "approved" as const, approvedAt, approvedBy } : r,
          );
          const ps = [...new Set([...l.presentStudents, studentId])];
          patch = { checkInRequests: reqs, presentStudents: ps };
          return { ...l, checkInRequests: reqs, presentStudents: ps };
        }),
      );
      if (!patch || !usingSupabaseSession) return;
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para aprovar check-in.");
        return;
      }
      void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar aprovação de check-in."),
      );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const rejectCheckIn = useCallback(
    (lessonId: string, studentId: string) => {
      let patch: Partial<Lesson> | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const reqs = (l.checkInRequests || []).map((r) =>
            r.studentId === studentId ? { ...r, status: "rejected" as const } : r,
          );
          patch = { checkInRequests: reqs };
          return { ...l, checkInRequests: reqs };
        }),
      );
      if (!patch || !usingSupabaseSession) return;
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para rejeitar check-in.");
        return;
      }
      void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar rejeição de check-in."),
      );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  const endClassCheckIn = useCallback(
    (lessonId: string, studentId: string) => {
      const finishedAt = new Date().toISOString();
      let patch: Partial<Lesson> | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const reqs = (l.checkInRequests || []).map((r) => {
            if (r.studentId !== studentId || r.status !== "approved") return r;
            const start = new Date(r.arrivedAt).getTime();
            const end = new Date(finishedAt).getTime();
            const duration = Math.round((end - start) / 60000);
            return { ...r, finishedAt, duration };
          });
          patch = { checkInRequests: reqs };
          return { ...l, checkInRequests: reqs };
        }),
      );
      if (!patch || !usingSupabaseSession) return;
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível para encerrar check-in.");
        return;
      }
      void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar término de check-in."),
      );
    },
    [usingSupabaseSession, setLessons, setCriticalDataError],
  );

  return { checkInStudent, requestCheckIn, approveCheckIn, rejectCheckIn, endClassCheckIn };
}
