"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

const ROLES = [
  { key: "admin" as const, label: "Dono" },
  { key: "coach" as const, label: "Prof" },
  { key: "aluno" as const, label: "Aluno" },
];

/**
 * Dev-only runtime role switcher. Visible only when email ∈ NEXT_PUBLIC_DEV_ROOT_EMAILS.
 */
export default function DevRoleImpersonationToggle() {
  const { isDevRoot, devImpersonation, setDevImpersonation, usingSupabaseSession } = useAuth();
  const showRlsHint = hasSupabaseEnv() && usingSupabaseSession;

  if (!isDevRoot) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="pointer-events-auto fixed bottom-20 right-4 z-[55] md:bottom-6 md:right-6"
      role="region"
      aria-label="Modo desenvolvedor: troca de papel"
    >
      <div className="flex items-center gap-1.5 rounded-2xl border border-[#EAB308]/25 bg-black/80 px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 text-[#EAB308]">
          <Shield className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex rounded-xl bg-zinc-950/90 p-0.5 ring-1 ring-zinc-800/80">
          {ROLES.map((r) => {
            const active = devImpersonation === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setDevImpersonation(r.key)}
                className={`relative min-h-9 min-w-[3.25rem] rounded-lg px-2 text-[10px] font-black uppercase tracking-wide transition-colors ${
                  active ? "text-black" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="dev-role-pill"
                    className="absolute inset-0 rounded-lg bg-[#EAB308] shadow-[0_0_18px_rgba(234,179,8,0.35)]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}
                <span className="relative z-10">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {showRlsHint ? (
        <p className="mt-1.5 max-w-[14rem] text-[9px] leading-snug text-zinc-500">
          Lista vazia no Dono? No Supabase, inclua seu e-mail de login em{" "}
          <span className="font-mono text-zinc-400">staff_access</span> como{" "}
          <span className="font-mono text-zinc-400">admin</span> — o RLS não lê este toggle, só o JWT +
          essa tabela.
        </p>
      ) : null}
    </motion.div>
  );
}
