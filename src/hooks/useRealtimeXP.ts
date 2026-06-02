"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { CardTier } from "@/context/types";
import { CARD_TIER_THRESHOLDS } from "@/context/types";

export interface XPEvent {
  xp: number;
  type: string;
  multiplierType?: string;
  timestamp: string;
}

interface UseRealtimeXPOptions {
  studentId: string | null | undefined;
  initialTotalXP: number;
  onXPGained?: (xpAmount: number, event: XPEvent) => void;
  onTierUnlock?: (newTier: CardTier, xpGained: number) => void;
}

interface UseRealtimeXPReturn {
  realtimeXP: number;
  lastXPEvent: XPEvent | null;
  isConnected: boolean;
}

const TIERS: CardTier[] = ["bronze", "prata", "ouro", "diamante", "elite"];

export function useRealtimeXP({
  studentId,
  initialTotalXP,
  onXPGained,
  onTierUnlock,
}: UseRealtimeXPOptions): UseRealtimeXPReturn {
  const [realtimeXP, setRealtimeXP] = useState(0);
  const [lastXPEvent, setLastXPEvent] = useState<XPEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Track current accumulated XP to detect tier crossings
  const runningTotalRef = useRef(initialTotalXP);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>["channel"]> | null>(null);

  // Keep callbacks in refs so the subscription closure doesn't become stale
  const onXPGainedRef = useRef(onXPGained);
  const onTierUnlockRef = useRef(onTierUnlock);
  useEffect(() => { onXPGainedRef.current = onXPGained; }, [onXPGained]);
  useEffect(() => { onTierUnlockRef.current = onTierUnlock; }, [onTierUnlock]);

  // Keep initialTotalXP in sync when it changes from context
  useEffect(() => {
    runningTotalRef.current = initialTotalXP;
  }, [initialTotalXP]);

  const handleXPInsert = useCallback(
    (payload: Record<string, unknown>) => {
      const row = payload as {
        student_id?: string;
        total_xp?: number;
        base_xp?: number;
        source?: string;
        fundamental?: string;
        validation_passed?: boolean;
        created_at?: string;
      };

      // Only process validated entries for this student
      if (!row.validation_passed) return;

      const xpGained = (row.total_xp ?? row.base_xp ?? 0) as number;
      if (xpGained <= 0) return;

      const event: XPEvent = {
        xp: xpGained,
        type: row.source ?? "unknown",
        multiplierType: row.fundamental ?? undefined,
        timestamp: row.created_at ?? new Date().toISOString(),
      };

      setLastXPEvent(event);
      setRealtimeXP((prev) => prev + xpGained);

      const prevTotal = runningTotalRef.current;
      const newTotal = prevTotal + xpGained;
      runningTotalRef.current = newTotal;

      // Check tier crossings
      for (const tier of TIERS) {
        const threshold = CARD_TIER_THRESHOLDS[tier];
        if (prevTotal < threshold && newTotal >= threshold) {
          onTierUnlockRef.current?.(tier, xpGained);
          break; // Only fire once per XP event even if multiple tiers crossed
        }
      }

      onXPGainedRef.current?.(xpGained, event);
    },
    []
  );

  useEffect(() => {
    if (!studentId) return;

    const supabase = getSupabaseClient();
    const channelName = `xp-updates-${studentId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_log",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          handleXPInsert(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel).catch(() => {/* ignore cleanup errors */});
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [studentId, handleXPInsert]);

  return { realtimeXP, lastXPEvent, isConnected };
}
