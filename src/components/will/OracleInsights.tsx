"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, RefreshCw, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { PRESS_SCALE } from "@/components/ui/motionTokens";

type InsightType = "churn" | "revenue" | "performance" | "attendance";
type Severity = "ok" | "warning" | "critical";

type Insight = {
  id: string;
  type: InsightType;
  severity: Severity;
  title: string;
  body: string;
  action?: string;
};

type OracleContext = {
  totalStudents: number;
  inactiveStudents: number;
  pendingPayments: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  weekLessons: number;
  awaitingApproval: number;
  avgRating: number | null;
};

const ICON_MAP: Record<InsightType, React.ReactNode> = {
  churn: <Users className="h-4 w-4" />,
  revenue: <TrendingUp className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
  attendance: <TrendingDown className="h-4 w-4" />,
};

const SEVERITY_STYLE: Record<Severity, { border: string; bg: string; icon: string; badge: string }> = {
  ok: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/[0.07]",
    icon: "text-[#EAB308]",
    badge: "bg-amber-500/20 text-amber-300",
  },
  critical: {
    border: "border-red-500/35",
    bg: "bg-red-500/[0.08]",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
  },
};

const SEVERITY_LABEL: Record<Severity, string> = {
  ok: "OK",
  warning: "Atenção",
  critical: "Crítico",
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

let _cachedPayload: { insights: Insight[]; ts: number } | null = null;

export default function OracleInsights({ ctx }: { ctx: OracleContext }) {
  const [insights, setInsights] = useState<Insight[]>(_cachedPayload?.insights ?? []);
  const [loading, setLoading] = useState(_cachedPayload === null);
  const [error, setError] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchInsights = useCallback(
    async (force = false) => {
      if (!force && _cachedPayload && Date.now() - _cachedPayload.ts < CACHE_TTL_MS) {
        setInsights(_cachedPayload.insights);
        return;
      }

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(false);

      try {
        const supabase = getSupabaseClient();
        if (!supabase) { setError(true); setLoading(false); return; }
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";

        const res = await fetch("/api/ai/oracle", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ctx),
          signal: ctrl.signal,
        });

        if (!res.ok) throw new Error("oracle_error");
        const data = await res.json() as { insights: Insight[]; generatedAt: string };
        _cachedPayload = { insights: data.insights, ts: Date.now() };
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    // ctx snapshot only on mount — re-fetch is manual or after TTL
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    void fetchInsights();
    return () => abortRef.current?.abort();
  }, [fetchInsights]);

  const timeLabel = generatedAt
    ? new Date(generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <section aria-label="Oráculo — análise preditiva">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EAB308]/30 bg-[#EAB308]/10">
            <Brain className="h-4 w-4 text-[#EAB308]" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EAB308]">Oráculo IA</p>
            {timeLabel && (
              <p className="text-[9px] text-zinc-500">Atualizado às {timeLabel}</p>
            )}
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={PRESS_SCALE}
          onClick={() => fetchInsights(true)}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition hover:text-white disabled:opacity-40"
          aria-label="Atualizar análise do Oráculo"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {loading && insights.length === 0 ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[68px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </motion.div>
        ) : error && insights.length === 0 ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-center"
          >
            <p className="text-xs text-red-400">Não foi possível carregar análises.</p>
            <button
              type="button"
              onClick={() => fetchInsights(true)}
              className="mt-1 text-[11px] font-bold text-red-300 underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {insights.map((insight, idx) => {
              const style = SEVERITY_STYLE[insight.severity];
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`rounded-xl border ${style.border} ${style.bg} px-3 py-2.5`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
                      {ICON_MAP[insight.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <p className="text-[11px] font-black text-white">{insight.title}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${style.badge}`}>
                          {SEVERITY_LABEL[insight.severity]}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug text-zinc-400">{insight.body}</p>
                      {insight.action && (
                        <p className="mt-1 text-[10px] font-bold text-[#EAB308]/80">{insight.action} →</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
