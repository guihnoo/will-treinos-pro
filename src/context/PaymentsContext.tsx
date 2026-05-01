"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Payment } from "@/context/types";
import { paymentReferenceForDate } from "@/lib/dateUtils";
import { useCalendarTick } from "@/lib/useCalendarTick";

export type StudentPaymentProofPayload = {
  note: string;
  attachment?: { file?: File; previewUrl?: string; fileName: string; mime: string } | null;
};

type PaymentsContextValue = {
  payments: Payment[];
  latePayments: number;
  monthlyRevenue: number;
  pendingOrLatePaymentsCount: number;
  currentMonthReference: string;
  currentMonthBuckets: {
    paid: number;
    pending: number;
    late: number;
  };
  getStudentCurrentPayment: (studentId: string) => Payment | undefined;
  totalsByStatus: {
    paid: number;
    pending: number;
    late: number;
  };
  proofPendingCount: number;
  markPayment: (id: string) => void;
  submitStudentPaymentProof: (id: string, payload: StudentPaymentProofPayload) => void;
};

const PaymentsContext = createContext<PaymentsContextValue | undefined>(undefined);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const calendarTick = useCalendarTick();
  const currentMonthReference = useMemo(() => paymentReferenceForDate(), [calendarTick]);
  const latePayments = useMemo(
    () => app.payments.filter((payment) => payment.status === "late").length,
    [app.payments],
  );
  const monthlyRevenue = useMemo(
    () =>
      app.payments
        .filter((payment) => payment.status === "paid" && payment.reference === currentMonthReference)
        .reduce((sum, payment) => sum + payment.amount, 0),
    [app.payments, currentMonthReference],
  );
  const currentMonthBuckets = useMemo(() => {
    const monthPayments = app.payments.filter((payment) => payment.reference === currentMonthReference);
    return {
      paid: monthPayments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0),
      pending: monthPayments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => sum + payment.amount, 0),
      late: monthPayments
        .filter((payment) => payment.status === "late")
        .reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [app.payments, currentMonthReference]);
  const totalsByStatus = useMemo(
    () => ({
      paid: app.payments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0),
      pending: app.payments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => sum + payment.amount, 0),
      late: app.payments
        .filter((payment) => payment.status === "late")
        .reduce((sum, payment) => sum + payment.amount, 0),
    }),
    [app.payments],
  );
  const proofPendingCount = useMemo(
    () =>
      app.payments.filter(
        (payment) => payment.status !== "paid" && Boolean(payment.studentProofSubmittedAt),
      ).length,
    [app.payments],
  );

  const value = useMemo<PaymentsContextValue>(
    () => ({
      payments: app.payments,
      latePayments,
      monthlyRevenue,
      pendingOrLatePaymentsCount: app.payments.filter(
        (payment) => payment.status === "pending" || payment.status === "late",
      ).length,
      currentMonthReference,
      currentMonthBuckets,
      getStudentCurrentPayment: (studentId: string) =>
        app.payments.find(
          (payment) => payment.studentId === studentId && payment.reference === currentMonthReference,
        ),
      totalsByStatus,
      proofPendingCount,
      markPayment: app.markPayment,
      submitStudentPaymentProof: app.submitStudentPaymentProof,
    }),
    [
      app.payments,
      latePayments,
      monthlyRevenue,
      app.markPayment,
      app.submitStudentPaymentProof,
      currentMonthReference,
      currentMonthBuckets,
      totalsByStatus,
      proofPendingCount,
    ],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error("usePayments deve ser usado dentro de PaymentsProvider");
  return ctx;
}
