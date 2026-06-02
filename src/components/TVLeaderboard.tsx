"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Tv } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TVEntry {
  position: number;
  name: string;
  totalXP: number;
  tier: string;
}

interface TVLeaderboardProps {
  onExit: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  elite:    { bg: "bg-purple-500/20",  text: "text-purple-300",  border: "border-purple-500/40" },
  diamante: { bg: "bg-cyan-500/20",    text: "text-cyan-300",    border: "border-cyan-500/40" },
  ouro:     { bg: "bg-amber-500/20",   text: "text-amber-300",   border: "border-amber-500/40" },
  prata:    { bg: "bg-zinc-500/20",    text: "text-zinc-300",    border: "border-zinc-500/40" },
  bronze:   { bg: "bg-orange-900/20",  text: "text-orange-300",  border: "border-orange-700/40" },
};

const TIER_LABEL: Record<string, string> = {
  elite: "Elite", diamante: "Diamante", ouro: "Ouro", prata: "Prata", bronze: "Bronze",
};

const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];

const MOTIVATIONAL_TICKERS = [
  "Consistência é a chave para o alto nível 🏐",
  "Cada treino conta — cada XP importa ⚡",
  "Campeões são feitos em quadra, não em sonhos 🏆",
  "Sua evolução começa na próxima aula 📈",
  "O maior rival está dentro de você — supere-se 💪",
  "Primeiro você domina a técnica, depois a técnica domina o jogo",
  "Discipline is the bridge between goals and achievement 🌟",
  "Treinar é difícil. Ganhar é ainda mais difícil. Desistir é impossível.",
];

const POLL_INTERVAL = 30_000; // 30s

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TickerText({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % texts.length);
        setVisible(true);
      }, 700);
    }, 5000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="text-sm sm:text-base font-bold text-[#EAB308] text-center px-4"
        >
          {texts[idx]}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function PodiumCard({ entry, delay }: { entry: TVEntry; delay: number }) {
  const tierStyle = TIER_COLORS[entry.tier] ?? TIER_COLORS.bronze!;
  const sizeMap: Record<number, string> = { 1: "scale-110", 2: "scale-100", 3: "scale-95" };
  const scale = sizeMap[entry.position] ?? "scale-95";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
      className={`flex flex-col items-center gap-3 ${scale} transform-gpu`}
    >
      {/* Medal */}
      <span className="text-4xl sm:text-5xl" role="img" aria-label={`${entry.position}° lugar`}>
        {PODIUM_MEDALS[entry.position - 1] ?? ""}
      </span>

      {/* Avatar */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-[#EAB308]/60 bg-gradient-to-br from-[#EAB308]/30 to-zinc-900 text-2xl sm:text-3xl font-black text-[#EAB308] shadow-[0_0_32px_rgba(234,179,8,0.3)]"
        aria-hidden="true"
      >
        {entry.name.charAt(0).toUpperCase()}
      </motion.div>

      {/* Name */}
      <p className="text-base sm:text-lg font-black text-white text-center leading-tight max-w-[9rem]">
        {entry.name}
      </p>

      {/* XP */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xl sm:text-2xl font-black text-[#EAB308]">
          {entry.totalXP.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">XP esta semana</p>
      </div>

      {/* Tier badge */}
      <span className={`rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
        {TIER_LABEL[entry.tier] ?? entry.tier}
      </span>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TVLeaderboard({ onExit }: TVLeaderboardProps) {
  const [entries, setEntries] = useState<TVEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard/tv", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { entries: TVEntry[] };
      setEntries(data.entries ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[TVLeaderboard] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    void fetchEntries();
    const id = setInterval(() => void fetchEntries(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEntries]);

  const podium = entries.slice(0, 3);
  const restOfList = entries.slice(3);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black text-white overflow-hidden"
      data-testid="tv-leaderboard"
    >
      {/* Exit button */}
      <button
        onClick={onExit}
        data-testid="tv-exit-btn"
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition backdrop-blur-sm"
      >
        <X className="h-3.5 w-3.5" />
        Sair do modo TV
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 flex flex-col items-center pt-8 pb-4 px-4 gap-1"
      >
        <div className="flex items-center gap-2 mb-1">
          <Tv className="h-5 w-5 text-[#EAB308]" />
          <p
            className="text-[11px] font-black uppercase tracking-[0.3em] text-[#EAB308]"
            style={{
              backgroundImage: "linear-gradient(90deg,#EAB308,#FDE68A,#EAB308)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}
          >
            WILL TREINOS PRO
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-[#EAB308]" />
          <h1 className="text-2xl sm:text-3xl font-black text-white">RANKING DA SEMANA</h1>
          <Trophy className="h-6 w-6 text-[#EAB308]" />
        </div>
        <p className="text-xs text-zinc-500 capitalize mt-0.5">{today}</p>
        {lastUpdated && (
          <p className="text-[9px] text-zinc-700 mt-0.5">
            Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-full border-2 border-[#EAB308] border-t-transparent"
          />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 text-lg">Nenhum XP registrado esta semana ainda.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Podium (top 3) */}
          {podium.length > 0 && (
            <div className="flex-shrink-0 flex items-end justify-center gap-6 sm:gap-10 px-6 py-4">
              {/* Reorder: 2nd, 1st, 3rd (clássico pódio) */}
              {[podium[1], podium[0], podium[2]]
                .filter(Boolean)
                .map((entry, i) => (
                  <PodiumCard
                    key={entry!.position}
                    entry={entry!}
                    delay={i * 0.15}
                  />
                ))}
            </div>
          )}

          {/* Rest of list (4th-10th) */}
          {restOfList.length > 0 && (
            <div
              ref={scrollRef}
              className="flex-1 overflow-hidden relative px-4 sm:px-8 max-w-2xl mx-auto w-full"
            >
              <div
                className="space-y-2"
                style={{
                  animation: restOfList.length > 4 ? "tv-scroll-up 20s linear infinite" : undefined,
                }}
              >
                {restOfList.map((entry, idx) => {
                  const tierStyle = TIER_COLORS[entry.tier] ?? TIER_COLORS.bronze!;
                  return (
                    <motion.div
                      key={entry.position}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.06 }}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-4 py-2.5"
                    >
                      <span className="w-6 text-center text-xs font-black text-zinc-500">
                        {entry.position}°
                      </span>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-black text-zinc-300">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="flex-1 text-sm font-bold text-white truncate">{entry.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                        {TIER_LABEL[entry.tier] ?? entry.tier}
                      </span>
                      <p className="text-sm font-black text-[#EAB308] tabular-nums">
                        {entry.totalXP.toLocaleString("pt-BR")} XP
                      </p>
                    </motion.div>
                  );
                })}
                {/* Duplicata para scroll contínuo */}
                {restOfList.length > 4 && restOfList.map((entry) => {
                  const tierStyle = TIER_COLORS[entry.tier] ?? TIER_COLORS.bronze!;
                  return (
                    <div
                      key={`dup-${entry.position}`}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-4 py-2.5"
                      aria-hidden="true"
                    >
                      <span className="w-6 text-center text-xs font-black text-zinc-500">
                        {entry.position}°
                      </span>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-black text-zinc-300">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="flex-1 text-sm font-bold text-white truncate">{entry.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                        {TIER_LABEL[entry.tier] ?? entry.tier}
                      </span>
                      <p className="text-sm font-black text-[#EAB308] tabular-nums">
                        {entry.totalXP.toLocaleString("pt-BR")} XP
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticker */}
      <div className="flex-shrink-0 border-t border-zinc-900 py-3 bg-black/90">
        <TickerText texts={MOTIVATIONAL_TICKERS} />
      </div>

      {/* CSS Keyframes via style tag */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes tv-scroll-up {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
