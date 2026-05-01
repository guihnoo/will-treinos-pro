"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Payment } from "@/context/types";

export type StudentPaymentProofPayload = {
  note: string;
  attachment?: { file?: File; previewUrl?: string; fileName: string; mime: string } | null;
};

type PaymentsContextValue = {
  payments: Payment[];
  latePayments: number;
  monthlyRevenue: number;
  markPayment: (id: string) => void;
  submitStudentPaymentProof: (id: string, payload: StudentPaymentProofPayload) => void;
};

const PaymentsContext = createContext<PaymentsContextValue | undefined>(undefined);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<PaymentsContextValue>(
    () => ({
      payments: app.payments,
      latePayments: app.latePayments,
      monthlyRevenue: app.monthlyRevenue,
      markPayment: app.markPayment,
      submitStudentPaymentProof: app.submitStudentPaymentProof,
    }),
    [app.payments, app.latePayments, app.monthlyRevenue, app.markPayment, app.submitStudentPaymentProof],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error("usePayments deve ser usado dentro de PaymentsProvider");
  return ctx;
}
