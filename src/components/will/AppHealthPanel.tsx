"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Users, CheckCircle2, Bell, TrendingUp, Loader2, MessageCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP } from "@/components/ui/modalScrollClasses";
import { SPRING_PREMIUM } from "@/components/ui/motionTokens";

interface DayActivity {
  date: string;
  count: number;
}

interface TopStudent {
  studentId: string;
  name: string;
  count: number;
}

interface HealthData {
  dau7: DayActivity[];
  dauAvg: number;
  checkinRate: number;
  pushSubscriptions: number;
  activeStudentsCount: number;
  noLoginStudents: Array<{ id: string; name: string; phone: string }>;
  top5: TopStudent[];
}

interface AppHealthPanelProps {
  onClose: () => void;
}

export default function AppHealthPanel({ onClose }: AppHealthPanelProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sb = getSupabaseClient();
        if (!sb) {
          setError("Supabase não configurado.");
          return;
        }

        const now = new Date();
        const day30Ago = new Date(now);
        day30Ago.setDate(now.getDate() - 30);
        const day7Ago = new Date(now);
        day7Ago.setDate(now.getDate() - 7);

        const day30Str = day30Ago.toISOString().slice(0, 10);
        const day7Str = day7Ago.toISOString().slice(0, 10);

        // 1. DAU 7 days: xp_log entries grouped by day (distinct student_id per day)
        const { data: xpLog7 } = await sb
          .from("xp_log")
          .select("student_id, created_at")
          .gte("created_at", day7Ago.toISOString())
          .order("created_at", { ascending: true });

        const dauMap = new Map<string, Set<string>>();
        if (xpLog7) {
          for (const row of xpLog7 as Array<{ student_id: string; created_at: string }>) {
            const day = row.created_at.slice(0, 10);
            if (!dauMap.has(day)) dauMap.set(day, new Set());
            dauMap.get(day)!.add(row.student_id);
          }
        }
        const dau7: DayActivity[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          dau7.push({ date: ds, count: dauMap.get(ds)?.size ?? 0 });
        }
        const dauAvg = dau7.length > 0 ? Math.round(dau7.reduce((s, d) => s + d.count, 0) / dau7.length) : 0;

        // 2. Check-in rate — completed lessons in last 30 days
        const { data: completedLessons } = await sb
          .from("lessons")
          .select("enrolled_students, present_students")
          .eq("status", "completed")
          .gte("date", day30Str);

        let totalEnrolled = 0;
        let totalPresent = 0;
        if (completedLessons) {
          for (const l of completedLessons as Array<{ enrolled_students: string[] | null; present_students: string[] | null }>) {
            const e = l.enrolled_students?.length ?? 0;
            const p = l.present_students?.length ?? 0;
            totalEnrolled += e;
            totalPresent += p;
          }
        }
        const checkinRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

        // 3. Push subscriptions count
        const { count: pushCount } = await sb
          .from("push_subscriptions")
          .select("*", { count: "exact", head: true });

        // 4. Active students
        const { data: activeStudents } = await sb
          .from("students")
          .select("id, name, phone, auth_user_id")
          .eq("status", "active");

        const activeCount = activeStudents?.length ?? 0;

        // 5. Students with no XP (never logged in effectively)
        const { data: studentsWithXP } = await sb
          .from("xp_log")
          .select("student_id");

        const xpStudentIds = new Set(
          (studentsWithXP as Array<{ student_id: string }> | null)?.map((r) => r.student_id) ?? []
        );

        const noLogin = (activeStudents as Array<{ id: string; name: string; phone: string; auth_user_id: string | null }> | null)
          ?.filter((s) => !xpStudentIds.has(s.id) && !s.auth_user_id)
          .slice(0, 10) ?? [];

        // 6. Top 5 most active in last 30 days
        const { data: xpLog30 } = await sb
          .from("xp_log")
          .select("student_id")
          .gte("created_at", day30Ago.toISOString());

        const countMap = new Map<string, number>();
        if (xpLog30) {
          for (const row of xpLog30 as Array<{ student_id: string }>) {
            countMap.set(row.student_id, (countMap.get(row.student_id) ?? 0) + 1);
          }
        }
        const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

        // Resolve names
        const topIds = sorted.map(([id]) => id);
        let topNames: Map<string, string> = new Map();
        if (topIds.length > 0) {
          const { data: topStudents } = await sb
            .from("students")
            .select("id, name")
            .in("id", topIds);
          if (topStudents) {
            for (const s of topStudents as Array<{ id: string; name: string }>) {
              topNames.set(s.id, s.name);
            }
          }
        }
        const top5 = sorted.map(([id, count]) => ({
          studentId: id,
          name: topNames.get(id) ?? "Atleta",
          count,
        }));

        if (!cancelled) {
          setData({
            dau7,
            dauAvg,
            checkinRate,
            pushSubscriptions: pushCount ?? 0,
            activeStudentsCount: activeCount,
            noLoginStudents: noLogin,
            top5,
          });
        }
      } catch (e) {
        if (!cancelled) setError("Erro ao carregar métricas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  const maxDau = useMemo(() => Math.max(1, ...(data?.dau7.map((d) => d.count) ?? [1])), [data]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "DAU médio / 7d",
        value: String(data.dauAvg),
        icon: Activity,
        color: "#EAB308",
      },
      {
        label: "Taxa de check-in",
        value: `${data.checkinRate}%`,
        icon: CheckCircle2,
        color: "#22C55E",
      },
      {
        label: "Push ativas",
        value: String(data.pushSubscriptions),
        icon: Bell,
        color: "#60A5FA",
      },
      {
        label: "Alunos ativos",
        value: String(data.activeStudentsCount),
        icon: Users,
        color: "#A78BFA",
      },
    ];
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Painel de Saúde do App"
      data-modal-overlay
      className={`fixed inset-0 z-[250] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div className={MODAL_OVERLAY_CENTER_WRAP}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#050505]/96 shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400">
                Operações
              </p>
              <h2 className="text-base font-black text-white">Saúde do App</h2>
              <p className="text-[11px] text-zinc-500">Métricas de engajamento em tempo real</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onClose}
              data-testid="btn-app-health-close"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-400 hover:text-white transition-colors"
              aria-label="Fechar painel de saúde"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} space-y-5 px-5 py-4`}>
            {loading && (
              <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando métricas…</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!loading && data && (
              <>
                {/* KPI Strip 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: kpi.color }} />
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 truncate">
                            {kpi.label}
                          </p>
                        </div>
                        <p className="text-2xl font-black tabular-nums text-white">{kpi.value}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* DAU bar chart — 7 days */}
                <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-4">
                    Usuários ativos por dia (7d)
                  </p>
                  <div className="flex items-end gap-1.5 h-20">
                    {data.dau7.map((day, i) => {
                      const pct = (day.count / maxDau) * 100;
                      const dayLabel = new Date(day.date + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "narrow",
                      });
                      return (
                        <motion.div
                          key={day.date}
                          className="flex flex-1 flex-col items-center gap-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <p className="text-[9px] text-zinc-600 tabular-nums font-bold">{day.count > 0 ? day.count : ""}</p>
                          <div className="relative w-full flex items-end" style={{ height: 52 }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(4, pct)}%` }}
                              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
                              className="w-full rounded-t-sm"
                              style={{
                                background:
                                  day.count === 0
                                    ? "#27272a"
                                    : `linear-gradient(to top, #ca8a04, #EAB308)`,
                              }}
                            />
                          </div>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">{dayLabel}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Check-in rate gauge */}
                <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-4">
                    Taxa de check-in (30d)
                  </p>
                  <div className="flex items-center gap-5">
                    {/* Semicircle SVG gauge */}
                    <div className="relative flex-shrink-0">
                      <svg viewBox="0 0 100 54" className="w-24 h-14" aria-hidden>
                        {/* Track */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#27272a"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Fill */}
                        <motion.path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.PI * 40 * (data.checkinRate / 100)} ${Math.PI * 40}`}
                          initial={{ strokeDasharray: `0 ${Math.PI * 40}` }}
                          animate={{
                            strokeDasharray: `${Math.PI * 40 * (data.checkinRate / 100)} ${Math.PI * 40}`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <p
                        className="absolute bottom-0 left-0 right-0 text-center text-lg font-black tabular-nums"
                        style={{ color: data.checkinRate >= 70 ? "#22C55E" : data.checkinRate >= 50 ? "#EAB308" : "#EF4444" }}
                      >
                        {data.checkinRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {data.checkinRate >= 80
                          ? "Excelente engajamento"
                          : data.checkinRate >= 60
                          ? "Bom nível de presença"
                          : "Presença abaixo do ideal"}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Média de alunos presentes vs. inscritos nas aulas concluídas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top 5 most active */}
                {data.top5.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-[#EAB308]" />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Top 5 mais ativos (30d)
                      </p>
                    </div>
                    <div className="space-y-2">
                      {data.top5.map((s, i) => (
                        <motion.div
                          key={s.studentId}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="flex-shrink-0 text-sm font-black tabular-nums w-5 text-center"
                            style={{ color: i === 0 ? "#EAB308" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#52525b" }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{s.name}</p>
                          </div>
                          <span className="flex-shrink-0 text-[11px] font-black text-zinc-400 tabular-nums">
                            {s.count} ações
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students without access */}
                {data.noLoginStudents.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-amber-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
                        Alunos sem acesso ao app ({data.noLoginStudents.length})
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-500 mb-3">
                      Nunca fizeram login — convide via WhatsApp para engajar.
                    </p>
                    <div className="space-y-2">
                      {data.noLoginStudents.map((s) => {
                        const phoneDigits = s.phone?.replace(/\D/g, "") ?? "";
                        const waHref = phoneDigits
                          ? `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(`Olá ${s.name.split(" ")[0]}! Acesse o Will Treinos PRO para acompanhar sua evolução: https://willtreinospro.com/aluno`)}`
                          : undefined;

                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-3 py-2"
                          >
                            <p className="text-sm font-bold text-white truncate min-w-0">{s.name}</p>
                            {waHref ? (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`btn-invite-${s.id}`}
                                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-green-500/35 bg-green-500/10 px-2.5 py-1 text-[10px] font-black text-green-400 hover:bg-green-500/20 transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Convidar
                              </a>
                            ) : (
                              <span className="flex-shrink-0 text-[10px] text-zinc-600">Sem tel.</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {data.noLoginStudents.length === 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm font-bold text-emerald-200">
                      Todos os alunos ativos já acessaram o app!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
