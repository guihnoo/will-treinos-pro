"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import CoachHome from "@/components/CoachHome";
import StudentHome from "@/components/StudentHome";
import StudentShell from "@/components/student/StudentShell";
import WillCockpit from "@/components/will/WillCockpit";

export default function DashboardPage() {
  const { user, adminMode } = useApp();

  if (!user) return null;

  if (user.role === "admin") {
    if (adminMode === "coach") return <CoachHome />;
    return <WillCockpit />;
  }
  if (user.role === "coach") return <CoachHome />;
  return (
    <StudentShell>
      <StudentHome />
    </StudentShell>
  );
}
