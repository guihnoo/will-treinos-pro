"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import {
  cadastroInviteRequired,
  setStaffOAuthGateOk,
  clearStaffOAuthGate,
} from "@/lib/enrollmentSession";
import {
  WT_SESSION_DEV_IMPERSONATION_KEY,
  WT_SESSION_POST_LOGIN_NEXT_KEY,
  wtSessionSet,
} from "@/lib/willLocalStorage";

// Spring physics presets
const springPhysics = {
  bounce: { type: "spring" as const, stiffness: 100, damping: 10, mass: 0.8 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 25, mass: 0.5 },
  snappy: { type: "spring" as const, stiffness: 350, damping: 35, mass: 0.3 },
};

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  return raw;
}

type Stage = "roles" | "staff-auth" | "athlete-gate";
type StaffRole = "admin" | "coach";

function LoginPageContent() {
  const { login, loginWithPassword, loginWithOAuth, user, authResolved } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("roles");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [awaitingRedirect, setAwaitingRedirect] = useState(false);

  const supabaseReady = hasSupabaseEnv();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const inviteStrict = cadastroInviteRequired();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const err = q.get("error");
    if (!err) return;
    toast(decodeURIComponent(err), "error");
    window.history.replaceState(null, "", "/login");
  }, [toast]);

  useEffect(() => {
    if (!awaitingRedirect || !authResolved || !user) return;
    const dest =
      user.role === "visitor"
        ? "/feed"
        : user.role === "aluno"
          ? "/treinos"
          : "/dashboard";
    router.replace(nextPath ?? dest);
  }, [awaitingRedirect, authResolved, user, router, nextPath]);

  // Staff/dev click → unlock OAuth gate immediately
  const handleStaffCardClick = (role: StaffRole) => {
    setSelectedRole(role);
    setStaffOAuthGateOk(); // unlocks Google OAuth for staff
    if (typeof window !== "undefined") {
      wtSessionSet(WT_SESSION_DEV_IMPERSONATION_KEY, role);
    }
    setStage("staff-auth");
  };

  // Athlete click → show login form (also handles returning athletes)
  const handleAthleteClick = () => {
    if (typeof window !== "undefined") {
      wtSessionSet(WT_SESSION_DEV_IMPERSONATION_KEY, "aluno");
    }
    setStage("athlete-gate");
  };

  const handleMockLogin = (role: "admin" | "coach" | "aluno") => {
    login(role);
    toast(`✅ Login efetuado como ${role.toUpperCase()}`);
    router.push(role === "aluno" ? "/treinos" : "/dashboard");
  };

  const handleRealLogin = async () => {
    setIsSubmitting(true);
    const result = await loginWithPassword(email, password);
    setIsSubmitting(false);
    if (result.ok === false) { toast(result.message, "error"); return; }
    toast("✅ Sessão autenticada.");
    clearStaffOAuthGate();
    setAwaitingRedirect(true); // aguarda role resolver via useEffect
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    if (!supabaseReady) {
      toast("Configure as variáveis Supabase no ambiente.", "error");
      return;
    }
    if (nextPath && typeof window !== "undefined") {
      wtSessionSet(WT_SESSION_POST_LOGIN_NEXT_KEY, nextPath);
    }
    setIsSubmitting(true);
    const result = await loginWithOAuth(provider);
    setIsSubmitting(false);
    if (result.ok === false) {
      toast(`${result.message} Confira Redirect URLs no Supabase.`, "error");
    }
  };

  if (awaitingRedirect && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EAB308]/30 border-t-[#EAB308]" />
          <p className="text-xs text-zinc-500">Validando acesso…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#e5e2e1]"
      style={{ fontFamily: "'Lexend', sans-serif" }}>

      {/* ── Background ─────────────────────────────── */}
      {/* Shimmer animation for premium feel */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          animation: shimmer 3s linear infinite;
          background-size: 200% center;
        }
        @media (prefers-reduced-motion: reduce) {
          .shimmer-text { animation: none; }
        }
      `}</style>

      {/* Court grid pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 0 M0 50 L100 50 M50 0 L50 100 M0 100 L100 100' fill='none' stroke='white' stroke-opacity='1' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Gold spotlight top-left */}
      <div className="fixed -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.25) 0%, transparent 70%)", filter: "blur(120px)" }}
      />
      {/* Orange spotlight bottom-right */}
      <div className="fixed -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,106,6,0.2) 0%, transparent 70%)", filter: "blur(120px)" }}
      />

      {/* ── Main ─────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion() ? { duration: 0 } : springPhysics.smooth}
          className="flex flex-col items-center mb-10"
        >
          {/* Glass logo badge with glow */}
          <motion.div
            className="relative mb-6 p-5 rounded-full group cursor-default overflow-hidden"
            whileHover={prefersReducedMotion() ? {} : { scale: 1.08 }}
            transition={springPhysics.snappy}
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-0"
              animate={prefersReducedMotion() ? {} : { opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ background: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, transparent 70%)", filter: "blur(24px)" }}
            />
            <div className="absolute inset-0 rounded-full opacity-50"
              style={{ background: "rgba(234,179,8,0.2)", filter: "blur(24px)" }} />
            <motion.span
              className="relative text-7xl leading-none select-none"
              animate={prefersReducedMotion() ? {} : { y: [0, -4, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ color: "#ffd165" }}>⚡</motion.span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-center mb-1 shimmer-text"
            style={{ background: "linear-gradient(90deg, #EAB308 0%, #F97316 50%, #EAB308 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% center" }}>
            WILL TREINOS PRO
          </h1>
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-white/40"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Arena Digital de Elite
          </p>
          {inviteStrict && (
            <p
              className="mx-auto mt-5 max-w-md rounded-lg border border-[#EAB308]/25 bg-[#EAB308]/5 px-4 py-2.5 text-center text-[11px] leading-relaxed text-[#EAB308]/90"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <strong className="font-bold uppercase tracking-wide text-[#EAB308]">Matrícula fechada:</strong> novos atletas só entram com o link oficial da equipe (<span className="whitespace-nowrap">?invite=…</span>), validado no servidor.
            </p>
          )}
        </motion.div>

        {/* ── STAGE: Role Selection ─────────────────── */}
        <AnimatePresence mode="wait">
          {stage === "roles" && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={prefersReducedMotion() ? { duration: 0 } : { ...springPhysics.smooth, duration: 0.5 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Dono/Gestor */}
              <motion.button
                whileHover={prefersReducedMotion() ? {} : { y: -12, boxShadow: "0 20px 40px rgba(234,179,8,0.3)" }}
                whileTap={prefersReducedMotion() ? {} : { scale: 0.95 }}
                onClick={() => handleStaffCardClick("admin")}
                transition={springPhysics.snappy}
                className="relative p-8 flex flex-col items-center text-center overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem" }}
              >
                {/* Glow pulse on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  whileHover={prefersReducedMotion() ? {} : { opacity: 0.15 }}
                  transition={{ duration: 0.3 }}
                  style={{ background: "radial-gradient(circle at center, rgba(234,179,8,0.3) 0%, transparent 70%)", filter: "blur(20px)" }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at center, rgba(234,179,8,0.15) 0%, transparent 70%)" }} />
                <motion.span
                  className="text-5xl mb-5"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.2, rotate: 10 }}
                  transition={springPhysics.snappy}
                  style={{ color: "#ffd165" }}>🛡️</motion.span>
                <h3 className="text-xl font-bold italic uppercase text-white mb-2">Dono / Gestor</h3>
                <p className="text-sm text-white/50 leading-snug mb-6">Gestão tática e comando de arena profissional.</p>
                <motion.div
                  className="px-5 py-1.5 border rounded-full text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.05 }}
                  transition={springPhysics.snappy}
                  style={{ borderColor: "rgba(234,179,8,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAB308"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "inherit"; }}>
                  Acessar Painel
                </motion.div>
              </motion.button>

              {/* Professor */}
              <motion.button
                whileHover={prefersReducedMotion() ? {} : { y: -12, boxShadow: "0 20px 40px rgba(255,182,144,0.3)" }}
                whileTap={prefersReducedMotion() ? {} : { scale: 0.95 }}
                onClick={() => handleStaffCardClick("coach")}
                transition={springPhysics.snappy}
                className="relative p-8 flex flex-col items-center text-center overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem" }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  whileHover={prefersReducedMotion() ? {} : { opacity: 0.15 }}
                  transition={{ duration: 0.3 }}
                  style={{ background: "radial-gradient(circle at center, rgba(255,182,144,0.3) 0%, transparent 70%)", filter: "blur(20px)" }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at center, rgba(255,182,144,0.15) 0%, transparent 70%)" }} />
                <motion.span
                  className="text-5xl mb-5"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.2, rotate: -10 }}
                  transition={springPhysics.snappy}
                  style={{ color: "#ffb690" }}>🎓</motion.span>
                <h3 className="text-xl font-bold italic uppercase text-white mb-2">Professor</h3>
                <p className="text-sm text-white/50 leading-snug mb-6">Prescrição de treinos e acompanhamento técnico.</p>
                <motion.div
                  className="px-5 py-1.5 border rounded-full text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.05 }}
                  transition={springPhysics.snappy}
                  style={{ borderColor: "rgba(255,182,144,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#ffb690"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "inherit"; }}>
                  Iniciar Aula
                </motion.div>
              </motion.button>

              {/* Atleta VIP */}
              <motion.button
                whileHover={prefersReducedMotion() ? {} : { y: -12, boxShadow: "0 20px 40px rgba(234,179,8,0.3)" }}
                whileTap={prefersReducedMotion() ? {} : { scale: 0.95 }}
                onClick={handleAthleteClick}
                transition={springPhysics.snappy}
                className="relative p-8 flex flex-col items-center text-center overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem" }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  whileHover={prefersReducedMotion() ? {} : { opacity: 0.15 }}
                  transition={{ duration: 0.3 }}
                  style={{ background: "radial-gradient(circle at center, rgba(234,179,8,0.3) 0%, transparent 70%)", filter: "blur(20px)" }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at center, rgba(234,179,8,0.15) 0%, transparent 70%)" }} />
                <motion.span
                  className="text-5xl mb-5"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.2, rotate: -5 }}
                  transition={springPhysics.snappy}
                  style={{ color: "#eab308" }}>🏆</motion.span>
                <h3 className="text-xl font-bold italic uppercase text-white mb-2">Atleta VIP</h3>
                <p className="text-sm text-white/50 leading-snug mb-6">Performance extrema e evolução gamificada.</p>
                <motion.div
                  className="px-5 py-1.5 border rounded-full text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                  whileHover={prefersReducedMotion() ? {} : { scale: 1.05 }}
                  transition={springPhysics.snappy}
                  style={{ borderColor: "rgba(234,179,8,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EAB308"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "inherit"; }}>
                  Entrar na Arena
                </motion.div>
              </motion.button>
            </motion.div>
          )}

          {/* ── STAGE: Staff Auth ─────────────────────── */}
          {stage === "staff-auth" && (
            <motion.div
              key="staff-auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={prefersReducedMotion() ? { duration: 0 } : { ...springPhysics.smooth, duration: 0.5 }}
              className="w-full max-w-sm"
            >
              <div className="relative rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>

                {/* Gold top border */}
                <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #EAB308, transparent)" }} />

                <div className="p-7">
                  <button onClick={() => setStage("roles")} className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                    ← Voltar
                  </button>

                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: selectedRole === "admin" ? "#ffd165" : "#ffb690", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {selectedRole === "admin" ? "🛡️ Dono / Gestor" : "🎓 Professor"}
                  </p>
                  <h2 className="text-xl font-bold text-white mb-6">Acesso ao Painel</h2>

                  {/* Google OAuth — principal para staff */}
                  {supabaseReady && (
                    <motion.button
                      whileTap={prefersReducedMotion() ? {} : { scale: 0.94 }}
                      whileHover={prefersReducedMotion() ? {} : { scale: 1.02, boxShadow: "0 12px 24px rgba(234,179,8,0.4)" }}
                      onClick={() => void handleOAuthLogin("google")}
                      disabled={isSubmitting}
                      transition={springPhysics.snappy}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-semibold text-sm mb-4 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)", color: "#000" }}
                    >
                      {isSubmitting ? (
                        <motion.span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                          animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {isSubmitting ? "Conectando…" : "Entrar com Google"}
                    </motion.button>
                  )}

                  {/* Separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-white/30">ou senha</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Email + password */}
                  <div className="space-y-2.5">
                    <motion.input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={e => e.key === "Enter" && void handleRealLogin()}
                      animate={!prefersReducedMotion() && focusedField === "email" ? { scale: 1.01 } : {}}
                      transition={springPhysics.snappy}
                      className="w-full rounded-lg py-2.5 px-4 text-sm text-white bg-black/40 outline-none placeholder:text-white/30"
                      style={{
                        border: `1px solid ${focusedField === "email" ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: focusedField === "email" ? "0 0 0 3px rgba(234,179,8,0.15)" : "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                    <motion.input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={e => e.key === "Enter" && void handleRealLogin()}
                      animate={!prefersReducedMotion() && focusedField === "password" ? { scale: 1.01 } : {}}
                      transition={springPhysics.snappy}
                      className="w-full rounded-lg py-2.5 px-4 text-sm text-white bg-black/40 outline-none placeholder:text-white/30"
                      style={{
                        border: `1px solid ${focusedField === "password" ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: focusedField === "password" ? "0 0 0 3px rgba(234,179,8,0.15)" : "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                    <motion.button
                      id="btn-login-password"
                      whileTap={prefersReducedMotion() ? {} : { scale: 0.94 }}
                      whileHover={prefersReducedMotion() ? {} : { scale: 1.01 }}
                      onClick={() => void handleRealLogin()}
                      disabled={!supabaseReady || isSubmitting}
                      transition={springPhysics.snappy}
                      className="w-full py-2.5 rounded-lg text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "rgba(234,179,8,0.15)", color: "#ffd165", border: "1px solid rgba(234,179,8,0.2)" }}
                    >
                      {isSubmitting ? "Entrando…" : "Entrar com senha"}
                    </motion.button>
                  </div>

                  {/* Dev mock (local only) */}
                  {!supabaseReady && (
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      {(["admin", "coach", "aluno"] as const).map(role => (
                        <button key={role} onClick={() => handleMockLogin(role)}
                          className="py-2 rounded-lg text-[10px] font-bold text-white/40 border border-white/10 hover:border-yellow-500/40 hover:text-yellow-400 transition-colors capitalize">
                          {role === "admin" ? "Dono" : role === "coach" ? "Prof" : "Aluno"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STAGE: Athlete Gate ───────────────────── */}
          {stage === "athlete-gate" && (
            <motion.div
              key="athlete-gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={prefersReducedMotion() ? { duration: 0 } : { ...springPhysics.smooth, duration: 0.5 }}
              className="w-full max-w-sm"
            >
              <div className="relative rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>

                {/* Gold top border */}
                <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #EAB308, transparent)" }} />

                <div className="p-7">
                  <button type="button" onClick={() => setStage("roles")} className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                    ← Voltar
                  </button>

                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "#eab308", fontFamily: "'Space Grotesk', sans-serif" }}>
                    🏆 Atleta VIP
                  </p>
                  <h2 className="text-xl font-bold text-white mb-1">Entrar na Arena</h2>
                  <p className="text-xs text-white/40 mb-6">Use sua conta Google ou e-mail e senha.</p>

                  {/* Google OAuth */}
                  {supabaseReady && (
                    <motion.button
                      type="button"
                      whileTap={prefersReducedMotion() ? {} : { scale: 0.94 }}
                      whileHover={prefersReducedMotion() ? {} : { scale: 1.02, boxShadow: "0 12px 24px rgba(234,179,8,0.4)" }}
                      onClick={() => void handleOAuthLogin("google")}
                      disabled={isSubmitting}
                      transition={springPhysics.snappy}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-semibold text-sm mb-4 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)", color: "#000" }}
                    >
                      {isSubmitting ? (
                        <motion.span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                          animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {isSubmitting ? "Conectando…" : "Entrar com Google"}
                    </motion.button>
                  )}

                  {/* Separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-white/30">ou senha</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Email + password */}
                  <div className="space-y-2.5">
                    <motion.input
                      type="email"
                      autoComplete="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={e => e.key === "Enter" && void handleRealLogin()}
                      animate={!prefersReducedMotion() && focusedField === "email" ? { scale: 1.01 } : {}}
                      transition={springPhysics.snappy}
                      className="w-full rounded-lg py-2.5 px-4 text-sm text-white bg-black/40 outline-none placeholder:text-white/30"
                      style={{
                        border: `1px solid ${focusedField === "email" ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: focusedField === "email" ? "0 0 0 3px rgba(234,179,8,0.15)" : "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                    <motion.input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={e => e.key === "Enter" && void handleRealLogin()}
                      animate={!prefersReducedMotion() && focusedField === "password" ? { scale: 1.01 } : {}}
                      transition={springPhysics.snappy}
                      className="w-full rounded-lg py-2.5 px-4 text-sm text-white bg-black/40 outline-none placeholder:text-white/30"
                      style={{
                        border: `1px solid ${focusedField === "password" ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: focusedField === "password" ? "0 0 0 3px rgba(234,179,8,0.15)" : "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                    <motion.button
                      whileTap={prefersReducedMotion() ? {} : { scale: 0.94 }}
                      whileHover={prefersReducedMotion() ? {} : { scale: 1.01 }}
                      onClick={() => void handleRealLogin()}
                      disabled={!supabaseReady || isSubmitting}
                      transition={springPhysics.snappy}
                      className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "rgba(234,179,8,0.15)", color: "#ffd165", border: "1px solid rgba(234,179,8,0.2)" }}
                    >
                      {isSubmitting ? "Entrando…" : "Entrar"}
                    </motion.button>
                  </div>

                  {/* New athlete hint */}
                  <p className="mt-5 text-center text-[11px] leading-relaxed text-white/25">
                    Primeiro acesso?{" "}
                    <span className="text-[#EAB308]/50">Peça o link de convite ao seu treinador.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion() ? 0 : 0.6, duration: prefersReducedMotion() ? 0 : 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] text-white/20 uppercase tracking-widest"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Est. 2024 · Will Treinos PRO · v2.0 Elite
          </p>
        </motion.div>
      </main>

      {/* Corner badge */}
      <div className="fixed bottom-6 right-6 z-20 hidden lg:flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/30"
        style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Servidor Online
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <motion.div className="h-8 w-8 rounded-full border-2 border-yellow-500/20 border-t-yellow-500"
          animate={prefersReducedMotion() ? {} : { rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
