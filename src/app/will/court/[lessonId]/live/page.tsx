"use client";

import React, { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import LiveLessonCoachPanel from "@/components/LiveLessonCoachPanel";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useAuth } from "@/context/AuthContext";

export default function LiveLessonPage() {
  const router = useRouter();
  const params = useParams();
  const { lessons } = useLessons();
  const { students } = useStudents();
  const { user } = useAuth();

  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId;
  const lesson = useMemo(
    () => lessons.find((l) => l.id === lessonId),
    [lessons, lessonId]
  );

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Aula não encontrada</p>
          <button
            onClick={() => router.push("/will/court")}
            className="px-4 py-2 bg-[#EAB308] text-black rounded-lg font-bold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const coachId = user?.id || "unknown";

  return (
    <LiveLessonCoachPanel
      lesson={lesson}
      students={students}
      coachId={coachId}
      onEndLesson={() => router.push("/will/court")}
    />
  );
}
