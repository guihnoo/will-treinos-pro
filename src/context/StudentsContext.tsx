"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { Student, StudentStatus } from "@/context/types";

type StudentsContextValue = {
  students: Student[];
  statusCounts: Record<StudentStatus, number>;
  approvalQueue: Student[];
  pendingStudents: number;
  activeStudents: number;
  activeStudentsRevenue: number;
  activeStudentsAvgFrequency: number;
  getStudent: (id: string) => Student | undefined;
  addStudent: (s: Omit<Student, "id">) => Promise<Student>;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  approveStudent: (id: string) => void;
  suspendStudent: (id: string) => void;
  seedPendingTuitionForStudent: (studentId: string, monthlyValue: number, paymentDay: number) => Promise<void>;
};

const StudentsContext = createContext<StudentsContextValue | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const statusCounts = useMemo<Record<StudentStatus, number>>(
    () =>
      app.students.reduce<Record<StudentStatus, number>>(
        (acc, student) => {
          acc[student.status] += 1;
          return acc;
        },
        { active: 0, pending: 0, suspended: 0, trial: 0 },
      ),
    [app.students],
  );
  const approvalQueue = useMemo(
    () => app.students.filter((student) => student.status === "pending" || student.status === "trial"),
    [app.students],
  );
  const activeStudentsRevenue = useMemo(
    () =>
      app.students
        .filter((student) => student.status === "active")
        .reduce((sum, student) => sum + student.monthlyValue, 0),
    [app.students],
  );
  const activeStudentsAvgFrequency = useMemo(() => {
    const activeWithFrequency = app.students.filter(
      (student) => student.status === "active" && student.frequency > 0,
    );
    if (activeWithFrequency.length === 0) return 0;
    return Math.round(
      activeWithFrequency.reduce((sum, student) => sum + student.frequency, 0) /
        activeWithFrequency.length,
    );
  }, [app.students]);
  const pendingStudents = useMemo(
    () => app.students.filter((student) => student.status === "pending").length,
    [app.students],
  );
  const activeStudents = useMemo(
    () => app.students.filter((student) => student.status === "active").length,
    [app.students],
  );
  const getStudent = useCallback(
    (id: string) => app.students.find((student) => student.id === id),
    [app.students],
  );

  const value = useMemo<StudentsContextValue>(
    () => ({
      students: app.students,
      statusCounts,
      approvalQueue,
      pendingStudents,
      activeStudents,
      activeStudentsRevenue,
      activeStudentsAvgFrequency,
      getStudent,
      addStudent: app.addStudent,
      updateStudent: app.updateStudent,
      approveStudent: app.approveStudent,
      suspendStudent: app.suspendStudent,
      seedPendingTuitionForStudent: app.seedPendingTuitionForStudent,
    }),
    [
      app.students,
      statusCounts,
      approvalQueue,
      pendingStudents,
      activeStudents,
      activeStudentsRevenue,
      activeStudentsAvgFrequency,
      getStudent,
      app.addStudent,
      app.updateStudent,
      app.approveStudent,
      app.suspendStudent,
      app.seedPendingTuitionForStudent,
    ],
  );

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents deve ser usado dentro de StudentsProvider");
  return ctx;
}
