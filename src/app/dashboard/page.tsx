"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import CoachHome from "@/components/CoachHome";
import StudentHome from "@/components/StudentHome";
import StudentShell from "@/components/student/StudentShell";
import WillCockpit from "@/components/will/WillCockpit";

export default function DashboardPage() {
  const { user } = useApp();

  if (!user) return null;

  if (user.role === "admin") return <WillCockpit />;
  if (user.role === "coach") return <CoachHome />;
  return (
    <StudentShell>
      <StudentHome />
    </StudentShell>
  );
}
