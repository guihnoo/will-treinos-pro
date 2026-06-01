"use client";

import React, { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Lesson } from "@/context/types";

interface Milestone {
  key: string;
  check: (data: MilestoneData) => boolean;
  title: string;
  emoji: string;
  xp: number;
}

interface MilestoneData {
  checkinCount: number;
  streak: number;
  totalXP: number;
  hasEvalScore10: boolean;
  hasReposition: boolean;
  lessonsCompleted: number;
}

const MILESTONES: Milestone[] = [
  { key: "checkin_10",  check: d => d.checkinCount >= 10,  title: "10 check-ins!",           emoji: "🔟",  xp: 50  },
  { key: "checkin_25",  check: d => d.checkinCount >= 25,  title: "25 check-ins!",           emoji: "🔥",  xp: 100 },
  { key: "checkin_50",  check: d => d.checkinCount >= 50,  title: "50 check-ins — campeão!", emoji: "💯",  xp: 200 },
  { key: "checkin_100", check: d => d.checkinCount >= 100, title: "100 check-ins — lenda!",  emoji: "🏆",  xp: 500 },
  { key: "streak_7",    check: d => d.streak >= 7,         title: "Semana perfeita!",         emoji: "📅",  xp: 75  },
  { key: "streak_30",   check: d => d.streak >= 30,        title: "30 dias consecutivos!",   emoji: "🗓️", xp: 300 },
  { key: "eval_10",     check: d => d.hasEvalScore10,      title: "Nota 10 na avaliação!",   emoji: "⭐",  xp: 150 },
  { key: "reposition",  check: d => d.hasReposition,       title: "Primeira reposição!",      emoji: "🔄",  xp: 30  },
  { key: "lessons_20",  check: d => d.lessonsCompleted >= 20, title: "20 aulas completadas!", emoji: "🎓", xp: 100 },
];

const LS_PREFIX = "wt_milestone_v1_";

interface Props {
  studentCrmId: string;
  authToken: string;
  lessons: Lesson[];
  studentId: string; // auth id for lessons check
  totalXP: number;
  streak: number;
  onUnlock?: (milestone: { title: string; emoji: string; xp: number }) => void;
}

export default function MilestoneTracker({
  studentCrmId, authToken, lessons, studentId, totalXP, streak, onUnlock,
}: Props) {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !studentCrmId || !authToken) return;
    checked.current = true;

    async function run() {
      try {
        const sb = getSupabaseClient();

        // Fetch check-in count
        const { count: checkinCount } = await sb
          .from("xp_log")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentCrmId)
          .eq("type", "checkin");

        // Check for eval score 10
        const { data: evals } = await sb
          .from("evaluations")
          .select("avg_score")
          .eq("student_id", studentCrmId)
          .gte("avg_score", 9.9)
          .limit(1);

        // Check for reposition
        const { count: reposCount } = await sb
          .from("reposition_requests")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentCrmId)
          .eq("status", "confirmed");

        const lessonsCompleted = lessons.filter(
          l => l.status === "completed" && l.presentStudents.includes(studentId)
        ).length;

        const data: MilestoneData = {
          checkinCount: checkinCount ?? 0,
          streak,
          totalXP,
          hasEvalScore10: (evals?.length ?? 0) > 0,
          hasReposition:  (reposCount ?? 0) > 0,
          lessonsCompleted,
        };

        for (const milestone of MILESTONES) {
          const lsKey = `${LS_PREFIX}${studentCrmId}_${milestone.key}`;
          if (localStorage.getItem(lsKey)) continue; // already awarded
          if (!milestone.check(data)) continue;

          // Mark as awarded
          localStorage.setItem(lsKey, "1");

          // Award XP fire-and-forget
          fetch("/api/xp/integration", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
              studentId: studentCrmId,
              points: milestone.xp,
              type: "achievement_unlock",
              multiplierType: "none",
              multiplierValue: 1,
              createdBy: "system",
            }),
          }).catch(() => {});

          // Notify parent
          onUnlock?.({ title: milestone.title, emoji: milestone.emoji, xp: milestone.xp });
          break; // one unlock per render cycle to avoid spam
        }
      } catch { /* silent */ }
    }

    run();
  }, [studentCrmId, authToken, lessons, studentId, totalXP, streak, onUnlock]);

  return null; // invisible tracker
}
