"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Copy, Share2, CheckCircle2, Clock, Zap, Gift } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralStatus = "pending" | "approved" | "rewarded";

interface Referral {
  id: string;
  referred_email: string;
  status: ReferralStatus;
  xp_awarded: number | null;
  created_at: string;
  rewarded_at: string | null;
}

interface Props {
  studentId: string;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  const visible = localPart.slice(0, 3);
  return `${visible}***@${domain}`;
}

const STATUS_META: Record<ReferralStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pendente",
    color: "text-zinc-400 bg-zinc-800/60 border-zinc-700/50",
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: "Aprovado",
    color: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rewarded: {
    label: "Recompensado",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    icon: <Zap className="w-3 h-3" />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReferralPanel({ studentId, onClose }: Props) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/signup?ref=${studentId}`
    : `https://willtreinospro.com.br/signup?ref=${studentId}`;

  const fetchReferrals = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) return;

    try {
      const res = await fetch("/api/student/referral", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { referrals: Referral[]; totalXpEarned: number };
      setReferrals(data.referrals ?? []);
      setTotalXpEarned(data.totalXpEarned ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReferrals();
  }, [fetchReferrals]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Will Treinos PRO",
          text: "Entre na minha equipe de vôlei! Cadastre-se pelo link:",
          url: referralLink,
        });
      } catch {
        // user cancelled — ignore
      }
    } else {
      await handleCopy();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setSubmitError("Email inválido");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const sb = getSupabaseClient();
    if (!sb) {
      setSubmitError("Erro de conexão");
      setSubmitting(false);
      return;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) {
      setSubmitError("Sessão expirada. Faça login novamente.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/student/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ referredEmail: email }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Erro ao criar indicação");
      } else {
        setSubmitSuccess(true);
        setEmailInput("");
        void fetchReferrals();
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch {
      setSubmitError("Erro de rede. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Painel de indicação"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-zinc-800 bg-[#08080A]"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#08080A]/95 backdrop-blur-sm px-5 pt-4 pb-4 border-b border-zinc-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25">
                <Users className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Indicar Amigo</h2>
                <p className="text-[11px] text-zinc-500">Ganhe XP por cada amigo aprovado</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="referral-close"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Fechar painel de indicação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pt-5 space-y-5">
          {/* XP Bonus Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30 text-2xl">
                🎁
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">+200 XP</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 border border-violet-500/30 bg-violet-500/10 rounded-full px-2 py-0.5">
                    por indicação
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Quando seu amigo for aprovado pelo coach, o XP cai automaticamente.
                </p>
              </div>
            </div>

            {totalXpEarned > 0 && (
              <div className="mt-3 pt-3 border-t border-violet-500/15 flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-bold">
                  Você já ganhou {totalXpEarned} XP com indicações!
                </span>
              </div>
            )}
          </motion.div>

          {/* Share Link */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Seu link de indicação
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <span className="flex-1 text-xs text-zinc-300 truncate font-mono">
                {referralLink}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                data-testid="referral-copy-link"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors shrink-0"
                aria-label="Copiar link de indicação"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleShare}
              data-testid="referral-share"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/15 transition-colors"
              aria-label="Compartilhar link de indicação"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar convite
            </button>
          </div>

          {/* Manual email invite */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Indicar por email
            </p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@amigo.com"
                disabled={submitting}
                data-testid="referral-email-input"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-violet-500/60 focus:outline-none transition-colors disabled:opacity-50"
              />
              <AnimatePresence>
                {submitError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 font-medium"
                  >
                    {submitError}
                  </motion.p>
                )}
                {submitSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-emerald-400 font-medium"
                  >
                    Indicação enviada com sucesso!
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={submitting || !emailInput.trim()}
                data-testid="referral-submit"
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-500 transition-colors disabled:opacity-40"
              >
                {submitting ? "Enviando..." : "Indicar este email"}
              </button>
            </form>
          </div>

          {/* Referrals list */}
          <div className="space-y-2 pb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Seus indicados ({referrals.length})
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-violet-500" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">Você ainda não indicou ninguém.</p>
                <p className="text-xs text-zinc-600 mt-1">Compartilhe seu link para começar a ganhar XP!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => {
                  const meta = STATUS_META[ref.status];
                  return (
                    <motion.div
                      key={ref.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-base flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {maskEmail(ref.referred_email)}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Indicado em {formatDate(ref.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.color}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                        {ref.status === "rewarded" && ref.xp_awarded && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            +{ref.xp_awarded} XP
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
