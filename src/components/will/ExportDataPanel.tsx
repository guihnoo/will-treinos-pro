"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Download, FileText, Users, Trophy, AlertCircle } from "lucide-react";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  generatePaymentsCSV,
  generateStudentsCSV,
  generateRankingCSV,
  downloadCSV,
  type RankingRow,
} from "@/lib/csvExport";
import { useToast } from "@/components/Toast";
import {
  MODAL_BADGE_ENTER,
  MODAL_HEADER_ENTER,
  MODAL_OVERLAY_FADE,
  PRESS_SCALE,
  SPRING_PREMIUM,
} from "@/components/ui/motionTokens";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";

const INTERACTIVE_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type PaymentStatusFilter = "all" | "paid" | "pending" | "late";
type StudentStatusFilter = "all" | "active" | "pending" | "suspended";

function buildMonthOptions(): { label: string; value: string }[] {
  const opts: { label: string; value: string }[] = [{ label: "Todos os meses", value: "all" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    opts.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
  }
  return opts;
}

interface Props {
  onClose: () => void;
}

export default function ExportDataPanel({ onClose }: Props) {
  const { toast } = useToast();
  const { students } = useStudents();
  const { payments } = usePayments();

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  // Payments filter state
  const [paymentMonth, setPaymentMonth] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");

  // Students filter state
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>("all");

  // XP ranking data
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);

  // Fetch XP ranking on mount
  useEffect(() => {
    let cancelled = false;
    setRankingLoading(true);

    (async () => {
      try {
        const sb = getSupabaseClient();
        const { data } = await sb
          .from("xp_log")
          .select("student_id, total_xp, source, created_at")
          .eq("validation_passed", true)
          .order("created_at", { ascending: false });

        if (cancelled || !data) return;

        // Aggregate by student
        const aggMap = new Map<string, { totalXP: number; checkins: number; lastActivity: string }>();
        for (const row of data as Array<{ student_id: string; total_xp: number; source: string; created_at: string }>) {
          const existing = aggMap.get(row.student_id);
          if (!existing) {
            aggMap.set(row.student_id, {
              totalXP: row.total_xp ?? 0,
              checkins: row.source?.includes("check_in") ? 1 : 0,
              lastActivity: row.created_at,
            });
          } else {
            existing.totalXP += row.total_xp ?? 0;
            if (row.source?.includes("check_in")) existing.checkins += 1;
            if (row.created_at > existing.lastActivity) existing.lastActivity = row.created_at;
          }
        }

        const tierLabel = (xp: number): string => {
          if (xp >= 10000) return "Elite";
          if (xp >= 6000) return "Diamante";
          if (xp >= 3000) return "Ouro";
          if (xp >= 1500) return "Prata";
          if (xp >= 500) return "Bronze";
          return "Sem tier";
        };

        const rows: RankingRow[] = [];
        for (const [studentId, agg] of aggMap.entries()) {
          const student = students.find((s) => s.id === studentId || s.authUserId === studentId);
          rows.push({
            name: student?.name ?? studentId,
            totalXP: agg.totalXP,
            tier: tierLabel(agg.totalXP),
            checkins: agg.checkins,
            lastActivity: agg.lastActivity?.slice(0, 10) ?? "",
          });
        }

        rows.sort((a, b) => b.totalXP - a.totalXP);
        if (!cancelled) setRankingRows(rows);
      } catch {
        // Supabase may not have the table yet — silently empty
        if (!cancelled) setRankingRows([]);
      } finally {
        if (!cancelled) setRankingLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [students]);

  // Filtered payments preview
  const filteredPayments = useMemo(() => {
    let result = paymentMonth === "all" ? payments : payments.filter((p) => p.reference === paymentMonth);
    if (paymentStatusFilter !== "all") result = result.filter((p) => p.status === paymentStatusFilter);
    return result;
  }, [payments, paymentMonth, paymentStatusFilter]);

  const paymentsTotal = useMemo(
    () => filteredPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    [filteredPayments]
  );

  // Filtered students preview
  const filteredStudents = useMemo(() => {
    if (studentStatusFilter === "all") return students;
    return students.filter((s) => s.status === (studentStatusFilter === "active" ? "active" : studentStatusFilter === "pending" ? "pending" : "suspended"));
  }, [students, studentStatusFilter]);

  function handlePaymentsExport() {
    const csv = generatePaymentsCSV(filteredPayments, students, paymentMonth);
    const month = paymentMonth === "all" ? "todos" : paymentMonth;
    downloadCSV(csv, `pagamentos_${month}.csv`);
    toast(`CSV de pagamentos baixado com sucesso.`);
  }

  function handleStudentsExport() {
    const csv = generateStudentsCSV(filteredStudents);
    downloadCSV(csv, `alunos_${new Date().toISOString().slice(0, 10)}.csv`);
    toast(`CSV de alunos baixado com sucesso.`);
  }

  function handleRankingExport() {
    const csv = generateRankingCSV(rankingRows);
    downloadCSV(csv, `ranking_xp_${new Date().toISOString().slice(0, 10)}.csv`);
    toast(`CSV de ranking XP baixado com sucesso.`);
  }

  const statusBtnClass = (active: boolean) =>
    `min-h-8 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
      active
        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
        : "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-500/60"
    }`;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Exportar Dados"
      className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/75`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      tabIndex={-1}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-zinc-950 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <motion.div
            {...MODAL_HEADER_ENTER}
            transition={SPRING_PREMIUM}
            className="shrink-0 flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-4 rounded-t-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Download className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Exportar Dados
                </motion.p>
                <h3 className="text-lg font-black text-white">Relatórios em CSV</h3>
              </div>
            </div>
            <motion.button
              whileTap={PRESS_SCALE}
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200 transition hover:border-white/30"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </motion.div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} p-5 space-y-5`}>

            {/* ── Seção 1: Pagamentos ── */}
            <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-black text-zinc-100">Exportar Pagamentos</p>
              </div>

              {/* Month selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Mês de referência</label>
                <select
                  data-testid="select-payment-month"
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/60"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold text-zinc-400">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "paid", "pending", "late"] as PaymentStatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-testid={`filter-payment-${s}`}
                      onClick={() => setPaymentStatusFilter(s)}
                      className={statusBtnClass(paymentStatusFilter === s)}
                    >
                      {s === "all" ? "Todos" : s === "paid" ? "Pagos" : s === "pending" ? "Pendentes" : "Atrasados"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs text-zinc-400">
                <span className="font-bold text-emerald-300">{filteredPayments.length} pagamento{filteredPayments.length !== 1 ? "s" : ""}</span>
                {" · "}
                <span className="font-semibold text-zinc-300">
                  {paymentsTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} confirmados
                </span>
              </div>

              <motion.button
                whileTap={PRESS_SCALE}
                type="button"
                data-testid="btn-export-payments"
                onClick={handlePaymentsExport}
                disabled={filteredPayments.length === 0}
                className={`w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40 ${INTERACTIVE_FOCUS_RING}`}
              >
                <Download className="h-4 w-4" />
                Baixar CSV de Pagamentos
              </motion.button>
            </section>

            {/* ── Seção 2: Alunos ── */}
            <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <p className="text-sm font-black text-zinc-100">Exportar Alunos</p>
              </div>

              {/* Status filter */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold text-zinc-400">Status dos alunos</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "pending", "suspended"] as StudentStatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-testid={`filter-student-${s}`}
                      onClick={() => setStudentStatusFilter(s)}
                      className={statusBtnClass(studentStatusFilter === s)}
                    >
                      {s === "all" ? "Todos" : s === "active" ? "Ativos" : s === "pending" ? "Pendentes" : "Suspensos"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-xs text-zinc-400">
                <span className="font-bold text-blue-300">{filteredStudents.length} aluno{filteredStudents.length !== 1 ? "s" : ""}</span>
                {" "}encontrado{filteredStudents.length !== 1 ? "s" : ""}
              </div>

              <motion.button
                whileTap={PRESS_SCALE}
                type="button"
                data-testid="btn-export-students"
                onClick={handleStudentsExport}
                disabled={filteredStudents.length === 0}
                className={`w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2.5 text-sm font-bold text-blue-100 transition hover:bg-blue-500/25 disabled:opacity-40 ${INTERACTIVE_FOCUS_RING}`}
              >
                <Download className="h-4 w-4" />
                Baixar CSV de Alunos
              </motion.button>
            </section>

            {/* ── Seção 3: XP / Gamificação ── */}
            <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#EAB308]" />
                <p className="text-sm font-black text-zinc-100">Exportar XP / Ranking</p>
              </div>

              {rankingLoading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#EAB308]/30 border-t-[#EAB308]" />
                  Carregando dados de XP...
                </div>
              ) : rankingRows.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-3 py-2 text-xs text-zinc-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Nenhum dado de XP encontrado ainda.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-[#EAB308]/20 bg-[#EAB308]/8 px-3 py-2 text-xs text-zinc-400">
                    <span className="font-bold text-[#EAB308]">{rankingRows.length} atleta{rankingRows.length !== 1 ? "s" : ""}</span>
                    {" "}no ranking
                  </div>
                  <motion.button
                    whileTap={PRESS_SCALE}
                    type="button"
                    data-testid="btn-export-ranking"
                    onClick={handleRankingExport}
                    className={`w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/15 px-4 py-2.5 text-sm font-bold text-[#EAB308] transition hover:bg-[#EAB308]/25 ${INTERACTIVE_FOCUS_RING}`}
                  >
                    <Download className="h-4 w-4" />
                    Baixar CSV de Ranking
                  </motion.button>
                </>
              )}
            </section>

          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
