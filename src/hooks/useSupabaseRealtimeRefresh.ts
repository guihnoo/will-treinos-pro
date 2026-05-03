"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const REALTIME_CHANNEL = "willpro-realtime";
const DEBOUNCE_MS = 400;

const WATCHED_TABLES = ["students", "lessons", "payments", "notifications"] as const;

/**
 * Postgres Realtime com debounce — recarrega dados ao vivo quando tabelas mudam.
 */
export function useSupabaseRealtimeRefresh(options: {
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
  /** `true` quando o canal está SUBSCRIBED (para indicador «ao vivo» na UI). */
  onLiveStatus?: (live: boolean) => void;
}): void {
  const { enabled, onRefresh, onLiveStatus } = options;

  useEffect(() => {
    if (!enabled) {
      onLiveStatus?.(false);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let debounceId: ReturnType<typeof setTimeout>;
    const scheduleRefresh = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => void onRefresh(), DEBOUNCE_MS);
    };

    let channel = supabase.channel(REALTIME_CHANNEL);
    for (const table of WATCHED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    }
    channel.subscribe((status) => {
      onLiveStatus?.(status === "SUBSCRIBED");
    });

    return () => {
      clearTimeout(debounceId);
      void supabase.removeChannel(channel);
    };
  }, [enabled, onRefresh, onLiveStatus]);
}
