"use client";

import { useEffect } from "react";
import type { AppConfig, Lesson, Notification, Payment, Post, Student } from "@/context/types";
import { wtLs as ls } from "@/lib/willLocalStorage";

/**
 * Persiste estado transacional em `localStorage` (prefixo `wt_`) quando não há sessão Supabase ativa.
 * `appConfig` persiste sempre que montado (PIX, convite offline, etc.).
 */
export function useLocalTransactionalPersistence(options: {
  isMounted: boolean;
  usingSupabaseSession: boolean;
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  notifications: Notification[];
  posts: Post[];
  appConfig: AppConfig;
}): void {
  const {
    isMounted,
    usingSupabaseSession,
    students,
    lessons,
    payments,
    notifications,
    posts,
    appConfig,
  } = options;

  useEffect(() => {
    if (!isMounted) return;
    if (!usingSupabaseSession) {
      ls.set("students", students);
      ls.set("lessons", lessons);
      ls.set("payments", payments);
      ls.set("notifications", notifications);
      ls.set("posts", posts);
    }
    ls.set("appConfig", appConfig);
  }, [
    isMounted,
    usingSupabaseSession,
    students,
    lessons,
    payments,
    notifications,
    posts,
    appConfig,
  ]);
}
