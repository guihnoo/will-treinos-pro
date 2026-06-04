"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Notification, WithoutId } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { insertNotificationRemote, updateNotificationReadRemote } from "@/lib/supabasePersistence";
import { willUid } from "@/lib/willUid";

export function useNotificationMutations(options: {
  usingSupabaseSession: boolean;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
}) {
  const { usingSupabaseSession, setNotifications, setCriticalDataError } = options;

  const addNotification = useCallback(
    (n: WithoutId<Notification>) => {
      if (!usingSupabaseSession) {
        setNotifications((p) => [{ ...n, id: `n_${willUid()}` }, ...p]);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotifications((p) => [{ ...n, id: `n_${willUid()}` }, ...p]);
        return;
      }
      void insertNotificationRemote(supabase, n)
        .then((created) =>
          setNotifications((p) =>
            // Evita duplicata quando Realtime já adicionou o item antes do .then() resolver
            p.some((x) => x.id === created.id) ? p : [created, ...p],
          ),
        )
        .catch((error) =>
          setCriticalDataError(error instanceof Error ? error.message : "Falha ao gravar notificação no Supabase."),
        );
    },
    [usingSupabaseSession, setNotifications, setCriticalDataError],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((p) => p.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
      if (!usingSupabaseSession) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;
      void updateNotificationReadRemote(supabase, id, true).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao marcar notificação como lida."),
      );
    },
    [usingSupabaseSession, setNotifications, setCriticalDataError],
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((p) => {
      const unreadIds = p.filter((n) => !n.read).map((n) => n.id);
      if (usingSupabaseSession && unreadIds.length > 0) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds)
            .then(({ error }) => {
              if (error) {
                setCriticalDataError(`Falha ao marcar todas como lidas: ${error.message}`);
              }
            });
        }
      }
      return p.map((n) => ({ ...n, read: true }));
    });
  }, [usingSupabaseSession, setNotifications, setCriticalDataError]);

  return { addNotification, markNotificationRead, markAllNotificationsRead };
}
