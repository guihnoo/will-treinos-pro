import { Lesson } from "@/context/types";

export function useAbsenceStreak(lessons: Lesson[], studentId: string): number {
  if (!lessons || lessons.length === 0) return 0;

  // Filtrar aulas completadas e ordenar por data (mais recente primeiro)
  const completedLessons = lessons
    .filter((lesson) => lesson.status === "completed")
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  // Contar sequência de faltas do início
  let consecutiveAbsences = 0;
  for (const lesson of completedLessons) {
    if (lesson.absentStudents?.includes(studentId)) {
      consecutiveAbsences++;
    } else {
      break; // Para na primeira presença
    }
  }

  return consecutiveAbsences;
}
