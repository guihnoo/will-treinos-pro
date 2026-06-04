"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const CHANNEL_NAME = "app-presence";
const HEARTBEAT_INTERVAL_MS = 30_000;

export type PresenceState = {
  studentId: string;
  studentName: string;
  lastSeen: string;
};

type PresenceListener = (students: PresenceState[]) => void;

let sharedChannel: RealtimeChannel | null = null;
let channelSubscribed = false;
let presenceHandlersAttached = false;

let coachListenerCount = 0;
const coachListeners = new Set<PresenceListener>();

let studentTrackCount = 0;
let activeStudentId: string | null = null;
let activeStudentName: string | null = null;

function parsePresenceState(channel: RealtimeChannel): PresenceState[] {
  const state = channel.presenceState<PresenceState>();
  const students: PresenceState[] = [];

  for (const key of Object.keys(state)) {
    const entries = state[key];
    if (!entries || entries.length === 0) continue;
    const latest = entries.reduce((a, b) =>
      new Date(a.lastSeen) >= new Date(b.lastSeen) ? a : b,
    );
    if (latest.studentId && latest.studentId !== "coach-observer") {
      students.push(latest);
    }
  }

  students.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  return students;
}

function notifyCoachListeners() {
  if (!sharedChannel) return;
  const students = parsePresenceState(sharedChannel);
  coachListeners.forEach((listener) => listener(students));
}

function attachPresenceHandlers(channel: RealtimeChannel) {
  if (presenceHandlersAttached) return;
  channel
    .on("presence", { event: "sync" }, notifyCoachListeners)
    .on("presence", { event: "join" }, notifyCoachListeners)
    .on("presence", { event: "leave" }, notifyCoachListeners);
  presenceHandlersAttached = true;
}

async function trackActiveStudent(channel: RealtimeChannel) {
  if (!activeStudentId || !activeStudentName) return;
  try {
    await channel.track({
      studentId: activeStudentId,
      studentName: activeStudentName,
      lastSeen: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("[useStudentPresence] track falhou:", error);
  }
}

function ensureSharedChannel(sb: SupabaseClient, presenceKey: string): RealtimeChannel | null {
  try {
    if (!sharedChannel) {
      sharedChannel = sb.channel(CHANNEL_NAME, {
        config: { presence: { key: presenceKey } },
      });
      attachPresenceHandlers(sharedChannel);
    }

    if (!channelSubscribed) {
      sharedChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          channelSubscribed = true;
          await trackActiveStudent(sharedChannel!);
          notifyCoachListeners();
        }
      });
    } else if (activeStudentId) {
      void trackActiveStudent(sharedChannel);
    }

    return sharedChannel;
  } catch (error) {
    console.error("[presenceChannel] Falha ao preparar canal:", error);
    return null;
  }
}

function maybeTeardownChannel(sb: SupabaseClient) {
  if (coachListenerCount > 0 || studentTrackCount > 0 || !sharedChannel) return;
  void sb.removeChannel(sharedChannel);
  sharedChannel = null;
  channelSubscribed = false;
  presenceHandlersAttached = false;
}

/**
 * Hook para o ALUNO: registra presença no canal Supabase Realtime.
 */
export function useStudentPresence(studentId: string, studentName: string): void {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!studentId || !studentName) return;

    const sb = getSupabaseClient();
    if (!sb) return;

    activeStudentId = studentId;
    activeStudentName = studentName;
    studentTrackCount += 1;

    ensureSharedChannel(sb, studentId);

    heartbeatRef.current = setInterval(() => {
      if (!sharedChannel || !activeStudentId || !activeStudentName) return;
      void sharedChannel.track({
        studentId: activeStudentId,
        studentName: activeStudentName,
        lastSeen: new Date().toISOString(),
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      studentTrackCount = Math.max(0, studentTrackCount - 1);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (studentTrackCount === 0) {
        activeStudentId = null;
        activeStudentName = null;
        if (sharedChannel) {
          void sharedChannel.untrack().finally(() => maybeTeardownChannel(sb));
        }
      }
    };
  }, [studentId, studentName]);
}

/**
 * Hook para o COACH: assina presença (singleton — TodayView + OnlineStudentsPanel compartilham).
 */
export function useCoachPresenceView(): { onlineStudents: PresenceState[]; count: number } {
  const [onlineStudents, setOnlineStudents] = useState<PresenceState[]>([]);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const listener: PresenceListener = (students) => setOnlineStudents(students);
    coachListeners.add(listener);
    coachListenerCount += 1;

    const channel = ensureSharedChannel(sb, "coach-observer");
    if (channel && channelSubscribed) {
      listener(parsePresenceState(channel));
    }

    return () => {
      coachListeners.delete(listener);
      coachListenerCount = Math.max(0, coachListenerCount - 1);
      maybeTeardownChannel(sb);
    };
  }, []);

  return { onlineStudents, count: onlineStudents.length };
}
