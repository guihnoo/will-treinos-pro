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
