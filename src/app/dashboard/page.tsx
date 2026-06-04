"use client";

import React, { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import CoachHome from "@/components/CoachHome";
import StudentHome from "@/components/StudentHome";
import StudentShell from "@/components/student/StudentShell";
import WillCockpit from "@/components/will/WillCockpit";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-32 h-3 rounded bg-zinc-800 animate-pulse" />
        <div className="w-20 h-2 rounded bg-zinc-900 animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, authResolved } = useAuth();

  // Enquanto auth resolve, mostrar skeleton em vez de tela preta
  if (!authResolved || !user) return <DashboardSkeleton />;

  if (user.role === "admin") return <ErrorBoundary><WillCockpit /></ErrorBoundary>;
  if (user.role === "coach") return <ErrorBoundary><CoachHome /></ErrorBoundary>;
  return (
    <ErrorBoundary>
      <StudentShell>
        <Suspense fallback={<DashboardSkeleton />}>
          <StudentHome />
        </Suspense>
      </StudentShell>
    </ErrorBoundary>
  );
}
