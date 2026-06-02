"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Coins,
  Loader2,
  RefreshCw,
  Send,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, PRESS_SCALE } from "@/components/ui/motionTokens";
import type { FinancialForecastResult, MonthData } from "@/app/api/ai/financial-forecast/route";

// ─── Revenue chart ────────────────────────────────────────────────────────────

function RevenueChart({ months, maxPotential }: { months: MonthData[]; maxPotential: number }) {
  const maxVal = Math.max(...months.map((m) => m.revenue), maxPotential * 0.5, 1);

  return (
    <div className="space-y-1.5">
      {months.map((m, i) => {
        const pct = Math.min((m.revenue / maxVal) * 100, 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 text-[9px] font-bold text-zinc-500 shrink-0">{m.label}</span>
            <div className="flex-1 h-5 rounded-lg bg-white/[0.04] overflow-hidden relative">
              <motion.div
                className={`h-full rounded-lg ${m.projected
                  ? "bg-gradient-to-r from-violet-500/50 to-violet-400/30 border border-violet-500/30 border-dashed"
                  : "bg-gradient-to-r from-emerald-600/70 to-emerald-400/50"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
              {m.projected && (
                <span className="absolute inset-0 flex items-center pl-2 text-[8px] font-bold text-violet-400">
                  projeção
                </span>
              )}
            </div>
            <span className={`w-16 text-right text-[10px] font-black shrink-0 ${
              m.projected ? "text-violet-400" : "text-emerald-400"
            }`}>
              R${m.revenue > 0 ? m.revenue.toLocaleString("pt-BR") : "0"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trend icon ───────────────────────────────────────────────────────────────

const TREND_META = {
  crescimento: { icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "Crescimento" },
  estável:     { icon: <ArrowUpRight className="h-4 w-4" />, color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/25",    label: "Estável" },
  queda:       { icon: <TrendingDown className="h-4 w-4" />, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25",     label: "Queda" },
};

const RISK_META = {
  baixo: { label: "Risco baixo",  class: "bg-emerald-500/15 text-emerald-300" },
  médio: { label: "Risco médio",  class: "bg-amber-500/15 text-amber-300" },
  alto:  { label: "Risco alto",   class: "bg-red-500/15 text-red-300" },
};

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function FinancialForecastPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<FinancialForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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
    setSent(false);

    try {
      const token = await getToken();
      const res = await fetch("/api/ai/financial-forecast", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: "{}",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      setData(await res.json() as FinancialForecastResult);
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

  const sendReminders = useCallback(async () => {
    setSending(true);
    try {
      const token = await getToken();
      await fetch("/api/cron/payment-reminder", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      });
      setSent(true);
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }, [getToken]);

  const trendMeta = data ? (TREND_META[data.insight.trend] ?? TREND_META.estável) : null;
  const timeLabel = data
    ? new Date(data.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={MODAL_FIXED_OVERLAY_SCROLL} role="dialog" aria-modal="true" aria-label="Previsão Financeira IA">
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
              <motion.div
                {...MODAL_BADGE_ENTER}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10"
              >
                <Coins className="h-4.5 w-4.5 text-emerald-400" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">Previsão Financeira</p>
                {timeLabel && <p className="text-[9px] text-zinc-600">Atualizado às {timeLabel}</p>}
              </div>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={PRESS_SCALE}
                onClick={() => load()}
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white disabled:opacity-40"
                aria-label="Recarregar previsão"
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

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5`}>
            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <p className="text-[12px] text-zinc-500">Analisando receitas e projetando caixa…</p>
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            )}

            {data && !loading && (
              <AnimatePresence>
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                  {/* KPI strip */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-2"
                  >
                    {[
                      { label: "Projeção 3m", value: `R$${Math.round(data.insight.projectedRevenue3m / 1000)}k`, icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> },
                      { label: "Potencial/mês", value: `R$${Math.round(data.maxPotential / 1000)}k`, icon: <Zap className="h-3.5 w-3.5 text-[#EAB308]" /> },
                      { label: "Em risco", value: String(data.atRisk.length), icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> },
                    ].map((kpi, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2.5 text-center">
                        <div className="flex justify-center mb-1">{kpi.icon}</div>
                        <p className="text-[13px] font-black text-white">{kpi.value}</p>
                        <p className="text-[9px] text-zinc-600">{kpi.label}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Revenue chart */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                      Receita — histórico + projeção
                    </p>
                    <RevenueChart months={data.months} maxPotential={data.maxPotential} />
                    <p className="mt-2 text-[9px] text-zinc-700">Barras sólidas = realizado · tracejadas = projeção AI</p>
                  </motion.div>

                  {/* AI insight card */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`rounded-xl border ${trendMeta!.border} ${trendMeta!.bg} px-4 py-3 space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className={`h-4 w-4 ${trendMeta!.color}`} />
                        <p className={`text-[11px] font-black uppercase tracking-wider ${trendMeta!.color}`}>
                          Análise IA
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black border ${trendMeta!.border} ${trendMeta!.color}`}>
                          {trendMeta!.icon} {trendMeta!.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${RISK_META[data.insight.riskLevel]?.class ?? ""}`}>
                          {RISK_META[data.insight.riskLevel]?.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-[12px] text-zinc-300 leading-snug">{data.insight.summary}</p>

                    <div className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#EAB308]">Ação prioritária</p>
                      <p className="text-[11px] font-bold text-zinc-200">{data.insight.topAction}</p>
                    </div>

                    {data.insight.secondaryActions.length > 0 && (
                      <div className="space-y-1">
                        {data.insight.secondaryActions.map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                            <p className="text-[10px] text-zinc-500">{a}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* At-risk students */}
                  {data.atRisk.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                      className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          <p className="text-[11px] font-black text-red-400 uppercase tracking-wider">
                            {data.atRisk.length} aluno{data.atRisk.length > 1 ? "s" : ""} com pagamento pendente
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          whileTap={PRESS_SCALE}
                          onClick={sendReminders}
                          disabled={sending || sent}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-black transition-all ${
                            sent
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          } disabled:opacity-50`}
                        >
                          {sending
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : sent
                            ? <CheckCircle2 className="h-3 w-3" />
                            : <Send className="h-3 w-3" />
                          }
                          {sent ? "Lembretes enviados" : sending ? "Enviando…" : "Enviar lembretes push"}
                        </motion.button>
                      </div>

                      <div className="space-y-1.5">
                        {data.atRisk.map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                          >
                            <div>
                              <p className="text-[11px] font-bold text-zinc-200">{s.name}</p>
                              {s.daysLate > 0 && (
                                <p className="text-[9px] text-red-400">{s.daysLate} dias em atraso</p>
                              )}
                            </div>
                            <p className="text-[11px] font-black text-red-400">
                              R${s.amount.toLocaleString("pt-BR")}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {data.atRisk.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-4 text-center"
                    >
                      <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                      <p className="text-[12px] font-black text-emerald-300">Pagamentos em dia</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Nenhum aluno com pendência este mês.</p>
                    </motion.div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-center gap-1.5 opacity-25 pt-2">
                    <Bot className="h-3 w-3 text-zinc-500" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                      Previsão Financeira · Powered by Claude AI
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
