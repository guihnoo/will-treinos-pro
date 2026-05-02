"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  Flame,
  Home,
  MapPin,
  Play,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

// ─── Animation Variants ─────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 28,
    },
  },
};

const feedItemVariants = {
  hidden: { opacity: 0, x: 30, scale: 0.95 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
};

// ─── Radial Progress Ring ───────────────────────────────────────────────────
function RadialProgress({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color = "#EAB308",
  bgColor = "rgba(255,255,255,0.08)",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Mesh Gradient Background ───────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
      {/* Primary dark mesh gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(234,179,8,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(234,179,8,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.02),transparent_40%)]" />
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Animated glow orbs */}
      <motion.div
        className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-[#EAB308]/10 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-48 -right-32 h-80 w-80 rounded-full bg-[#EAB308]/8 blur-[120px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}

// ─── Glass Card Component ───────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/[0.04] backdrop-blur-2xl
        border border-white/[0.08]
        ${glow ? "shadow-[0_0_40px_rgba(234,179,8,0.12),0_8px_32px_rgba(0,0,0,0.4)]" : "shadow-[0_8px_32px_rgba(0,0,0,0.3)]"}
        ${className}
      `}
    >
      {/* Inner highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
}

// ─── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: "home", icon: Home, label: "Início" },
    { id: "agenda", icon: Calendar, label: "Agenda" },
    { id: "performance", icon: ChartNoAxesCombined, label: "Desempenho" },
    { id: "profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md">
        <GlassCard className="!rounded-2xl px-2 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                    transition-colors duration-200
                    ${isActive ? "text-[#EAB308]" : "text-zinc-500"}
                  `}
                  whileTap={{ scale: 0.92 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-xl bg-[#EAB308]/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-5 w-5 transition-all duration-200 ${
                      isActive ? "drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" : ""
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`relative z-10 text-[10px] font-semibold ${isActive ? "text-[#EAB308]" : ""}`}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </nav>
  );
}

// ─── Feed Item Card ─────────────────────────────────────────────────────────
function FeedCard({
  type,
  title,
  subtitle,
  thumbnail,
}: {
  type: "video" | "announcement";
  title: string;
  subtitle: string;
  thumbnail?: string;
}) {
  return (
    <motion.button
      className="group relative flex-shrink-0 w-56 overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] active:scale-[0.97] transition-transform"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Thumbnail or gradient */}
      <div className="relative h-28 w-full overflow-hidden">
        {thumbnail ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#EAB308]/30 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAB308] shadow-[0_0_20px_rgba(234,179,8,0.5)]">
              <Play className="h-4 w-4 fill-black text-black ml-0.5" />
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3 text-left">
        <p className="text-xs font-bold text-white line-clamp-2 leading-tight">{title}</p>
        <p className="mt-1 text-[10px] text-zinc-500">{subtitle}</p>
      </div>
    </motion.button>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────────
export default function AthleteDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Mock data
  const athlete = {
    name: "Guilherme",
    avatar: null,
    level: "Atleta Elite",
    rank: 7,
  };

  const nextClass = {
    title: "TREINO TÁTICO",
    date: "Hoje",
    time: "19:00",
    court: "Quadra Principal",
    category: "Grupo",
  };

  const stats = {
    monthlyAttendance: 85,
    streak: 12,
    successfulAttacks: 78,
    evolution: 15,
  };

  const feedItems = [
    {
      id: "1",
      type: "video" as const,
      title: "Técnica de Saque Viagem",
      subtitle: "Coach Will • 3 min",
    },
    {
      id: "2",
      type: "announcement" as const,
      title: "Torneio interno confirmado para próximo sábado!",
      subtitle: "Comunicado oficial",
    },
    {
      id: "3",
      type: "video" as const,
      title: "Análise Tática: Bloqueio Central",
      subtitle: "Coach Will • 5 min",
    },
  ];

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    // Haptic feedback simulation via visual
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 pb-28">
      <MeshBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-md px-4 pt-4"
      >
        {/* ─── TOP BAR ───────────────────────────────────────────────────── */}
        <motion.header variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Glowing Avatar */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#EAB308] to-[#EAB308]/30 opacity-60 blur-md" />
              <div className="relative h-12 w-12 rounded-full border-2 border-[#EAB308]/60 bg-zinc-900 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAB308]/30 to-zinc-900">
                  <span className="text-lg font-black text-[#FCD34D] drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]">
                    {athlete.name.charAt(0)}
                  </span>
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            {/* Greeting */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                E aí,
              </p>
              <p className="text-lg font-bold text-white -mt-0.5">{athlete.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rank Badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-sm">🏐</span>
              <span className="text-[11px] font-bold text-[#EAB308]">{athlete.level}</span>
            </div>

            {/* Notification Bell */}
            <motion.button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08]"
              whileTap={{ scale: 0.92 }}
            >
              <Bell className="h-5 w-5 text-zinc-400" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EAB308] text-[9px] font-bold text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                3
              </span>
            </motion.button>
          </div>
        </motion.header>

        {/* ─── HERO: NEXT CLASS CARD ─────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <GlassCard glow className="relative p-5 mb-5 overflow-hidden">
            {/* Decorative gradient orb */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#EAB308]/15 blur-[60px]" />
            
            {/* Category badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300">
                {nextClass.category}
              </span>
            </div>

            {/* Class title */}
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white mb-1">
              {nextClass.title}
            </h2>

            {/* Date & time */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-[#EAB308]">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-semibold">{nextClass.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">{nextClass.time}</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-zinc-500 mb-6">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{nextClass.court}</span>
            </div>

            {/* Check-in Button */}
            <AnimatePresence mode="wait">
              {!isCheckedIn ? (
                <motion.button
                  key="checkin"
                  onClick={handleCheckIn}
                  className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#EAB308] p-4 font-bold uppercase tracking-wide text-black shadow-[0_0_30px_rgba(234,179,8,0.4),0_4px_20px_rgba(0,0,0,0.3)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative flex items-center justify-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="text-base">Confirmar Presença</span>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="confirmed"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold uppercase tracking-wide text-emerald-400">
                    Presença Confirmada
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ─── TELEMETRY / STATS BENTO GRID ──────────────────────────────── */}
        <motion.section variants={itemVariants} className="mb-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 pl-1">
            Sua Performance
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Attendance - Radial */}
            <GlassCard className="p-4 flex flex-col items-center">
              <RadialProgress value={stats.monthlyAttendance} max={100} size={72} color="#22C55E">
                <div className="text-center">
                  <p className="text-lg font-black text-white">{stats.monthlyAttendance}%</p>
                </div>
              </RadialProgress>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Presença Mensal
              </p>
            </GlassCard>

            {/* Streak */}
            <GlassCard className="p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAB308]/15">
                  <Flame className="h-5 w-5 text-[#EAB308]" />
                </div>
                <span className="text-2xl font-black text-white">{stats.streak}</span>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Dias Seguidos
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">Sequência de treino</p>
              </div>
            </GlassCard>

            {/* Successful Attacks */}
            <GlassCard className="p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-2xl font-black text-white">{stats.successfulAttacks}%</span>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Ataques Certos
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">Eficiência ofensiva</p>
              </div>
            </GlassCard>

            {/* Evolution */}
            <GlassCard className="p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-black text-white">+{stats.evolution}%</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Evolução Física
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">vs. mês anterior</p>
              </div>
            </GlassCard>
          </div>
        </motion.section>

        {/* ─── QUICK FEED: A REDE ────────────────────────────────────────── */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              A Rede
            </h3>
            <button className="flex items-center gap-1 text-[10px] font-semibold text-[#EAB308] hover:text-[#FCD34D] transition-colors">
              <span>Ver Tudo</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <motion.div
            className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
          >
            {feedItems.map((item) => (
              <motion.div key={item.id} variants={feedItemVariants}>
                <FeedCard
                  type={item.type}
                  title={item.title}
                  subtitle={item.subtitle}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.div>

      {/* ─── BOTTOM NAVIGATION ───────────────────────────────────────────── */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
