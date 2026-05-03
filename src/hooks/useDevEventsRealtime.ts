"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const CHANNEL = "willpro-dev-events";

/**
 * Postgres Realtime na tabela `dev_events` — debounce para não martelar o estado.
 * Requer migração `20260504110000_dev_events_realtime` (publication + RLS staff).
 */
export function useDevEventsRealtime(options: {
  enabled: boolean;
  onInsert: () => void | Promise<void>;
  debounceMs?: number;
  onLiveStatus?: (live: boolean) => void;
}): void {
  const { enabled, onInsert, debounceMs = 350, onLiveStatus } = options;

  useEffect(() => {
    if (!enabled) {
      onLiveStatus?.(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      onLiveStatus?.(false);
      return;
    }

    let debounceId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => void onInsert(), debounceMs);
    };

    const channel = supabase
      .channel(CHANNEL)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dev_events" },
        schedule,
      )
      .subscribe((status) => {
        onLiveStatus?.(status === "SUBSCRIBED");
      });

    return () => {
      clearTimeout(debounceId);
      void supabase.removeChannel(channel);
    };
  }, [enabled, onInsert, debounceMs, onLiveStatus]);
}
