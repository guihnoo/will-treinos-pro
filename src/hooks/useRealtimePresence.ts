"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type StudentPresence = {
  studentId: string;
  joinedAt: string;
  lastHeartbeat: string;
  isActive: boolean;
};

export function useRealtimePresence(lessonId: string | null) {
  const [presence, setPresence] = useState<Map<string, StudentPresence>>(new Map());
  const [isLive, setIsLive] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setPresence(new Map());
      setIsLive(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channelName = `lesson:${lessonId}:presence`;
    let channel = supabase.channel(channelName);
    channelRef.current = channel;

    const schedulePresenceRefresh = () => {
      const timer = setTimeout(() => {
        void supabase
          .from("lesson_presence")
          .select("student_id, joined_at, last_heartbeat, is_active")
          .eq("lesson_id", lessonId)
          .then(({ data, error }) => {
            if (!error && data) {
              const presenceMap = new Map<string, StudentPresence>();
              data.forEach((row) => {
                presenceMap.set(row.student_id, {
                  studentId: row.student_id,
                  joinedAt: row.joined_at,
                  lastHeartbeat: row.last_heartbeat,
                  isActive: row.is_active,
                });
              });
              setPresence(presenceMap);
            }
          });
      }, 200);
      return () => clearTimeout(timer);
    };

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_presence", filter: `lesson_id=eq.${lessonId}` },
        schedulePresenceRefresh,
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    // Initial fetch
    void supabase
      .from("lesson_presence")
      .select("student_id, joined_at, last_heartbeat, is_active")
      .eq("lesson_id", lessonId)
      .then(({ data, error }) => {
        if (!error && data) {
          const presenceMap = new Map<string, StudentPresence>();
          data.forEach((row) => {
            presenceMap.set(row.student_id, {
              studentId: row.student_id,
              joinedAt: row.joined_at,
              lastHeartbeat: row.last_heartbeat,
              isActive: row.is_active,
            });
          });
          setPresence(presenceMap);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [lessonId]);

  const updatePresenceHeartbeat = useCallback(
    async (studentId: string) => {
      if (!lessonId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;

      await supabase
        .from("lesson_presence")
        .update({ last_heartbeat: new Date().toISOString(), is_active: true })
        .eq("lesson_id", lessonId)
        .eq("student_id", studentId);
    },
    [lessonId],
  );

  const recordPresence = useCallback(
    async (studentId: string) => {
      if (!lessonId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;

      await supabase.from("lesson_presence").upsert(
        {
          lesson_id: lessonId,
          student_id: studentId,
          joined_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "lesson_id,student_id" },
      );
    },
    [lessonId],
  );

  const markStudentLeft = useCallback(
    async (studentId: string) => {
      if (!lessonId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;

      await supabase
        .from("lesson_presence")
        .update({ is_active: false })
        .eq("lesson_id", lessonId)
        .eq("student_id", studentId);
    },
    [lessonId],
  );

  return {
    presence,
    isLive,
    recordPresence,
    updatePresenceHeartbeat,
    markStudentLeft,
  };
}
