"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { AppConfig, Lesson, Notification, Payment, Post, Student } from "@/context/types";
import { filterDemoNotifications } from "@/lib/appSessionHelpers";
import { loadCriticalLiveBundle } from "@/lib/loadCriticalLiveBundle";
import { runEnrollmentInviteSync } from "@/lib/enrollmentInviteSync";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/**
 * Sincronização single-flight: dados ao vivo + feed + convite; respeita `criticalBootstrapDoneRef` para loading bloqueante.
 */
export function useLoadSupabaseCriticalData(options: {
  applySupabaseSession: (
    authUser: SupabaseAuthUser,
    catalogStudents?: Student[],
  ) => void | Promise<void>;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  criticalBootstrapDoneRef: MutableRefObject<boolean>;
  criticalLoadInflightRef: MutableRefObject<Promise<void> | null>;
  setCriticalDataLoading: Dispatch<SetStateAction<boolean>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
  setStudents: Dispatch<SetStateAction<Student[]>>;
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setPosts: Dispatch<SetStateAction<Post[]>>;
  setAppConfig: Dispatch<SetStateAction<AppConfig>>;
}): {
  loadSupabaseCriticalData: (opt?: { forceBlocking?: boolean }) => Promise<void>;
  retryCriticalDataSync: () => Promise<void>;
} {
  const {
    applySupabaseSession,
    supabaseAuthUserRef,
    criticalBootstrapDoneRef,
    criticalLoadInflightRef,
    setCriticalDataLoading,
    setCriticalDataError,
    setStudents,
    setPayments,
    setLessons,
    setNotifications,
    setPosts,
    setAppConfig,
  } = options;

  const loadSupabaseCriticalData = useCallback(
    async (opts?: { forceBlocking?: boolean }) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        criticalBootstrapDoneRef.current = true;
        return;
      }

      if (criticalLoadInflightRef.current) {
        await criticalLoadInflightRef.current;
        return;
      }

      const forceBlocking = opts?.forceBlocking === true;
      const blockingSpinner = forceBlocking || !criticalBootstrapDoneRef.current;

      const promise = (async () => {
        if (blockingSpinner) setCriticalDataLoading(true);
        setCriticalDataError(null);
        if (blockingSpinner) {
          setStudents([]);
          setPayments([]);
          setLessons([]);
          setNotifications([]);
          setPosts([]);
        }
        try {
          const currentUserId = supabaseAuthUserRef.current?.id || "";
          const { data, livePosts } = await loadCriticalLiveBundle(supabase, currentUserId);
          setStudents(data.students);
          setPayments(data.payments);
          setLessons(data.lessons);
          setNotifications(filterDemoNotifications(data.notifications));
          setPosts(livePosts);
          if (supabaseAuthUserRef.current) {
            void applySupabaseSession(supabaseAuthUserRef.current, data.students);
          }
          await runEnrollmentInviteSync(supabase, setAppConfig);
        } catch (error) {
          setCriticalDataError(
            error instanceof Error ? error.message : "Falha ao sincronizar dados ao vivo com Supabase.",
          );
        } finally {
          if (blockingSpinner) setCriticalDataLoading(false);
          criticalBootstrapDoneRef.current = true;
        }
      })();

      criticalLoadInflightRef.current = promise;
      try {
        await promise;
      } finally {
        criticalLoadInflightRef.current = null;
      }
    },
    [
      applySupabaseSession,
      supabaseAuthUserRef,
      criticalBootstrapDoneRef,
      criticalLoadInflightRef,
      setCriticalDataLoading,
      setCriticalDataError,
      setStudents,
      setPayments,
      setLessons,
      setNotifications,
      setPosts,
      setAppConfig,
    ],
  );

  const retryCriticalDataSync = useCallback(async () => {
    await loadSupabaseCriticalData({ forceBlocking: true });
  }, [loadSupabaseCriticalData]);

  return { loadSupabaseCriticalData, retryCriticalDataSync };
}
