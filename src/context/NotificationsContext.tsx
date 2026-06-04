"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp, type AppContextType } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import type { Notification } from "@/context/types";
import { useCoachMessagesUnread } from "@/hooks/useCoachMessagesUnread";
import { unreadNotificationsCount } from "@/lib/notificationVisibility";
import { resolveStudentCrmId } from "@/lib/resolveStudentCrmId";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadNotifications: number;
  crmStudentId: string | null;
  coachMessagesUnread: number;
  refreshCoachMessagesUnread: () => Promise<void>;
  addNotification: AppContextType["addNotification"];
  markNotificationRead: AppContextType["markNotificationRead"];
  markAllNotificationsRead: AppContextType["markAllNotificationsRead"];
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const { user } = useAuth();
  const { students } = useStudents();
  const crmStudentId = useMemo(() => resolveStudentCrmId(user, students), [user, students]);
  const { count: coachMessagesUnread, refresh: refreshCoachMessagesUnread } = useCoachMessagesUnread(
    user?.role === "aluno" ? crmStudentId : null,
  );
  const inboxUnread = useMemo(
    () => unreadNotificationsCount(app.notifications, user, crmStudentId),
    [app.notifications, user, crmStudentId],
  );
  const unreadNotifications =
    user?.role === "aluno" ? inboxUnread + coachMessagesUnread : inboxUnread;
  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: app.notifications,
      unreadNotifications,
      crmStudentId,
      coachMessagesUnread,
      refreshCoachMessagesUnread,
      addNotification: app.addNotification,
      markNotificationRead: app.markNotificationRead,
      markAllNotificationsRead: app.markAllNotificationsRead,
    }),
    [
      app.notifications,
      unreadNotifications,
      crmStudentId,
      coachMessagesUnread,
      refreshCoachMessagesUnread,
      app.addNotification,
      app.markNotificationRead,
      app.markAllNotificationsRead,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications deve ser usado dentro de NotificationsProvider");
  return ctx;
}
