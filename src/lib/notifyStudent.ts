import type { Notification, WithoutId } from "@/context/types";

/**
 * Monta payload de notificação para a inbox do aluno.
 * RLS em `notifications` filtra por `recipient_id` (= CRM `students.id`), não só `student_id`.
 */
export function buildStudentNotification(
  studentCrmId: string,
  payload: Omit<WithoutId<Notification>, "studentId" | "recipientId">,
): WithoutId<Notification> {
  return {
    ...payload,
    studentId: studentCrmId,
    recipientId: studentCrmId,
  };
}

/** Notificação in-app quando aluno é matriculado / aula criada na agenda. */
export function buildLessonScheduledNotification(
  studentCrmId: string,
  lesson: { title: string; date: string; startTime: string },
): WithoutId<Notification> {
  const dateLabel = lesson.date.split("-").reverse().join("/");
  return buildStudentNotification(studentCrmId, {
    type: "lesson_soon",
    title: "Aula agendada",
    message: `${lesson.title} — ${dateLabel} às ${lesson.startTime}`,
    time: "agora",
    read: false,
    actionUrl: "/agenda",
  });
}

/** Aviso da turma / recado ligado a uma aula específica. */
export function buildLessonBroadcastNotification(
  studentCrmId: string,
  lessonTitle: string,
  message: string,
): WithoutId<Notification> {
  return buildStudentNotification(studentCrmId, {
    type: "message",
    title: `Aviso: ${lessonTitle}`,
    message,
    time: "agora",
    read: false,
    actionUrl: "/agenda",
  });
}
