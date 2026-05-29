"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Dna,
  Flame,
  Loader2,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import UserAvatar from "@/components/ui/UserAvatar";
import type { Student } from "@/context/types";
import type { AthleteTwinResult } from "@/app/api/ai/athlete-twin/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_FUNDAMENTALS = [
  "ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento"
] as const;

const FUNDAMENTAL_LABELS: Record<string, string> = {
  ataque: "Ataque", levantamento: "Levant.", bloqueio: "Bloqueio",
  saque: "Saque", defesa: "Defesa", recepcao: "Recepção", posicionamento: "Posic.",
};

const FUNDAMENTAL_COLORS: Record<string, string> = {
  ataque: "#ef4444", levantamento: "#a855f7", bloqueio: "#3b82f6",
  saque: "#EAB308", defesa: "#10b981", recepcao: "#06b6d4", posicionamento: "#6b7280",
};

const PROFILE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  "Guerreiro":    { icon: <Flame className="h-4 w-4" />,       color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/30" },
  "Em Ascensão":  { icon: <TrendingUp className="h-4 w-4" />,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Em Platô":     { icon: <Activity className="h-4 w-4" />,     color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  "Em Risco":     { icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  "Promessa":     { icon: <Sparkles className="h-4 w-4" />,     color: "text-[#EAB308]",  bg: "bg-[#EAB308]/10",   border: "border-[#EAB308]/30" },
};

const BURNOUT_STYLE = {
  baixo:  { label: "Risco baixo",  class: "bg-emerald-500/15 text-emerald-300" },
  médio:  { label: "Risco médio",  class: "bg-amber-500/15 text-amber-300" },
  alto:   { label: "Risco alto",   class: "bg-red-500/15 text-red-300" },
};

const TIER_ICONS: Record<string, string> = {
  "Bronze 🥉": "🥉", "Prata 🥈": "🥈", "Ouro 🥇": "🥇", "Diamante 💎": "💎", "Elite 👑": "👑",
};

// ─── Radar SVG (heptagon) ─────────────────────────────────────────────────────

function FundamentalRadar({ data }: { data: Record<string, number> }) {
  const N = ALL_FUNDAMENTALS.length;
  const cx = 100;
  const cy = 100;
  const R = 72;
  const maxXP = Math.max(...Object.values(data), 1);

  // Angles: start at top (−π/2), go clockwise
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const point = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const gridPolygon = (ratio: number) =>
    ALL_FUNDAMENTALS.map((_, i) => {
      const p = point(R * ratio, i);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPolygon = ALL_FUNDAMENTALS.map((f, i) => {
    const ratio = Math.min((data[f] ?? 0) / maxXP, 1);
    const p = point(R * ratio, i);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto" aria-label="Radar de fundamentos">
      {/* Grid */}
      {gridLevels.map((ratio, gi) => (
        <polygon
          key={gi}
          points={gridPolygon(ratio)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.8"
        />
      ))}

      {/* Axis lines */}
      {ALL_FUNDAMENTALS.map((_, i) => {
        const outer = point(R, i);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />;
      })}

      {/* Data fill */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING_PREMIUM, delay: 0.15 }}
        points={dataPolygon}
        fill="rgba(234,179,8,0.18)"
        stroke="#EAB308"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data dots */}
      {ALL_FUNDAMENTALS.map((f, i) => {
        const ratio = Math.min((data[f] ?? 0) / maxXP, 1);
        const p = point(R * ratio, i);
        return (
          <motion.circle
            key={f}
            cx={p.x} cy={p.y} r="3"
            fill={FUNDAMENTAL_COLORS[f]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.04 }}
          />
        );
      })}

      {/* Labels */}
      {ALL_FUNDAMENTALS.map((f, i) => {
        const labelR = R + 16;
        const p = point(labelR, i);
        return (
          <text
            key={f}
            x={p.x} y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7.5"
            fill={data[f] ? FUNDAMENTAL_COLORS[f] : "rgba(255,255,255,0.25)"}
            fontWeight={data[f] ? "700" : "400"}
          >
            {FUNDAMENTAL_LABELS[f]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── XP bar ───────────────────────────────────────────────────────────────────

function XPBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-bold text-zinc-400">{label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{value.toLocaleString()} XP</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      </div>
    </div>
  );
}

// ─── Tier timeline ────────────────────────────────────────────────────────────

function TierTimeline({ unlocks }: { unlocks: { tier: string; unlockedAt: string }[] }) {
  if (unlocks.length === 0) {
    return <p className="text-[11px] text-zinc-600 text-center py-2">Nenhum tier desbloqueado ainda.</p>;
  }
  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-white/[0.06]" />
      {unlocks.map((u, i) => {
        const date = new Date(u.unlockedAt);
        const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative mb-3 last:mb-0"
          >
            <div className="absolute -left-3.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EAB308]/20 text-[8px]">
              {TIER_ICONS[u.tier] ?? "⭐"}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black text-white">{u.tier}</p>
              <p className="text-[9px] text-zinc-600">{label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function AthleteTwinPanel({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const [data, setData] = useState<AthleteTwinResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const supabase = getSupabaseClient();
        const token = supabase
          ? (await supabase.auth.getSession()).data.session?.access_token ?? ""
          : "";

        const res = await fetch("/api/ai/athlete-twin", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentId: student.id, studentName: student.name }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("api_error");
        const result = await res.json() as AthleteTwinResult;
        setData(result);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [student.id, student.name]);

  const profileMeta = data ? (PROFILE_META[data.profile.type] ?? PROFILE_META["Promessa"]) : null;
  const maxFundXP = data ? Math.max(...Object.values(data.fundamentals), 1) : 1;

  return (
    <div className={MODAL_FIXED_OVERLAY_SCROLL} role="dialog" aria-modal="true" aria-label={`Gêmeo Digital — ${student.name}`}>
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10"
              >
                <Dna className="h-4.5 w-4.5 text-violet-400" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-400">Gêmeo Digital</p>
                <p className="text-[10px] text-zinc-500">Análise preditiva · powered by Claude AI</p>
              </div>
            </motion.div>
            <motion.button
              whileTap={PRESS_SCALE}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Athlete identity strip */}
          <div className="shrink-0 flex items-center gap-3 px-5 pb-4">
            <UserAvatar name={student.name} photo={student.avatar} size="md" />
            <div className="min-w-0">
              <p className="text-[14px] font-black text-white truncate">{student.name}</p>
              <p className="text-[10px] text-zinc-500">{student.plan ?? "plano não definido"} · {student.frequency ?? "—"}x/sem</p>
            </div>
            {data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`ml-auto shrink-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${profileMeta!.border} ${profileMeta!.bg} ${profileMeta!.color}`}
              >
                {profileMeta!.icon}
                {data.profile.type}
              </motion.div>
            )}
          </div>

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5`}>
            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <p className="text-[12px] text-zinc-500">Construindo perfil digital…</p>
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-6 text-center">
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-red-400" />
                <p className="text-[12px] font-bold text-red-400">Falha ao carregar dados</p>
                <p className="text-[11px] text-zinc-500 mt-1">Verifique a conexão e tente novamente.</p>
              </div>
            )}

            {/* Content */}
            {data && !loading && (
              <AnimatePresence>
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {/* KPI row */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-2"
                  >
                    {[
                      { label: "XP Total", value: data.totalXP.toLocaleString(), icon: <Zap className="h-3.5 w-3.5 text-[#EAB308]" /> },
                      { label: "Avaliações", value: String(data.evaluationCount), icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
                      { label: "Check-ins", value: String(data.checkinCount), icon: <Activity className="h-3.5 w-3.5 text-blue-400" /> },
                    ].map((kpi, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2.5 text-center">
                        <div className="flex justify-center mb-1">{kpi.icon}</div>
                        <p className="text-[13px] font-black text-white">{kpi.value}</p>
                        <p className="text-[9px] text-zinc-600">{kpi.label}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Velocity */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Velocidade de XP</p>
                    <XPBar label="Últimos 7 dias" value={data.recentXP7d} max={Math.max(data.recentXP30d, data.recentXP7d, 1)} color="#EAB308" />
                    <XPBar label="Últimos 30 dias" value={data.recentXP30d} max={Math.max(data.recentXP30d, 1)} color="#a855f7" />
                    {data.lastActivityDaysAgo !== null && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <p className="text-[10px] text-zinc-600">
                          Último treino: <span className={`font-bold ${data.lastActivityDaysAgo > 14 ? "text-red-400" : data.lastActivityDaysAgo > 7 ? "text-amber-400" : "text-emerald-400"}`}>
                            {data.lastActivityDaysAgo === 0 ? "hoje" : `${data.lastActivityDaysAgo} dias atrás`}
                          </span>
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Radar */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 pt-3 pb-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Radar de Fundamentos</p>
                    <FundamentalRadar data={data.fundamentals} />
                    {/* Legend for top 3 */}
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                      {Object.entries(data.fundamentals)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([f, xp]) => (
                          <div key={f} className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: FUNDAMENTAL_COLORS[f] }} />
                            <span className="text-[9px] text-zinc-500">{FUNDAMENTAL_LABELS[f]} <span className="font-bold text-zinc-400">{xp}</span></span>
                          </div>
                        ))
                      }
                    </div>
                  </motion.div>

                  {/* AI Profile card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`rounded-xl border ${profileMeta!.border} ${profileMeta!.bg} px-4 py-3 space-y-3`}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className={`h-4 w-4 ${profileMeta!.color}`} />
                      <p className={`text-[11px] font-black uppercase tracking-wider ${profileMeta!.color}`}>
                        Análise do Copiloto
                      </p>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${BURNOUT_STYLE[data.profile.burnoutRisk]?.class ?? ""}`}>
                        {BURNOUT_STYLE[data.profile.burnoutRisk]?.label}
                      </span>
                    </div>

                    <p className="text-[12px] text-zinc-300 leading-snug">{data.profile.motivationalNote}</p>

                    {data.profile.insight && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Target className="h-3 w-3 text-[#EAB308]" />
                          <p className="text-[9px] font-black uppercase tracking-wider text-[#EAB308]">Ação prioritária</p>
                        </div>
                        <p className="text-[11px] text-zinc-300">{data.profile.insight}</p>
                      </div>
                    )}

                    {data.profile.focusPriorities.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">Focar em</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {data.profile.focusPriorities.map((f) => (
                            <span
                              key={f}
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: `${FUNDAMENTAL_COLORS[f]}22`, color: FUNDAMENTAL_COLORS[f] }}
                            >
                              {FUNDAMENTAL_LABELS[f] ?? f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.profile.nextTierETA && (
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <p className="text-[11px] text-zinc-300">
                          Próximo tier em <span className="font-black text-emerald-400">{data.profile.nextTierETA}</span> no ritmo atual
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Tier timeline */}
                  {data.tierUnlocks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Conquistas Desbloqueadas</p>
                      <TierTimeline unlocks={data.tierUnlocks} />
                    </motion.div>
                  )}

                  {/* Fundaments bars for all 7 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Detalhamento por Fundamento</p>
                    {ALL_FUNDAMENTALS.map((f) => (
                      <XPBar
                        key={f}
                        label={FUNDAMENTAL_LABELS[f]}
                        value={data.fundamentals[f] ?? 0}
                        max={maxFundXP}
                        color={FUNDAMENTAL_COLORS[f]}
                      />
                    ))}
                  </motion.div>

                  {/* Shields / no data */}
                  {data.totalXP === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border border-zinc-800/60 bg-white/[0.02] px-4 py-4 text-center"
                    >
                      <Shield className="mx-auto mb-2 h-5 w-5 text-zinc-700" />
                      <p className="text-[12px] font-bold text-zinc-600">Sem avaliações ainda</p>
                      <p className="text-[10px] text-zinc-700 mt-0.5">Realize a primeira avaliação para ativar o perfil preditivo.</p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-center gap-1.5 opacity-25">
              <Bot className="h-3 w-3 text-zinc-500" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Gêmeo Digital · Powered by Claude AI
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
