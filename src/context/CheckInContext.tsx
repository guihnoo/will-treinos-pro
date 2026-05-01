"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";

type CheckInContextValue = {
  checkInStudent: (lessonId: string, studentId: string, present: boolean) => void;
  requestCheckIn: (lessonId: string, studentId: string) => void;
  approveCheckIn: (lessonId: string, studentId: string, approvedBy: string) => void;
  rejectCheckIn: (lessonId: string, studentId: string) => void;
  endClassCheckIn: (lessonId: string, studentId: string) => void;
};

const CheckInContext = createContext<CheckInContextValue | undefined>(undefined);

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<CheckInContextValue>(
    () => ({
      checkInStudent: app.checkInStudent,
      requestCheckIn: app.requestCheckIn,
      approveCheckIn: app.approveCheckIn,
      rejectCheckIn: app.rejectCheckIn,
      endClassCheckIn: app.endClassCheckIn,
    }),
    [
      app.checkInStudent,
      app.requestCheckIn,
      app.approveCheckIn,
      app.rejectCheckIn,
      app.endClassCheckIn,
    ],
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn() {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn deve ser usado dentro de CheckInProvider");
  return ctx;
}
