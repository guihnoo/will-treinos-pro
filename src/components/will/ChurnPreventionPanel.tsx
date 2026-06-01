"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Bell,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";
import { useStudents } from "@/context/StudentsContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const ACTIVATED_KEY = "wt_churn_activated";

function getActivatedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ACTIVATED_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function markActivated(studentId: string) {
  const map = getActivatedMap();
  map[studentId] = Date.now();
  localStorage.setItem(ACTIVATED_KEY, JSON.stringify(map));
}

function wasActivated(studentId: string): boolean {
  const ts = getActivatedMap()[studentId];
  if (!ts) return false;
  return Date.now() - ts < 72 * 60 * 60 * 1000; // 72h
}

interface AtRiskStudent {
  id: string;
  name: string;
  authUserId: string | null | undefined;
  avatar: string;
  daysSinceLastActivity: number;
  xpLast14d: number;
  riskScore: number;
}

interface Props {
  onClose: () => void;
}

export default function ChurnPreventionPanel({ onClose }: Props) {
  const { user } = useAuth();
  const { students } = useStudents();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [activatedSet, setActivatedSet] = useState<Set<string>>(() => {
    const map = getActivatedMap();
    return new Set(Object.keys(map).filter((k) => Date.now() - map[k] < 72 * 60 * 60 * 1000));
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      if (!sb) { setLoading(false); return; }

      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const cutoffISO = fourteenDaysAgo.toISOString();

      // Fetch xp_log last 14 days grouped by student_id (student_id = CRM id)
      const { data: xpRows } = await sb
        .from("xp_log")
        .select("student_id, total_xp, created_at")
        .gte("created_at", cutoffISO);

      // Build maps per student
      const xpPerStudent = new Map<string, number>();
      const lastSeenPerStudent = new Map<string, Date>();

      for (const row of xpRows ?? []) {
        const sid = row.student_id as string;
        xpPerStudent.set(sid, (xpPerStudent.get(sid) ?? 0) + ((row.total_xp as number) ?? 0));
        const d = new Date(row.created_at as string);
        const prev = lastSeenPerStudent.get(sid);
        if (!prev || d > prev) lastSeenPerStudent.set(sid, d);
      }

      const activeStudents = students.filter((s) => s.status === "active");
      const result: AtRiskStudent[] = [];

      for (const student of activeStudents) {
        const lastSeen = lastSeenPerStudent.get(student.id);
        const daysSince = lastSeen
          ? Math.floor((now.getTime() - lastSeen.getTime()) / 86400000)
          : 99;
        const xpLast14d = xpPerStudent.get(student.id) ?? 0;
        const riskScore = daysSince * 10 + (xpLast14d < 50 ? 30 : 0);

        if (riskScore >= 20) {
          result.push({
            id: student.id,
            name: student.name,
            authUserId: student.authUserId,
            avatar: student.avatar,
            daysSinceLastActivity: daysSince,
            xpLast14d,
            riskScore,
          });
        }
      }

      result.sort((a, b) => b.riskScore - a.riskScore);
      setAtRisk(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [students]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleActivate(student: AtRiskStudent) {
    if (!student.authUserId) {
      toast("Aluno sem conta vinculada — push não disponível.");
      return;
    }
    if (wasActivated(student.id)) {
      toast("Já acionado nas últimas 72h.");
      return;
    }

    setSending(student.id);
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Supabase não configurado");

      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const firstName = student.name.split(" ")[0];
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          payload: {
            title: `Oi ${firstName}, sentimos sua falta! 🏐`,
            body: "Está com saudade da quadra? Vem treinar, a turma tá esperando!",
            url: "/dashboard",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.svg",
          },
          targetUserId: student.authUserId,
        }),
      });

      const result: { sent?: number } = await res.json();
      if ((result.sent ?? 0) > 0) {
        markActivated(student.id);
        setActivatedSet((prev) => new Set([...prev, student.id]));
        toast(`✅ Push enviado para ${firstName}`);
      } else {
        toast(`${firstName} não tem push ativo no dispositivo.`);
      }
    } catch {
      toast("Erro ao enviar push.");
    } finally {
      setSending(null);
    }
  }

  void user;

  return (
    <AnimatePresence>
      <motion.div
        key="churn-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="churn-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#0a0a0a] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/10">
                  <HeartHandshake className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Retenção</h2>
                  <p className="text-[11px] text-zinc-500">
                    {loading ? "Calculando..." : `${atRisk.length} aluno${atRisk.length !== 1 ? "s" : ""} em risco`}
                  </p>
                </div>
              </div>
              <button
                data-testid="churn-panel-close"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-3`}>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-16 rounded-xl bg-zinc-800/60 border border-zinc-800/40 ${i === 0 ? "h-12" : ""}`} />
                  ))}
                </div>
              ) : atRisk.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <ShieldCheck className="h-10 w-10 text-emerald-500/50" />
                  <p className="text-sm font-bold text-zinc-400">Nenhum aluno em risco</p>
                  <p className="text-xs text-zinc-600">Turma com boa retenção — continue assim!</p>
                </div>
              ) : (
                <>
                  {/* Legend */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                      <AlertTriangle size={10} className="text-amber-400" />
                      <span>Alerta (score 20–49)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                      <AlertTriangle size={10} className="text-red-400" />
                      <span>Crítico (score 50+)</span>
                    </div>
                  </div>

                  {/* Student cards */}
                  <div className="space-y-2">
                    {atRisk.map((student) => {
                      const isSending = sending === student.id;
                      const isActivated = activatedSet.has(student.id);
                      const isCritical = student.riskScore >= 50;

                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-all ${
                            isActivated
                              ? "border-zinc-800/50 bg-zinc-950/50 opacity-60"
                              : isCritical
                                ? "border-red-500/25 bg-red-500/5"
                                : "border-amber-500/20 bg-amber-500/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar placeholder */}
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 overflow-hidden">
                              {student.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{student.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                                  <Clock size={8} />
                                  {student.daysSinceLastActivity}d sem atividade
                                </span>
                                <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                                  <Zap size={8} />
                                  {student.xpLast14d} XP/2sem
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Risk badge */}
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black ${
                              isCritical
                                ? "bg-red-500/15 text-red-300"
                                : "bg-amber-500/15 text-amber-300"
                            }`}>
                              <AlertTriangle size={8} />
                              {isCritical ? "Crítico" : "Alerta"}
                            </span>

                            {/* Action button */}
                            {isActivated ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                                <CheckCircle2 size={10} />
                                Acionado
                              </span>
                            ) : !student.authUserId ? (
                              <span className="text-[9px] text-zinc-600">Sem conta</span>
                            ) : (
                              <motion.button
                                data-testid={`churn-activate-${student.id}`}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => handleActivate(student)}
                                disabled={isSending}
                                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/12 px-2.5 py-1.5 text-[9px] font-black text-rose-200 hover:bg-rose-500/22 transition-colors disabled:opacity-50"
                              >
                                {isSending ? (
                                  <Loader2 size={9} className="animate-spin" />
                                ) : (
                                  <Bell size={9} />
                                )}
                                Acionar
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
