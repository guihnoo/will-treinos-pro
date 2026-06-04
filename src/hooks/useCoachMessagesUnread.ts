"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

/** Returns unread coach_messages count for a student CRM id. */
export function useCoachMessagesUnread(studentCrmId: string | null) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!studentCrmId) {
      setCount(0);
      return;
    }
    const sb = getSupabaseClient();
    const { count: unread, error } = await sb
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("to_student_id", studentCrmId)
      .is("read_at", null);
    if (!error) setCount(unread ?? 0);
  }, [studentCrmId]);

  useEffect(() => {
    if (!studentCrmId) {
      setCount(0);
      return;
    }

    void refresh();

    const sb = getSupabaseClient();
    const channel = sb
      .channel(`coach-messages-unread-${studentCrmId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coach_messages",
          filter: `to_student_id=eq.${studentCrmId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refresh();
    }, 45_000);

    return () => {
      window.clearInterval(poll);
      void sb.removeChannel(channel);
    };
  }, [studentCrmId, refresh]);

  return { count, setCount, refresh };
}
