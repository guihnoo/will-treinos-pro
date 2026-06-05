"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Target, Camera, MapPin, Rss, Circle } from "lucide-react";
import type { Lesson } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";

/** Chave localStorage de visita ao feed (por aluno + dia). */
function feedVisitKey(studentId: string) {
  return `wt_feed_visited_${studentId}_${localDateISO()}`;
}

function markFeedVisited(studentId: string) {
  try { localStorage.setItem(feedVisitKey(studentId), "1"); } catch { /* ignore */ }
}

function hasFeedVisitedToday(studentId: string): boolean {
  try { return !!localStorage.getItem(feedVisitKey(studentId)); } catch { return false; }
}

/**
 * Detecta check-in hoje usando o CRM id do aluno.
 * IMPORTANTE: presentStudents e checkInRequests.studentId guardam o CRM id,
 * NÃO o auth UUID — sempre passar `crmStudentId` neste componente.
 */
function hasCheckInToday(lessons: Lesson[], crmStudentId: string): boolean {
  const today = localDateISO();
  return lessons.some((lesson) => {
    if (lesson.date !== today) return false;
    if (lesson.presentStudents?.includes(crmStudentId)) return true;
    const req = lesson.checkInRequests?.find((r) => r.studentId === crmStudentId);
    return req?.status === "approved" || req?.status === "pending";
  });
}

type Props = {
  /** CRM id do aluno (students.id) — NÃO o auth UUID */
  crmStudentId: string;
  hasAvatar: boolean;
  lessons: Lesson[];
};

export default function StudentDailyMissionCard({
  crmStudentId,
  hasAvatar,
  lessons,
}: Props) {
  const [feedDone, setFeedDone] = useState(false);

  // Hidrata estado do feed no client (localStorage)
  useEffect(() => {
    setFeedDone(hasFeedVisitedToday(crmStudentId));
  }, [crmStudentId]);

  const checkInDone = useMemo(
    () => hasCheckInToday(lessons, crmStudentId),
    [lessons, crmStudentId],
  );

  const missions = useMemo(
    () => [
      {
        id: "avatar",
        label: "Enviar sua foto de perfil",
        done: hasAvatar,
        href: "/perfil",
        icon: Camera,
      },
      {
        id: "checkin",
        label: "Check-in na quadra hoje",
        done: checkInDone,
        href: "/dashboard",
        icon: MapPin,
      },
      {
        id: "feed",
        label: "Ver novidades no feed",
        done: feedDone,
        href: "/feed",
        icon: Rss,
      },
    ],
    [hasAvatar, checkInDone, feedDone],
  );

  const pendingMissions = missions.filter((m) => !m.done);

  // Esconde o card quando não há pendências (não repete missões já concluídas)
  if (pendingMissions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#EAB308]/20 bg-zinc-950/90 p-4 backdrop-blur-md"
      data-testid="student-daily-missions"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10">
          <Target className="h-4 w-4 text-[#EAB308]" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#EAB308]">
            Missão do dia
          </p>
          <p className="text-[10px] text-zinc-500">
            {pendingMissions.length} pendente{pendingMissions.length === 1 ? "" : "s"} · +XP na quadra
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {pendingMissions.map((mission) => {
          const Icon = mission.icon;
          return (
            <li key={mission.id}>
              <Link
                href={mission.href}
                onClick={() => {
                  if (mission.id === "feed") {
                    markFeedVisited(crmStudentId);
                    setFeedDone(true);
                  }
                }}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 transition-colors hover:border-[#EAB308]/25 hover:bg-[#EAB308]/5"
              >
                <Circle className="h-4 w-4 shrink-0 text-zinc-600" />
                <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span className="flex-1 text-xs font-semibold text-zinc-200">
                  {mission.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#EAB308]">
                  Ir
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
