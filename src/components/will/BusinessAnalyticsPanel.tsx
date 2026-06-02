"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  X,
  AlertTriangle,
  Users,
  CheckCircle2,
  BarChart3,
  Loader2,
  RefreshCw,
  Calendar,
  CreditCard,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiData {
  currentRevenue: number;
  prevRevenue: number;
  activeStudents: number;
  prevActiveStudents: number;
  retentionRate: number;
  lessonsCompleted: number;
}

interface FunnelData {
  pending: number;
  active: number;
  withCheckin: number;
  recurrent: number;
}

interface RevenueMonth {
  label: string;
  value: number;
  isCurrent: boolean;
}

interface DayEngagement {
  day: string;
  count: number;
}

interface BusinessAlert {
  id: string;
  level: "warning" | "info";
  message: string;
}

interface AnalyticsData {
  kpi: KpiData;
  funnel: FunnelData;
  revenueMonths: RevenueMonth[];
  dayEngagement: DayEngagement[];
  alerts: BusinessAlert[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function delta(current: number, prev: number): { pct: number; positive: boolean } {
  if (prev === 0) return { pct: current > 0 ? 100 : 0, positive: current >= 0 };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct: Math.abs(pct), positive: pct >= 0 };
}

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getMonthRange(offsetMonths: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  return { start, end, label };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  prev,
  format = "number",
  icon,
}: {
  label: string;
  value: number;
  prev: number;
  format?: "currency" | "number" | "percent";
  icon: React.ReactNode;
}) {
  const { pct, positive } = delta(value, prev);
  const formatted =
    format === "currency"
      ? currencyBRL(value)
      : format === "percent"
      ? `${Math.round(value)}%`
      : String(value);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800/60">
          {icon}
        </div>
        {prev > 0 && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              positive
                ? "text-emerald-300 bg-emerald-500/10"
                : "text-red-300 bg-red-500/10"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            {pct}%
          </div>
        )}
      </div>
      <p className="text-xl font-black text-white">{formatted}</p>
      <p className="text-[10px] text-zinc-500 mt-0.5 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ─── Revenue Chart (CSS bars, no library) ────────────────────────────────────

function RevenueBarChart({ months }: { months: RevenueMonth[] }) {
  const maxVal = Math.max(...months.map((m) => m.value), 1);

  return (
    <div className="flex items-end gap-2 h-28">
      {months.map((m, i) => {
        const pct = (m.value / maxVal) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-zinc-500">
              {m.value > 0 ? `R$${Math.round(m.value / 1000)}k` : ""}
            </span>
            <div className="w-full flex-1 rounded-t-lg overflow-hidden bg-zinc-800/50 relative min-h-[8px]">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                className={`absolute bottom-0 left-0 right-0 rounded-t-lg ${
                  m.isCurrent
                    ? "bg-gradient-to-t from-amber-600 to-amber-400"
                    : "bg-zinc-700"
                }`}
              />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 capitalize">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day Heatmap ──────────────────────────────────────────────────────────────

function DayHeatmap({ data }: { data: DayEngagement[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const maxDayIndex = data.reduce((best, d, i) => (d.count > data[best]!.count ? i : best), 0);
  const minDayIndex = data.reduce((best, d, i) => (d.count < data[best]!.count ? i : best), 0);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {data.map((d, i) => {
          const intensity = d.count / maxCount;
          const isMax = i === maxDayIndex;
          const isMin = i === minDayIndex;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                className={`w-full rounded-lg border ${
                  isMax
                    ? "border-amber-500/40 bg-amber-400/30"
                    : isMin
                    ? "border-zinc-700/40 bg-zinc-800/30"
                    : "border-zinc-700/30 bg-zinc-800/20"
                }`}
                style={{
                  height: `${Math.max(16, Math.round(intensity * 48))}px`,
                  opacity: 0.4 + intensity * 0.6,
                }}
              />
              <span className="text-[9px] font-bold text-zinc-500">{d.day}</span>
              <span className="text-[9px] text-zinc-600">{d.count}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-600">
        Pico: <span className="text-amber-400">{data[maxDayIndex]?.day}</span> &middot; Menor movimento:{" "}
        <span className="text-zinc-400">{data[minDayIndex]?.day}</span>
      </p>
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-white">
          {value} <span className="text-zinc-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function BusinessAnalyticsPanel({ onClose }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sb = getSupabaseClient();
    if (!sb) {
      setError("Cliente Supabase indisponível.");
      setLoading(false);
      return;
    }

    try {
      // --- Month ranges ---
      const currentMonth = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      // --- Revenue current month ---
      const [{ data: currentPayments }, { data: prevPayments }] = await Promise.all([
        sb
          .from("payments")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_at", currentMonth.start)
          .lte("paid_at", currentMonth.end + "T23:59:59"),
        sb
          .from("payments")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_at", prevMonth.start)
          .lte("paid_at", prevMonth.end + "T23:59:59"),
      ]);

      const currentRevenue = (currentPayments ?? []).reduce(
        (s: number, p: { amount: number }) => s + (p.amount ?? 0),
        0
      );
      const prevRevenue = (prevPayments ?? []).reduce(
        (s: number, p: { amount: number }) => s + (p.amount ?? 0),
        0
      );

      // --- Active students ---
      const { data: allStudents } = await sb
        .from("students")
        .select("id, status, created_at, email");

      const active = (allStudents ?? []).filter((s: { status: string }) => s.status === "active");
      const pending = (allStudents ?? []).filter((s: { status: string }) => s.status === "pending");

      // Students created before current month start = prev count
      const prevActiveStudents = active.filter(
        (s: { created_at: string }) => s.created_at < currentMonth.start
      ).length;

      // --- Lessons completed this month ---
      const { data: completedLessons } = await sb
        .from("lessons")
        .select("id, date, present_students")
        .eq("status", "completed")
        .gte("date", currentMonth.start)
        .lte("date", currentMonth.end);

      const lessonsCompleted = (completedLessons ?? []).length;

      // --- Check-ins this month per student ---
      const { data: checkIns } = await sb
        .from("xp_log")
        .select("student_id")
        .in("type", ["checkin_presencial", "checkin_externo"])
        .gte("created_at", currentMonth.start);

      const checkinByStudent = new Map<string, number>();
      for (const ci of checkIns ?? []) {
        const row = ci as { student_id: string };
        checkinByStudent.set(row.student_id, (checkinByStudent.get(row.student_id) ?? 0) + 1);
      }

      const studentsWithCheckin = active.filter((s: { id: string }) =>
        (checkinByStudent.get(s.id) ?? 0) >= 1
      ).length;
      const studentsRecurrent = active.filter((s: { id: string }) =>
        (checkinByStudent.get(s.id) ?? 0) >= 2
      ).length;

      const retentionRate =
        active.length > 0
          ? Math.round((studentsWithCheckin / active.length) * 100)
          : 0;

      // --- Revenue last 6 months ---
      const revenueMonths: RevenueMonth[] = [];
      for (let i = -5; i <= 0; i++) {
        const range = getMonthRange(i);
        const { data: payments } = await sb
          .from("payments")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_at", range.start)
          .lte("paid_at", range.end + "T23:59:59");
        const total = (payments ?? []).reduce(
          (s: number, p: { amount: number }) => s + (p.amount ?? 0),
          0
        );
        revenueMonths.push({ label: range.label, value: total, isCurrent: i === 0 });
      }

      // --- Engagement by day of week (check-ins last 30 days) ---
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentCheckins } = await sb
        .from("xp_log")
        .select("created_at")
        .in("type", ["checkin_presencial", "checkin_externo"])
        .gte("created_at", thirtyDaysAgo);

      const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun=0 … Sat=6
      for (const ci of recentCheckins ?? []) {
        const row = ci as { created_at: string };
        const day = new Date(row.created_at).getDay();
        dayCount[day] = (dayCount[day] ?? 0) + 1;
      }
      const dayEngagement: DayEngagement[] = DAYS_PT.map((day, i) => ({
        day,
        count: dayCount[i] ?? 0,
      }));

      // --- Pending students older than 3 days ---
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const oldPending = pending.filter(
        (s: { created_at: string }) => s.created_at < threeDaysAgo
      ).length;

      // --- Count inactive 7+ days ---
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentXpStudents } = await sb
        .from("xp_log")
        .select("student_id")
        .gte("created_at", sevenDaysAgo);

      const recentActiveSet = new Set(
        (recentXpStudents ?? []).map((r: { student_id: string }) => r.student_id)
      );
      const inactiveCount = active.filter(
        (s: { id: string }) => !recentActiveSet.has(s.id)
      ).length;

      // --- Build alerts ---
      const alerts: BusinessAlert[] = [];
      const { pct: revPct, positive: revPositive } = delta(currentRevenue, prevRevenue);
      if (!revPositive && revPct >= 15) {
        alerts.push({
          id: "revenue_drop",
          level: "warning",
          message: `Receita caiu ${revPct}% vs mês anterior — verificar inadimplentes`,
        });
      }
      if (inactiveCount >= 3) {
        alerts.push({
          id: "inactive_students",
          level: "warning",
          message: `${inactiveCount} alunos sem atividade há 7+ dias — considere FOMO push`,
        });
      }
      if (retentionRate < 70) {
        alerts.push({
          id: "low_retention",
          level: "warning",
          message: `Retenção em ${retentionRate}% — abaixo do ideal de 70%`,
        });
      }
      if (oldPending > 0) {
        alerts.push({
          id: "pending_approval",
          level: "warning",
          message: `${oldPending} cadastro${oldPending > 1 ? "s" : ""} pendente${oldPending > 1 ? "s" : ""} há mais de 3 dias sem aprovação`,
        });
      }

      setData({
        kpi: {
          currentRevenue,
          prevRevenue,
          activeStudents: active.length,
          prevActiveStudents,
          retentionRate,
          lessonsCompleted,
        },
        funnel: {
          pending: pending.length,
          active: active.length,
          withCheckin: studentsWithCheckin,
          recurrent: studentsRecurrent,
        },
        revenueMonths,
        dayEngagement,
        alerts,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <AnimatePresence>
      <motion.div
        key="business-analytics-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Analytics do negócio"
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP} onClick={(e) => e.stopPropagation()}>
          <motion.div
            key="business-analytics-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={SPRING_PREMIUM}
            className={MODAL_PANEL_COLUMN}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-zinc-900/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25">
                  <TrendingUp className="w-5 h-5 text-violet-300" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Analytics do Negócio</h2>
                  <p className="text-[11px] text-zinc-500">Métricas executivas em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  data-testid="business-analytics-refresh"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  aria-label="Atualizar dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="business-analytics-close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="Fechar analytics"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className={`${MODAL_BODY_SCROLL} px-5 py-5 space-y-6`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  <p className="text-sm text-zinc-500">Carregando métricas...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="mt-2 text-xs text-zinc-400 hover:text-white underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : data ? (
                <>
                  {/* Alerts */}
                  {data.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Alertas do negócio
                      </p>
                      {data.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-200/90">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* KPIs */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      KPIs do mês
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <KpiCard
                        label="Receita do mês"
                        value={data.kpi.currentRevenue}
                        prev={data.kpi.prevRevenue}
                        format="currency"
                        icon={<CreditCard className="w-4 h-4 text-emerald-400" />}
                      />
                      <KpiCard
                        label="Alunos ativos"
                        value={data.kpi.activeStudents}
                        prev={data.kpi.prevActiveStudents}
                        format="number"
                        icon={<Users className="w-4 h-4 text-blue-400" />}
                      />
                      <KpiCard
                        label="Taxa de retenção"
                        value={data.kpi.retentionRate}
                        prev={0}
                        format="percent"
                        icon={<CheckCircle2 className="w-4 h-4 text-violet-400" />}
                      />
                      <KpiCard
                        label="Aulas realizadas"
                        value={data.kpi.lessonsCompleted}
                        prev={0}
                        format="number"
                        icon={<Calendar className="w-4 h-4 text-amber-400" />}
                      />
                    </div>
                  </div>

                  {/* Funnel */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Funil de conversão
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 space-y-3">
                      <FunnelBar
                        label="Cadastros (pendentes)"
                        value={data.funnel.pending}
                        total={data.funnel.pending + data.funnel.active}
                        color="#6B7280"
                      />
                      <FunnelBar
                        label="Aprovados (ativos)"
                        value={data.funnel.active}
                        total={data.funnel.pending + data.funnel.active}
                        color="#3B82F6"
                      />
                      <FunnelBar
                        label="Com primeiro check-in"
                        value={data.funnel.withCheckin}
                        total={data.funnel.active}
                        color="#8B5CF6"
                      />
                      <FunnelBar
                        label="Recorrentes (2+ check-ins)"
                        value={data.funnel.recurrent}
                        total={data.funnel.active}
                        color="#EAB308"
                      />
                      <div className="pt-2 border-t border-zinc-800/40 grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-500">Taxa de ativação</p>
                          <p className="text-sm font-black text-white">
                            {data.funnel.pending + data.funnel.active > 0
                              ? `${Math.round((data.funnel.active / (data.funnel.pending + data.funnel.active)) * 100)}%`
                              : "—"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-500">Taxa de engajamento</p>
                          <p className="text-sm font-black text-white">
                            {data.funnel.active > 0
                              ? `${Math.round((data.funnel.withCheckin / data.funnel.active) * 100)}%`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue chart */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Receita — últimos 6 meses
                    </p>
                    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                      <RevenueBarChart months={data.revenueMonths} />
                      <p className="mt-2 text-[10px] text-zinc-600 text-center">
                        Barras em{" "}
                        <span className="text-amber-400 font-bold">âmbar</span> = mês atual
                      </p>
                    </div>
                  </div>

                  {/* Day engagement */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Engajamento por dia da semana
                    </p>
                    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                      <DayHeatmap data={data.dayEngagement} />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
