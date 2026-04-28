"use client";

import StudentShell from "@/components/student/StudentShell";

/**
 * Route group `(student)` — URLs unchanged; shared premium shell for grouped student routes.
 */
export default function StudentRouteGroupLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
