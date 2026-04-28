"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";

const PUBLIC_ROUTES = new Set(["/", "/login", "/cadastro"]);

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();
  const isPublic = pathname ? PUBLIC_ROUTES.has(pathname) : false;

  useEffect(() => {
    if (!isPublic && !user) {
      router.replace("/login");
    }
  }, [isPublic, user, router]);

  if (isPublic) {
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-auto">
        {children}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-3">
        <div
          className="h-10 w-10 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin"
          aria-hidden
        />
        <p className="text-xs text-zinc-500 font-medium">Carregando sessão…</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main
        data-app-scroll-root
        className="flex-1 lg:pl-20 h-screen overflow-y-auto pb-24 lg:pb-0 relative min-w-0"
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
