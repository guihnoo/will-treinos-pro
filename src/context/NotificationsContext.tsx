"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Notification } from "@/context/types";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadNotifications: number;
  addNotification: (n: Omit<Notification, "id">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: app.notifications,
      unreadNotifications: app.unreadNotifications,
      addNotification: app.addNotification,
      markNotificationRead: app.markNotificationRead,
      markAllNotificationsRead: app.markAllNotificationsRead,
    }),
    [
      app.notifications,
      app.unreadNotifications,
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
