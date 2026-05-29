"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronRight, Dna, Loader2, TrendingUp, Zap } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AthleteTwinResult } from "@/app/api/ai/athlete-twin/route";

// ─── Radar (compact, 100px) ───────────────────────────────────────────────────

const ALL_FUNDAMENTALS = [
  "ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento"
] as const;

const FUNDAMENTAL_COLORS: Record<string, string> = {
  ataque: "#ef4444", levantamento: "#a855f7", bloqueio: "#3b82f6",
  saque: "#EAB308", defesa: "#10b981", recepcao: "#06b6d4", posicionamento: "#6b7280",
};

function MiniRadar({ data }: { data: Record<string, number> }) {
  const N = ALL_FUNDAMENTALS.length;
  const cx = 50; const cy = 50; const R = 36;
  const maxXP = Math.max(...Object.values(data), 1);
  const angle = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

  const gridPolygon = (ratio: number) =>
    ALL_FUNDAMENTALS.map((_, i) => { const p = pt(R * ratio, i); return `${p.x},${p.y}`; }).join(" ");

  const dataPolygon = ALL_FUNDAMENTALS.map((f, i) => {
    const p = pt(R * Math.min((data[f] ?? 0) / maxXP, 1), i);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" width="80" height="80" aria-hidden="true">
      {[0.33, 0.66, 1].map((r, i) => (
        <polygon key={i} points={gridPolygon(r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
      ))}
      {ALL_FUNDAMENTALS.map((_, i) => {
        const o = pt(R, i);
        return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />;
      })}
      <motion.polygon
        points={dataPolygon}
        fill="rgba(234,179,8,0.2)"
        stroke="#EAB308"
        strokeWidth="1.2"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      {ALL_FUNDAMENTALS.map((f, i) => {
        const ratio = Math.min((data[f] ?? 0) / maxXP, 1);
        const p = pt(R * ratio, i);
        return <circle key={f} cx={p.x} cy={p.y} r="1.8" fill={FUNDAMENTAL_COLORS[f]} />;
      })}
    </svg>
  );
}

// ─── Profile type config ──────────────────────────────────────────────────────

const PROFILE_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  "Guerreiro":   { emoji: "🔥", color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/25" },
  "Em Ascensão": { emoji: "📈", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  "Em Platô":    { emoji: "⚡", color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/25" },
  "Em Risco":    { emoji: "⚠️", color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  "Promessa":    { emoji: "✨", color: "text-[#EAB308]",  bg: "bg-[#EAB308]/10",   border: "border-[#EAB308]/25" },
};

// ─── Cache key ────────────────────────────────────────────────────────────────

const CACHE_TTL = 30 * 60 * 1000; // 30 min
let _cache: { data: AthleteTwinResult; ts: number; studentId: string } | null = null;

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentTwinCard({
  studentId,
  studentName,
  onOpenFull,
}: {
  studentId: string;
  studentName: string;
  onOpenFull?: () => void;
}) {
  const [data, setData] = useState<AthleteTwinResult | null>(
    _cache?.studentId === studentId && Date.now() - _cache.ts < CACHE_TTL ? _cache.data : null
  );
  const [loading, setLoading] = useState(data === null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (_cache?.studentId === studentId && Date.now() - _cache.ts < CACHE_TTL) {
      setData(_cache.data);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const sb = getSupabaseClient();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token ?? "" : "";

      const res = await fetch("/api/ai/athlete-twin", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId, studentName }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      const result = await res.json() as AthleteTwinResult;
      _cache = { data: result, ts: Date.now(), studentId };
      setData(result);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, [studentId, studentName]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const cfg = data ? (PROFILE_CONFIG[data.profile.type] ?? PROFILE_CONFIG["Promessa"]) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-[#EAB308]/[0.04] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10">
            <Dna className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">Meu Perfil AI</p>
        </div>
        {data && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black border ${cfg!.border} ${cfg!.bg} ${cfg!.color}`}>
            {cfg!.emoji} {data.profile.type}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center gap-2 px-4 pb-4 pt-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400 shrink-0" />
          <p className="text-[11px] text-zinc-600">Analisando seu perfil…</p>
        </div>
      )}

      {/* Content */}
      <AnimatePresence>
        {data && !loading && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pb-4"
          >
            <div className="flex gap-3 items-start">
              {/* Mini radar */}
              <div className="shrink-0">
                <MiniRadar data={data.fundamentals} />
              </div>

              {/* Info column */}
              <div className="min-w-0 flex-1 pt-1 space-y-2">
                {/* Motivational note */}
                <p className="text-[11px] text-zinc-300 leading-snug line-clamp-3">
                  {data.profile.motivationalNote}
                </p>

                {/* Stats row */}
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#EAB308]" />
                    <span className="text-[10px] font-black text-[#EAB308]">{data.totalXP.toLocaleString()} XP</span>
                  </div>
                  {data.recentXP7d > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">+{data.recentXP7d} esta semana</span>
                    </div>
                  )}
                </div>

                {/* Next tier ETA */}
                {data.profile.nextTierETA && (
                  <div className="rounded-lg border border-[#EAB308]/20 bg-[#EAB308]/[0.07] px-2.5 py-1.5">
                    <p className="text-[10px] text-zinc-400">
                      Próximo tier em{" "}
                      <span className="font-black text-[#EAB308]">{data.profile.nextTierETA}</span>{" "}
                      no ritmo atual
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Focus priorities */}
            {data.profile.focusPriorities.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <Brain className="h-3 w-3 text-zinc-600 shrink-0" />
                <p className="text-[9px] text-zinc-600">Foque em:</p>
                {data.profile.focusPriorities.map((f) => (
                  <span
                    key={f}
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold capitalize"
                    style={{ backgroundColor: `${FUNDAMENTAL_COLORS[f] ?? "#6b7280"}20`, color: FUNDAMENTAL_COLORS[f] ?? "#9ca3af" }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            {onOpenFull && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onOpenFull}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.08] py-2 text-[10px] font-black text-violet-300 transition-all hover:bg-violet-500/15"
              >
                Ver perfil completo
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
