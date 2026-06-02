"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, X, Share2, Sparkles } from "lucide-react";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlySummaryData {
  summary: string;
  xpGained: number;
  classesAttended: number;
  presenceRate: number;
  bestPilar: string;
  monthName: string;
  nextMonthGoal?: string;
}

interface MonthlySummaryCardProps {
  studentId: string;
  addPost?: (post: {
    user: { name: string; avatar: string; isPro: boolean };
    time: string;
    content: string;
    media: null;
    likes: number;
    comments: [];
    isLiked: boolean;
    isSaved: boolean;
    pinned: boolean;
    isOfficial: boolean;
    targetRole: "all";
  }) => void;
  userName?: string;
  userAvatar?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPrevMonthInfo(): { month: number; year: number; dismissKey: string } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = prev.getMonth() + 1;
  const year = prev.getFullYear();
  const dismissKey = `wt_monthly_summary_dismissed_${month}_${year}`;
  return { month, year, dismissKey };
}

function isDismissed(dismissKey: string): boolean {
  try {
    return localStorage.getItem(dismissKey) === "1";
  } catch {
    return false;
  }
}

function setDismissed(dismissKey: string): void {
  try {
    localStorage.setItem(dismissKey, "1");
  } catch { /* ignore */ }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 to-zinc-950 p-4">
      <div className="h-4 w-40 rounded bg-zinc-800 mb-3" />
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-zinc-800/60" />
        ))}
      </div>
      <div className="h-3 w-full rounded bg-zinc-800/60 mb-2" />
      <div className="h-3 w-4/5 rounded bg-zinc-800/60" />
    </div>
  );
}

// ─── KPI Pill ────────────────────────────────────────────────────────────────

function KpiPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-2 py-2.5 gap-0.5"
      style={{ borderColor: `${accent}30` }}
    >
      <p className="text-[13px] font-black tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MonthlySummaryCard({
  studentId,
  addPost,
  userName = "Atleta",
  userAvatar = "user",
}: MonthlySummaryCardProps) {
  const [data, setData] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissedState] = useState(false);
  const [shared, setShared] = useState(false);

  const { month, year, dismissKey } = getPrevMonthInfo();

  useEffect(() => {
    if (isDismissed(dismissKey)) {
      setDismissedState(true);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(
          `/api/ai/student-monthly-summary?studentId=${encodeURIComponent(studentId)}&month=${month}&year=${year}`
        );
        if (!res.ok) return;
        const result = (await res.json()) as MonthlySummaryData;
        setData(result);
      } catch (err) {
        console.warn("[MonthlySummaryCard] fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, month, year, dismissKey]);

  const handleDismiss = () => {
    setDismissed(dismissKey);
    setDismissedState(true);
  };

  const handleShare = () => {
    if (!data || !addPost) return;
    const content = `Meu mês de ${data.monthName} em números!\n\n${data.summary}\n\nBora pro próximo mês mais forte ainda! 🏐`;
    addPost({
      user: { name: userName, avatar: userAvatar, isPro: false },
      time: "agora",
      content,
      media: null,
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false,
      pinned: false,
      isOfficial: false,
      targetRole: "all",
    });
    setShared(true);
  };

  if (loading) return <Skeleton />;
  if (dismissed || !data) return null;

  const kpis = [
    { label: "XP ganho", value: data.xpGained.toLocaleString("pt-BR"), accent: "#EAB308" },
    { label: "Aulas", value: String(data.classesAttended), accent: "#60A5FA" },
    { label: "Presença", value: `${data.presenceRate}%`, accent: "#22C55E" },
    { label: "Melhor pilar", value: data.bestPilar, accent: "#A78BFA" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-zinc-950 to-zinc-950 p-4 relative overflow-hidden"
        data-testid="monthly-summary-card"
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: "radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.25) 0%, transparent 60%)",
          }}
        />

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          data-testid="monthly-summary-dismiss"
          className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition ${FOCUS_RING_GOLD}`}
          aria-label="Dispensar resumo mensal"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/30">
            <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">
              Resumo do mês
            </p>
            <p className="text-sm font-black text-white leading-tight">
              Seu {data.monthName} em números
            </p>
          </div>
        </div>

        {/* KPI Pills */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {kpis.map((kpi) => (
            <KpiPill key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* AI Summary text */}
        <p className="text-[12px] leading-relaxed text-zinc-300 italic mb-2">
          &ldquo;{data.summary}&rdquo;
        </p>

        {/* Next month goal */}
        {data.nextMonthGoal && (
          <div className="flex items-start gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200 font-medium">
              <span className="font-black text-amber-400">Meta para {new Date().toLocaleDateString("pt-BR", { month: "long" })}: </span>
              {data.nextMonthGoal}
            </p>
          </div>
        )}

        {/* Share button */}
        {addPost && (
          <button
            onClick={handleShare}
            disabled={shared}
            data-testid="monthly-summary-share"
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-[11px] font-black text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 transition ${FOCUS_RING_GOLD}`}
          >
            <Share2 className="h-3.5 w-3.5" />
            {shared ? "Compartilhado no Feed!" : "Compartilhar no Feed"}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
