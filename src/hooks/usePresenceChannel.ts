"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CHANNEL_NAME = "app-presence";
const HEARTBEAT_INTERVAL_MS = 30_000;

export type PresenceState = {
  studentId: string;
  studentName: string;
  lastSeen: string;
};

/**
 * Hook para o ALUNO: registra presença no canal Supabase Realtime.
 * Deve ser usado em um componente invisível renderizado enquanto o aluno estiver no app.
 */
export function useStudentPresence(studentId: string, studentName: string): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!studentId || !studentName) return;

    const sb = getSupabaseClient();
    if (!sb) return;

    const presencePayload: PresenceState = {
      studentId,
      studentName,
      lastSeen: new Date().toISOString(),
    };

    const channel = sb.channel(CHANNEL_NAME, {
      config: { presence: { key: studentId } },
    });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(presencePayload);
      }
    });

    // Heartbeat: update lastSeen every 30s to confirm still active
    heartbeatRef.current = setInterval(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          ...presencePayload,
          lastSeen: new Date().toISOString(),
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (channelRef.current) {
        void channelRef.current.untrack().then(() => {
          if (channelRef.current) {
            void sb.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        });
      }
    };
  }, [studentId, studentName]);
}

/**
 * Hook para o COACH: assina o canal de presença e retorna a lista de alunos online.
 */
export function useCoachPresenceView(): { onlineStudents: PresenceState[]; count: number } {
  const [onlineStudents, setOnlineStudents] = useState<PresenceState[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb.channel(CHANNEL_NAME, {
      config: { presence: { key: "coach-observer" } },
    });

    channelRef.current = channel;

    const syncPresence = () => {
      const state = channel.presenceState<PresenceState>();
      const students: PresenceState[] = [];

      for (const key of Object.keys(state)) {
        // Each key can have multiple presence entries (multi-tab); take the latest
        const entries = state[key];
        if (!entries || entries.length === 0) continue;
        const latest = entries.reduce((a, b) =>
          new Date(a.lastSeen) >= new Date(b.lastSeen) ? a : b
        );
        // Skip coach-observer key itself
        if (latest.studentId && latest.studentId !== "coach-observer") {
          students.push(latest);
        }
      }

      // Sort: most recently seen first
      students.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
      setOnlineStudents(students);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe();

    return () => {
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { onlineStudents, count: onlineStudents.length };
}
