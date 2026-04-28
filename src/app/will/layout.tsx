import React from "react";
import WillShell from "@/components/will/WillShell";

export default function WillLayout({ children }: { children: React.ReactNode }) {
  return <WillShell>{children}</WillShell>;
}
