"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Student, StudentRole, StudentStatus, User, WithoutId } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { createStudentRemote, updateStudentRemote } from "@/lib/supabasePersistence";
import { logDevEvent } from "@/lib/devEventsLogger";
import { syncWtRoleCookie } from "@/lib/appSessionHelpers";
import { sendPushToRole } from "@/lib/pushRoleBroadcast";
import { willUid } from "@/lib/willUid";
import { wtLegacyRoleSet, wtLs as ls } from "@/lib/willLocalStorage";

export function useStudentMutations(options: {
  usingSupabaseSession: boolean;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  setStudents: Dispatch<SetStateAction<Student[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
  setUser: Dispatch<SetStateAction<User | null>>;
  loadSupabaseCriticalData: () => Promise<void>;
}) {
  const {
    usingSupabaseSession,
    supabaseAuthUserRef,
    setStudents,
    setCriticalDataError,
    setUser,
    loadSupabaseCriticalData,
  } = options;

  const addStudent = useCallback(
    async (s: WithoutId<Student>): Promise<Student> => {
      const sessionAuthId = supabaseAuthUserRef.current?.id ?? undefined;
      const next: Student = {
        ...s,
        id: `st_${willUid()}`,
        authUserId: s.authUserId ?? sessionAuthId,
      };
      if (!usingSupabaseSession) {
        setStudents((p) => [...p, next]);
        return next;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        const message = "Cliente Supabase indisponível.";
        setCriticalDataError(message);
        throw new Error(message);
      }
      try {
        const created = await createStudentRemote(supabase, next);
        setStudents((p) => [created, ...p]);
        if (sessionAuthId && created.authUserId === sessionAuthId) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  id: created.id,
                  role: "aluno",
                  name: created.name,
                  avatar: created.avatar,
                  email: created.email || prev.email,
                  authSubjectId: sessionAuthId,
                }
              : prev,
          );
          wtLegacyRoleSet("aluno");
          syncWtRoleCookie("aluno");
        }
        /* Nova inscrição: notificação pode vir do trigger Postgres (wt_notify_staff_new_pending_student);
           INSERT pelo cliente falha para não-staff por RLS — o reload puxa a linha. */
        void loadSupabaseCriticalData().catch(() => {
          /* best-effort sync */
        });

        void sendPushToRole("admin", {
          title: "Novo aluno aguardando aprovação",
          body: `${created.name} se cadastrou e aguarda aprovação.`,
          url: "/alunos",
        });

        void logDevEvent("student_created", "student", created.id, {
          name: created.name,
          email: created.email,
          status: created.status,
        });

        return created;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao criar aluno no Supabase.";
        setCriticalDataError(message);
        throw new Error(message);
      }
    },
    [usingSupabaseSession, supabaseAuthUserRef, setStudents, setCriticalDataError, setUser, loadSupabaseCriticalData],
  );

  const approveStudent = useCallback(
    (id: string, role?: StudentRole) => {
      const updates: { status: StudentStatus; role?: StudentRole } = { status: "active" };
      if (role) updates.role = role;

      if (!usingSupabaseSession) {
        setStudents((p) => p.map((st) => (st.id === id ? { ...st, ...updates } : st)));
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        return;
      }
      void updateStudentRemote(supabase, id, updates)
        .then((updated) => {
          setStudents((p) => p.map((st) => (st.id === id ? updated : st)));

          // Notificar aluno que foi aprovado
          void sendPushToRole("aluno", {
            title: "🎉 Bem-vindo!",
            body: `Sua inscrição foi aprovada. Acesse o app para começar.`,
            url: "/dashboard",
          });

          void logDevEvent("student_approved", "student", id, { name: updated.name, role: updated.role });
        })
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao aprovar aluno."));
    },
    [usingSupabaseSession, setStudents, setCriticalDataError],
  );

  const suspendStudent = useCallback(
    (id: string) => {
      if (!usingSupabaseSession) {
        setStudents((p) => p.map((st) => (st.id === id ? { ...st, status: "suspended" as StudentStatus } : st)));
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        return;
      }
      void updateStudentRemote(supabase, id, { status: "suspended" })
        .then((updated) => {
          setStudents((p) => p.map((st) => (st.id === id ? updated : st)));
          void logDevEvent("student_suspended", "student", id, { name: updated.name });
        })
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao suspender aluno."));
    },
    [usingSupabaseSession, setStudents, setCriticalDataError],
  );

  const updateStudent = useCallback(
    (id: string, u: Partial<Student>) => {
      if (!usingSupabaseSession) {
        setStudents((p) => p.map((st) => (st.id === id ? { ...st, ...u } : st)));
      } else {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setCriticalDataError("Cliente Supabase indisponível.");
        } else {
          void updateStudentRemote(supabase, id, u)
            .then((updated) => setStudents((p) => p.map((st) => (st.id === id ? updated : st))))
            .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao atualizar aluno."));
        }
      }
      if (u.name !== undefined || u.avatar !== undefined) {
        const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
        ls.set("userProfiles", {
          ...persistedProfiles,
          [id]: {
            ...persistedProfiles[id],
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.avatar !== undefined ? { avatar: u.avatar } : {}),
          },
        });
      }
      setUser((prev) => {
        if (!prev || prev.id !== id) return prev;
        return {
          ...prev,
          ...(u.name !== undefined && { name: u.name }),
          ...(u.avatar !== undefined && { avatar: u.avatar }),
        };
      });
    },
    [usingSupabaseSession, setStudents, setCriticalDataError, setUser],
  );

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
    ls.set("userProfiles", {
      ...persistedProfiles,
      [id]: {
        ...persistedProfiles[id],
        ...updates,
      },
    });
    setUser((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, ...updates };
    });
  }, [setUser]);

  return { addStudent, approveStudent, suspendStudent, updateStudent, updateUser };
}
