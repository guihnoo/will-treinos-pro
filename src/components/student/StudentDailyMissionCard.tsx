"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Target, User, MapPin, MessageCircle, CheckCircle2, Circle } from "lucide-react";
import type { Lesson } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";

type Mission = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

type Props = {
  studentId: string;
  studentName?: string;
  hasAvatar?: boolean;
  hasPosition?: boolean;
  lessons: Lesson[];
};

function hasCheckInToday(lessons: Lesson[], studentId: string): boolean {
  const today = localDateISO();
  return lessons.some((lesson) => {
    if (lesson.date !== today) return false;
    if (lesson.presentStudents?.includes(studentId)) return true;
    const req = lesson.checkInRequests?.find((r) => r.studentId === studentId);
    return req?.status === "approved" || req?.status === "pending";
  });
}

export default function StudentDailyMissionCard({
  studentId,
  studentName,
  hasAvatar,
  hasPosition,
  lessons,
}: Props) {
  const missions = useMemo<Mission[]>(() => {
    const profileDone = Boolean(studentName?.trim()) && Boolean(hasAvatar) && Boolean(hasPosition);
    const checkInDone = hasCheckInToday(lessons, studentId);
    return [
      {
        id: "profile",
        label: "Completar perfil (foto + contato)",
        done: profileDone,
        href: "/perfil",
      },
      {
        id: "checkin",
        label: "Check-in na quadra hoje",
        done: checkInDone,
        href: "/dashboard",
      },
      {
        id: "feed",
        label: "Ver novidades no feed",
        done: false,
        href: "/feed",
      },
    ];
  }, [studentId, studentName, hasAvatar, hasPosition, lessons]);

  const doneCount = missions.filter((m) => m.done).length;
  const profileDone = missions.find((m) => m.id === "profile")?.done ?? false;
  const checkInDone = missions.find((m) => m.id === "checkin")?.done ?? false;
  if (profileDone && checkInDone) return null;

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
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#EAB308]">Missão do dia</p>
          <p className="text-[10px] text-zinc-500">
            {doneCount}/{missions.length} concluídas · +XP na quadra
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {missions.map((mission) => {
          const Icon =
            mission.id === "profile" ? User : mission.id === "checkin" ? MapPin : MessageCircle;
          return (
            <li key={mission.id}>
              <Link
                href={mission.href}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 transition-colors hover:border-[#EAB308]/25 hover:bg-[#EAB308]/5"
              >
                {mission.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-600" />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span
                  className={`flex-1 text-xs font-semibold ${
                    mission.done ? "text-zinc-500 line-through" : "text-zinc-200"
                  }`}
                >
                  {mission.label}
                </span>
                {!mission.done && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#EAB308]">
                    Ir
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
