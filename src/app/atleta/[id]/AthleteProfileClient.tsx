"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Zap, Trophy, CalendarCheck, Users } from "lucide-react";
import Link from "next/link";

interface Fundamental { id: string; label: string; xp: number; pct: number }
interface TierInfo    { id: string; emoji: string; label: string }

interface Profile {
  id: string;
  displayName: string;
  avatar: string;
  categories: string[];
  joinedAt: string | null;
  totalClasses: number;
  checkinCount: number;
  totalXP: number;
  tier: TierInfo;
  nextTier: { label: string; emoji: string; xpNeeded: number } | null;
  fundamentals: Fundamental[];
}

interface Props {
  id: string;
  initialProfile: Profile | null;
}

const TIER_COLORS: Record<string, { ring: string; glow: string; bg: string; text: string }> = {
  elite:    { ring: "border-purple-400",  glow: "shadow-purple-500/40",  bg: "bg-purple-500/10",  text: "text-purple-300"  },
  diamante: { ring: "border-cyan-400",    glow: "shadow-cyan-500/40",    bg: "bg-cyan-500/10",    text: "text-cyan-300"    },
  ouro:     { ring: "border-amber-400",   glow: "shadow-amber-500/40",   bg: "bg-amber-500/10",   text: "text-amber-300"   },
  prata:    { ring: "border-zinc-400",    glow: "shadow-zinc-500/30",    bg: "bg-zinc-500/10",    text: "text-zinc-300"    },
  bronze:   { ring: "border-orange-500",  glow: "shadow-orange-500/30",  bg: "bg-orange-500/10",  text: "text-orange-300"  },
  iniciante:{ ring: "border-zinc-600",    glow: "shadow-zinc-700/20",    bg: "bg-zinc-800/50",    text: "text-zinc-400"    },
};

const FUND_COLORS: Record<string, string> = {
  ataque:         "#EF4444",
  levantamento:   "#8B5CF6",
  bloqueio:       "#3B82F6",
  saque:          "#F97316",
  defesa:         "#22C55E",
  recepcao:       "#06B6D4",
  posicionamento: "#EAB308",
};

function RadarChart({ fundamentals }: { fundamentals: Fundamental[] }) {
  const size   = 180;
  const cx     = size / 2;
  const cy     = size / 2;
  const r      = 72;
  const n      = fundamentals.length;

  const angle  = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point  = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polyPoints = fundamentals
    .map((f, i) => { const p = point(i, r * (f.pct / 100)); return `${p.x},${p.y}`; })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={fundamentals.map((_, i) => { const p = point(i, r * level); return `${p.x},${p.y}`; }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {fundamentals.map((_, i) => {
        const outer = point(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {/* Filled area */}
      <polygon
        points={polyPoints}
        fill="rgba(234,179,8,0.12)"
        stroke="#EAB308"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {fundamentals.map((f, i) => {
        const p = point(i, r * (f.pct / 100));
        return (
          <circle key={f.id} cx={p.x} cy={p.y} r={3.5}
            fill={FUND_COLORS[f.id] ?? "#EAB308"}
            stroke="#0a0a0a" strokeWidth="1.5"
          />
        );
      })}
      {/* Labels */}
      {fundamentals.map((f, i) => {
        const p = point(i, r + 14);
        return (
          <text key={f.id} x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill="rgba(255,255,255,0.45)" fontWeight="600"
          >
            {f.label.slice(0, 5).toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

function Avatar({ name, seed }: { name: string; seed: string }) {
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const isDicebear = seed.includes("dicebear") || seed.startsWith("http");
  if (isDicebear) {
    return <img src={seed} alt={name} className="w-full h-full object-cover rounded-full" />;
  }
  return (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#EAB308]/30 to-[#F97316]/20 flex items-center justify-center">
      <span className="text-2xl font-black text-[#EAB308]">{initials}</span>
    </div>
  );
}

function formatXP(xp: number) {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return String(xp);
}

export default function AthleteProfileClient({ id, initialProfile }: Props) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [copied, setCopied]   = useState(false);
  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://will-treinos-pro.vercel.app"}/atleta/${id}`;

  // Re-fetch client-side in case SSR missed env
  useEffect(() => {
    if (profile) return;
    fetch(`/api/public/athlete/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile(data); })
      .catch(() => {});
  }, [id, profile]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName} ${profile?.tier?.emoji} | Will Treinos PRO`,
          text: `Confira meu perfil: ${profile?.totalXP} XP · ${profile?.tier?.label}`,
          url,
        });
        return;
      } catch { /* fallthrough to copy */ }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-4xl">🏐</span>
        <p className="text-zinc-500 text-sm text-center">Perfil não encontrado ou não está ativo.</p>
        <Link href="/" className="text-xs text-[#EAB308] font-bold underline">Ir para o Will Treinos PRO</Link>
      </div>
    );
  }

  const tierStyle = TIER_COLORS[profile.tier.id] ?? TIER_COLORS.iniciante;
  const topFundamentals = [...profile.fundamentals].sort((a, b) => b.xp - a.xp).slice(0, 3);
  const nextXpPct = profile.nextTier
    ? Math.round(100 - (profile.nextTier.xpNeeded / (profile.nextTier.xpNeeded + profile.totalXP)) * 100)
    : 100;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center py-10 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-8"
      >
        <span className="text-[#EAB308] font-black text-sm tracking-widest uppercase">⚡ Will Treinos PRO</span>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`w-full max-w-sm rounded-3xl border ${tierStyle.ring} bg-zinc-950 shadow-2xl ${tierStyle.glow} overflow-hidden`}
      >
        {/* Top accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-[#EAB308] via-[#F97316] to-[#EAB308]" />

        {/* Hero */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
            className={`w-20 h-20 rounded-full border-2 ${tierStyle.ring} shadow-lg mb-3`}
          >
            <Avatar name={profile.displayName} seed={profile.avatar} />
          </motion.div>

          {/* Tier badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${tierStyle.ring} ${tierStyle.bg} mb-2`}
          >
            <span className="text-base">{profile.tier.emoji}</span>
            <span className={`text-[11px] font-black tracking-widest uppercase ${tierStyle.text}`}>
              {profile.tier.label}
            </span>
          </motion.div>

          {/* Name */}
          <h1 className="text-xl font-black text-white text-center">{profile.displayName}</h1>

          {/* XP counter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-[#EAB308] mt-1"
          >
            {formatXP(profile.totalXP)} <span className="text-sm font-bold text-zinc-500">XP</span>
          </motion.p>

          {/* Next tier progress bar */}
          {profile.nextTier && (
            <div className="w-full mt-3">
              <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
                <span>{profile.tier.label}</span>
                <span>{profile.nextTier.emoji} {profile.nextTier.label} — faltam {formatXP(profile.nextTier.xpNeeded)} XP</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${nextXpPct}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#EAB308] to-[#F97316] rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 border-t border-zinc-800/60 divide-x divide-zinc-800/60">
          {[
            { icon: CalendarCheck, label: "Aulas", value: String(profile.totalClasses) },
            { icon: Zap,           label: "Check-ins", value: String(profile.checkinCount) },
            { icon: Trophy,        label: "Tier", value: profile.tier.label },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center py-3 gap-0.5">
              <Icon size={14} className="text-zinc-500 mb-0.5" />
              <span className="text-sm font-black text-white">{value}</span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div className="border-t border-zinc-800/60 pt-5 pb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center mb-3">
            Fundamentos
          </p>
          <RadarChart fundamentals={profile.fundamentals} />
        </div>

        {/* Top fundamentals */}
        {topFundamentals.some(f => f.xp > 0) && (
          <div className="px-5 pb-5 space-y-2">
            {topFundamentals.filter(f => f.xp > 0).map((f, i) => (
              <div key={f.id} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 w-3">{i + 1}</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.pct}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: FUND_COLORS[f.id] ?? "#EAB308" }}
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 w-20 text-right truncate">{f.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        <div className="px-5 pb-6 pt-1">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#EAB308] text-black font-black text-sm hover:bg-[#F59E0B] transition-colors"
          >
            {copied
              ? <><Check size={16} /> Link copiado!</>
              : <><Share2 size={16} /> Compartilhar perfil</>
            }
          </motion.button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <p className="text-[11px] text-zinc-600 text-center">
          Quer treinar e subir no ranking?
        </p>
        <Link
          href="/cadastro"
          className="text-xs font-black text-[#EAB308] hover:text-[#F59E0B] transition-colors"
        >
          Entrar no Will Treinos PRO →
        </Link>
      </motion.div>
    </div>
  );
}
