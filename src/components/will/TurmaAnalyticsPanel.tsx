"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, RefreshCw, TrendingUp, TrendingDown,
  AlertTriangle, Trophy, Zap, Users, CalendarCheck,
  Target, ChevronRight,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_FIXED_OVERLAY_SCROLL, MODAL_BODY_SCROLL } from "@/components/ui/modalScrollClasses";

interface TierEntry   { id?: string; label: string; emoji: string; color: string; count: number }
interface FundStat    { id: string; label: string; avgXpPerStudent: number; studentsActive: number }
interface ChurnEntry  { id: string; name: string; daysAgo: number }
interface WeekEntry   { week: string; label: string; xp: number }
interface TopEntry    { id: string; name: string; monthXP: number; totalXP: number; tier: { label: string; emoji: string } }

interface Analytics {
  activeCount:          number;
  avgMonthXP:           number;
  weekCheckins:         number;
  tierDist:             TierEntry[];
  weakestFundamental:   FundStat;
  strongestFundamental: FundStat;
  fundamentalStats:     FundStat[];
  churnRisk:            ChurnEntry[];
  weeklyTrend:          WeekEntry[];
  topPerformers:        TopEntry[];
}

async function fetchAnalytics(): Promise<Analytics | null> {
  const sb = getSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) return null;
  const res = await fetch("/api/coach/turma-analytics", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function fmtXP(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

// ── Mini bar chart (CSS) ──────────────────────────────────────────────────────
function WeekBar({ week, maxXP }: { week: WeekEntry; maxXP: number }) {
  const pct = maxXP > 0 ? Math.round((week.xp / maxXP) * 100) : 0;
  const isCurrentWeek = week.week === weekKey(new Date().toISOString());
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-[9px] text-zinc-600 font-bold">{fmtXP(week.xp)}</span>
      <div className="w-full h-14 bg-zinc-900 rounded-md overflow-hidden flex items-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(pct, 4)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full rounded-md ${isCurrentWeek ? "bg-[#EAB308]" : "bg-zinc-700"}`}
        />
      </div>
      <span className="text-[9px] text-zinc-600 text-center leading-tight">{week.label}</span>
    </div>
  );
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

// ── Tier bar ─────────────────────────────────────────────────────────────────
function TierBar({ tiers, total }: { tiers: TierEntry[]; total: number }) {
  return (
    <div className="space-y-2">
      {tiers.map(t => {
        const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
        return (
          <div key={t.id} className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">{t.emoji}</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: t.color }}
              />
            </div>
            <div className="flex items-center gap-1.5 w-20 justify-end">
              <span className="text-[10px] font-bold text-white">{t.count}</span>
              <span className="text-[10px] text-zinc-600">{t.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export default function TurmaAnalyticsPanel({ onClose }: Props) {
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics();
      if (!result) throw new Error("Erro ao carregar analytics");
      setData(result);
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount
  React.useEffect(() => { load(); }, [load]);

  async function notifyChurnStudent(studentId: string, name: string) {
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) return;
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          targetUserId: studentId,
          title: `🏐 Sentimos sua falta, ${name.split(" ")[0]}!`,
          body: "Seus treinos estão esperando por você. Volte para a quadra e continue sua jornada!",
          url: "/dashboard",
        }),
      });
      setNotified(prev => new Set([...prev, studentId]));
    } catch { /* silent */ }
  }

  const maxWeekXP = data ? Math.max(...data.weeklyTrend.map(w => w.xp), 1) : 1;
  const trend = data && data.weeklyTrend.length >= 2
    ? data.weeklyTrend[data.weeklyTrend.length - 1].xp - data.weeklyTrend[data.weeklyTrend.length - 2].xp
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm ${MODAL_FIXED_OVERLAY_SCROLL}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-w-xl mx-auto rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a]"
        style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/35 bg-indigo-500/10">
              <TrendingUp size={17} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Evolução da Turma</h2>
              <p className="text-[10px] text-zinc-500">Analytics dos últimos 12 semanas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 px-5 py-4 space-y-5 ${MODAL_BODY_SCROLL}`}>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <p className="text-xs text-zinc-500">Analisando a turma…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-bold text-zinc-400">{error}</p>
              <button onClick={load} className="text-xs text-indigo-400 font-bold underline">Tentar novamente</button>
            </div>
          )}

          {!loading && data && (
            <>
              {/* ── KPI strip ── */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Users,         label: "Ativos",       value: String(data.activeCount),      color: "text-indigo-400" },
                  { icon: Zap,           label: "XP médio/mês", value: fmtXP(data.avgMonthXP),        color: "text-amber-400"  },
                  { icon: CalendarCheck, label: "Check-ins/sem",value: String(data.weekCheckins),      color: "text-emerald-400"},
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-3 px-2">
                    <Icon size={16} className={color} />
                    <p className="text-base font-black text-white">{value}</p>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 text-center leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* ── Tier distribution ── */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Distribuição de Tiers</p>
                <TierBar tiers={data.tierDist} total={data.activeCount} />
              </div>

              {/* ── Fundamental alerts ── */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={12} className="text-red-400" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Ponto fraco</p>
                  </div>
                  <p className="text-sm font-black text-white">{data.weakestFundamental.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {fmtXP(data.weakestFundamental.avgXpPerStudent)} XP médio
                  </p>
                  <p className="text-[9px] text-red-400/70 mt-1.5 leading-tight">
                    Priorize exercícios de {data.weakestFundamental.label.toLowerCase()} nos próximos treinos.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target size={12} className="text-emerald-400" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Ponto forte</p>
                  </div>
                  <p className="text-sm font-black text-white">{data.strongestFundamental.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {fmtXP(data.strongestFundamental.avgXpPerStudent)} XP médio
                  </p>
                  <p className="text-[9px] text-emerald-400/70 mt-1.5 leading-tight">
                    A turma domina {data.strongestFundamental.label.toLowerCase()}. Use como âncora.
                  </p>
                </div>
              </div>

              {/* ── XP Trend ── */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">XP da Turma — últimas 6 semanas</p>
                  <div className={`flex items-center gap-1 text-[10px] font-black ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {trend >= 0 ? "+" : ""}{fmtXP(Math.abs(trend))} XP
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  {data.weeklyTrend.map(w => (
                    <WeekBar key={w.week} week={w} maxXP={maxWeekXP} />
                  ))}
                </div>
              </div>

              {/* ── Top performers ── */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Top do mês</p>
                <div className="space-y-2">
                  {data.topPerformers.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-zinc-600 w-4">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{p.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-zinc-600">{p.tier.emoji} {p.tier.label}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-amber-400">+{fmtXP(p.monthXP)} XP</p>
                        <p className="text-[10px] text-zinc-600">{fmtXP(p.totalXP)} total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Churn risk ── */}
              {data.churnRisk.length > 0 && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-orange-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      Risco de churn — {data.churnRisk.length} aluno{data.churnRisk.length !== 1 ? "s" : ""} inativos
                    </p>
                  </div>
                  <div className="space-y-2">
                    {data.churnRisk.map(c => (
                      <div key={c.id} className="flex items-center gap-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{c.name.split(" ")[0]}</p>
                          <p className="text-[10px] text-zinc-500">
                            {c.daysAgo >= 999 ? "Nunca teve atividade" : `Inativo há ${c.daysAgo} dias`}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => notifyChurnStudent(c.id, c.name)}
                          disabled={notified.has(c.id)}
                          className={`flex-shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition-colors ${
                            notified.has(c.id)
                              ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-400"
                              : "border-orange-700/50 bg-orange-900/20 text-orange-300 hover:bg-orange-800/30"
                          }`}
                        >
                          {notified.has(c.id) ? "✓ Notificado" : "Notificar"}
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
