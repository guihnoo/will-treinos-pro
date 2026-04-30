"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Student } from "@/context/types";

type StudentsContextValue = {
  students: Student[];
  pendingStudents: number;
  addStudent: ReturnType<typeof useApp>["addStudent"];
  updateStudent: (id: string, patch: Partial<Student>) => void;
  approveStudent: (id: string) => void;
  suspendStudent: (id: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<StudentsContextValue>(
    () => ({
      students: app.students,
      pendingStudents: app.pendingStudents,
      addStudent: app.addStudent,
      updateStudent: app.updateStudent,
      approveStudent: app.approveStudent,
      suspendStudent: app.suspendStudent,
    }),
    [app.students, app.pendingStudents, app.addStudent, app.updateStudent, app.approveStudent, app.suspendStudent],
  );

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents deve ser usado dentro de StudentsProvider");
  return ctx;
}
