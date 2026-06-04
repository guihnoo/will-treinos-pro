"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarRange, Wallet, Users,
  LogOut, Bell, User, Zap, Trophy, Home, Rss
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useNotifications } from "@/context/NotificationsContext";
import dynamic from "next/dynamic";
const NotificationPulseSheet = dynamic(
  () => import("@/components/notifications/NotificationPulseSheet"),
  { ssr: false },
);
const NotificationCommandPeek = dynamic(
  () => import("@/components/notifications/NotificationCommandPeek"),
  { ssr: false },
);
import OfflineStatusBanner from "@/components/ui/OfflineStatusBanner";
import UserAvatar from "@/components/ui/UserAvatar";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";

// Rotas permitidas por role
const ALLOWED_ROUTES: Record<string, string[]> = {
  admin:   ["/dashboard", "/agenda", "/alunos", "/financeiro", "/feed", "/configuracoes", "/cadastro", "/perfil", "/will"],
  coach:   ["/dashboard", "/agenda", "/alunos", "/perfil", "/will"],
  aluno:   ["/dashboard", "/agenda", "/ranking", "/feed", "/perfil", "/configuracoes", "/treinos"],
  visitor: ["/feed", "/perfil"],
  /** Conta Google/e-mail sem linha de aluno: só cadastro público + login. */
  pending_student: ["/cadastro", "/login", "/auth"],
};

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, usingSupabaseSession } = useAuth();
  const { pendingStudents } = useStudents();
  const { unreadNotifications } = useNotifications();
  const { latePayments } = usePayments();
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showPeek,  setShowPeek]    = useState(false);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBellEnter = useCallback(() => {
    peekTimerRef.current = setTimeout(() => setShowPeek(true), 400);
  }, []);
  const handleBellLeave = useCallback(() => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    setShowPeek(false);
  }, []);

  useEffect(() => () => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
  }, []);

  // Route guard — redireciona roles restritos para /dashboard
  useEffect(() => {
    if (!user) return;
    const routeKey =
      user.role === null && usingSupabaseSession ? "pending_student" : String(user.role ?? "");
    const allowed = ALLOWED_ROUTES[routeKey] || ["/cadastro"];
    const isAllowed = allowed.some((r) => pathname.startsWith(r));
    if (!isAllowed) router.replace(routeKey === "pending_student" ? "/cadastro?matricula=1" : "/dashboard");
  }, [pathname, user, usingSupabaseSession, router]);

  if (!user) return null;
  if (user.role === null && usingSupabaseSession) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { name: "Hoje", href: "/dashboard", icon: LayoutDashboard, badge: 0 },
          { name: "Turma", href: "/alunos", icon: Users, badge: pendingStudents },
          { name: "Agenda", href: "/agenda", icon: CalendarRange, badge: 0 },
          { name: "Gestão", href: "/financeiro", icon: Wallet, badge: latePayments },
        ];
      case "coach":
        return [
          { name: "Hoje", href: "/will/court", icon: Zap, badge: 0 },
          { name: "Turma", href: "/alunos", icon: Users, badge: 0 },
          { name: "Agenda", href: "/agenda", icon: CalendarRange, badge: 0 },
        ];
      case "aluno":
        return [
          { name: "Início",   href: "/dashboard", icon: Home,         badge: 0 },
          { name: "Agenda",   href: "/agenda",    icon: CalendarRange, badge: 0 },
          { name: "Feed",     href: "/feed",      icon: Rss,           badge: 0 },
          { name: "Ranking",  href: "/ranking",   icon: Trophy,        badge: 0 },
        ];
      case "visitor":
        return [
          { name: "Rede", href: "/feed", icon: Bell, badge: 0 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  /** Itens da barra inferior: todos os itens de nav (sem Perfil duplicado — já há atalho dedicado). */
  const mobileBottomItems = navItems.filter((item) => item.href !== "/perfil").slice(0, 4);
  const showOfflineBanner = !pathname.startsWith("/will");

  return (
    <>
      {showOfflineBanner ? <OfflineStatusBanner position="bottom" /> : null}
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex flex-col w-20 hover:w-64 z-50 transition-all duration-300 ease-in-out border-r border-zinc-900 bg-[#0A0A0A] fixed left-0 top-0 h-full group"
      >
        <div className="flex items-center gap-4 p-6 h-20 border-b border-zinc-900 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#EAB308] flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.25)]">
            W
          </div>
          <span className="font-bold text-white tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            WILL<span className="text-[#EAB308]">PRO</span>
          </span>
          {/* Bell — desktop: hover → peek, click → sheet */}
          <div
            className="relative ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100"
            onMouseEnter={handleBellEnter}
            onMouseLeave={handleBellLeave}
          >
            <motion.button
              onClick={() => { setShowPeek(false); setShowNotifs(true); }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-1.5 rounded-lg text-zinc-500 hover:text-[#EAB308] hover:bg-zinc-900 transition-colors ${FOCUS_RING_GOLD}`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#EF4444] text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </motion.button>
            {/* Peek popover — aparece no hover */}
            <NotificationCommandPeek
              showDesktop={showPeek}
              showMobile={false}
              onOpenSheet={() => { setShowPeek(false); setShowNotifs(true); }}
            />
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 p-4 flex-grow overflow-hidden">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/will/court" && pathname.startsWith("/will/"));
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href} className={`block outline-none ${FOCUS_RING_GOLD}`}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: "0 0 24px rgba(234,179,8,0.14)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 relative
                    ${isActive
                      ? "bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 shadow-[0_0_20px_rgba(234,179,8,0.16)]"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-900 hover:border hover:border-[#EAB308]/20"
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div layoutId="nav-pill" className="absolute left-0 w-1 h-8 bg-[#EAB308] rounded-r-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* USER INFO + LOGOUT */}
        <div className="mt-auto p-4 border-t border-zinc-900 flex flex-col gap-3">
          <Link href="/perfil" className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap cursor-pointer outline-none ${FOCUS_RING_GOLD}`}>
            <UserAvatar name={user.name} photo={user.avatar} size="sm" className="h-8 w-8 border border-zinc-800" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight">{user.name}</span>
              <span className="text-[#EAB308] text-[10px] uppercase font-bold tracking-widest">
                {user.role === "admin" ? "Administrador" : user.role}
              </span>
            </div>
          </Link>

          <motion.button
            onClick={logout}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-4 p-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-all duration-300 cursor-pointer ${FOCUS_RING_GOLD}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sair</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* MOBILE BOTTOM BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/97 backdrop-blur-2xl border-t border-zinc-800/80 z-50 flex justify-around items-center px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
        {mobileBottomItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/will/court" && pathname.startsWith("/will/"));
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className={`flex-1 outline-none ${FOCUS_RING_GOLD}`}>
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1 rounded-xl"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-[#EAB308]/12 border border-[#EAB308]/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#EAB308]" : "text-zinc-500"}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold transition-colors z-10 ${isActive ? "text-[#EAB308]" : "text-zinc-600"}`}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* Bell — mobile: clique → PulseSheet */}
        <motion.button
          onClick={() => setShowNotifs(true)}
          whileTap={{ scale: 0.92 }}
          className={`flex-1 relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1 rounded-xl text-zinc-500 hover:text-[#EAB308] transition-colors ${FOCUS_RING_GOLD}`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold">Avisos</span>
        </motion.button>

        {/* Profile */}
        <Link href="/perfil" className={`flex-1 outline-none ${FOCUS_RING_GOLD}`}>
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] py-1 rounded-xl"
          >
            {pathname === "/perfil" && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-[#EAB308]/12 border border-[#EAB308]/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <User className={`w-5 h-5 z-10 transition-colors ${pathname === "/perfil" ? "text-[#EAB308]" : "text-zinc-500"}`} />
            <span className={`text-[9px] font-bold z-10 ${pathname === "/perfil" ? "text-[#EAB308]" : "text-zinc-600"}`}>Perfil</span>
          </motion.div>
        </Link>
      </nav>

      {/* Pulse Inbox */}
      <NotificationPulseSheet open={showNotifs} onClose={() => setShowNotifs(false)} />

    </>
  );
}
