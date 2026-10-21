/**
 * Central de Modais do Aluno (Student Modal Manager) — Will Treinos PRO.
 * Baseada no padrão useSyncExternalStore nativo do React 18/19 (zero dependências externas).
 * Desacopla 35+ useStates e 30+ modais do StudentHome.tsx, evitando re-renderizações desnecessárias.
 */

import { useSyncExternalStore, useEffect } from "react";
import type { Lesson, CardTier } from "@/context/types";

export type StudentModalKey =
  // Gamificação & Celebração
  | "welcome"
  | "conquistasMore"
  | "gamificationDashboard"
  | "dailyChallenges"
  | "dailyQuote"
  | "xpHistory"
  | "shareCard"
  | "track"
  | "tierUnlocked"
  | "achievementFeed"
  // Treinos, Aulas & Agenda
  | "lesson"
  | "rating"
  | "agenda"
  | "attendanceCalendar"
  | "lessonHistory"
  | "studentSchedule"
  | "absenceSheet"
  | "repositionSheet"
  | "trainingPlan"
  | "freeTraining"
  | "qrScanner"
  // Perfil, Performance & Notificações
  | "notif"
  | "notificationCenter"
  | "pushSettings"
  | "messages"
  | "studentTwin"
  | "timeline"
  | "pillar"
  | "evol"
  | "stats"
  | "referral"
  | "payments"
  | "sessionExpired"
  | (string & {});

export interface StudentModalPayloadMap {
  welcome: Record<string, unknown> | undefined;
  conquistasMore: Record<string, unknown> | undefined;
  gamificationDashboard: Record<string, unknown> | undefined;
  dailyChallenges: Record<string, unknown> | undefined;
  dailyQuote: Record<string, unknown> | undefined;
  xpHistory: Record<string, unknown> | undefined;
  shareCard: Record<string, unknown> | undefined;
  track: { trackId?: string | null };
  tierUnlocked: { tier?: CardTier | null; autoShareText?: string };
  achievementFeed: Record<string, unknown> | undefined;
  lesson: { lesson?: Lesson | null };
  rating: { lesson?: Lesson | null };
  agenda: Record<string, unknown> | undefined;
  attendanceCalendar: Record<string, unknown> | undefined;
  lessonHistory: Record<string, unknown> | undefined;
  studentSchedule: Record<string, unknown> | undefined;
  absenceSheet: Record<string, unknown> | undefined;
  repositionSheet: Record<string, unknown> | undefined;
  trainingPlan: Record<string, unknown> | undefined;
  freeTraining: Record<string, unknown> | undefined;
  qrScanner: Record<string, unknown> | undefined;
  notif: Record<string, unknown> | undefined;
  notificationCenter: Record<string, unknown> | undefined;
  pushSettings: Record<string, unknown> | undefined;
  messages: Record<string, unknown> | undefined;
  studentTwin: Record<string, unknown> | undefined;
  timeline: Record<string, unknown> | undefined;
  pillar: Record<string, unknown> | undefined;
  evol: Record<string, unknown> | undefined;
  stats: { statKey?: "aulas" | "streak" | "nota" | "freq" | null };
  referral: Record<string, unknown> | undefined;
  payments: Record<string, unknown> | undefined;
  sessionExpired: Record<string, unknown> | undefined;
  [key: string]: unknown;
}

export interface StudentModalState {
  activeModal: StudentModalKey | null;
  modalPayload: Record<string, unknown> | null;
}

let currentState: StudentModalState = {
  activeModal: null,
  modalPayload: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const studentModalManager = {
  getState(): StudentModalState {
    return currentState;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  openModal<K extends StudentModalKey>(
    key: K,
    payload: (K extends keyof StudentModalPayloadMap ? StudentModalPayloadMap[K] : Record<string, unknown>) | null = null
  ): void {
    currentState = {
      activeModal: key,
      modalPayload: payload as Record<string, unknown> | null,
    };
    notify();
  },

  closeModal(): void {
    if (currentState.activeModal === null) return;
    currentState = {
      activeModal: null,
      modalPayload: null,
    };
    notify();
  },

  isOpen(key: StudentModalKey): boolean {
    return currentState.activeModal === key;
  },
};

/**
 * Hook para componentes consumirem a Central de Modais do Aluno sem re-renderizar páginas inteiras.
 */
export function useStudentModalStore(): StudentModalState & {
  openModal: typeof studentModalManager.openModal;
  closeModal: typeof studentModalManager.closeModal;
  isAnyModalOpen: boolean;
} {
  const state = useSyncExternalStore(
    studentModalManager.subscribe,
    studentModalManager.getState,
    () => currentState
  );

  // Fecha no ESC
  useEffect(() => {
    if (!state.activeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        studentModalManager.closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.activeModal]);

  return {
    ...state,
    openModal: studentModalManager.openModal,
    closeModal: studentModalManager.closeModal,
    isAnyModalOpen: state.activeModal !== null,
  };
}
