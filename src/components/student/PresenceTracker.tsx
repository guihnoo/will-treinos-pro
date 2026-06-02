"use client";

import { useStudentPresence } from "@/hooks/usePresenceChannel";

type Props = {
  studentId: string;
  studentName: string;
};

/**
 * Componente invisível que registra a presença do aluno no canal Realtime.
 * Renderizado no StudentHome quando o perfil do aluno está disponível.
 */
export default function PresenceTracker({ studentId, studentName }: Props) {
  useStudentPresence(studentId, studentName);
  return null;
}
