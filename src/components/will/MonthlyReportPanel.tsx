"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bot,
  BarChart3,
  CheckCircle2,
  Coins,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, PRESS_SCALE } from "@/components/ui/motionTokens";
import type { MonthlyReportData } from "@/app/api/ai/monthly-report/route";

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, highlight = false }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${
      highlight ? "border-[#EAB308]/25 bg-[#EAB308]/[0.06]" : "border-white/[0.07] bg-white/[0.02]"
    }`}>
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className={`text-[16px] font-black ${highlight ? "text-[#EAB308]" : "text-white"}`}>{value}</p>
      {sub && <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Revenue bar ──────────────────────────────────────────────────────────────

function RevenueComparison({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const max = Math.max(thisMonth, lastMonth, 1);
  const pctThis = (thisMonth / max) * 100;
  const pctLast = (lastMonth / max) * 100;
  const up = thisMonth >= lastMonth;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-24 text-[10px] text-zinc-400 shrink-0">Este mês</span>
        <div className="flex-1 h-5 rounded-lg bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-lg bg-gradient-to-r from-emerald-600/70 to-emerald-400/50"
            initial={{ width: 0 }}
            animate={{ width: `${pctThis}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <span className="w-20 text-right text-[10px] font-black text-emerald-400 shrink-0">
          R${thisMonth.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 text-[10px] text-zinc-500 shrink-0">Mês anterior</span>
        <div className="flex-1 h-5 rounded-lg bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-lg bg-white/20"
            initial={{ width: 0 }}
            animate={{ width: `${pctLast}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        </div>
        <span className="w-20 text-right text-[10px] font-black text-zinc-500 shrink-0">
          R${lastMonth.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {up ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
        <span className={`text-[11px] font-black ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? "+" : ""}{Math.round(((thisMonth - lastMonth) / Math.max(lastMonth, 1)) * 100)}% vs mês anterior
        </span>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function MonthlyReportPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const getToken = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return "";
    const { data: { session } } = await sb.auth.getSession();
    return session?.access_token ?? "";
  }, []);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch("/api/ai/monthly-report", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: "{}",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      setData(await res.json() as MonthlyReportData);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const timeLabel = data
    ? new Date(data.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={MODAL_FIXED_OVERLAY_SCROLL} role="dialog" aria-modal="true" aria-label="Relatório Mensal">
      <div className={MODAL_OVERLAY_CENTER_WRAP}>
        <motion.div
          className={`${MODAL_PANEL_COLUMN} max-w-lg border-white/[0.08] bg-[#050505]/96 backdrop-blur-3xl`}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
            <motion.div {...MODAL_HEADER_ENTER} className="flex items-center gap-3">
              <motion.div {...MODAL_BADGE_ENTER}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10"
              >
                <BarChart3 className="h-4.5 w-4.5 text-[#EAB308]" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#EAB308]">
                  Relatório Mensal{data ? ` — ${data.period}` : ""}
                </p>
                {timeLabel && <p className="text-[9px] text-zinc-600">Gerado às {timeLabel}</p>}
              </div>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={PRESS_SCALE} onClick={() => load()}
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white disabled:opacity-40"
                aria-label="Regenerar relatório"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              </motion.button>
              <motion.button whileTap={PRESS_SCALE} onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5 space-y-4`}>
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-[#EAB308]" />
                  <p className="text-[12px] text-zinc-500">Compilando dados do mês…</p>
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            )}

            <AnimatePresence>
              {data && !loading && (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                  {/* KPI strip */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <KpiCard
                      label="Alunos ativos"
                      value={String(data.students.active)}
                      sub={`+${data.students.newThisMonth} novos este mês`}
                      icon={<Users className="h-3.5 w-3.5 text-blue-400" />}
                    />
                    <KpiCard
                      label="Check-ins"
                      value={String(data.attendance.totalCheckins)}
                      sub={`${data.attendance.avgPerActiveStudent}x por aluno`}
                      icon={<Activity className="h-3.5 w-3.5 text-emerald-400" />}
                    />
                    <KpiCard
                      label="Avaliações"
                      value={String(data.performance.evalCount)}
                      sub={data.performance.avgScoreThisMonth !== null
                        ? `Média ${data.performance.avgScoreThisMonth}/10`
                        : "Sem avaliações"}
                      icon={<Zap className="h-3.5 w-3.5 text-violet-400" />}
                    />
                    <KpiCard
                      label="Receita coletada"
                      value={`${data.revenue.collectionRate}%`}
                      sub={`R$${data.revenue.thisMonth.toLocaleString("pt-BR")} recebidos`}
                      icon={<Coins className="h-3.5 w-3.5 text-[#EAB308]" />}
                      highlight
                    />
                  </motion.div>

                  {/* Revenue comparison */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Receita — comparativo</p>
                    <RevenueComparison
                      thisMonth={data.revenue.thisMonth}
                      lastMonth={data.revenue.lastMonth}
                    />
                  </motion.div>

                  {/* Top performers */}
                  {data.topPerformers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="rounded-xl border border-[#EAB308]/20 bg-[#EAB308]/[0.05] px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="h-3.5 w-3.5 text-[#EAB308]" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#EAB308]">Top Atletas do Mês</p>
                      </div>
                      <div className="space-y-1.5">
                        {data.topPerformers.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-base">{["🥇", "🥈", "🥉"][i]}</span>
                            <p className="text-[11px] font-bold text-white flex-1">{p.name}</p>
                            <span className="text-[9px] font-bold text-zinc-500 capitalize">{p.tier}</span>
                            <span className="text-[10px] font-black text-[#EAB308]">+{p.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* AI Analysis */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-4 py-3 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-400" />
                      <p className="text-[11px] font-black uppercase tracking-wider text-violet-400">Análise Estratégica</p>
                      <Sparkles className="h-3 w-3 text-violet-400 ml-auto" />
                    </div>

                    <p className="text-[12px] text-zinc-300 leading-snug">{data.aiStrategicComment}</p>

                    {data.aiHighlights.length > 0 && (
                      <div className="space-y-1.5">
                        {data.aiHighlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-zinc-400">{h}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {data.nextMonthFocus && (
                      <div className="rounded-lg border border-[#EAB308]/20 bg-[#EAB308]/[0.07] px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Target className="h-3 w-3 text-[#EAB308]" />
                          <p className="text-[9px] font-black uppercase tracking-wider text-[#EAB308]">Foco para o próximo mês</p>
                        </div>
                        <p className="text-[11px] text-zinc-300">{data.nextMonthFocus}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Pending */}
                  {data.students.pendingApproval > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 flex items-center gap-3"
                    >
                      <Users className="h-4 w-4 text-amber-400 shrink-0" />
                      <p className="text-[11px] text-zinc-300">
                        <span className="font-black text-amber-300">{data.students.pendingApproval} alunos</span>{" "}
                        aguardando aprovação — revise no cockpit.
                      </p>
                    </motion.div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-center gap-1.5 opacity-25 pt-2">
                    <Bot className="h-3 w-3 text-zinc-500" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                      Relatório Mensal · Powered by Claude AI
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
