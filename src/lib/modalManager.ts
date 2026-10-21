/**
 * Central de Modais Desacoplada (Modal Manager) para o Will Treinos PRO.
 * Implementada com useSyncExternalStore nativo do React 18/19 (zero dependências externas).
 * Permite abrir, fechar e passar dados para modais de qualquer lugar do app sem re-renderizar a página inteira.
 */

import { useSyncExternalStore, useEffect } from "react";

export type CockpitModalKey =
  | "adminSettings"
  | "appHealth"
  | "attendanceHeatmap"
  | "businessAnalytics"
  | "categoryManager"
  | "churnPrevention"
  | "coachCopilot"
  | "exportData"
  | "financialForecast"
  | "monthlyReport"
  | "turmaAnalytics"
  | "xpAnalytics"
  | "xpModeration"
  | "evaluationTemplates"
  | "weeklyChallenge"
  | "absenceTracker"
  | "broadcast"
  | "attention"
  | "coachOnboarding"
  | "importStudents"
  | (string & {});

export interface ModalState {
  activeModal: CockpitModalKey | null;
  modalPayload: Record<string, unknown> | null;
}

let currentState: ModalState = {
  activeModal: null,
  modalPayload: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const modalManager = {
  getState(): ModalState {
    return currentState;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  openModal(key: CockpitModalKey, payload: Record<string, unknown> | null = null): void {
    currentState = {
      activeModal: key,
      modalPayload: payload,
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

  isOpen(key: CockpitModalKey): boolean {
    return currentState.activeModal === key;
  },
};

/**
 * Hook para componentes consumirem o estado do modal manager com re-renders cirúrgicos.
 */
export function useModalStore(): ModalState & {
  openModal: (key: CockpitModalKey, payload?: Record<string, unknown> | null) => void;
  closeModal: () => void;
  isAnyModalOpen: boolean;
} {
  const state = useSyncExternalStore(
    modalManager.subscribe,
    modalManager.getState,
    () => currentState // SSR snapshot
  );

  // Escuta tecla ESC para fechar o modal ativo automaticamente
  useEffect(() => {
    if (!state.activeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        modalManager.closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.activeModal]);

  return {
    ...state,
    openModal: modalManager.openModal,
    closeModal: modalManager.closeModal,
    isAnyModalOpen: state.activeModal !== null,
  };
}
