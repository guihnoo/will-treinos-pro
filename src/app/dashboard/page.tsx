"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import CoachHome from "@/components/CoachHome";
import StudentHome from "@/components/StudentHome";
import StudentShell from "@/components/student/StudentShell";
import WillCockpit from "@/components/will/WillCockpit";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") return <ErrorBoundary><WillCockpit /></ErrorBoundary>;
  if (user.role === "coach") return <ErrorBoundary><CoachHome /></ErrorBoundary>;
  return (
    <ErrorBoundary>
      <StudentShell>
        <StudentHome />
      </StudentShell>
    </ErrorBoundary>
  );
}
