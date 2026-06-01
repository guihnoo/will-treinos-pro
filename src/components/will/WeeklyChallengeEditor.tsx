"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  X,
  Zap,
  CheckCircle2,
  Loader2,
  Users,
  Trophy,
  CalendarCheck,
  Flame,
} from "lucide-react";
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

type ChallengeType = "checkins" | "xp" | "classes" | "streak";

interface WeeklyChallenge {
  id: string;
  week_start: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_value: number;
  xp_bonus: number;
  created_by: string | null;
  created_at: string;
}

interface ChallengeProgress {
  challenge: WeeklyChallenge;
  totalStudents: number;
  completedStudents: number;
}

interface Props {
  onClose: () => void;
}

const CHALLENGE_TYPES: { id: ChallengeType; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "checkins", label: "Check-ins",  icon: CalendarCheck, hint: "Presenças na quadra" },
  { id: "xp",       label: "XP",         icon: Zap,           hint: "XP acumulado" },
  { id: "classes",  label: "Aulas",      icon: Trophy,        hint: "Aulas concluídas" },
  { id: "streak",   label: "Sequência",  icon: Flame,         hint: "Dias consecutivos" },
];

const XP_BONUS_OPTIONS = [100, 150, 200] as const;

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

export default function WeeklyChallengeEditor({ onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<ChallengeProgress | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState<ChallengeType>("checkins");
  const [targetValue, setTargetValue] = useState(3);
  const [xpBonus, setXpBonus] = useState<100 | 150 | 200>(100);

  const weekStart = getCurrentWeekMonday();

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/coach/weekly-challenge?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const json: { challenge: WeeklyChallenge | null; progress: { totalStudents: number; completedStudents: number } | null } = await res.json();
        if (json.challenge) {
          setExisting({
            challenge: json.challenge,
            totalStudents: json.progress?.totalStudents ?? 0,
            completedStudents: json.progress?.completedStudents ?? 0,
          });
          // Pre-fill form
          setTitle(json.challenge.title);
          setDescription(json.challenge.description ?? "");
          setChallengeType(json.challenge.challenge_type);
          setTargetValue(json.challenge.target_value);
          setXpBonus(json.challenge.xp_bonus as 100 | 150 | 200);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void fetchChallenge();
  }, [fetchChallenge]);

  async function handleSave() {
    if (!title.trim()) {
      toast("Informe um título para o desafio.", "error");
      return;
    }
    if (targetValue < 1) {
      toast("A meta deve ser maior que zero.", "error");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Supabase não configurado");

      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/coach/weekly-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          challenge_type: challengeType,
          target_value: targetValue,
          xp_bonus: xpBonus,
        }),
      });

      const json: { challenge?: WeeklyChallenge; error?: string } = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Erro ao salvar");

      toast("✅ Desafio da semana criado!");
      await fetchChallenge();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar desafio.", "error");
    } finally {
      setSaving(false);
    }
  }

  void user; // used for context awareness

  return (
    <AnimatePresence>
      <motion.div
        key="challenge-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="challenge-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-violet-500/30 bg-[#0a0a0a] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/10">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Desafio da Semana</h2>
                  <p className="text-[11px] text-zinc-500">
                    Semana de {new Date(`${weekStart}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
              <button
                data-testid="challenge-editor-close"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-4`}>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-violet-400" />
                </div>
              ) : (
                <>
                  {/* Existing challenge progress */}
                  {existing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-violet-500/25 bg-violet-500/8 px-4 py-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-violet-400" />
                        <p className="text-xs font-black text-violet-300">Desafio ativo esta semana</p>
                      </div>
                      <p className="text-sm font-bold text-white">{existing.challenge.title}</p>
                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-500">Progresso da turma</span>
                          <span className="text-[10px] font-black text-violet-300">
                            {existing.completedStudents}/{existing.totalStudents} completaram
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: existing.totalStudents > 0
                                ? `${Math.min(100, (existing.completedStudents / existing.totalStudents) * 100)}%`
                                : "0%",
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-violet-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Users size={10} className="text-zinc-500" />
                          <span className="text-[9px] text-zinc-500">
                            {existing.totalStudents} alunos ativos · meta: {existing.challenge.target_value} {existing.challenge.challenge_type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Form */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {existing ? "Atualizar desafio" : "Criar desafio"}
                    </p>

                    {/* Title */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 block">Título *</label>
                      <input
                        data-testid="challenge-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: 3 check-ins esta semana"
                        maxLength={80}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                      />
                    </div>

                    {/* Challenge type chips */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1.5 block">Tipo *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CHALLENGE_TYPES.map(({ id, label, icon: Icon, hint }) => (
                          <motion.button
                            key={id}
                            data-testid={`challenge-type-${id}`}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setChallengeType(id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                              challengeType === id
                                ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                                : "border-zinc-800/80 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <Icon size={13} className={challengeType === id ? "text-violet-400" : "text-zinc-500"} />
                            <div>
                              <p className="text-[11px] font-bold">{label}</p>
                              <p className="text-[9px] opacity-70">{hint}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Target value */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 block">Meta *</label>
                      <input
                        data-testid="challenge-target"
                        type="number"
                        min={1}
                        max={9999}
                        value={targetValue}
                        onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                      />
                    </div>

                    {/* XP Bonus chips */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1.5 block">XP Bônus</label>
                      <div className="flex gap-2">
                        {XP_BONUS_OPTIONS.map((val) => (
                          <motion.button
                            key={val}
                            data-testid={`challenge-xp-${val}`}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setXpBonus(val)}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-black transition-all ${
                              xpBonus === val
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                                : "border-zinc-800/80 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <Zap size={11} className={xpBonus === val ? "text-amber-400" : "text-zinc-500"} />
                            +{val} XP
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 block">Descrição (opcional)</label>
                      <textarea
                        data-testid="challenge-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detalhe o desafio para os alunos..."
                        maxLength={300}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                      />
                    </div>

                    {/* Save button */}
                    <motion.button
                      data-testid="challenge-save"
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-violet-500/50 bg-violet-500/20 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Target size={16} />
                      )}
                      {existing ? "Atualizar Desafio" : "Criar Desafio da Semana"}
                    </motion.button>
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
