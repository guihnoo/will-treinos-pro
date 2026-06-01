"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Clipboard, MessageCircle, Loader2, Check } from "lucide-react";
import type { Student } from "@/context/types";
import { useToast } from "@/components/Toast";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  student: Student;
  onClose: () => void;
}

interface ReportData {
  avgRating: number | null;
  bestFundamental: string | null;
  worstFundamental: string | null;
  totalXP: number;
  monthXP: number;
  tier: string;
  streak: number;
  lessonsThisMonth: number;
  totalLessonsAvailable: number;
  frequencyPct: number;
  weeklyHighlight: { note: string; date: string } | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`rounded bg-zinc-800/70 animate-pulse ${className ?? "h-3 w-full"}`} />;
}

function ReportSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-5/6"}`} />
      ))}
    </div>
  );
}

// ─── Report text builder ───────────────────────────────────────────────────────

function buildReportText(student: Student, data: ReportData, coachNote: string): string {
  const now = new Date();
  const monthYear = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const ratingStr = data.avgRating != null ? data.avgRating.toFixed(1) : "N/A";

  const lines: string[] = [
    `🏐 *Relatório de ${student.name} — ${monthYear}*`,
    "",
    `📊 *Progresso Técnico*`,
    `• Nota média: ${ratingStr} / 10`,
    data.bestFundamental ? `• Melhor fundamento: ${data.bestFundamental}` : "• Melhor fundamento: Sem dados",
    data.worstFundamental ? `• Ponto de atenção: ${data.worstFundamental}` : "• Ponto de atenção: Sem dados",
    "",
    `⚡ *XP & Gamificação*`,
    `• XP total: ${data.totalXP.toLocaleString("pt-BR")} XP`,
    `• XP este mês: +${data.monthXP.toLocaleString("pt-BR")} XP`,
    `• Tier atual: ${data.tier}`,
    `• Sequência: ${data.streak} ${data.streak === 1 ? "dia" : "dias"}`,
    "",
    `📅 *Presença*`,
    `• Aulas este mês: ${data.lessonsThisMonth} de ${data.totalLessonsAvailable} disponíveis`,
    `• Frequência: ${data.frequencyPct}%`,
  ];

  if (data.weeklyHighlight) {
    const d = new Date(`${data.weeklyHighlight.date}T00:00:00`);
    const label = d.toLocaleDateString("pt-BR", { day: "numeric", month: "2-digit" });
    lines.push("", `⭐ *Destaque da Semana em ${label}*`, data.weeklyHighlight.note);
  }

  if (coachNote.trim()) {
    lines.push("", `💬 *Nota do Coach:*`, coachNote.trim());
  }

  lines.push("", `— Will Treinos PRO 🏐`);

  return lines.join("\n");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentReportSheet({ student, onClose }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [coachNote, setCoachNote] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const { getSupabaseClient } = await import("@/lib/supabaseClient");
        const sb = getSupabaseClient();

        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .slice(0, 10);

        // 1. Last 3 evaluations
        const { data: evals } = await sb
          .from("evaluations")
          .select("rating, strengths, improvements, date")
          .eq("student_id", student.id)
          .order("date", { ascending: false })
          .limit(3);

        // 2. XP total + XP this month
        const { data: xpAll } = await sb
          .from("xp_log")
          .select("points, created_at")
          .eq("student_id", student.id);

        const totalXP = (xpAll ?? []).reduce((s: number, r: { points: number }) => s + (r.points ?? 0), 0);
        const monthXP = (xpAll ?? [])
          .filter((r: { created_at: string }) => r.created_at >= monthStart)
          .reduce((s: number, r: { points: number }) => s + (r.points ?? 0), 0);

        // 3. Lessons presence this month
        const { data: lessons } = await sb
          .from("lessons")
          .select("id, present_students, status")
          .gte("date", monthStart)
          .lte("date", monthEnd)
          .in("status", ["completed", "in-progress"]);

        const lessonsThisMonth = (lessons ?? []).filter((l: { present_students: string[] }) =>
          Array.isArray(l.present_students) && l.present_students.includes(student.id)
        ).length;
        const totalLessonsAvailable = (lessons ?? []).length;
        const frequencyPct =
          totalLessonsAvailable > 0
            ? Math.round((lessonsThisMonth / totalLessonsAvailable) * 100)
            : 0;

        // 4. Weekly highlight
        const { data: highlights } = await sb
          .from("weekly_highlights")
          .select("note, created_at")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const weeklyHighlight =
          highlights && highlights.length > 0
            ? {
                note: highlights[0].note as string,
                date: (highlights[0].created_at as string).slice(0, 10),
              }
            : null;

        // Derive analytics from evaluations
        const avgRating =
          evals && evals.length > 0
            ? evals.reduce((s: number, e: { rating: number }) => s + (e.rating ?? 0), 0) / evals.length
            : null;

        // Best / worst fundamental from strengths/improvements in evaluations
        const strengthsCount: Record<string, number> = {};
        const improvementsCount: Record<string, number> = {};
        for (const ev of evals ?? []) {
          for (const s of (ev.strengths as string[]) ?? []) strengthsCount[s] = (strengthsCount[s] ?? 0) + 1;
          for (const i of (ev.improvements as string[]) ?? []) improvementsCount[i] = (improvementsCount[i] ?? 0) + 1;
        }
        const bestFundamental =
          Object.keys(strengthsCount).sort((a, b) => (strengthsCount[b] ?? 0) - (strengthsCount[a] ?? 0))[0] ?? null;
        const worstFundamental =
          Object.keys(improvementsCount).sort((a, b) => (improvementsCount[b] ?? 0) - (improvementsCount[a] ?? 0))[0] ?? null;

        // Tier from student plan (simplified — use stored value)
        const tier = student.plan || "Aluno";

        // Streak: count consecutive days with present lessons before today
        const presentDates = new Set(
          (lessons ?? [])
            .filter((l: { present_students: string[] }) =>
              Array.isArray(l.present_students) && l.present_students.includes(student.id)
            )
            .map((l: { id: string }) => l.id) // we only have id, not date here — use approximation
        );
        const streak = student.attendanceHistory
          ? (() => {
              let count = 0;
              const sorted = [...student.attendanceHistory]
                .filter((a) => a.status === "present")
                .sort((a, b) => b.date.localeCompare(a.date));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              for (const entry of sorted) {
                const d = new Date(`${entry.date}T00:00:00`);
                const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
                if (diff <= count + 7) count++;
                else break;
              }
              return count;
            })()
          : 0;

        if (!cancelled) {
          setReportData({
            avgRating,
            bestFundamental,
            worstFundamental,
            totalXP,
            monthXP,
            tier,
            streak,
            lessonsThisMonth,
            totalLessonsAvailable,
            frequencyPct,
            weeklyHighlight,
          });
        }
      } catch {
        if (!cancelled) {
          setReportData({
            avgRating: null,
            bestFundamental: null,
            worstFundamental: null,
            totalXP: 0,
            monthXP: 0,
            tier: student.plan || "Aluno",
            streak: 0,
            lessonsThisMonth: 0,
            totalLessonsAvailable: 0,
            frequencyPct: 0,
            weeklyHighlight: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [student]);

  const reportText = useMemo(() => {
    if (!reportData) return "";
    return buildReportText(student, reportData, coachNote);
  }, [student, reportData, coachNote]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast("Texto copiado! Cole no WhatsApp.", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast("Erro ao copiar. Selecione o texto manualmente.", "error");
    }
  }, [reportText, toast]);

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [reportText]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      aria-label={`Relatório de ${student.name}`}
      className={`fixed inset-0 z-[240] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.08] bg-zinc-950/95 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <motion.div
            {...MODAL_HEADER_ENTER}
            transition={SPRING_PREMIUM}
            className="mb-3 shrink-0 flex items-center justify-between p-5 pb-0"
          >
            <div>
              <motion.p
                {...MODAL_BADGE_ENTER}
                transition={SPRING_PREMIUM}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400"
              >
                Relatório WhatsApp
              </motion.p>
              <h3 className="text-lg font-black text-white mt-0.5">{student.name}</h3>
            </div>
            <motion.button
              whileTap={PRESS_SCALE}
              type="button"
              onClick={onClose}
              data-testid="btn-close-report"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-200" />
            </motion.button>
          </motion.div>

          <div ref={scrollRef} className={`${MODAL_BODY_SCROLL} px-5 pb-5 space-y-4 mt-4`}>
            {/* Report preview */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Preview WhatsApp</p>
              </div>
              <div className="p-3 min-h-[120px]">
                {loading ? (
                  <ReportSkeleton />
                ) : (
                  <pre
                    className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed"
                    style={{ fontFamily: "monospace" }}
                  >
                    {reportText}
                  </pre>
                )}
              </div>
            </div>

            {/* Coach note */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Nota do Coach (opcional)
              </p>
              <textarea
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                placeholder="Adicione uma observação personalizada para este atleta…"
                rows={3}
                maxLength={400}
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={PRESS_SCALE}
                onClick={handleCopy}
                disabled={loading}
                data-testid="btn-copy-report"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/70 py-3 text-xs font-black text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4 text-zinc-400" />
                    Copiar para WhatsApp
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                whileTap={PRESS_SCALE}
                onClick={handleWhatsApp}
                disabled={loading}
                data-testid="btn-open-whatsapp"
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-3 text-xs font-black text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/15 transition-all disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Abrir WhatsApp
              </motion.button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-2 text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Buscando dados do atleta…</span>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
