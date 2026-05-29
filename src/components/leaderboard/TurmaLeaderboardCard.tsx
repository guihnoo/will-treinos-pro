"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, Trophy, Users, Zap } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { TurmaEntry, TurmaLeaderboardResult } from "@/app/api/leaderboard/turma/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankBadge(rank: number, isCurrent: boolean) {
  if (RANK_MEDAL[rank]) {
    return (
      <span className="text-base leading-none">{RANK_MEDAL[rank]}</span>
    );
  }
  return (
    <span className={`text-[11px] font-black w-5 text-center ${isCurrent ? "text-[#EAB308]" : "text-zinc-500"}`}>
      {rank}°
    </span>
  );
}

function AvatarInitials({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : "h-6 w-6 text-[9px]";
  return (
    <div className={`${sz} shrink-0 flex items-center justify-center rounded-full bg-[#EAB308]/20 text-[#EAB308] font-black border border-[#EAB308]/25`}>
      {initials}
    </div>
  );
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry, maxXP, idx }: { entry: TurmaEntry; maxXP: number; idx: number }) {
  const pct = maxXP > 0 ? Math.min((entry.weeklyXP / maxXP) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
        entry.isCurrentStudent
          ? "border border-[#EAB308]/25 bg-[#EAB308]/[0.07]"
          : "border border-transparent bg-white/[0.02]"
      }`}
    >
      {/* Rank */}
      <div className="shrink-0 w-6 flex justify-center">
        {rankBadge(entry.rank, entry.isCurrentStudent)}
      </div>

      {/* Avatar */}
      <AvatarInitials name={entry.name} />

      {/* Name + bar */}
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold truncate ${entry.isCurrentStudent ? "text-[#EAB308]" : "text-zinc-200"}`}>
          {entry.name.split(" ")[0]}{entry.isCurrentStudent ? " (você)" : ""}
        </p>
        <div className="mt-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${entry.isCurrentStudent ? "bg-[#EAB308]" : "bg-zinc-600"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
          />
        </div>
      </div>

      {/* XP */}
      <div className="shrink-0 flex items-center gap-0.5">
        <Zap className={`h-3 w-3 ${entry.isCurrentStudent ? "text-[#EAB308]" : "text-zinc-600"}`} />
        <span className={`text-[10px] font-black ${entry.isCurrentStudent ? "text-[#EAB308]" : "text-zinc-400"}`}>
          {entry.weeklyXP > 0 ? entry.weeklyXP.toLocaleString("pt-BR") : "—"}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 min
let _cache: { data: TurmaLeaderboardResult; ts: number; studentId: string } | null = null;

export default function TurmaLeaderboardCard({ studentId }: { studentId: string }) {
  const [data, setData] = useState<TurmaLeaderboardResult | null>(
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

      const res = await fetch("/api/leaderboard/turma", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      const result = await res.json() as TurmaLeaderboardResult;
      _cache = { data: result, ts: Date.now(), studentId };
      setData(result);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  if (!loading && (!data || data.entries.length === 0)) return null;

  const maxXP = data ? Math.max(...data.entries.map((e) => e.weeklyXP), 1) : 1;

  const rankLabel = data?.currentRank
    ? data.currentRank === 1 ? "1° lugar 🥇"
    : data.currentRank === 2 ? "2° lugar 🥈"
    : data.currentRank === 3 ? "3° lugar 🥉"
    : `${data.currentRank}° lugar`
    : "—";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#EAB308]" />
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Ranking da Turma</p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5">
              <Users className="h-3 w-3 text-zinc-500" />
              <span className="text-[9px] text-zinc-500">{data.totalInTurma} atletas</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => { _cache = null; void load(); }}
            disabled={loading}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-600 hover:text-white disabled:opacity-40 transition-colors"
            aria-label="Recarregar ranking"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {/* Category + week + position banner */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between rounded-xl border border-[#EAB308]/15 bg-[#EAB308]/[0.05] px-3 py-2"
          >
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                {data.categoryName} · {data.weekLabel}
              </p>
              <p className={`text-[13px] font-black mt-0.5 ${
                data.currentRank <= 3 ? "text-[#EAB308]" : "text-zinc-200"
              }`}>
                Você está em {rankLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-zinc-600">de {data.totalInTurma}</p>
              <p className="text-[9px] text-zinc-600">atletas</p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
              <p className="text-[11px] text-zinc-600">Carregando ranking…</p>
            </div>
          </div>
        )}

        {/* Entries */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              key="entries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              {data.entries.map((entry, i) => (
                <EntryRow key={entry.studentId} entry={entry} maxXP={maxXP} idx={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week note */}
        {!loading && data && (
          <p className="text-[9px] text-zinc-700 text-center pt-1">
            XP acumulado esta semana · atualiza segunda-feira
          </p>
        )}
      </div>
    </div>
  );
}
