"use client";

import React, { useState, useMemo, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useCheckIn } from "@/context/CheckInContext";
import { useLessonRatings } from "@/context/LessonRatingsContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import type { Lesson, CardTier } from "@/context/types";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import { useGamification } from "@/context/GamificationContext";
import { useFeed } from "@/context/FeedContext";
import { useApp } from "@/context/AppContext";
import { Calendar as CalendarIcon, Clock, Trophy, Bell, CheckCircle2, Play, Star, TrendingUp, TrendingDown, Users, X, Lock, MapPin, User, ChevronRight, Target, Medal, Radio, Flame, Heart, MessageCircle, Award, CreditCard, AlertTriangle as AlertIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { fetchXpLogEntriesRemote, type XpLogEntry } from "@/lib/supabasePersistence";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import { richToast } from "@/hooks/useToast";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import PushPermissionBanner from "@/components/PushPermissionBanner";
import GeoCheckInButton from "@/components/student/GeoCheckInButton";
import LessonCountdownCard from "@/components/student/LessonCountdownCard";
import { useCoachMessagesUnread } from "@/hooks/useCoachMessagesUnread";

// ─── Lazy-loaded panels (code-split — zero cost at startup) ──────────────────
const StudentGamificationDashboard = dynamic(
  () => import("@/components/StudentGamificationDashboard").then((m) => ({ default: m.StudentGamificationDashboard })),
  { ssr: false, loading: () => null }
);
const GamificationPanel = dynamic(
  () => import("@/components/gamification/GamificationPanel").then((m) => ({ default: m.GamificationPanel })),
  { ssr: false, loading: () => null }
);
const LeaderboardRankingPanel = dynamic(
  () => import("@/components/leaderboard/LeaderboardRankingPanel").then((m) => ({ default: m.LeaderboardRankingPanel })),
  { ssr: false, loading: () => null }
);
const TurmaLeaderboardCard = dynamic(
  () => import("@/components/leaderboard/TurmaLeaderboardCard"),
  { ssr: false, loading: () => null }
);
const StudentTwinCard = dynamic(
  () => import("@/components/gamification/StudentTwinCard"),
  { ssr: false, loading: () => null }
);
const OnboardingWidget = dynamic(
  () => import("@/components/gamification/OnboardingWidget"),
  { ssr: false, loading: () => null }
);
const WeeklyHighlightBanner = dynamic(
  () => import("@/components/student/WeeklyHighlightBanner"),
  { ssr: false, loading: () => null }
);
const WeeklySummaryBanner = dynamic(
  () => import("@/components/student/WeeklySummaryBanner"),
  { ssr: false, loading: () => null }
);
const WeeklyChallengeCard = dynamic(
  () => import("@/components/student/WeeklyChallengeCard"),
  { ssr: false, loading: () => null }
);
// Modal panels — only loaded when first opened
const LessonRatingSheet      = dynamic(() => import("@/components/LessonRatingSheet"), { ssr: false, loading: () => null });
const Confetti                = dynamic(() => import("@/components/Confetti"), { ssr: false, loading: () => null });
const LeaderboardPanel        = dynamic(() => import("@/components/LeaderboardPanel").then((m) => ({ default: m.LeaderboardPanel })), { ssr: false, loading: () => null });
const DailyChallengesPanel    = dynamic(() => import("@/components/gamification/DailyChallengesPanel"), { ssr: false, loading: () => null });
const AthleteTwinPanel        = dynamic(() => import("@/components/will/AthleteTwinPanel"), { ssr: false, loading: () => null });
const StudentPillarPanel      = dynamic(() => import("@/components/student/StudentPillarPanel"), { ssr: false, loading: () => null });
const StudentMessagesPanel    = dynamic(() => import("@/components/student/StudentMessagesPanel"), { ssr: false, loading: () => null });
const AttendanceCalendarPanel = dynamic(() => import("@/components/student/AttendanceCalendarPanel"), { ssr: false, loading: () => null });
const AbsenceRequestSheet     = dynamic(() => import("@/components/student/AbsenceRequestSheet"), { ssr: false, loading: () => null });
const RepositionSheet         = dynamic(() => import("@/components/student/RepositionSheet"), { ssr: false, loading: () => null });
const AthleteTimelinePanel    = dynamic(() => import("@/components/student/AthleteTimelinePanel"), { ssr: false, loading: () => null });
const StudentGoalsCard          = dynamic(() => import("@/components/student/StudentGoalsCard"),           { ssr: false, loading: () => null });
const NotificationCenterPanel  = dynamic(() => import("@/components/student/NotificationCenterPanel"),   { ssr: false, loading: () => null });
const FrequencyAlertBanner      = dynamic(() => import("@/components/student/FrequencyAlertBanner"),      { ssr: false, loading: () => null });
const MilestoneTracker          = dynamic(() => import("@/components/student/MilestoneTracker"),          { ssr: false, loading: () => null });
const FreeTrainingSheet         = dynamic(() => import("@/components/student/FreeTrainingSheet"),         { ssr: false, loading: () => null });
const PushSettingsPanel         = dynamic(() => import("@/components/PushSettingsPanel"),                 { ssr: false, loading: () => null });
const AchievementFeedPanel      = dynamic(() => import("@/components/student/AchievementFeedPanel"),      { ssr: false, loading: () => null });
const StudentTrainingPlanPanel  = dynamic(() => import("@/components/student/StudentTrainingPlanPanel"),  { ssr: false, loading: () => null });
const QRScannerSheet            = dynamic(() => import("@/components/student/QRScannerSheet"),            { ssr: false, loading: () => null });
const StudentPaymentSheet     = dynamic(() => import("@/components/student/StudentPaymentSheet").then((m) => ({ default: m.StudentPaymentSheet })), { ssr: false, loading: () => null });
const LessonHistoryPanel      = dynamic(() => import("@/components/student/LessonHistoryPanel"),       { ssr: false, loading: () => null });
const StudentSchedulePanel    = dynamic(() => import("@/components/student/StudentSchedulePanel"),     { ssr: false, loading: () => null });
const ShareProgressCard       = dynamic(() => import("@/components/student/ShareProgressCard"),        { ssr: false, loading: () => null });
const MonthlySummaryCard      = dynamic(() => import("@/components/student/MonthlySummaryCard"),        { ssr: false, loading: () => null });
const ReferralPanel           = dynamic(() => import("@/components/student/ReferralPanel"),              { ssr: false, loading: () => null });
import { studentSeesNotification } from "@/lib/notificationVisibility";
import OfflineBanner from "@/components/student/OfflineBanner";
import { offlineCache } from "@/lib/offlineCache";
import { wtLsGetString, wtLsSetString } from "@/lib/willLocalStorage";
import AppSectionCard from "@/components/ui/AppSectionCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import { YourDayCard } from "@/components/YourDayCard";
import WelcomeModal from "@/components/student/WelcomeModal";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import SessionExpiredModal from "@/components/SessionExpiredModal";
const MoodResponseCard = dynamic(
  () => import("@/components/student/MoodResponseCard"),
  { ssr: false, loading: () => null }
);

// Inlined from OnboardingWidget to avoid static import
function markTwinViewed(studentId: string) {
  try { localStorage.setItem(`wt_twin_viewed_${studentId}`, "1"); } catch { /* ignore */ }
}

const SPORTS_QUOTES = [
  { text: "Eu posso aceitar o fracasso — todos falham em alguma coisa. Mas não consigo aceitar não tentar.", author: "Michael Jordan", role: "Basketball" },
  { text: "O sucesso não é acidental. É trabalho duro, perseverança, aprendizado, sacrifício e, acima de tudo, amor pelo que você faz.", author: "Pelé", role: "Futebol" },
  { text: "Você tem que esperar. A vitória não vem de graça.", author: "Giba", role: "Vôlei" },
  { text: "A diferença entre o impossível e o possível está na determinação.", author: "Tommy Lasorda", role: "Coach Lendário" },
  { text: "Dor é temporária. Desistir dura para sempre.", author: "Lance Armstrong", role: "Ciclismo" },
  { text: "Campeões treinam quando os outros descansam.", author: "Anônimo", role: "Alto Nível" },
  { text: "O corpo conquista o que a mente acredita.", author: "Jim Evans", role: "Coach" },
  { text: "Não existe talento aqui. Isso é trabalho duro. Isso é obsessão.", author: "Conor McGregor", role: "MMA" },
  { text: "O único treino ruim é o que não aconteceu.", author: "Anônimo", role: "Fitness" },
  { text: "Grandes resultados exigem grandes ambições.", author: "Heráclito", role: "Filosofia" },
  { text: "Se você quer algo que nunca teve, precisa fazer algo que nunca fez.", author: "Thomas Jefferson", role: "Liderança" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier", role: "Filosofia" },
  { text: "A conquista mais difícil é vencer a si mesmo.", author: "Aristóteles", role: "Filosofia" },
  { text: "Atletas de elite não nascem, são construídos treino a treino.", author: "Sheilla Castro", role: "Vôlei" },
  { text: "O maior rival não está do outro lado da rede. Está dentro de você.", author: "Anônimo", role: "Vôlei" },
  { text: "Primeiro você domina a técnica, depois a técnica domina o jogo.", author: "Bernardo Rezende", role: "Seleção Brasileira" },
  { text: "A consistência é o que transforma a média em excelência.", author: "Tony Robbins", role: "Alta Performance" },
  { text: "Não meça seu progresso pelos olhos dos outros. Meça pelo que você era ontem.", author: "Anônimo", role: "Mentalidade" },
  { text: "Quem não tem disciplina para treinar não terá escolha na hora do jogo.", author: "Vince Lombardi", role: "Football Americano" },
  { text: "Um campeão é alguém que se levanta quando não consegue mais.", author: "Jack Dempsey", role: "Boxe" },
  { text: "O que você faz quando ninguém está olhando determina quem você será.", author: "Anônimo", role: "Mentalidade Elite" },
  { text: "A preparação é a arma mais poderosa que um atleta possui.", author: "Murilo Endres", role: "Vôlei" },
  { text: "O treino de hoje é o desempenho de amanhã.", author: "Anônimo", role: "Performance" },
  { text: "A fadiga faz covardes de todos nós. Então fique em forma.", author: "Vince Lombardi", role: "Coach Lendário" },
  { text: "O hábito é o segundo instinto.", author: "Aristóteles", role: "Filosofia" },
  { text: "Treinar é difícil. Ganhar é ainda mais difícil. Desistir é impossível.", author: "Anônimo", role: "Esporte" },
  { text: "Disciplina é a ponte entre metas e conquistas.", author: "Jim Rohn", role: "Alta Performance" },
  { text: "Toda manhã que você treina, você está um passo à frente de quem ainda está dormindo.", author: "Anônimo", role: "Esporte" },
  { text: "Não importa quantas vezes você cai; o que importa é quantas vezes você se levanta.", author: "Vince Lombardi", role: "Football Americano" },
  { text: "Os detalhes fazem a diferença entre campeões.", author: "Giba", role: "Vôlei" },
];

const ACHIEVEMENT_TRACKS = [
  {
    id: "consistency",
    label: "Trilha Consistência",
    desc: "Ritmo semanal, presença e sequência de treino.",
    accent: "#22C55E",
    goal: 74,
    requirements: ["Frequência >= 75%", "Sequência >= 5", "Consistência semanal >= 70%"],
    action: "Garanta presença nos próximos 2 treinos sem quebrar sequência.",
  },
  {
    id: "technical",
    label: "Trilha Técnica",
    desc: "Qualidade da execução validada em feedback.",
    accent: "#EAB308",
    goal: 76,
    requirements: ["Nota média >= 7.5", "Feedback técnico estável", "Sem regressão nas últimas sessões"],
    action: "Atuar no principal ponto de melhoria da sessão anterior.",
  },
  {
    id: "fundamentals",
    label: "Trilha Fundamentos",
    desc: "Evolução equilibrada em saque, recepção, levantamento, ataque, bloqueio e defesa.",
    accent: "#60A5FA",
    goal: 72,
    requirements: ["Média dos fundamentos >= 72", "Pelo menos 3 fundamentos em alta", "Sem fundamento crítico em queda"],
    action: "Treinar fundamento mais fraco antes da próxima aula.",
  },
  {
    id: "competitive",
    label: "Trilha Competitiva",
    desc: "Disciplina + técnica + execução em contexto real.",
    accent: "#A78BFA",
    goal: 82,
    requirements: ["Merit score >= 82", "Taxa de execução semanal >= 80%", "Check-in e feedback em dia"],
    action: "Executar semana completa com check-in e plano técnico aplicado.",
  },
] as const;

const DAY = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const scoreColor = (s: number) => s >= 8 ? "#22C55E" : s >= 6 ? "#EAB308" : "#EF4444";
const FUNDAMENTALS = [
  { id: "serve", label: "Saque", keys: ["saque", "servico", "serviço", "serve"] },
  { id: "receive", label: "Recepção", keys: ["recepcao", "recepção", "passe", "pass"] },
  { id: "set", label: "Levantamento", keys: ["levantamento", "set", "distribuicao", "distribuição"] },
  { id: "attack", label: "Ataque", keys: ["ataque", "spike", "finalizacao", "finalização"] },
  { id: "block", label: "Bloqueio", keys: ["bloqueio", "block"] },
  { id: "defense", label: "Defesa", keys: ["defesa", "dig", "cobertura"] },
] as const;

const resolveAvatarSrc = (avatar: string | null | undefined, fallbackSeed: string) => {
  if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
  if (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`;
};

const homeList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.05 },
  },
};

const homeItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

/** Points + paths for the evolution trend SVG (shared Home + modal). */
type EvolutionLineChartData = {
  w: number;
  h: number;
  d: string;
  areaD: string;
  linePts: Array<{ id: string; x: number; y: number; date: string; rating: number }>;
  lo: number;
  hi: number;
};

function EvolutionTrendPanel({
  idBase,
  chart,
  avgRating,
  compact,
}: {
  idBase: string;
  chart: EvolutionLineChartData | null;
  avgRating: number;
  compact?: boolean;
}) {
  const fillId = `${idBase}-evoFill`;
  const glowId = `${idBase}-evoGlow`;
  const avg = avgRating > 0 ? avgRating.toFixed(1) : "—";
  return (
    <div
      className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent ${compact ? "p-3" : "p-4"} backdrop-blur-md`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Tendência</p>
          <p className={`${compact ? "text-sm" : "text-sm"} font-bold text-white mt-1`}>Nota média (feedbacks)</p>
          <p className="text-xs text-zinc-500 mt-0.5">Uma leitura única — sem grade de pilares.</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>{avg}</p>
          <p className="text-[10px] font-bold text-zinc-500">média global</p>
        </div>
      </div>

      {chart ? (
        <div className="relative min-h-0">
          <svg
            viewBox={`0 0 ${chart.w} ${chart.h}`}
            className={compact ? "w-full h-28" : "w-full h-36"}
            role="img"
            aria-label="Gráfico de linha da evolução da nota"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(234,179,8,0.35)" />
                <stop offset="100%" stopColor="rgba(234,179,8,0.0)" />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path d={chart.areaD} fill={`url(#${fillId})`} opacity="0.9" />
            <motion.path
              d={chart.d}
              fill="none"
              stroke="rgba(234,179,8,0.95)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
              initial={{ pathLength: 0.55, opacity: 0.6 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />

            {chart.linePts.map((p) => (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r="3.2" fill="rgba(0,0,0,0.55)" stroke="rgba(234,179,8,0.85)" strokeWidth="1.4" />
                <circle cx={p.x} cy={p.y} r="1.2" fill="rgba(234,179,8,0.95)" />
              </g>
            ))}

            <text x="12" y="18" fill="rgba(161,161,170,0.95)" fontSize="10" fontWeight="700">
              {`min ${chart.lo.toFixed(1)}`}
            </text>
            <text x={chart.w - 12} y="18" fill="rgba(161,161,170,0.95)" fontSize="10" fontWeight="700" textAnchor="end">
              {`max ${chart.hi.toFixed(1)}`}
            </text>
          </svg>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm font-bold text-white">Ainda poucos dados</p>
          <p className="text-xs text-zinc-500 mt-1">
            Conclua mais feedbacks para liberar a tendência (precisamos de pelo menos 2 pontos).
          </p>
        </div>
      )}
    </div>
  );
}

const WEEK_STYLE: Record<
  string,
  {
    label: string;
    cardClass: string;
    badge: string;
    timeClass: string;
    accent: string;
  }
> = {
  // Técnica — electric blue
  individual: {
    label: "Técnica",
    cardClass:
      "bg-gradient-to-br from-sky-500/25 via-sky-600/10 to-black/50 border-sky-400/35 shadow-[0_12px_40px_rgba(14,165,233,0.12)]",
    badge: "border-sky-400/50 bg-sky-500/15 text-sky-100",
    timeClass: "text-sky-100/95",
    accent: "rgba(56,189,248,0.75)",
  },
  dupla: {
    label: "Técnica",
    cardClass:
      "bg-gradient-to-br from-cyan-500/20 via-sky-900/20 to-black/50 border-cyan-400/30 shadow-[0_12px_40px_rgba(6,182,212,0.1)]",
    badge: "border-cyan-400/45 bg-cyan-500/10 text-cyan-50",
    timeClass: "text-cyan-100/95",
    accent: "rgba(34,211,238,0.8)",
  },
  // Tático — deep purple
  grupo: {
    label: "Tático",
    cardClass:
      "bg-gradient-to-br from-violet-600/35 via-fuchsia-900/20 to-black/55 border-violet-500/35 shadow-[0_12px_44px_rgba(124,58,237,0.16)]",
    badge: "border-violet-400/45 bg-violet-500/15 text-violet-100",
    timeClass: "text-violet-100/95",
    accent: "rgba(167,139,250,0.85)",
  },
  // Físico — energy red
  performance: {
    label: "Físico",
    cardClass:
      "bg-gradient-to-br from-red-500/30 via-rose-900/20 to-black/50 border-red-500/35 shadow-[0_12px_44px_rgba(239,68,68,0.14)]",
    badge: "border-red-400/50 bg-red-500/12 text-red-100",
    timeClass: "text-red-100/95",
    accent: "rgba(248,113,113,0.9)",
  },
  // Recovery — jade
  "kids-sub10": {
    label: "Recovery",
    cardClass:
      "bg-gradient-to-br from-emerald-500/25 via-emerald-900/15 to-black/50 border-emerald-400/35 shadow-[0_12px_40px_rgba(16,185,129,0.12)]",
    badge: "border-emerald-400/45 bg-emerald-500/12 text-emerald-100",
    timeClass: "text-emerald-100/95",
    accent: "rgba(52,211,153,0.85)",
  },
  "kids-sub13": {
    label: "Recovery",
    cardClass:
      "bg-gradient-to-br from-emerald-500/25 via-teal-900/20 to-black/50 border-emerald-400/32 shadow-[0_12px_40px_rgba(16,185,129,0.1)]",
    badge: "border-emerald-400/45 bg-emerald-500/10 text-emerald-100",
    timeClass: "text-emerald-100/95",
    accent: "rgba(45,212,191,0.8)",
  },
  "kids-sub15": {
    label: "Recovery",
    cardClass:
      "bg-gradient-to-br from-green-500/22 via-emerald-950/25 to-black/50 border-green-500/30 shadow-[0_12px_40px_rgba(34,197,94,0.1)]",
    badge: "border-green-400/45 bg-green-500/10 text-green-100",
    timeClass: "text-green-100/95",
    accent: "rgba(74,222,128,0.85)",
  },
  // VIP — premium (gold + violet) — not in the 4 base buckets, but distinct
  vip: {
    label: "VIP",
    cardClass:
      "bg-gradient-to-br from-amber-500/20 via-violet-700/20 to-black/55 border-amber-400/35 shadow-[0_12px_44px_rgba(234,179,8,0.1)]",
    badge: "border-amber-300/50 bg-amber-500/10 text-amber-100",
    timeClass: "text-amber-100/95",
    accent: "rgba(250,204,21,0.75)",
  },
};

function getWeekStyle(categoryId: string) {
  return (
    WEEK_STYLE[categoryId] ?? {
      label: "Treino",
      cardClass: "bg-zinc-950/50 border-white/[0.08]",
      badge: "border-zinc-600 bg-zinc-900/60 text-zinc-200",
      timeClass: "text-zinc-200",
      accent: "rgba(161,161,170,0.7)",
    }
  );
}

function MedalTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 260, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 260, damping: 22 });

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    x.set(px);
    y.set(py);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className={className}>
      <motion.div style={{ perspective: 900, transformStyle: "preserve-3d" }}>
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="will-change-transform [transform:translateZ(0)]"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

function TrackGlyph({ id, accent, locked }: { id: (typeof ACHIEVEMENT_TRACKS)[number]["id"]; accent: string; locked: boolean }) {
  const baseOpacity = locked ? 0.35 : 0.95;
  if (id === "consistency") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="19" fill="none" stroke={`${accent}66`} strokeWidth="4" />
        <path d="M20 32 L29 40 L44 23" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={baseOpacity} />
      </svg>
    );
  }
  if (id === "technical") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="18" fill="none" stroke={`${accent}66`} strokeWidth="3" />
        <path d="M14 32 H50 M32 14 V50" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity={baseOpacity} />
        <circle cx="32" cy="32" r="5.5" fill={accent} opacity={baseOpacity} />
      </svg>
    );
  }
  if (id === "fundamentals") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="5.5" fill={accent} opacity={baseOpacity} />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 32 + Math.cos(rad) * 16;
          const y = 32 + Math.sin(rad) * 16;
          return <circle key={angle} cx={x} cy={y} r="3.7" fill={accent} opacity={baseOpacity} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
      <path d="M12 18 H52 V46 H12 Z" fill="none" stroke={`${accent}66`} strokeWidth="3" />
      <path d="M32 18 V46" stroke={`${accent}66`} strokeWidth="2" />
      <path d="M15 32 C21 25, 27 25, 32 32 C37 39, 43 39, 49 32" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity={baseOpacity} />
      <path d="M38 16 L46 10 M46 10 L46 18 M46 10 L38 10" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function StudentHomeSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse" aria-hidden>
      <div className="flex justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-zinc-800/80" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-6 w-48 rounded-lg bg-zinc-800/80" />
            <div className="h-3 w-32 rounded bg-zinc-800/60" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-xl bg-zinc-800/80" />
          <div className="h-10 w-10 rounded-xl bg-zinc-800/80" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
        ))}
      </div>
      <div className="h-24 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
      <div className="h-40 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
    </div>
  );
}

const TIER_META: Record<CardTier, { emoji: string; label: string; color: string; gradient: string }> = {
  bronze:   { emoji: "🥉", label: "Bronze",   color: "#CD7F32", gradient: "from-amber-700 to-amber-600" },
  prata:    { emoji: "🥈", label: "Prata",    color: "#C0C0C0", gradient: "from-gray-400 to-gray-300" },
  ouro:     { emoji: "🥇", label: "Ouro",     color: "#FFD700", gradient: "from-yellow-400 to-yellow-300" },
  diamante: { emoji: "💎", label: "Diamante", color: "#00CED1", gradient: "from-cyan-400 to-blue-400" },
  elite:    { emoji: "👑", label: "Elite",    color: "#FF1493", gradient: "from-purple-500 to-pink-500" },
};

export default function StudentHome() {
  const { getCategory } = useCatalog();
  const { feedbacks } = useCoaching();
  const { payments, getStudentCurrentPayment, currentMonthReference } = usePayments();
  const { requestCheckIn } = useCheckIn();
  const { appConfig } = useAppConfig();
  const { lessonRatings, addLessonRating, getLessonRating } = useLessonRatings();
  const { user, usingSupabaseSession } = useAuth();
  const { totalXP } = useGamification();
  const { addPost } = useFeed();
  const { requestReposition } = useApp();
  const { lessons } = useLessons();
  const { students } = useStudents();
  const { criticalDataError, retryCriticalDataSync } = useCriticalData();
  const { notifications, markNotificationRead } = useNotifications();
  const evoChartIdHome = useId().replace(/:/g, "h");
  const evoChartIdModal = useId().replace(/:/g, "m");
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const { isExpired: sessionExpired, recovering: sessionRecovering, recover: recoverSession, forceLogout: sessionForceLogout } = useSessionRecovery();

  // Show welcome modal on first login (once per user)
  useEffect(() => {
    if (!hydrated || !user?.id) return;
    const key = `wt_welcomed_${user.id}`;
    try {
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
      }
    } catch { /* ignore */ }
  }, [hydrated, user?.id]);

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ getSupabaseClient }) => {
      getSupabaseClient().auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) setSessionToken(session.access_token);
      });
    });
  }, []);

  // Detect card tier unlock
  useEffect(() => {
    if (!hydrated || totalXP === 0) return;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevXPRef.current = totalXP;
      return;
    }
    const prev = prevXPRef.current ?? 0;
    if (totalXP <= prev) { prevXPRef.current = totalXP; return; }
    const tiers: CardTier[] = ["bronze", "prata", "ouro", "diamante", "elite"];
    for (const tier of tiers) {
      const threshold = CARD_TIER_THRESHOLDS[tier];
      if (prev < threshold && totalXP >= threshold) {
        const meta = TIER_META[tier];
        setJustUnlockedTier(tier);
        const autoShareText = `Acabei de desbloquear o Card ${meta.label} ${meta.emoji} no Will Treinos PRO! ${totalXP} XP conquistados na quadra. Quem tá chegando no mesmo nível? 🏐🔥`;
        setShareText(autoShareText);
        // Auto-post silencioso no feed (conquista oficial)
        try {
          const currentProfile = students.find(s => s.authUserId === user?.id || s.id === user?.id);
          addPost({
            user: { name: user?.name || "Atleta", avatar: currentProfile?.avatar || user?.avatar || "user", isPro: false },
            time: "agora",
            content: autoShareText,
            media: null,
            likes: 0,
            comments: [],
            isLiked: false,
            isSaved: false,
            pinned: false,
            isOfficial: false,
            targetRole: "all",
          });
        } catch { /* silent */ }
        break;
      }
    }
    prevXPRef.current = totalXP;
  }, [totalXP, hydrated]);
  const [showNotif, setShowNotif] = useState(false);
  const [lessonModal, setLessonModal] = useState<Lesson | null>(null);
  const [evolModal, setEvolModal] = useState(false);
  const [trackModalId, setTrackModalId] = useState<(typeof ACHIEVEMENT_TRACKS)[number]["id"] | null>(null);
  const [statsModal, setStatsModal] = useState<"aulas"|"streak"|"nota"|"freq"|null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAgendaPanel, setShowAgendaPanel] = useState(false);
  const [ratingLesson, setRatingLesson] = useState<Lesson | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [equippedTierId, setEquippedTierId] = useState<string | null>(null);
  const [localNow, setLocalNow] = useState<Date | null>(null);
  const [kpiCount, setKpiCount] = useState({ aulas: 0, streak: 0, nota: 0, freq: 0 });
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGamificationDashboard, setShowGamificationDashboard] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showStudentTwin, setShowStudentTwin] = useState(false);
  const [showPillarPanel, setShowPillarPanel] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showAbsenceSheet, setShowAbsenceSheet] = useState(false);
  const [showRepositionSheet, setShowRepositionSheet] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPushSettings, setShowPushSettings] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showFreeTraining, setShowFreeTraining] = useState(false);
  const [showAchievementFeed, setShowAchievementFeed] = useState(false);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [showTrainingPlan, setShowTrainingPlan] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [showStudentSchedule, setShowStudentSchedule] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [xpLogEntries, setXpLogEntries] = useState<XpLogEntry[]>([]);
  const [showPayments, setShowPayments] = useState(false);
  const [justUnlockedTier, setJustUnlockedTier] = useState<CardTier | null>(null);
  const [shareText, setShareText] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const prevXPRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  const hasOverlayOpen = Boolean(
    showWelcome ||
    showNotif ||
      lessonModal ||
      evolModal ||
      trackModalId ||
      statsModal ||
      showAgendaPanel ||
      ratingLesson ||
      showDailyQuote ||
      showXpModal ||
      showLeaderboard ||
      showGamificationDashboard ||
      showDailyChallenges ||
      showStudentTwin ||
      showPillarPanel ||
      showMessagesPanel ||
      showAbsenceSheet ||
      showRepositionSheet ||
      showTimeline ||
      showNotificationCenter ||
      showPushSettings ||
      showFreeTraining ||
      showAchievementFeed ||
      showReferralPanel ||
      showTrainingPlan ||
      showQRScanner ||
      showAttendanceCalendar ||
      showLessonHistory ||
      showPayments ||
      showStudentSchedule ||
      showShareCard ||
      justUnlockedTier,
  );
  useBodyScrollLock(hasOverlayOpen);
  useEffect(() => {
    setLocalNow(new Date());
    const id = setInterval(() => setLocalNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return SPORTS_QUOTES[dayOfYear % SPORTS_QUOTES.length]!;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const today = new Date().toDateString();
    const lastSeen = wtLsGetString("daily_quote_date", "");
    if (lastSeen !== today) setShowDailyQuote(true);
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const savedTier = wtLsGetString("equipped_tier_id", "");
    if (savedTier) setEquippedTierId(savedTier);
  }, [hydrated]);

  useEffect(() => {
    if (!showXpModal || !user?.id) {
      setXpLogEntries([]);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void fetchXpLogEntriesRemote(supabase, user.id, 10).then(entries => setXpLogEntries(entries));
  }, [showXpModal, user?.id]);

  const profile = students.find(s => s.id === user?.id);
  const { count: messagesUnread, setCount: setMessagesUnread } = useCoachMessagesUnread(profile?.id ?? null);
  const myLessons = lessons.filter(l => l.enrolledStudents.includes(user?.id || ""));
  // Real count: completed lessons with presence + historical record from profile
  const completedFromLessons = myLessons.filter(l => l.presentStudents.includes(user?.id || "")).length;
  const completedCount = Math.max(completedFromLessons, profile?.totalClasses || 0);
  const frequency = profile?.frequency || Math.min(100, completedFromLessons > 0 ? Math.round((completedFromLessons / Math.max(profile?.totalClasses || completedFromLessons, 1)) * 100) : 0);
  const freqColor = frequency >= 80 ? "#22C55E" : frequency >= 60 ? "#EAB308" : "#EF4444";
  // Use student profile avatar (updated via perfil page)
  const avatarSeed = profile?.avatar || user?.avatar || "Ricardo";

  const myFeedbacks = useMemo(() => feedbacks.filter(f => f.studentId === user?.id).sort((a,b) => b.date.localeCompare(a.date)), [feedbacks, user]);
  const myLessonRatings = useMemo(
    () => lessonRatings.filter((r) => r.studentId === user?.id).sort((a, b) => b.date.localeCompare(a.date)),
    [lessonRatings, user],
  );

  // Completed lessons in last 7 days where student was present and hasn't rated yet
  const unratedLessons = useMemo(() => {
    if (!user?.id) return [];
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    const ratedIds = new Set(myLessonRatings.map(r => r.lessonId));
    return myLessons
      .filter(l =>
        l.status === "completed" &&
        l.presentStudents.includes(user.id) &&
        l.date >= sinceStr &&
        !ratedIds.has(l.id)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [myLessons, myLessonRatings, user]);
  const latest = myFeedbacks[0] ?? null;
  const avgRating = useMemo(() => {
    if (myFeedbacks.length === 0) return 0;
    const sum = myFeedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    return sum / myFeedbacks.length;
  }, [myFeedbacks]);
  const selfSessionAvg = useMemo(() => {
    if (myLessonRatings.length === 0) return 0;
    const total = myLessonRatings.reduce((acc, item) => {
      const score = (item.intensidade + item.tecnica + item.didatica + item.evolucao) / 4;
      return acc + score;
    }, 0);
    return (total / myLessonRatings.length) * 2;
  }, [myLessonRatings]);

  const evolutionSeries = useMemo(() => {
    const sorted = [...myFeedbacks].sort((a, b) => a.date.localeCompare(b.date) || (a.id || "").localeCompare(b.id || ""));
    return sorted.slice(-18).map((f) => ({ id: f.id, date: f.date, rating: f.rating }));
  }, [myFeedbacks]);

  const evolutionLineChart = useMemo((): EvolutionLineChartData | null => {
    const pts = evolutionSeries.filter((p) => typeof p.rating === "number");
    if (pts.length < 2) return null;
    const ratings = pts.map((p) => p.rating);
    const minR = Math.min(...ratings);
    const maxR = Math.max(...ratings);
    const pad = 0.75;
    const lo = Math.max(0, minR - pad);
    const hi = Math.min(10, maxR + pad);
    const span = Math.max(0.0001, hi - lo);
    const w = 320;
    const h = 120;
    const padX = 12;
    const padY = 14;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const linePts = pts.map((p, i) => {
      const x = padX + (innerW * i) / Math.max(1, pts.length - 1);
      const y = padY + innerH * (1 - (p.rating - lo) / span);
      return { x, y, ...p };
    });
    const d = linePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaD = `M ${linePts[0]!.x.toFixed(1)} ${(h - padY).toFixed(1)} ${linePts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${linePts[linePts.length - 1]!.x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;
    return { w, h, d, areaD, linePts, lo, hi };
  }, [evolutionSeries]);

  const streak = useMemo(() => {
    let s = 0;
    const sorted = [...myLessons].filter(l => l.status === "completed").sort((a,b) => b.date.localeCompare(a.date));
    for (const l of sorted) { if (l.presentStudents.includes(user?.id || "")) s++; else break; }
    // If no completed lessons in data but profile shows totalClasses, use a calculated streak
    return s > 0 ? s : Math.min(profile?.totalClasses || 0, 5);
  }, [myLessons, user, profile]);
  const bestStreak = useMemo(() => {
    const completed = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    let best = 0;
    let current = 0;
    for (const l of completed) {
      if (l.presentStudents.includes(user?.id || "")) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return Math.max(best, streak);
  }, [myLessons, user, streak]);
  const sessionsToBeatRecord = Math.max(0, bestStreak - streak + 1);
  const streakTrail = useMemo(() => {
    const completed = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 7)
      .map((l) => l.presentStudents.includes(user?.id || ""));
    while (completed.length < 7) completed.push(false);
    return completed.reverse();
  }, [myLessons, user]);

  const currentWeekPlan = useMemo(() => {
    const now = localNow ?? new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const inWeek = myLessons.filter((l) => {
      const d = lessonLocalDateTime(l.date, l.startTime);
      return d >= monday && d <= sunday;
    });
    const scheduledThisWeek = inWeek.filter((l) => l.status === "scheduled" || l.status === "in-progress" || l.status === "completed").length;
    const attendedThisWeek = inWeek.filter((l) => l.status === "completed" && l.presentStudents.includes(user?.id || "")).length;
    return { scheduledThisWeek, attendedThisWeek };
  }, [myLessons, localNow, user]);
  const weeklyConsistency = useMemo(() => {
    const expected = Math.max(1, currentWeekPlan.scheduledThisWeek);
    return Math.round(Math.min(100, (currentWeekPlan.attendedThisWeek / expected) * 100));
  }, [currentWeekPlan]);
  const meritScore = useMemo(() => {
    const attendanceScore = Math.min(100, completedCount * 3);
    const frequencyScore = frequency;
    const qualityScore = Math.min(100, avgRating * 10);
    const streakScore = Math.min(100, streak * 8);
    const consistencyScore = weeklyConsistency;
    return Math.round(
      attendanceScore * 0.2 +
      frequencyScore * 0.25 +
      qualityScore * 0.35 +
      streakScore * 0.1 +
      consistencyScore * 0.1,
    );
  }, [completedCount, frequency, avgRating, streak, weeklyConsistency]);
  const tierSystem = useMemo(() => [
    { id: "tier-bronze", min: 35, label: "Bronze", color: "#CD7F32" },
    { id: "tier-silver", min: 50, label: "Prata", color: "#C0C0C0" },
    { id: "tier-gold", min: 65, label: "Ouro", color: "#EAB308" },
    { id: "tier-platinum", min: 78, label: "Platina", color: "#67E8F9" },
    { id: "tier-diamond", min: 88, label: "Diamante", color: "#60A5FA" },
    { id: "tier-legend", min: 96, label: "Lendário", color: "#A78BFA" },
  ], []);
  const currentTier = useMemo(
    () => [...tierSystem].reverse().find((t) => meritScore >= t.min) ?? { id: "tier-base", min: 0, label: "Base", color: "#6B7280" },
    [tierSystem, meritScore],
  );
  const nextTier = useMemo(
    () => tierSystem.find((t) => meritScore < t.min) ?? null,
    [tierSystem, meritScore],
  );
  const equippedTier = useMemo(() => {
    const selected = tierSystem.find((t) => t.id === equippedTierId);
    if (selected && meritScore >= selected.min) return selected;
    return currentTier;
  }, [tierSystem, equippedTierId, meritScore, currentTier]);
  const getTierSubLevel = (tierId: string) => {
    const idx = tierSystem.findIndex((t) => t.id === tierId);
    if (idx < 0) return 1;
    const tier = tierSystem[idx]!;
    const next = tierSystem[idx + 1];
    const span = Math.max(1, (next?.min ?? 100) - tier.min);
    const localScore = Math.max(0, meritScore - tier.min);
    const ratio = Math.min(0.999, localScore / span);
    return Math.min(3, Math.max(1, Math.floor(ratio * 3) + 1));
  };
  const performanceScore = Math.round(Math.min(100, (avgRating * 10 * 0.75) + (Math.min(100, bestStreak * 3) * 0.25)));
  const disciplineScore = Math.round(Math.min(100, frequency * 0.6 + weeklyConsistency * 0.4));
  const coachTrustScore = Math.round(Math.min(100, (myFeedbacks.length * 6) + (avgRating * 6)));

  const week7 = useMemo(() => {
    const base = localNow ?? new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return localDateISO(d);
    });
  }, [localNow]);
  const weekScheduledCount = useMemo(() => {
    const weekSet = new Set(week7);
    return myLessons.filter((l) => weekSet.has(l.date) && (l.status === "scheduled" || l.status === "in-progress" || l.status === "completed")).length;
  }, [myLessons, week7]);
  const weekCompletedCount = useMemo(() => {
    const weekSet = new Set(week7);
    return myLessons.filter((l) => weekSet.has(l.date) && l.status === "completed" && l.presentStudents.includes(user?.id || "")).length;
  }, [myLessons, week7, user]);

  const nextLesson = myLessons.filter(l => l.status==="scheduled"||l.status==="in-progress")
    .sort((a,b) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))[0];
  const missionOfDay = useMemo(() => {
    if (nextLesson) {
      return {
        title: "Missão de Hoje",
        decision: "Priorizar preparação e chegada no horário",
        action: `Checklist + check-in para ${nextLesson.startTime}`,
      };
    }
    return {
      title: "Missão de Hoje",
      decision: "Consolidar evolução técnica",
      action: "Revisar feedback do professor e definir foco da próxima sessão",
    };
  }, [nextLesson]);
  const nextSessionPlan = useMemo(() => {
    if (!latest) return ["Confirmar presença da próxima aula", "Definir objetivo técnico da sessão", "Chegar com 15 min de antecedência"];
    const plan = [
      ...(latest.improvements?.length ? latest.improvements.slice(0, 2).map((i) => `Aprimorar: ${i}`) : []),
      ...(latest.strengths?.length ? [`Manter ponto forte: ${latest.strengths[0]}`] : []),
    ];
    while (plan.length < 3) plan.push("Executar plano com disciplina e constância");
    return plan.slice(0, 3);
  }, [latest]);
  const feedbackByLessonId = useMemo(() => {
    const map = new Map<string, (typeof myFeedbacks)[number]>();
    for (const fb of myFeedbacks) {
      if (!map.has(fb.lessonId)) map.set(fb.lessonId, fb);
    }
    return map;
  }, [myFeedbacks]);
  const fundamentalsTrend = useMemo(() => {
    const src = [...myFeedbacks]
      .sort((a, b) => a.date.localeCompare(b.date) || (a.id || "").localeCompare(b.id || ""))
      .slice(-10);
    return FUNDAMENTALS.map((fund) => {
      let score = 52;
      const points: Array<{ x: number; y: number; score: number }> = [];
      src.forEach((fb, idx) => {
        const strengthsText = (fb.strengths || []).join(" ").toLowerCase();
        const improvementsText = (fb.improvements || []).join(" ").toLowerCase();
        const noteText = `${fb.professorNote || ""} ${fb.trainingType || ""}`.toLowerCase();
        const hitStrength = fund.keys.some((k) => strengthsText.includes(k));
        const hitImprove = fund.keys.some((k) => improvementsText.includes(k));
        const hitNote = fund.keys.some((k) => noteText.includes(k));
        const fbBias = (fb.rating - 7) * 0.3;
        const delta = (hitStrength ? 3.8 : 0) - (hitImprove ? 3.2 : 0) + (hitNote ? fbBias : 0);
        score = Math.max(35, Math.min(96, score + delta));
        points.push({ x: idx, y: score, score });
      });
      if (points.length < 2) {
        points.push({ x: 0, y: score, score }, { x: 1, y: score, score });
      }
      const last = points[points.length - 1]?.score ?? score;
      const prev = points[points.length - 2]?.score ?? last;
      const trend = last > prev + 0.6 ? "up" : last < prev - 0.6 ? "down" : "stable";
      return { id: fund.id, label: fund.label, points, score: Math.round(last), trend };
    });
  }, [myFeedbacks]);
  // XP by fundamental derived from trend scores (0-100 range — used in share card radar)
  const xpByFundamental = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const FUNDAMENTAL_KEY_MAP: Record<string, string> = {
      serve: "saque",
      receive: "recepcao",
      set: "levantamento",
      attack: "ataque",
      block: "bloqueio",
      defense: "defesa",
    };
    for (const f of fundamentalsTrend) {
      const key = FUNDAMENTAL_KEY_MAP[f.id] ?? f.id;
      map[key] = f.score;
    }
    return map;
  }, [fundamentalsTrend]);

  const getLessonExecutionStage = (lesson: Lesson) => {
    const userId = user?.id || "";
    const myCheckIn = lesson.checkInRequests?.find((r) => r.studentId === userId);
    const hasCheckInRequest = Boolean(myCheckIn);
    const checkedIn = lesson.presentStudents.includes(userId) || myCheckIn?.status === "approved";
    const hasFeedback = feedbackByLessonId.has(lesson.id);
    const stage = lesson.status === "completed" && hasFeedback ? 4 : checkedIn ? 3 : hasCheckInRequest ? 2 : 1;
    return {
      stage,
      label: stage === 4 ? "Concluída com feedback" : stage === 3 ? "Check-in confirmado" : stage === 2 ? "Check-in solicitado" : "Aula agendada",
      color: stage === 4 ? "#22C55E" : stage === 3 ? "#60A5FA" : stage === 2 ? "#EAB308" : "#A1A1AA",
    };
  };

  // Countdown to next lesson
  const [countdown, setCountdown] = React.useState("");
  React.useEffect(() => {
    if (!nextLesson) return;
    const tick = () => {
      const now = new Date();
      const target = lessonLocalDateTime(nextLesson.date, nextLesson.startTime);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setCountdown("Agora!"); return; }
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      setCountdown(h > 0 ? `${h}h ${m}min` : `${m}min`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextLesson]);

  // SECURITY: same rule as financeiro CRM id (recipientId === user.id) + globals; staff sees all
  const myNotifications = (role: string | null | undefined, userId: string) => {
    if (role === "admin" || role === "coach") return notifications;
    return notifications.filter((n) => studentSeesNotification(n, userId));
  };
  const visibleNotifications = myNotifications(user?.role, user?.id || "");
  const unread = visibleNotifications.filter(n => !n.read).length;
  const fundamentalsAverage = Math.round(
    fundamentalsTrend.length ? fundamentalsTrend.reduce((acc, item) => acc + item.score, 0) / fundamentalsTrend.length : 0,
  );
  const executionRate = Math.round((weekCompletedCount / Math.max(1, weekScheduledCount)) * 100);
  const attendedLessons = useMemo(
    () => myLessons.filter((l) => l.status === "completed" && l.presentStudents.includes(user?.id || "")),
    [myLessons, user],
  );
  const attendanceDiagnostics = useMemo(() => {
    const recent = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 8);
    const attended = recent.filter((l) => l.presentStudents.includes(user?.id || "")).length;
    const rate = recent.length ? Math.round((attended / recent.length) * 100) : 0;
    const cause = rate >= 80 ? "Boa regularidade nas últimas sessões." : rate >= 60 ? "Oscilação de presença nas últimas semanas." : "Ritmo de comparecimento abaixo do ideal.";
    const impact = rate >= 80 ? "Mantém ganho técnico contínuo e previsível." : "Evolução técnica fica menos estável entre sessões." ;
    const action = rate >= 80 ? "Manter confirmação antecipada e rotina de check-in." : "Fechar agenda semanal e confirmar presença com antecedência.";
    return { recent, rate, cause, impact, action };
  }, [myLessons, user]);
  const trackScoreMap = {
    consistency: Math.round(Math.min(100, frequency * 0.45 + weeklyConsistency * 0.35 + Math.min(100, streak * 8) * 0.2)),
    technical: Math.round(Math.min(100, avgRating * 10 * 0.55 + performanceScore * 0.25 + coachTrustScore * 0.15 + selfSessionAvg * 0.05)),
    fundamentals: Math.round(Math.min(100, fundamentalsAverage * 0.75 + avgRating * 10 * 0.25)),
    competitive: Math.round(Math.min(100, meritScore * 0.5 + executionRate * 0.3 + disciplineScore * 0.2)),
  } as const;
  const achievementTracks = ACHIEVEMENT_TRACKS.map((track) => {
    const score = trackScoreMap[track.id];
    const unlocked = score >= track.goal;
    const progress = Math.max(0, Math.min(100, (score / track.goal) * 100));
    return {
      ...track,
      score,
      unlocked,
      progress,
      missing: Math.max(0, track.goal - score),
    };
  });
  const unlockedTracksCount = achievementTracks.filter((track) => track.unlocked).length;
  const activeTrack = trackModalId ? achievementTracks.find((track) => track.id === trackModalId) ?? null : null;
  const greeting = () => {
    if (!localNow) return "Olá";
    const h = localNow.getHours();
    if (h >= 0 && h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };
  const periodPill = (() => {
    if (!localNow) return "Sincronizando";
    const h = localNow.getHours();
    if (h >= 0 && h < 6) return "Madrugada";
    if (h < 12) return "Modo manhã";
    if (h < 18) return "Modo sunset";
    return "Modo noite";
  })();
  const dayTheme = (() => {
    const h = localNow?.getHours() ?? 13;
    const isDawn = h >= 0 && h < 6;
    const isMorning = h >= 6 && h < 12;
    const isAfternoon = h >= 12 && h < 18;
    if (isDawn || !localNow) return {
      chrome: "bg-[#07090f]/78",
      topAura: "from-[#0d1630]/55 via-[#090d1c]/30 to-transparent",
      headerAura: "from-[#101830]/40 via-[#0b0e19]/20 to-transparent",
    };
    if (isMorning) return {
      chrome: "bg-[#0a0d11]/70",
      topAura: "from-[#1b2430]/55 via-[#0f1822]/30 to-transparent",
      headerAura: "from-[#182434]/35 via-[#0f1822]/20 to-transparent",
    };
    if (isAfternoon) return {
      chrome: "bg-[#120e0a]/70",
      topAura: "from-[#3a2918]/45 via-[#1c1510]/25 to-transparent",
      headerAura: "from-[#2e2318]/35 via-[#1a1310]/20 to-transparent",
    };
    return {
      chrome: "bg-[#07090f]/78",
      topAura: "from-[#0d1630]/55 via-[#090d1c]/30 to-transparent",
      headerAura: "from-[#101830]/40 via-[#0b0e19]/20 to-transparent",
    };
  })();
  const haptic = React.useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  }, []);
  const checkInGate = (lesson: Lesson) => {
    if (!localNow) {
      return { locked: true, reason: "Sincronizando horário local...", unlockLabel: "" };
    }
    const lessonStart = lessonLocalDateTime(lesson.date, lesson.startTime);
    const unlockAt = new Date(lessonStart.getTime() - 60 * 60 * 1000);
    const sameDay = lesson.date === localDateISO(localNow);
    const unlocked = sameDay && localNow.getTime() >= unlockAt.getTime();
    const unlockLabel = unlockAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return {
      locked: !unlocked,
      reason: sameDay ? `Check-in libera às ${unlockLabel}` : "Check-in disponível apenas no dia da aula",
      unlockLabel,
    };
  };

  useEffect(() => {
    const target = {
      aulas: completedCount,
      streak,
      nota: avgRating || 0,
      freq: frequency,
    };
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setKpiCount({
        aulas: Math.round(target.aulas * eased),
        streak: Math.round(target.streak * eased),
        nota: Number((target.nota * eased).toFixed(1)),
        freq: Math.round(target.freq * eased),
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [completedCount, streak, avgRating, frequency]);

  if (!hydrated) return <StudentHomeSkeleton />;

  if (usingSupabaseSession && criticalDataError) {
    return (
      <AppSectionCard
        title="Falha ao sincronizar seu painel"
        subtitle="Não foi possível carregar os dados ao vivo agora."
        className="mt-2"
      >
        <p className="text-sm text-zinc-300">{criticalDataError}</p>
        <button
          type="button"
          onClick={() => void retryCriticalDataSync()}
          className={`mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15 ${ctaClass}`}
        >
          Tentar sincronizar novamente
        </button>
      </AppSectionCard>
    );
  }

  // Persist upcoming lessons and XP to offline cache when online
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    const today = localDateISO();
    const upcoming = myLessons
      .filter((l) => l.status === "scheduled" && l.date >= today)
      .slice(0, 20)
      .map((l) => ({
        id: l.id,
        title: l.title,
        date: l.date,
        startTime: l.startTime,
        categoryId: l.categoryId,
        status: l.status,
      }));
    offlineCache.saveLessons(upcoming);
  }, [myLessons]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    if (!profile?.id || totalXP === 0) return;
    offlineCache.saveStudentXP(profile.id, totalXP, currentTier.label);
  }, [profile?.id, totalXP, currentTier.label]);

  return (
    <>
    {showWelcome && (
      <WelcomeModal
        name={(profile?.name || user?.name || "Atleta").split(" ")[0]!}
        onClose={() => {
          try { localStorage.setItem(`wt_welcomed_${user?.id ?? ""}`, "1"); } catch { /* ignore */ }
          setShowWelcome(false);
        }}
      />
    )}
    <PushPermissionBanner role="aluno" />
    <OfflineBanner />
    <motion.div
      className="w-full space-y-5 pt-2 sm:pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] relative"
      variants={homeList}
      initial="hidden"
      animate="show"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-28 bg-gradient-to-b ${dayTheme.topAura}`} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-[max(0.2rem,env(safe-area-inset-top))] sm:top-[max(0.35rem,env(safe-area-inset-top))] z-40 w-full px-2 mb-2"
      >
        <div className={`mx-auto w-[min(95vw,42rem)] flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] ${dayTheme.chrome} px-2 py-1 sm:px-2.5 sm:py-1.5 backdrop-blur-2xl shadow-[0_16px_42px_rgba(0,0,0,0.4)]`}>
          <WeatherWidget compact />
          <span className="rounded-full border border-[#EAB308]/20 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#EAB308]">
            {periodPill}
          </span>
        </div>
      </motion.div>

      {/* 0. Resumo mensal de IA — visível apenas nos dias 1-7 do mês */}
      {user?.id && new Date().getDate() <= 7 && (
        <motion.div variants={homeItem} className="px-1">
          <MonthlySummaryCard
            studentId={user.id}
            addPost={addPost}
            userName={user.name || "Atleta"}
            userAvatar={profile?.avatar || user.avatar || "user"}
          />
        </motion.div>
      )}

      {/* 1. Countdown da próxima aula — destaque máximo */}
      {user?.id && (
        <motion.div variants={homeItem} className="px-1">
          <LessonCountdownCard
            lessons={lessons}
            studentId={user.id}
            getCategoryFn={getCategory}
            onCheckIn={() => toast("Vá até a quadra e pressione o botão de check-in da turma 🏐", "info")}
          />
        </motion.div>
      )}

      {/* 1b. Feedback de humor pós-aula */}
      {user?.id && (
        <motion.div variants={homeItem} className="px-1">
          <MoodResponseCard
            lessons={lessons}
            studentId={user.id}
          />
        </motion.div>
      )}

      {/* 2. Bloco Hero do Aluno */}
      <motion.div variants={homeItem}>
        <Link href="/perfil">
          <motion.div
            whileTap={{ scale: 0.985 }}
            className="rounded-2xl border border-[#EAB308]/15 bg-zinc-950 px-4 py-3.5 flex items-center gap-3.5 relative overflow-hidden cursor-pointer hover:border-[#EAB308]/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#EAB308] opacity-[0.04] blur-[40px] rounded-full pointer-events-none" />
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={resolveAvatarSrc(avatarSeed, "Ricardo")}
                className={`w-14 h-14 aspect-square rounded-full bg-zinc-900 object-cover ${
                  (avatarSeed?.startsWith("data:") || avatarSeed?.startsWith("http://") || avatarSeed?.startsWith("https://") || avatarSeed?.startsWith("/"))
                    ? "border-2 border-[#EAB308]"
                    : "border-2 border-zinc-700"
                }`}
                alt={profile?.name || user?.name || "Atleta"}
              />
              {/* Tier badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px] font-black"
                style={{ background: equippedTier.color, color: "#000" }}
                title={equippedTier.label}
              >
                {equippedTier.label.slice(0, 1)}
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white leading-tight truncate">
                {greeting()}, <span style={{ color: equippedTier.color }}>{(profile?.name || user?.name || "Atleta").split(" ")[0]}!</span>
              </h2>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{equippedTier.label} · {profile?.plan || "Aluno"} · {profile?.categories?.[0] || "Vôlei"}</p>
            </div>
            {/* XP + Streak compact */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black" style={{ color: equippedTier.color }}>{totalXP}</span>
                <span className="text-[10px] text-zinc-500">XP</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-zinc-300">{streak}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); haptic([16, 12, 24]); setShowNotif(true); }}
                className="relative mt-0.5"
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4 text-zinc-400" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">{unread}</span>
                )}
              </button>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Share progress button */}
      <motion.div variants={homeItem} className="px-1">
        <button
          type="button"
          data-testid="btn-share-progress-card"
          onClick={(e) => { e.preventDefault(); setShowShareCard(true); }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5 py-2.5 text-[11px] font-bold text-amber-400/80 hover:bg-[#EAB308]/10 hover:border-[#EAB308]/35 transition-all"
        >
          <span>📸</span>
          Compartilhar progresso no Stories
        </button>
      </motion.div>

      {/* 3. Próximas Aulas — Bloco "Hoje" — 3 upcoming with quick actions */}
      {user?.id && (() => {
        const today = localDateISO();
        const upcoming = myLessons
          .filter(l => l.status === "scheduled" && l.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
          .slice(0, 3);
        if (upcoming.length === 0) return null;
        return (
          <motion.div variants={homeItem} className="px-1">
            <div className="space-y-1.5">
              {upcoming.map(lesson => {
                const title = lesson.title || getCategory(lesson.categoryId)?.name || "Aula";
                const d = new Date(`${lesson.date}T00:00:00`);
                const today2 = new Date(); today2.setHours(0,0,0,0);
                const diff = Math.round((d.getTime() - today2.getTime()) / 86400000);
                const dayLabel = diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div key={lesson.id} className="flex items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{title}</p>
                      <p className="text-[10px] text-zinc-500">{dayLabel} · {lesson.startTime}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { haptic(8); setShowAbsenceSheet(true); }}
                        className="rounded-lg border border-orange-500/30 bg-orange-500/8 px-2 py-1 text-[9px] font-black text-orange-400 hover:bg-orange-500/15 transition-colors"
                      >
                        Faltar
                      </button>
                      <button
                        onClick={() => { haptic(8); setShowRepositionSheet(true); }}
                        className="rounded-lg border border-teal-500/30 bg-teal-500/8 px-2 py-1 text-[9px] font-black text-teal-400 hover:bg-teal-500/15 transition-colors"
                      >
                        Repor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Alerta de Frequência */}
      {user?.id && profile?.frequency && (
        <motion.div variants={homeItem} className="px-1">
          <FrequencyAlertBanner
            lessons={lessons}
            studentId={user.id}
            targetFrequency={profile.frequency}
            onCheckIn={() => setShowAgendaPanel(true)}
          />
        </motion.div>
      )}

      {/* Metas do Coach */}
      {profile?.id && (
        <motion.div variants={homeItem} className="px-1">
          <StudentGoalsCard
            studentCrmId={profile.id}
            totalXP={totalXP}
            checkinCount={myLessons.filter(l => l.presentStudents.includes(user?.id || "")).length}
          />
        </motion.div>
      )}

      {/* Banner: aulas não avaliadas */}
      {unratedLessons.length > 0 && (
        <motion.div variants={homeItem} className="px-1">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setRatingLesson(unratedLessons[0])}
            className="w-full flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-left hover:bg-amber-500/12 transition-all"
          >
            <span className="text-2xl flex-shrink-0">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">
                {unratedLessons.length === 1
                  ? "Avalie seu treino de hoje"
                  : `${unratedLessons.length} treinos aguardando avaliação`}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {unratedLessons[0].title || getCategory(unratedLessons[0].categoryId)?.name || "Aula"} · {new Date(`${unratedLessons[0].date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <span className="text-xs font-black text-amber-400 flex-shrink-0">Avaliar →</span>
          </motion.button>
        </motion.div>
      )}

      {/* Your Day Card */}
      <motion.div variants={homeItem}>
        <YourDayCard />
      </motion.div>

      {/* BLOCO 1: Próxima Aula + Check-in */}
      {nextLesson ? (
        <motion.div variants={homeItem}>
          <div
            onClick={() => setLessonModal(nextLesson)}
            className="rounded-2xl border border-[#EAB308]/30 bg-zinc-950/60 backdrop-blur-xl p-4 cursor-pointer hover:border-[#EAB308]/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#EAB308]">Próxima aula</span>
                  {countdown && (
                    <span className="flex items-center gap-1 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-2 py-0.5 text-[10px] font-bold text-[#EAB308]">
                      <Clock className="h-3 w-3" />{countdown}
                    </span>
                  )}
                  {nextLesson.status === "in-progress" && (
                    <span className="flex animate-pulse items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-black text-red-400">
                      <Radio className="h-2.5 w-2.5" />Ao vivo
                    </span>
                  )}
                </div>
                <p className="truncate text-base font-bold text-white">{nextLesson.title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{nextLesson.startTime}–{nextLesson.endTime} · {nextLesson.enrolledStudents.length} alunos</p>
              </div>
              {(() => {
                const gate = checkInGate(nextLesson);
                if (nextLesson.presentStudents.includes(user?.id || "")) {
                  return (
                    <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/10 px-3 py-2 text-[#22C55E]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-[10px] font-bold">Confirmado</span>
                    </div>
                  );
                }
                if (nextLesson.checkInRequests?.find(r => r.studentId === user?.id)?.status === "pending") {
                  return (
                    <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-2">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Clock className="h-5 w-5 text-[#EAB308]" />
                      </motion.div>
                      <span className="text-[10px] font-bold text-[#EAB308]">Aguardando</span>
                    </div>
                  );
                }
                if (gate.locked) {
                  return (
                    <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-center">
                      <Lock className="h-5 w-5 text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-500">Bloqueado</span>
                      <span className="max-w-[64px] text-[9px] text-zinc-600">{gate.unlockLabel}</span>
                    </div>
                  );
                }
                return (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={e => {
                      e.stopPropagation();
                      haptic([18, 12, 20]);
                      requestCheckIn(nextLesson.id, user!.id);
                      richToast.success("Chegada registrada!", "Aguardando confirmação do professor.");
                    }}
                    className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl bg-[#EAB308] px-3 py-2 font-bold text-black shadow-[0_0_16px_rgba(234,179,8,0.3)] ${ctaClass}`}
                  >
                    <MapPin className="h-5 w-5" />
                    <span className="text-[10px]">Check-in</span>
                  </motion.button>
                );
              })()}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={homeItem} className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 text-center">
          <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">Nenhum treino agendado no momento.</p>
          <button
            onClick={() => { setSelectedDay(week7[0] ?? null); setShowAgendaPanel(true); }}
            className={`mt-2 text-[11px] font-bold text-[#EAB308] ${ctaClass}`}
          >
            Ver agenda completa
          </button>
        </motion.div>
      )}

      {/* BLOCO 2: XP + Progresso */}
      <motion.div variants={homeItem} className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { haptic([22, 16, 22]); setShowXpModal(true); }}
          className={`rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 text-left flex items-center gap-3 ${ctaClass}`}
        >
          <div className="relative h-14 w-14 flex-shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.4" />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={equippedTier.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={100 - meritScore}
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - meritScore }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-black leading-none" style={{ color: equippedTier.color }}>{meritScore}</p>
              <span className="text-[8px] text-zinc-500">pts</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
            <p className="truncate text-sm font-bold" style={{ color: equippedTier.color }}>{equippedTier.label}</p>
            {nextTier && <p className="truncate text-[10px] text-zinc-600">{Math.max(0, nextTier.min - meritScore)}pts → {nextTier.label}</p>}
          </div>
        </button>

        <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500">Sequência</p>
              <p className="text-xl font-black text-[#EAB308]">{streak}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500">Nota média</p>
              <p className="text-xl font-black" style={{ color: avgRating ? scoreColor(avgRating) : "#52525b" }}>
                {avgRating ? avgRating.toFixed(1) : "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {streakTrail.slice(-5).map((active, idx) => (
              <div key={idx} className={`h-1 flex-1 rounded-full ${active ? "bg-[#EAB308]" : "bg-zinc-800"}`} />
            ))}
          </div>
          <button
            onClick={() => { haptic(16); setEvolModal(true); }}
            className={`w-full text-[10px] font-bold text-zinc-500 hover:text-[#EAB308] transition-colors ${ctaClass}`}
          >
            Ver evolução completa →
          </button>
        </div>
      </motion.div>

      {/* BLOCO 3: Agenda da Semana + Ranking */}
      <motion.div variants={homeItem} className="rounded-2xl border border-[#EAB308]/20 bg-zinc-950/50 backdrop-blur-xl p-3.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#EAB308]">Minha Semana</h2>
          <button
            onClick={() => { setSelectedDay(week7[0] ?? null); setShowAgendaPanel(true); }}
            className={`text-[10px] font-bold text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 rounded-lg ${ctaClass}`}
          >
            Ver agenda
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Planejados</p>
            <p className="text-sm font-black text-white">{weekScheduledCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Concluídos</p>
            <p className="text-sm font-black text-[#22C55E]">{weekCompletedCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Execução</p>
            <p className="text-sm font-black text-[#EAB308]">{executionRate}%</p>
          </div>
        </div>
        <button
          onClick={() => { haptic([22, 16, 22]); setShowLeaderboard(true); }}
          className={`mt-3 w-full rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-2.5 flex items-center justify-between ${ctaClass}`}
        >
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-yellow-400" />
            <span className="text-[11px] font-bold text-yellow-400">Ranking — ver minha posição</span>
          </div>
          <ChevronRight className="h-4 w-4 text-yellow-600" />
        </button>
      </motion.div>

      {/* BLOCO 4: Meus Pagamentos */}
      {(() => {
        const currentPay = getStudentCurrentPayment(user?.id ?? "");
        const hasLate = payments.some((p) => p.studentId === user?.id && p.status === "late");
        const isLate = currentPay?.status === "late";
        const isPending = currentPay?.status === "pending";
        const isPaid = currentPay?.status === "paid";
        const proofSent = Boolean(currentPay?.studentProofSubmittedAt) && !isPaid;
        return (
          <motion.div variants={homeItem}>
            <button
              onClick={() => { haptic(16); setShowPayments(true); }}
              className={`w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all ${
                isLate || hasLate
                  ? "border-red-500/35 bg-red-500/8 hover:border-red-500/55"
                  : proofSent
                  ? "border-amber-500/30 bg-amber-500/8 hover:border-amber-500/50"
                  : isPaid
                  ? "border-emerald-500/25 bg-emerald-500/6 hover:border-emerald-500/45"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
              } ${ctaClass}`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                isLate || hasLate ? "border-red-500/40 bg-red-500/15" :
                isPaid ? "border-emerald-500/35 bg-emerald-500/12" :
                "border-[#EAB308]/35 bg-[#EAB308]/10"
              }`}>
                {isLate || hasLate
                  ? <AlertIcon className="h-5 w-5 text-red-400" />
                  : isPaid
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  : <CreditCard className="h-5 w-5 text-[#EAB308]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                  isLate || hasLate ? "text-red-400" : isPaid ? "text-emerald-400" : "text-[#EAB308]"
                }`}>
                  {isLate || hasLate ? "Pagamento em atraso" : isPaid ? "Em dia" : proofSent ? "Aguardando confirmação" : "Meus Pagamentos"}
                </p>
                <p className="text-sm font-bold text-white">
                  {currentPay
                    ? `${currentPay.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · ${currentMonthReference}`
                    : "Ver histórico e pagar"}
                </p>
                {proofSent && (
                  <p className="text-[10px] text-amber-400 mt-0.5">Comprovante enviado — aguardando confirmação do Will</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-600" />
            </button>
          </motion.div>
        );
      })()}

      {/* BLOCO 5: Reposição de Aulas */}
      {(() => {
        const studentId = user?.id ?? "";
        const today = localDateISO();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoStr = twoWeeksAgo.toISOString().slice(0, 10);

        const missedLessons = lessons.filter(l =>
          l.status === "completed" &&
          l.enrolledStudents.includes(studentId) &&
          !l.presentStudents.includes(studentId) &&
          l.date >= twoWeeksAgoStr,
        );

        if (missedLessons.length === 0) return null;

        const availableSlots = lessons.filter(l =>
          l.status === "scheduled" &&
          l.date >= today &&
          !l.enrolledStudents.includes(studentId) &&
          l.enrolledStudents.length < l.maxStudents &&
          !(l.repositionRequests || []).some(
            r => r.studentId === studentId && r.status !== "declined",
          ),
        ).slice(0, 3);

        const pendingMyRequests = lessons.filter(l =>
          (l.repositionRequests || []).some(r => r.studentId === studentId && r.status === "pending"),
        );
        const approvedMyRequests = lessons.filter(l =>
          (l.repositionRequests || []).some(r => r.studentId === studentId && r.status === "approved"),
        );

        const fromLessonId = missedLessons[0]?.id ?? "";
        const cat = missedLessons[0] ? getCategory(missedLessons[0].categoryId) : undefined;

        return (
          <motion.div variants={homeItem}>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 flex-shrink-0">
                  <Radio className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Reposição</p>
                  <p className="text-sm font-bold text-white">
                    {missedLessons.length} aula{missedLessons.length > 1 ? "s" : ""} faltada{missedLessons.length > 1 ? "s" : ""} nos últimos 14 dias
                  </p>
                </div>
              </div>

              {approvedMyRequests.length > 0 && (
                <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300 font-bold">Reposição aprovada! Você já está matriculado na aula.</p>
                </div>
              )}

              {pendingMyRequests.length > 0 && (
                <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300 font-bold">Solicitação enviada — aguardando aprovação do Will.</p>
                </div>
              )}

              {pendingMyRequests.length === 0 && approvedMyRequests.length === 0 && availableSlots.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-500 font-bold mb-1.5">Escolha uma aula para repor:</p>
                  {availableSlots.map(slot => {
                    const slotCat = getCategory(slot.categoryId);
                    const vagasLivres = slot.maxStudents - slot.enrolledStudents.length;
                    return (
                      <motion.button
                        key={slot.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          haptic(18);
                          requestReposition(slot.id, studentId, fromLessonId);
                          toast("🔄 Solicitação de reposição enviada!");
                        }}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-all ${ctaClass}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: slotCat?.color ?? "#EAB308" }} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{slot.title || slotCat?.name || "Aula"}</p>
                            <p className="text-[10px] text-zinc-500">{slot.date} · {slot.startTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-zinc-500">{vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""}</span>
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-0.5">Repor</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {pendingMyRequests.length === 0 && approvedMyRequests.length === 0 && availableSlots.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">Nenhuma vaga disponível no momento. Fale com o Will pelo WhatsApp.</p>
              )}
            </div>
          </motion.div>
        );
      })()}

      <AnimatePresence>
        {showAgendaPanel && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Agenda da semana"
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end" onClick={()=>setShowAgendaPanel(false)}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:300}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-3 pb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-[#EAB308]"/> Agenda da semana</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedDay(week7[0] ?? null)} className={`text-[10px] font-bold text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 rounded-lg ${ctaClass}`}>Ver hoje</button>
                  <button onClick={() => setShowAgendaPanel(false)} className={`p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 ${FOCUS_RING_GOLD}`}><X className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                  <p className="text-[9px] text-zinc-500">Treinos na semana</p>
                  <p className="text-[11px] font-bold text-white">{weekScheduledCount}</p>
                </div>
                <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                  <p className="text-[9px] text-zinc-500">Concluídos</p>
                  <p className="text-[11px] font-bold text-[#22C55E]">{weekCompletedCount}</p>
                </div>
                <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                  <p className="text-[9px] text-zinc-500">Execução</p>
                  <p className="text-[11px] font-bold text-[#EAB308]">{executionRate}%</p>
                </div>
              </div>
              <div className="-mx-1 px-1 flex gap-3 overflow-x-auto overflow-y-visible no-scrollbar pb-2 overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none]" style={{ WebkitOverflowScrolling: "touch" }}>
                {week7.map((date, i) => {
                  const d = new Date(date+"T12:00:00");
                  const dayLessons = myLessons.filter(l => l.date===date && (l.status==="scheduled"||l.status==="in-progress"||l.status==="completed"));
                  const isToday = i===0;
                  const isSelected = selectedDay === date;
                  const sortedDay = [...dayLessons].sort((a, b) => a.startTime.localeCompare(b.startTime));
                  const primary = sortedDay[0];
                  const sty = primary ? getWeekStyle(primary.categoryId) : getWeekStyle("");
                  return (
                    <motion.div key={date} whileTap={dayLessons.length > 0 ? { scale: 0.97 } : undefined}
                      onClick={() => { if (dayLessons.length === 0) return; haptic(18); setSelectedDay(isSelected ? null : date); }}
                      className={`group relative flex flex-col flex-shrink-0 snap-start min-h-[150px] min-w-[118px] w-[118px] sm:min-w-[128px] sm:w-[128px] rounded-2xl border p-3 backdrop-blur-xl ${dayLessons.length > 0 ? `cursor-pointer ${sty.cardClass}` : "border-white/[0.06] bg-zinc-950/55"} ${isSelected && dayLessons.length > 0 ? "ring-2 ring-[#EAB308]/80 ring-offset-2 ring-offset-black" : ""} ${isToday && !isSelected && dayLessons.length > 0 ? "ring-1 ring-white/15" : ""}`}>
                      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col">
                        <div className="mb-1 flex min-h-[2.5rem] items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-[#EAB308]" : isToday ? "text-white/90" : "text-zinc-500"}`}>{isToday ? "Hoje" : DAY[d.getDay()]}</p>
                            <p className={`text-lg font-bold tabular-nums leading-none ${dayLessons.length > 0 ? "text-white" : isToday ? "text-zinc-200" : "text-zinc-600"}`}>{d.getDate()}</p>
                          </div>
                          {primary ? <span className={`mt-0.5 inline-flex max-w-[4.5rem] flex-shrink-0 items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide leading-none ${sty.badge}`}>{sty.label}</span> : null}
                        </div>
                        {dayLessons.length > 0 && primary ? (
                          <div className="mt-0 flex min-h-0 flex-1 flex-col">
                            <p className={`shrink-0 text-[11px] font-mono font-bold leading-none tabular-nums ${sty.timeClass}`}>{primary.startTime} – {primary.endTime}</p>
                            <p className="mt-1 line-clamp-2 min-h-[2.35rem] break-words text-[10px] font-bold leading-snug text-white/95 [overflow-wrap:anywhere]">{primary.title}</p>
                            <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/10 pt-2">
                              <span className="text-[9px] font-bold text-white/50">{dayLessons.length} no ciclo</span>
                              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/25" />
                            </div>
                          </div>
                        ) : <div className="mt-auto flex flex-1 items-end justify-center pb-1.5"><div className="h-1.5 w-1.5 rounded-full bg-zinc-800" /></div>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <AnimatePresence>
                {selectedDay && (() => {
                  const dayLessons = myLessons.filter(l => l.date===selectedDay && (l.status==="scheduled"||l.status==="in-progress"||l.status==="completed"));
                  return dayLessons.length > 0 && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mt-2">
                      <div className="space-y-2 pt-2">
                        {dayLessons.map((l) => {
                          const ws = getWeekStyle(l.categoryId);
                          const flow = getLessonExecutionStage(l);
                          return (
                            <motion.div key={l.id} whileTap={{scale:0.98}} onClick={()=>{ setLessonModal(l); setShowAgendaPanel(false); }}
                              className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
                              <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ws.accent, boxShadow: `0 0 12px ${ws.accent}` }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{l.title}</p>
                                <p className="text-xs text-zinc-500 tabular-nums">{l.startTime} – {l.endTime}</p>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{ws.label}</p>
                                  <span className="rounded-full border px-1.5 py-0.5 text-[8px] font-bold" style={{ color: flow.color, borderColor: `${flow.color}55`, background: `${flow.color}14` }}>{flow.label}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0"/>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Próximo Treino — CLICÁVEL */}
      {false && nextLesson ? (
        (() => {
          const gate = checkInGate(nextLesson);
          return (
        <motion.div variants={homeItem}
          onClick={() => setLessonModal(nextLesson)}
          className="mb-5 rounded-3xl border border-[#EAB308]/35 bg-zinc-950/50 backdrop-blur-xl p-5 relative overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.08)] cursor-pointer hover:border-[#EAB308]/55 transition-all active:scale-[0.99]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#EAB308] rounded-r-full"/>
          <div className="flex justify-between items-start gap-2 sm:gap-4 pl-1 sm:pl-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-black bg-[#EAB308] px-2 py-0.5 rounded-md uppercase inline-flex items-center gap-1.5">
                  {nextLesson.status === "in-progress" ? (
                    <>
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)] animate-pulse" />
                      AO VIVO
                    </>
                  ) : (
                    "Próximo treino"
                  )}
                </span>
                {countdown && (
                  <span className="text-[10px] font-bold text-[#EAB308] bg-[#EAB308]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 opacity-80" />
                    {countdown}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{nextLesson.title}</h3>
              <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#EAB308]"/>{nextLesson.startTime}–{nextLesson.endTime}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/>{nextLesson.enrolledStudents.length} alunos</span>
              </div>
              {nextLesson.enrolledStudents.filter(id=>id!==user?.id).length>0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {nextLesson.enrolledStudents.filter(id=>id!==user?.id).slice(0,5).map((sid,idx)=>{
                    const s = students.find(st=>st.id===sid);
                    return (
                      <div key={sid} className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-full pl-0.5 pr-2 py-0.5 min-w-0" title={s?.name}>
                        <img src={resolveAvatarSrc(s?.avatar, sid)}
                          className="w-5 h-5 rounded-full object-cover border border-zinc-700 flex-shrink-0"/>
                        <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[60px]">{s?.name?.split(" ")[0] || "Aluno"}</span>
                      </div>
                    );
                  })}
                  {nextLesson.enrolledStudents.filter(id=>id!==user?.id).length>5 && (
                    <span className="text-[10px] text-zinc-500">+{nextLesson.enrolledStudents.filter(id=>id!==user?.id).length-5}</span>
                  )}
                </div>
              )}
            </div>
            {nextLesson.presentStudents.includes(user?.id||"") ? (
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] px-4 py-3 rounded-2xl flex flex-col items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6"/><span className="text-xs font-bold">Confirmado</span>
              </div>
            ) : (nextLesson.checkInRequests?.find(r=>r.studentId===user?.id)?.status==="pending") ? (
              <div className="bg-[#EAB308]/10 border border-[#EAB308]/30 px-4 py-3 rounded-2xl flex flex-col items-center gap-1 flex-shrink-0">
                <motion.div animate={{scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:1.5}}>
                  <Clock className="w-6 h-6 text-[#EAB308]"/>
                </motion.div>
                <span className="text-xs font-bold text-[#EAB308]">Aguardando Prof.</span>
                <span className="text-[9px] text-[#EAB308]/60">
                  {new Date(nextLesson.checkInRequests!.find(r=>r.studentId===user?.id)!.arrivedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
            ) : gate.locked ? (
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 text-zinc-400 px-4 py-3 rounded-2xl text-center">
                <Lock className="w-5 h-5"/>
                <span className="text-xs font-bold">Check-in bloqueado</span>
                <span className="text-[9px] text-zinc-500">{gate.reason}</span>
              </div>
            ) : (
              <GeoCheckInButton
                courtLocation={appConfig.courtLocation}
                onCheckIn={(isAtCourt) => {
                  requestCheckIn(nextLesson.id, user!.id);
                  toast(isAtCourt
                    ? "📍 Check-in na quadra confirmado! +50 XP aguardando professor."
                    : "🏠 Treino externo registrado! +10 XP anti-cheat."
                  );
                }}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-[#EAB308] text-black px-4 py-3 rounded-2xl font-bold text-xs shadow-[0_0_15px_rgba(234,179,8,0.25)] text-center"
              >
                <MapPin className="w-5 h-5"/>
                <span>Registrar</span>
                <span className="opacity-70 font-normal">Chegada</span>
              </GeoCheckInButton>
            )}
          </div>
        </motion.div>
          );
        })()
      ) : (
        <motion.div variants={homeItem} className="mb-5 rounded-3xl border border-dashed border-zinc-700/50 bg-zinc-950/30 backdrop-blur-md p-8 text-center">
          <CalendarIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2"/>
          <p className="text-zinc-500 text-sm">Nenhum treino agendado no momento.</p>
        </motion.div>
      )}

      {/* Minha Evolução — CLICÁVEL */}
      {myLessons.length > 0 && (
        <motion.div variants={homeItem} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#EAB308]"/> Checkpoint Técnico</h2>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowPillarPanel(true)}
                className={`text-[10px] font-bold text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 hover:bg-violet-500/20 transition-colors ${ctaClass}`}>
                Notas do Coach
              </motion.button>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowAttendanceCalendar(true)}
                className={`text-[10px] font-bold text-zinc-300 bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-zinc-700/40 hover:bg-zinc-700/60 transition-colors ${ctaClass}`}>
                📅 Histórico
              </motion.button>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowLessonHistory(true)}
                data-testid="btn-lesson-history"
                className={`text-[10px] font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25 hover:bg-amber-500/20 transition-colors ${ctaClass}`}>
                📋 Histórico de Treinos
              </motion.button>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setEvolModal(true)}
                className={`text-[10px] font-bold text-[#EAB308] bg-[#EAB308]/10 px-3 py-1.5 rounded-lg border border-[#EAB308]/20 hover:bg-[#EAB308]/20 transition-colors ${ctaClass}`}>
                Ver relatório
              </motion.button>
            </div>
          </div>
          <motion.div whileTap={{scale:0.98}} whileHover={{ y: -2, borderColor: "rgba(234,179,8,0.35)" }}
            className="rounded-2xl border border-white/[0.07] bg-zinc-950/45 backdrop-blur-xl p-4 cursor-pointer hover:border-[#EAB308]/25 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            onClick={()=>setEvolModal(true)}>
            {myFeedbacks.length === 0 ? (
              <div className="text-center py-6">
                <TrendingUp className="w-10 h-10 text-zinc-700 mx-auto mb-2"/>
                <p className="text-sm font-bold text-zinc-400">Ainda sem avaliações</p>
                <p className="text-xs text-zinc-600 mt-1">Após as aulas, o professor enviará feedbacks técnicos que aparecerão aqui.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Disciplina", value: `${disciplineScore}`, color: "#22C55E" },
                    { label: "Técnica", value: `${performanceScore}`, color: "#EAB308" },
                    { label: "Feedback", value: `${coachTrustScore}`, color: "#60A5FA" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
                      <p className="text-sm font-black" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-[9px] text-zinc-500">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Fonte das notas</p>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Avaliação oficial por <span className="text-[#EAB308] font-bold">prof/admin</span> + percepção do aluno como apoio.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
                      <p className="text-[8px] text-zinc-500">Coach oficial</p>
                      <p className="text-[12px] font-black text-[#EAB308]">{avgRating ? avgRating.toFixed(1) : "—"}/10</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
                      <p className="text-[8px] text-zinc-500">Autoavaliação aluno</p>
                      <p className="text-[12px] font-black text-[#60A5FA]">{selfSessionAvg ? selfSessionAvg.toFixed(1) : "—"}/10</p>
                    </div>
                  </div>
                </div>
                {evolutionLineChart ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
                    <p className="text-[9px] text-zinc-500 mb-1">Linha de evolução técnica</p>
                    <svg viewBox={`0 0 ${evolutionLineChart.w} ${evolutionLineChart.h}`} className="w-full h-20" preserveAspectRatio="none">
                      <path d={evolutionLineChart.areaD} fill="rgba(234,179,8,0.18)" opacity="0.35" />
                      <motion.path d={evolutionLineChart.d} fill="none" stroke="#EAB308" strokeWidth="2.2" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                    </svg>
                  </div>
                ) : null}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3 mt-2">
                  <p className="text-[9px] text-zinc-500 mb-1">Timeline das últimas avaliações</p>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {myFeedbacks.slice(0, 6).reverse().map((fb, idx, arr) => {
                      const tone = scoreColor(fb.rating);
                      return (
                        <div key={fb.id} className="flex items-center flex-shrink-0">
                          <div className="rounded-full border px-2 py-1 bg-zinc-900/70" style={{ borderColor: `${tone}66` }}>
                            <p className="text-[9px] font-bold" style={{ color: tone }}>{fb.rating.toFixed(1)}</p>
                            <p className="text-[8px] text-zinc-600">{new Date(fb.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
                          </div>
                          {idx < arr.length - 1 && <div className="w-4 h-px bg-zinc-700 mx-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-3 mt-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Meta atual: {nextTier ? `subir para ${nextTier.label}` : "manter elite"} com execução técnica consistente nas próximas sessões.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3 mt-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Próxima sessão — plano de execução</p>
                  <div className="space-y-1.5">
                    {nextSessionPlan.map((item, idx) => (
                      <div key={`plan-${idx}`} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[9px] text-zinc-400">{idx + 1}</span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3 gap-1.5 text-[10px] text-zinc-600 font-bold">
                  <ChevronRight className="w-3 h-3"/>Ver gráfico completo e histórico de notas
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Evolução por fundamentos */}
      <motion.div variants={homeItem} className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-[#EAB308]"/> Evolução por Fundamentos</h2>
          <button onClick={() => setEvolModal(true)} className={`text-[10px] font-bold text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 rounded-lg ${ctaClass}`}>Ver detalhe</button>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/55 p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
              <p className="text-[9px] text-zinc-500">Média técnica</p>
              <p className="text-[12px] font-black text-white">{fundamentalsAverage}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
              <p className="text-[9px] text-zinc-500">Em alta</p>
              <p className="text-[12px] font-black text-[#22C55E]">{fundamentalsTrend.filter((f) => f.trend === "up").length}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
              <p className="text-[9px] text-zinc-500">Atenção</p>
              <p className="text-[12px] font-black text-[#EF4444]">{fundamentalsTrend.filter((f) => f.trend === "down").length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Banners suplementares: prioridade única ──
           Regra: máx 1 de cada vez.
           Hierarquia: Destaque > Resumo Semanal > Onboarding
           O countdown card e o push banner ficam fora desta prioridade. */}
      {profile?.id && user?.id && (() => {
        // WeeklyHighlightBanner controla internamente se mostra (via Supabase query).
        // Ele dispara e mostra ou não. Para os outros verificamos via props antes de renderizar.
        const isOnboardingCandidate = totalXP < 400;
        const isSummaryDay = (() => { const d = new Date().getDay(); return d === 5 || d === 6; })();

        // Slot único: Destaque tem prioridade; se não estiver visível, vai para o próximo
        // WeeklyHighlightBanner já gerencia dismiss internamente — renderizamos sempre e ele decide
        return (
          <motion.div variants={homeItem} className="mb-4">
            {/* Priority 1: Destaque da Semana */}
            <WeeklyHighlightBanner
              studentCrmId={profile.id}
              firstName={profile.name?.split(" ")[0] ?? "Atleta"}
            />
            {/* Priority 2: Resumo Semanal (só Sex/Sáb — WeeklySummaryBanner controla internamente) */}
            {isSummaryDay && (
              <WeeklySummaryBanner
                lessons={lessons}
                studentId={user.id}
                totalXP={totalXP}
                streak={streak}
                getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
              />
            )}
            {/* Priority 2b: Desafio Semanal da Turma */}
            {profile?.id && user?.id && (
              <WeeklyChallengeCard
                lessons={lessons}
                studentId={profile.id}
                authUserId={user.id}
                totalXP={totalXP}
                onConfetti={() => setConfettiActive(true)}
              />
            )}
            {/* Priority 3: Onboarding (só novos atletas, não-Sex/Sáb para evitar stack) */}
            {isOnboardingCandidate && !isSummaryDay && (
              <OnboardingWidget
                studentId={user.id}
                totalXP={totalXP}
                hasAvatar={!!(profile.avatar && !profile.avatar.includes("dicebear"))}
                onOpenChallenges={() => setShowDailyChallenges(true)}
                onOpenTwin={() => { markTwinViewed(user.id); setShowStudentTwin(true); }}
                onOpenFeed={() => { }}
                onOpenProfile={() => { }}
              />
            )}
          </motion.div>
        );
      })()}

      {/* Conquistas — CLICÁVEIS */}
      <motion.div variants={homeItem} className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3"><Trophy className="w-5 h-5 text-[#EAB308]"/> Conquistas</h2>
        <div className="mb-3 rounded-2xl border border-white/[0.07] bg-zinc-950/45 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Trilhas desbloqueadas</p>
              <p className="text-sm font-black" style={{ color: equippedTier.color }}>
                {unlockedTracksCount}/{achievementTracks.length} · nível {equippedTier.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => { haptic([16, 12, 24]); setShowDailyChallenges(true); }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-violet-500/40 bg-violet-500/12 text-violet-300 transition-colors hover:bg-violet-500/20 ${ctaClass}`}
                >
                  Desafios ⚡
                </button>
                {messagesUnread > 0 && (
                  <button
                    onClick={() => { haptic(18); setShowMessagesPanel(true); }}
                    className={`relative text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#EAB308]/40 bg-[#EAB308]/10 text-amber-300 transition-colors hover:bg-[#EAB308]/20 ${ctaClass}`}
                  >
                    💬 Recados
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EAB308] text-[8px] font-black text-black">
                      {messagesUnread}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => { haptic([16, 12, 24]); setShowGamificationDashboard(true); }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${ctaClass}`}
                  style={{ color: equippedTier.color, borderColor: `${equippedTier.color}40`, background: `${equippedTier.color}12` }}
                >
                  Progresso 🎯
                </button>
                {profile?.id && (
                  <a
                    href={`/atleta/${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                    onClick={() => haptic(8)}
                  >
                    🔗 Perfil
                  </a>
                )}
                {profile?.id && (
                  <button
                    onClick={() => { haptic(8); setShowTimeline(true); }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    🕐 Jornada
                  </button>
                )}
                <button
                  onClick={() => { haptic(8); setShowNotificationCenter(true); }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  🔔 Notifs
                </button>
                <button
                  onClick={() => { haptic(8); setShowPushSettings(true); }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  📲 Push
                </button>
                <button
                  onClick={() => { haptic([16, 12, 24]); setShowAchievementFeed(true); }}
                  data-testid="btn-achievement-feed"
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors ${ctaClass}`}
                >
                  🏆 Turma
                </button>
                <button
                  onClick={() => { haptic([16, 12, 24]); setShowTrainingPlan(true); }}
                  data-testid="btn-training-plan"
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors ${ctaClass}`}
                >
                  💪 Meu Plano
                </button>
                <button
                  onClick={() => { haptic([16, 12, 24]); setShowReferralPanel(true); }}
                  data-testid="btn-referral-panel"
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-violet-500/35 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors ${ctaClass}`}
                >
                  👥 Indicar Amigo
                </button>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500">Meta competitiva</p>
                <p className="text-[11px] font-bold text-zinc-300">
                  {nextTier ? `${nextTier.label} em ${Math.max(0, nextTier.min - meritScore)} pts` : "Tier máximo"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-zinc-900 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((unlockedTracksCount / Math.max(1, achievementTracks.length)) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${equippedTier.color}80, ${equippedTier.color})` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">Conquistas por trilha: consistência, técnica, fundamentos e execução competitiva.</p>

          {/* Student Digital Twin Card */}
          {user?.id && (
            <div className="mt-3">
              <StudentTwinCard
                studentId={user.id}
                studentName={user.name ?? "Atleta"}
                onOpenFull={() => setShowStudentTwin(true)}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => setTrackModalId("competitive")}
          className={`w-full rounded-2xl border border-zinc-800 bg-zinc-950/55 p-3 text-left hover:border-zinc-700 transition-colors ${ctaClass}`}
        >
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Jornada de conquistas</p>
          <p className="text-sm font-bold text-white mt-1">Acompanhe trilhas, pontuação e próximos desbloqueios</p>
          <p className="text-[10px] text-zinc-500 mt-1">{unlockedTracksCount}/{achievementTracks.length} trilhas liberadas</p>
        </button>
      </motion.div>

      {/* Neural removido por prioridade de produto */}

      {/* Payment Sheet */}
      <StudentPaymentSheet open={showPayments} onClose={() => setShowPayments(false)} />

      {/* Notifications Drawer */}
      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Notificações do aluno"
            className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/80 backdrop-blur-sm flex justify-end" onClick={()=>setShowNotif(false)}>
            <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:25,stiffness:200}}
              onClick={e=>e.stopPropagation()} className="w-full max-w-sm bg-[#050505] border-l border-zinc-800 h-full flex flex-col">
              <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-sm border-b border-zinc-900 p-6 flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-[#EAB308]"/> Notificações</h2>
                <button onClick={()=>setShowNotif(false)} className={`p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 ${FOCUS_RING_GOLD}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {visibleNotifications.length===0
                  ? <p className="text-zinc-600 text-sm text-center mt-20">Sem notificações.</p>
                  : visibleNotifications.slice().reverse().map(n=>(
                    <motion.div key={n.id} layout className={`p-4 rounded-2xl border ${!n.read?"bg-[#EAB308]/5 border-[#EAB308]/20":"bg-zinc-900/30 border-zinc-800"}`}>
                      {!n.read && <div className="w-2 h-2 bg-[#EAB308] rounded-full mb-2"/>}
                      <p className={`text-sm font-bold ${!n.read?"text-white":"text-zinc-400"}`}>{n.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                      {!n.read && <button onClick={()=>markNotificationRead(n.id)} className={`w-full mt-2 py-1.5 text-xs font-bold text-[#EAB308] bg-[#EAB308]/10 rounded-lg hover:bg-[#EAB308]/20 transition-colors ${ctaClass}`}>Marcar como lida</button>}
                    </motion.div>
                  ))
                }
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: Detalhes da Aula ===== */}
      <AnimatePresence>
        {lessonModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label={`Detalhes da aula ${lessonModal.title}`}
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end" onClick={()=>setLessonModal(null)}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:300}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-start justify-between mb-4 pb-2">
                <div>
                  {lessonModal.status==="in-progress" && (
                    <motion.span animate={{opacity:[1,0.4,1]}} transition={{repeat:Infinity,duration:1.5}}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full"/> AO VIVO
                    </motion.span>
                  )}
                  <h2 className="text-xl font-bold text-white">{lessonModal.title}</h2>
                  <p className="text-sm text-zinc-400 mt-1">{lessonModal.date.split("-").reverse().join("/")}</p>
                </div>
                <button onClick={()=>setLessonModal(null)} className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <Clock className="w-4 h-4 text-[#EAB308] mb-2"/>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Horário</p>
                  <p className="text-sm font-bold text-white mt-0.5">{lessonModal.startTime} – {lessonModal.endTime}</p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <Users className="w-4 h-4 text-[#EAB308] mb-2"/>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Turma</p>
                  <p className="text-sm font-bold text-white mt-0.5">{lessonModal.enrolledStudents.length}/{lessonModal.maxStudents} alunos</p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <MapPin className="w-4 h-4 text-[#EAB308] mb-2"/>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Local</p>
                  <p className="text-xs text-white mt-0.5 leading-tight">{lessonModal.venueId === "v1" ? "Quadra Central" : lessonModal.venueId === "v2" ? "Arena Beach" : "Ginásio Municipal"}</p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-[#EAB308] mb-2"/>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Status</p>
                  <p className="text-xs font-bold mt-0.5" style={{color: lessonModal.presentStudents.includes(user?.id||"") ? "#22C55E" : "#EAB308"}}>
                    {lessonModal.presentStudents.includes(user?.id||"") ? "✓ Check-in feito" : "Aguardando check-in"}
                  </p>
                </div>
              </div>
              {lessonModal.enrolledStudents.filter(id=>id!==user?.id).length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Colegas de Turma</p>
                  <div className="flex gap-2 flex-wrap">
                    {lessonModal.enrolledStudents.filter(id=>id!==user?.id).map(sid => {
                      const st = students.find(s=>s.id===sid);
                      return (
                        <div key={sid} className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-full pl-1 pr-2.5 py-1">
                          <img src={resolveAvatarSrc(st?.avatar, sid)}
                            className="w-6 h-6 rounded-full border border-zinc-700 object-cover flex-shrink-0"/>
                          <span className="text-xs text-zinc-300 font-medium">{st?.name?.split(" ")[0] || "Aluno"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="sticky bottom-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {(() => {
                const isCompleted = lessonModal.status === "completed";
                const alreadyCheckedIn = lessonModal.presentStudents.includes(user?.id||"");
                const myCheckIn = lessonModal.checkInRequests?.find(r => r.studentId === user?.id);
                const existingRating = getLessonRating(lessonModal.id, user?.id||"");

                if (isCompleted) return (
                  <div className="space-y-3">
                    {alreadyCheckedIn && (
                      <div className="flex items-center gap-2 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]"/>
                        <span className="text-sm text-[#22C55E] font-bold">Presença confirmada</span>
                      </div>
                    )}
                    <motion.button whileTap={{scale:0.96}}
                      onClick={()=>{setRatingLesson(lessonModal);setLessonModal(null);}}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                        existingRating
                          ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                          : "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      } ${ctaClass}`}>
                      <Star className={`w-4 h-4 ${existingRating ? "" : "fill-black"}`}/>
                      {existingRating ? `Avaliado (${((existingRating.intensidade+existingRating.tecnica+existingRating.didatica+existingRating.evolucao)/4).toFixed(1)}/5)` : "Avaliar esse Treino"}
                    </motion.button>
                  </div>
                );

                if (myCheckIn?.status === "pending") return (
                  <div className="flex items-center gap-3 p-4 bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-2xl">
                    <motion.div animate={{scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:1.5}}>
                      <Clock className="w-5 h-5 text-[#EAB308]"/>
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-[#EAB308]">Aguardando confirmação</p>
                      <p className="text-xs text-zinc-500">Chegada registrada. O professor vai confirmar.</p>
                    </div>
                  </div>
                );

                if (alreadyCheckedIn) return (
                  <div className="flex items-center gap-2 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]"/>
                    <span className="text-sm text-[#22C55E] font-bold">Presença confirmada pelo professor</span>
                  </div>
                );

                const gate = checkInGate(lessonModal);
                if (gate.locked) return (
                  <div className="flex items-center gap-3 p-4 bg-zinc-900/75 border border-zinc-700 rounded-2xl">
                    <Lock className="w-5 h-5 text-zinc-400"/>
                    <div>
                      <p className="text-sm font-bold text-zinc-300">Check-in bloqueado</p>
                      <p className="text-xs text-zinc-500">{gate.reason}</p>
                    </div>
                  </div>
                );

                return (
                  <motion.button whileTap={{scale:0.96}}
                    onClick={()=>{requestCheckIn(lessonModal.id,user!.id);toast("📍 Chegada registrada!");setLessonModal(null);}}
                    className={`w-full flex items-center justify-center gap-2 py-4 bg-[#EAB308] text-black rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(234,179,8,0.2)] ${ctaClass}`}>
                    <MapPin className="w-5 h-5"/> Registrar Chegada
                  </motion.button>
                );
              })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CONFETTI (badge unlock) ===== */}
      <Confetti active={confettiActive} onDone={()=>setConfettiActive(false)}/>

      {/* ===== LESSON RATING SHEET ===== */}
      <AnimatePresence>
        {ratingLesson && (
          <LessonRatingSheet
            lessonId={ratingLesson.id}
            lessonTitle={ratingLesson.title}
            lessonDate={ratingLesson.date}
            studentId={user?.id || ""}
            existingRating={getLessonRating(ratingLesson.id, user?.id || "")}
            onSubmit={(r) => { addLessonRating(r); richToast.success("Feedback enviado!", "Obrigado por avaliar o treino."); }}
            onClose={() => setRatingLesson(null)}
          />
        )}
      </AnimatePresence>

      {/* ===== MODAL: Desempenho & Evolução ===== */}
      <AnimatePresence>
        {evolModal && (() => {
          const tier = avgRating >= 9 ? {label:"Élite",color:"#A78BFA",bg:"#A78BFA"} : avgRating >= 8 ? {label:"Ouro",color:"#EAB308",bg:"#EAB308"} : avgRating >= 7 ? {label:"Prata",color:"#C0C0C0",bg:"#C0C0C0"} : avgRating >= 5 ? {label:"Bronze",color:"#CD7F32",bg:"#CD7F32"} : {label:"Iniciante",color:"#6B7280",bg:"#6B7280"};
          const trend = myFeedbacks.length >= 3 ? (() => {
            const recent = myFeedbacks.slice(0,3).reduce((a,b)=>a+b.rating,0)/3;
            const older = myFeedbacks.slice(3,6).length ? myFeedbacks.slice(3,6).reduce((a,b)=>a+b.rating,0)/myFeedbacks.slice(3,6).length : recent;
            return recent > older + 0.3 ? "up" : recent < older - 0.3 ? "down" : "stable";
          })() : "stable";
          const best = myFeedbacks.reduce((acc,f)=>f.rating>acc?f.rating:acc, 0);
          return (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Desempenho geral"
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end" onClick={()=>setEvolModal(false)}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:300}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-4 pb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#EAB308]"/> Desempenho Geral</h2>
                <button onClick={()=>setEvolModal(false)} className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="overflow-y-auto space-y-4 no-scrollbar flex-1">
                {myFeedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-zinc-700 mx-auto mb-3"/>
                    <p className="text-zinc-400 font-bold">Nenhum feedback do professor ainda.</p>
                    <p className="text-zinc-600 text-sm mt-1">Após as aulas, o professor enviará avaliações que aparecerão aqui.</p>
                  </div>
                ) : (
                  <>
                    {/* Tier + Stats hero */}
                    <div className="relative rounded-2xl overflow-hidden border p-5" style={{borderColor:`${tier.color}30`,background:`linear-gradient(135deg,${tier.bg}08,transparent)`}}>
                      <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse at 0% 0%,${tier.bg}10,transparent 55%)`}}/>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.5"/>
                            <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={tier.color} strokeWidth="2.5"
                              strokeLinecap="round" strokeDasharray="100" strokeDashoffset={100-Math.min(100,(avgRating/10)*100)}
                              initial={{strokeDashoffset:100}} animate={{strokeDashoffset:100-Math.min(100,(avgRating/10)*100)}} transition={{duration:1.2,ease:"easeOut"}}/>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-xl font-black tabular-nums" style={{color:tier.color}}>{avgRating ? avgRating.toFixed(1) : "—"}</p>
                            <p className="text-[8px] text-zinc-500 font-bold">/ 10</p>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{color:tier.color,borderColor:`${tier.color}40`,background:`${tier.bg}12`}}>{tier.label}</span>
                            {trend==="up" && <span className="text-[10px] font-bold text-[#22C55E] flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/>Tendência de nota: alta</span>}
                            {trend==="down" && <span className="text-[10px] font-bold text-[#EF4444] flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/>Tendência de nota: queda</span>}
                            {trend==="stable" && <span className="text-[10px] font-bold text-zinc-400">Tendência de nota: estável</span>}
                          </div>
                          <p className="text-sm font-bold text-white">{profile?.name?.split(" ")[0] || "Atleta"}</p>
                          <p className="text-[11px] text-zinc-500">{myFeedbacks.length} avaliações · melhor nota <span className="text-white font-bold">{best}</span></p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">Comparação entre média das 3 avaliações mais recentes vs. 3 anteriores.</p>
                        </div>
                      </div>
                    </div>

                    {/* KPIs row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {label:"Avaliações",value:myFeedbacks.length,color:"#EAB308",sub:"total"},
                        {label:"Melhor Nota",value:best,color:scoreColor(best),sub:"recorde pessoal"},
                        {label:"Frequência",value:`${frequency}%`,color:freqColor,sub:"presença"},
                      ].map((s,i)=>(
                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                          <p className="text-xl font-black tabular-nums" style={{color:s.color}}>{s.value}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{s.label}</p>
                          <p className="text-[9px] text-zinc-700">{s.sub}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Motor de avaliação composto</p>
                      <div className="space-y-2">
                        {[
                          { label: "Disciplina", value: disciplineScore, color: "#22C55E" },
                          { label: "Performance técnica", value: performanceScore, color: "#EAB308" },
                          { label: "Confiança do professor", value: coachTrustScore, color: "#60A5FA" },
                        ].map((metric) => (
                          <div key={metric.label}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[11px] text-zinc-400">{metric.label}</p>
                              <p className="text-[11px] font-black tabular-nums" style={{ color: metric.color }}>{metric.value}</p>
                            </div>
                            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(to right, ${metric.color}88, ${metric.color})` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-2">Este painel explica sua evolução por mérito técnico real, não apenas por presença.</p>
                    </div>

                    {/* Chart */}
                    <EvolutionTrendPanel
                      idBase={evoChartIdModal}
                      chart={evolutionLineChart}
                      avgRating={avgRating}
                    />

                    {/* Latest professor notes */}
                    {myFeedbacks.some(f=>f.professorNote) && (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Últimas observações do professor</p>
                        <div className="space-y-2">
                          {myFeedbacks.filter(f=>f.professorNote).slice(0,3).map((fb,i)=>(
                            <div key={fb.id} className="flex gap-2.5">
                              <div className="w-1 flex-shrink-0 rounded-full mt-0.5" style={{background:scoreColor(fb.rating)}}/>
                              <div>
                                <p className="text-xs text-zinc-300 leading-relaxed">"{fb.professorNote}"</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(fb.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})} · nota <span className="font-bold" style={{color:scoreColor(fb.rating)}}>{fb.rating}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Session history */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 px-0.5">Histórico de avaliações</p>
                      {myFeedbacks.slice(0, 8).map((fb, i) => (
                        <motion.div key={fb.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
                          <div className="min-w-0 flex items-center gap-2.5">
                            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background:scoreColor(fb.rating)}}/>
                            <div>
                              <p className="text-sm font-bold text-white truncate">{fb.trainingType}</p>
                              <p className="text-[10px] text-zinc-500">{new Date(fb.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-lg font-black tabular-nums" style={{color:scoreColor(fb.rating)}}>{fb.rating}</span>
                            <span className="text-[9px] text-zinc-600">/ 10</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== MODAL: Trilha de Conquista ===== */}
      <AnimatePresence>
        {activeTrack && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label={`Trilha ${activeTrack.label}`}
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex min-h-[100dvh] items-center justify-center p-5 py-10" onClick={()=>setTrackModalId(null)}>
            <motion.div
              initial={{scale:0.85,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.85,opacity:0,y:20}}
              transition={{type:"spring",stiffness:380,damping:26}}
              onClick={e=>e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl text-left bg-[#070707] border backdrop-blur-2xl"
              style={{borderColor:`${activeTrack.accent}35`}}>
              <div className="pointer-events-none absolute inset-0" style={{background:`radial-gradient(ellipse at 50% 0%,${activeTrack.accent}22,transparent 56%)`}} />
              <button onClick={()=>setTrackModalId(null)} className="absolute top-4 right-4 z-20 p-1.5 text-zinc-600 hover:text-zinc-300">
                <X className="w-4 h-4"/>
              </button>
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-full border"
                    style={{color:activeTrack.accent,borderColor:`${activeTrack.accent}44`,background:`${activeTrack.accent}15`}}>
                    trilha competitiva
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full border ${activeTrack.unlocked ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10" : "text-zinc-500 border-zinc-700 bg-zinc-900/40"}`}>
                    {activeTrack.unlocked ? "desbloqueada" : "em progresso"}
                  </span>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className={activeTrack.unlocked ? "" : "opacity-50 grayscale"}>
                    <TrackGlyph id={activeTrack.id} accent={activeTrack.accent} locked={!activeTrack.unlocked} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-white leading-tight">{activeTrack.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{activeTrack.desc}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Progresso da trilha</p>
                    <p className="text-xs font-black" style={{color:activeTrack.accent}}>{activeTrack.score}/100</p>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${activeTrack.progress}%`}} transition={{duration:0.9,ease:"easeOut"}}
                      className="h-full rounded-full" style={{background:`linear-gradient(90deg,${activeTrack.accent}70,${activeTrack.accent})`}}/>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    {activeTrack.unlocked ? "Trilha concluída. Mantenha execução para preservar o nível." : `Faltam ${activeTrack.missing} pontos para destravar.`}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Requisitos da trilha</p>
                  <div className="space-y-1.5">
                    {activeTrack.requirements.map((rule, idx) => (
                      <div key={`${activeTrack.id}-rule-${idx}`} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[9px] text-zinc-400">{idx + 1}</span>
                        <p className="text-[11px] text-zinc-300">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border p-3" style={{borderColor:`${activeTrack.accent}35`, background:`${activeTrack.accent}10`}}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{color:activeTrack.accent}}>Próxima ação recomendada</p>
                  <p className="text-[11px] text-zinc-200">{activeTrack.action}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ===== MODAL: Stats Detalhe ===== */}
      <AnimatePresence>
        {statsModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Diagnóstico de métricas"
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end" onClick={()=>setStatsModal(null)}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:300}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-4 pb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {statsModal==="aulas" && <><Trophy className="w-5 h-5 text-[#EAB308]"/> Carga Confirmada - Diagnóstico</>}
                  {statsModal==="streak" && <><Radio className="w-5 h-5 text-[#EAB308]"/> Ritmo Competitivo - Diagnóstico</>}
                  {statsModal==="freq" && <><CheckCircle2 className="w-5 h-5 text-[#22C55E]"/> Confiabilidade de Presença</>}
                </h2>
                <button onClick={()=>setStatsModal(null)} className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-3">
                {statsModal==="aulas" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Causa atual</p>
                        <p className="text-[11px] text-zinc-300 mt-1">{attendanceDiagnostics.cause}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Impacto no jogo</p>
                        <p className="text-[11px] text-zinc-300 mt-1">{attendanceDiagnostics.impact}</p>
                      </div>
                      <div className="rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-[#EAB308] font-bold">Ação da semana</p>
                        <p className="text-[11px] text-zinc-100 mt-1">{attendanceDiagnostics.action}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        {label:"Total",value:completedCount,color:"#EAB308"},
                        {label:"Este Mês",value:completedFromLessons,color:"#22C55E"},
                        {label:"Meta Mensal",value:"16",color:"#8B5CF6"},
                      ].map((s,i)=>(
                        <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-center">
                          <p className="text-2xl font-bold" style={{color:s.color}}>{s.value}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {attendedLessons.map((l)=>(
                      <div key={l.id} className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0"/>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{l.title}</p>
                          <p className="text-xs text-zinc-500">{l.date.split("-").reverse().join("/")} · {l.startTime}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {statsModal==="streak" && (() => {
                  const allCompleted = myLessons.filter(l=>l.status==="completed").sort((a,b)=>b.date.localeCompare(a.date));
                  const last21 = allCompleted.slice(0, 21);
                  const milestones = [3,5,10,15,20,30,50,100];
                  const nextM = milestones.find(m=>streak<m) ?? milestones[milestones.length-1]!;
                  const prevM = milestones.filter(m=>m<=streak).pop() ?? 0;
                  const mPct = nextM===prevM ? 100 : Math.round(((streak-prevM)/(nextM-prevM))*100);
                  const now = new Date();
                  const monthLessons = myLessons.filter(l=>{
                    const d=new Date(l.date+"T12:00:00");
                    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
                  });
                  const mAttended = monthLessons.filter(l=>l.presentStudents.includes(user?.id||"")).length;
                  const mTotal = monthLessons.filter(l=>l.status==="completed").length;
                  const consPct = mTotal>0 ? Math.round((mAttended/mTotal)*100) : 0;
                  const consColor = consPct>=80?"#22C55E":consPct>=60?"#EAB308":"#EF4444";
                  return (
                  <>
                    {/* Hero */}
                    <div className="relative rounded-2xl overflow-hidden border border-[#EAB308]/20 bg-gradient-to-br from-[#EAB308]/[0.08] via-zinc-950 to-zinc-950 p-5 mb-1 text-center">
                      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at 50% 0%,rgba(234,179,8,0.12),transparent 65%)"}}/>
                      <div className="flex items-end justify-center gap-6 mb-3">
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Atual</p>
                          <motion.p initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:300,damping:22}}
                            className="text-6xl font-black text-white tabular-nums leading-none">{streak}</motion.p>
                          <p className="text-xs text-zinc-400 font-bold mt-1">treinos seguidos</p>
                        </div>
                        <div className="h-14 w-px bg-zinc-800"/>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Recorde</p>
                          <p className="text-4xl font-black text-[#EAB308] tabular-nums leading-none">{Math.max(streak, completedCount > 0 ? Math.ceil(completedCount/1.5) : 0)}</p>
                          <p className="text-xs text-zinc-400 font-bold mt-1">melhor marca</p>
                        </div>
                      </div>
                      {streak === 0 ? (
                        <p className="text-xs text-zinc-500">Compareça ao próximo treino para iniciar sua sequência.</p>
                      ) : streak >= nextM ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308]"/>
                          <p className="text-xs font-bold text-[#EAB308]">Marco {streak} alcançado! Próximo: {nextM}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">Mais <span className="text-white font-bold">{nextM - streak}</span> treinos para o marco de <span className="text-[#EAB308] font-bold">{nextM}</span></p>
                      )}
                    </div>

                    {/* Milestone progress */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Próximo marco</p>
                        <p className="text-xs font-bold text-[#EAB308]">{mPct}%</p>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                        <motion.div initial={{width:0}} animate={{width:`${mPct}%`}} transition={{duration:0.9,ease:"easeOut"}}
                          className="h-full rounded-full bg-gradient-to-r from-[#EAB308]/60 to-[#EAB308]"/>
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                        <span>{prevM} treinos</span><span>Meta: {nextM} treinos</span>
                      </div>
                    </div>

                    {/* Calendar heat grid */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Últimos {last21.length} treinos</p>
                        <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]/30 border border-[#22C55E]/50 inline-block"/>Presente
                          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800 border border-zinc-700 inline-block"/>Falta
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {last21.map((l,i)=>{
                          const present = l.presentStudents.includes(user?.id||"");
                          const d = new Date(l.date+"T12:00:00");
                          const label = d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
                          return (
                            <div key={l.id} title={`${label} — ${present?"Presente":"Falta"}`}
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[9px] font-bold border transition-all ${
                                present
                                  ?"bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                                  :"bg-zinc-900 border-zinc-800 text-zinc-700"
                              }`}>
                              {present ? <CheckCircle2 className="w-3 h-3"/> : <span>—</span>}
                              <span className="text-[8px] font-bold leading-none mt-0.5">{label.split("/")[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {last21.slice(0, 5).map((l) => {
                          const present = l.presentStudents.includes(user?.id || "");
                          const dateLabel = new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                          return (
                            <div key={`streak-log-${l.id}`} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/45 px-2.5 py-1.5">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-zinc-200 truncate">{l.title}</p>
                                <p className="text-[9px] text-zinc-600">{dateLabel} · {l.startTime}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${present ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10" : "text-zinc-500 border-zinc-700 bg-zinc-900"}`}>
                                {present ? "Presente" : "Falta"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Consistency this month */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black tabular-nums" style={{color:consColor}}>{consPct}%</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Consistência Mês</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{mAttended}/{mTotal} treinos</p>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-white tabular-nums">{completedCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Total Treinos</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">histórico completo</p>
                      </div>
                    </div>

                    {/* Impacto real da consistência */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Diagnóstico tático da sequência</p>
                      <div className="space-y-2">
                        {[
                          {title:"Causa", text:streak >= 5 ? "Você está mantendo estímulo contínuo entre sessões." : "Intervalos longos entre sessões quebram adaptação técnica."},
                          {title:"Impacto", text:streak >= 5 ? "Ganho de execução mais estável em saque, recepção e tempo de bola." : "Memória motora oscila e aumenta erro sob pressão."},
                          {title:"Ação", text:sessionsToBeatRecord === 0 ? "Prioridade: defender recorde e manter janela semanal de treino." : `Prioridade: completar mais ${sessionsToBeatRecord} sessões para novo recorde.`},
                        ].map((row,i)=>(
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] leading-tight flex-shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-400 font-bold uppercase">{row.title}</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{row.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                  );
                })()}
                {statsModal==="freq" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Causa</p>
                        <p className="text-[11px] text-zinc-300 mt-1">{frequency >= 80 ? "Planejamento semanal está funcionando." : "Ritmo semanal ainda irregular."}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Impacto</p>
                        <p className="text-[11px] text-zinc-300 mt-1">{frequency >= 80 ? "Maior previsibilidade de evolução técnica." : "Feedback técnico não consolida com a mesma velocidade."}</p>
                      </div>
                      <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-[#22C55E] font-bold">Ação</p>
                        <p className="text-[11px] text-zinc-100 mt-1">{frequency >= 80 ? "Manter rotina de confirmação e check-in." : "Definir presença mínima da semana com prof/admin."}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3"/>
                          <motion.circle cx="18" cy="18" r="15.9" fill="none"
                            stroke={freqColor} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray="100" strokeDashoffset={100-frequency}
                            initial={{strokeDashoffset:100}} animate={{strokeDashoffset:100-frequency}} transition={{duration:1.2,ease:"easeOut"}}/>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-2xl font-bold text-white">{frequency}%</p>
                          <p className="text-[9px] text-zinc-500 font-bold">Frequência</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        {label:"Mínimo",value:"60%",ok:frequency>=60,color:"#EF4444"},
                        {label:"Meta",value:"80%",ok:frequency>=80,color:"#EAB308"},
                        {label:"Elite",value:"90%+",ok:frequency>=90,color:"#22C55E"},
                      ].map((s,i)=>(
                        <div key={i} className={`p-3 rounded-xl border ${s.ok?"border-zinc-700 bg-zinc-900/60":"border-zinc-800/40"}`}>
                          <p className="font-bold text-sm" style={{color:s.ok?s.color:"#52525b"}}>{s.value}</p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{s.label}</p>
                          {s.ok && <p className="text-[9px] text-[#22C55E] mt-0.5">✓ Atingido</p>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                      <p className="text-xs text-zinc-400">
                        Você compareceu a <span className="text-white font-bold">{completedFromLessons} aulas</span> neste ciclo.
                        {frequency >= 80
                          ? " Continue assim para manter o nível Elite."
                          : " Tente aumentar sua frequência para desbloquear mais conquistas."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: Frase Motivacional Diária ===== */}
      <AnimatePresence>
        {showDailyQuote && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Frase motivacional do dia"
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/90 backdrop-blur-md flex min-h-[100dvh] items-center justify-center p-6 py-10"
            onClick={()=>{
              wtLsSetString("daily_quote_date", new Date().toDateString());
              setShowDailyQuote(false);
            }}>
            <motion.div
              initial={{scale:0.88,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.88,opacity:0,y:24}}
              transition={{type:"spring",stiffness:340,damping:26}}
              onClick={e=>e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#050505] border border-[#EAB308]/20">

              {/* Animated radial aura */}
              <motion.div aria-hidden className="pointer-events-none absolute -inset-20"
                style={{background:"conic-gradient(from 0deg, rgba(234,179,8,0.5), rgba(168,85,247,0.15), rgba(234,179,8,0.25), rgba(59,130,246,0.10), rgba(234,179,8,0.5))"}}
                animate={{rotate:360}} transition={{duration:14,repeat:Infinity,ease:"linear"}}/>
              <div className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(ellipse at 50% 0%,rgba(234,179,8,0.15),transparent 60%)"}}/>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/40"/>

              <div className="relative z-10 p-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse"/>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#EAB308]">Frase do Dia</p>
                  </div>
                  <p className="text-[9px] text-zinc-600 font-bold">
                    {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}
                  </p>
                </div>

                {/* Decorative quote mark */}
                <p className="text-8xl font-black text-[#EAB308]/10 leading-none mb-0 -mb-6 select-none">"</p>

                {/* Quote */}
                <motion.p
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
                  className="text-xl font-bold text-white leading-relaxed mb-6 mt-2">
                  {dailyQuote.text}
                </motion.p>

                {/* Author */}
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="flex items-center gap-3 mb-7">
                  <div className="h-px flex-1 bg-gradient-to-r from-[#EAB308]/30 to-transparent"/>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#EAB308]">{dailyQuote.author}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">{dailyQuote.role}</p>
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.button
                  whileTap={{scale:0.96}}
                  onClick={()=>{
                    wtLsSetString("daily_quote_date", new Date().toDateString());
                    setShowDailyQuote(false);
                    haptic([18,12,22]);
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-[#EAB308] via-[#F59E0B] to-[#EAB308] shadow-[0_0_24px_rgba(234,179,8,0.35)] tracking-wide">
                  Vamos Treinar
                </motion.button>
                <p className="text-center text-[10px] text-zinc-700 mt-3 font-bold">Toque para fechar · aparece uma vez ao dia</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: Score de Mérito / XP ===== */}
      <AnimatePresence>
        {showXpModal && (() => {
          const TIER_ALL = [
            { id: "tier-base",     min: 0,  label: "Base",     color: "#6B7280" },
            { id: "tier-bronze",   min: 35, label: "Bronze",   color: "#CD7F32" },
            { id: "tier-silver",   min: 50, label: "Prata",    color: "#C0C0C0" },
            { id: "tier-gold",     min: 65, label: "Ouro",     color: "#EAB308" },
            { id: "tier-platinum", min: 78, label: "Platina",  color: "#67E8F9" },
            { id: "tier-diamond",  min: 88, label: "Diamante", color: "#60A5FA" },
            { id: "tier-legend",   min: 96, label: "Lendário", color: "#A78BFA" },
          ];
          const tierProgressPct = nextTier
            ? Math.round(Math.max(0, Math.min(100, ((meritScore - currentTier.min) / Math.max(1, nextTier.min - currentTier.min)) * 100)))
            : 100;
          const components = [
            { label: "Qualidade técnica", weight: "35%", value: Math.round(Math.min(100, avgRating * 10)), color: "#EAB308", tip: "Melhorando a nota média das avaliações do professor." },
            { label: "Frequência",        weight: "25%", value: frequency,                                  color: "#22C55E", tip: "Comparecendo a mais treinos por semana." },
            { label: "Presença acumulada", weight: "20%", value: Math.round(Math.min(100, completedCount * 3)), color: "#60A5FA", tip: "Cada aula completada conta para esse score." },
            { label: "Sequência ativa",   weight: "10%", value: Math.round(Math.min(100, streak * 8)),      color: "#F97316", tip: "Não quebre sua sequência de presença." },
            { label: "Consistência semanal", weight: "10%", value: weeklyConsistency,                       color: "#A78BFA", tip: "Treinar nos dias previstos a cada semana." },
          ];
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              role="dialog" aria-modal="true" data-modal-overlay aria-label="Score de Mérito XP"
              className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
              onClick={() => setShowXpModal(false)}
            >
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
              >
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-5 pb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Medal className="w-5 h-5" style={{ color: currentTier.color }} />
                    Score de Mérito
                  </h2>
                  <button onClick={() => setShowXpModal(false)} className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-4 no-scrollbar flex-1">
                  {/* Score hero */}
                  <div className="relative rounded-2xl overflow-hidden border p-5 flex items-center gap-5"
                    style={{ borderColor: `${currentTier.color}30`, background: `linear-gradient(135deg,${currentTier.color}08,transparent)` }}>
                    <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at 0% 0%,${currentTier.color}12,transparent 55%)` }} />
                    <div className="relative flex-shrink-0">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.5" />
                        <motion.circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={currentTier.color} strokeWidth="2.5" strokeLinecap="round"
                          strokeDasharray="100" strokeDashoffset={100 - meritScore}
                          initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - meritScore }}
                          transition={{ duration: 1.2, ease: "easeOut" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.p
                          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                          className="text-2xl font-black tabular-nums" style={{ color: currentTier.color }}
                        >
                          {meritScore}
                        </motion.p>
                        <p className="text-[9px] text-zinc-500 font-bold">/ 100</p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5"
                        style={{ color: currentTier.color, borderColor: `${currentTier.color}40`, background: `${currentTier.color}12` }}>
                        {currentTier.label}
                      </span>
                      <p className="text-sm font-bold text-white">{profile?.name?.split(" ")[0] || "Atleta"}</p>
                      {nextTier ? (
                        <>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Faltam <span className="font-bold" style={{ color: nextTier.color }}>{nextTier.min - meritScore} pts</span> para {nextTier.label}
                          </p>
                          <div className="mt-2 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${tierProgressPct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(to right, ${currentTier.color}80, ${nextTier.color})` }}
                            />
                          </div>
                          <p className="text-[9px] text-zinc-600 mt-1">{tierProgressPct}% do caminho para {nextTier.label}</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-[#A78BFA] font-bold mt-1">Tier máximo atingido!</p>
                      )}
                    </div>
                  </div>

                  {/* Progressão de tiers */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Progressão de tiers</p>
                    <div className="space-y-2">
                      {TIER_ALL.map((tier, i) => {
                        const isCurrentOrPast = meritScore >= tier.min;
                        const isCurrent = tier.id === currentTier.id;
                        const nextInList = TIER_ALL[i + 1];
                        return (
                          <div key={tier.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCurrent ? "border-zinc-600 bg-zinc-900/60" : "border-zinc-800/40"
                          }`}>
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: isCurrentOrPast ? tier.color : "#27272a" }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-bold" style={{ color: isCurrentOrPast ? tier.color : "#52525b" }}>{tier.label}</p>
                                {isCurrent && <span className="text-[9px] font-black text-black px-1.5 py-0.5 rounded-full" style={{ background: tier.color }}>atual</span>}
                              </div>
                              <p className="text-[9px] text-zinc-600">{nextInList ? `${tier.min}–${nextInList.min - 1} pts` : `${tier.min}+ pts`}</p>
                            </div>
                            {isCurrentOrPast && !isCurrent && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: tier.color }} />}
                            {isCurrent && (
                              <span className="text-[10px] font-black tabular-nums" style={{ color: tier.color }}>{meritScore}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Breakdown dos componentes */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Como o score é calculado</p>
                    <div className="space-y-3">
                      {components.map((c) => (
                        <div key={c.label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] text-zinc-300">{c.label}</p>
                              <span className="text-[9px] font-bold text-zinc-600">({c.weight})</span>
                            </div>
                            <p className="text-[11px] font-black tabular-nums" style={{ color: c.color }}>{c.value}</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${c.value}%` }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(to right, ${c.color}70, ${c.color})` }}
                            />
                          </div>
                          <p className="text-[9px] text-zinc-700 mt-0.5">{c.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dica para subir */}
                  {nextTier && (() => {
                    const weakest = [...components].sort((a, b) => (a.value / 100) * parseFloat(a.weight) - (b.value / 100) * parseFloat(b.weight))[0]!;
                    return (
                      <div className="rounded-2xl border p-4" style={{ borderColor: `${nextTier.color}35`, background: `${nextTier.color}08` }}>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: nextTier.color }}>
                          Como chegar ao tier {nextTier.label}
                        </p>
                        <p className="text-[11px] text-zinc-200 leading-relaxed">
                          Seu maior ganho vem de <span className="font-bold" style={{ color: weakest.color }}>{weakest.label.toLowerCase()}</span> — melhore esse componente para avançar mais rápido.
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-1.5">{weakest.tip}</p>
                      </div>
                    );
                  })()}

                  {/* Últimas conquistas (XP Log) */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5" /> Últimas conquistas
                    </p>
                    {xpLogEntries.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 text-center py-4">Nenhuma conquista registrada ainda. Comece treinando!</p>
                    ) : (
                      <div className="space-y-2">
                        {xpLogEntries.map((entry, idx) => {
                          const icons: Record<string, React.ReactNode> = {
                            checkin: <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />,
                            feedback: <Star className="w-3.5 h-3.5 text-[#EAB308]" />,
                            feed_like: <Heart className="w-3.5 h-3.5 text-[#EF4444]" />,
                            feed_comment: <MessageCircle className="w-3.5 h-3.5 text-[#06B6D4]" />,
                            evaluation: <Award className="w-3.5 h-3.5 text-[#A78BFA]" />,
                            training_completed: <Trophy className="w-3.5 h-3.5 text-[#F97316]" />,
                          };
                          const labels: Record<string, string> = {
                            checkin: "Check-in aprovado",
                            feedback: "Feedback de aula",
                            feed_like: "Curtiu no feed",
                            feed_comment: "Comentou no feed",
                            evaluation: "Avaliação recebida",
                            training_completed: "Treino completado",
                          };
                          const timeAgo = (() => {
                            const now = new Date();
                            const then = new Date(entry.createdAt);
                            const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
                            if (diff < 60) return "agora";
                            if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
                            if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
                            return `${Math.floor(diff / 86400)}d atrás`;
                          })();
                          return (
                            <motion.div key={entry.id}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-900/40 transition-colors">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className="flex-shrink-0">{icons[entry.type] || <Trophy className="w-3.5 h-3.5 text-zinc-500" />}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-zinc-300">{labels[entry.type] || entry.description}</p>
                                  <p className="text-[9px] text-zinc-600">{timeAgo}</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-[11px] font-bold text-[#EAB308]">+{entry.points}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Gamification Panel — XP, Awards, History */}
      <motion.div variants={homeItem} className="mb-2">
        <GamificationPanel />
      </motion.div>

      {/* Ranking da Turma — semanal por categoria */}
      {user?.id && (
        <motion.div variants={homeItem} className="mb-2">
          <TurmaLeaderboardCard studentId={user.id} />
        </motion.div>
      )}

      {/* Leaderboard Global */}
      <motion.div variants={homeItem} className="mb-2">
        <LeaderboardRankingPanel compact={true} />
      </motion.div>

      <LeaderboardPanel
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        timeframe="all"
      />

      <StudentGamificationDashboard
        isOpen={showGamificationDashboard}
        onClose={() => setShowGamificationDashboard(false)}
      />

      <AnimatePresence>
        {showDailyChallenges && user?.id && (
          <DailyChallengesPanel
            studentId={user.id}
            onClose={() => setShowDailyChallenges(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentTwin && profile && (
          <AthleteTwinPanel
            student={profile}
            onClose={() => { setShowStudentTwin(false); if (user?.id) markTwinViewed(user.id); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPillarPanel && (
          <StudentPillarPanel onClose={() => setShowPillarPanel(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMessagesPanel && profile?.id && (
          <StudentMessagesPanel
            studentCrmId={profile.id}
            onClose={() => setShowMessagesPanel(false)}
            onUnreadCountChange={(c) => setMessagesUnread(c)}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onCheckIn={() => toast("💚 Check-in: vá até a quadra e pressione o botão de check-in da turma", "info")}
        onViewLessons={() => setShowAgendaPanel(true)}
        onViewSchedule={() => setShowStudentSchedule(true)}
        onReportAbsence={() => setShowAbsenceSheet(true)}
        onRequestReposition={() => setShowRepositionSheet(true)}
        onViewPayments={() => setShowPayments(true)}
        onFreeTraining={() => setShowFreeTraining(true)}
        onQRScan={() => setShowQRScanner(true)}
      />

      <AnimatePresence>
        {showAttendanceCalendar && user?.id && (
          <AttendanceCalendarPanel
            lessons={lessons}
            studentId={user.id}
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            streak={streak}
            bestStreak={bestStreak}
            onClose={() => setShowAttendanceCalendar(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLessonHistory && profile?.id && (
          <LessonHistoryPanel
            studentId={profile.id}
            getCategory={getCategory}
            onClose={() => setShowLessonHistory(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentSchedule && user?.id && (
          <StudentSchedulePanel
            studentId={user.id}
            lessons={lessons}
            getCategory={getCategory}
            onClose={() => setShowStudentSchedule(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAbsenceSheet && user?.id && (
          <AbsenceRequestSheet
            lessons={lessons}
            studentId={user.id}
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            onClose={() => setShowAbsenceSheet(false)}
            onRequestReposition={() => setShowRepositionSheet(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRepositionSheet && (
          <RepositionSheet
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            onClose={() => setShowRepositionSheet(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeline && profile?.id && (
          <AthleteTimelinePanel
            studentCrmId={profile.id}
            studentName={profile.name ?? user?.name ?? "Atleta"}
            onClose={() => setShowTimeline(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotificationCenter && user?.id && (
          <NotificationCenterPanel
            studentId={user.id}
            onClose={() => setShowNotificationCenter(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPushSettings && (
          <PushSettingsPanel
            role="aluno"
            onClose={() => setShowPushSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFreeTraining && profile?.id && (
          <FreeTrainingSheet
            studentCrmId={profile.id}
            onClose={() => setShowFreeTraining(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievementFeed && user?.id && (
          <AchievementFeedPanel
            studentId={user.id}
            onClose={() => setShowAchievementFeed(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReferralPanel && profile?.id && (
          <ReferralPanel
            studentId={profile.id}
            onClose={() => setShowReferralPanel(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrainingPlan && user?.id && (
          <StudentTrainingPlanPanel
            studentId={user.id}
            onClose={() => setShowTrainingPlan(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRScanner && (
          <QRScannerSheet
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Invisible milestone tracker — fires onUnlock toast when a new badge is earned */}
      {profile?.id && sessionToken && (
        <MilestoneTracker
          studentCrmId={profile.id}
          authToken={sessionToken}
          lessons={lessons}
          studentId={user?.id ?? ""}
          totalXP={totalXP}
          streak={streak}
          onUnlock={({ title, emoji, xp }) => {
            richToast.xp(xp, `${emoji} ${title}`);
          }}
        />
      )}

      {/* Achievement Share Sheet */}
      <AnimatePresence>
        {justUnlockedTier && (() => {
          const meta = TIER_META[justUnlockedTier];
          const profile = students.find(s => s.authUserId === user?.id || s.id === user?.id);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[260] flex flex-col justify-end bg-black/85 backdrop-blur-md"
              onClick={() => setJustUnlockedTier(null)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="w-full rounded-t-3xl border-t border-zinc-800 bg-[#08080A] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              >
                {/* Handle */}
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-4" />

                {/* Card unlock visual */}
                <div className="px-5 pb-4 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.4, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(234,179,8,0.3)] mb-3`}
                  >
                    {meta.emoji}
                  </motion.div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-1">Conquista desbloqueada</p>
                  <h2 className="text-2xl font-black text-white">Card <span style={{ color: meta.color }}>{meta.label}</span></h2>
                  <p className="text-sm text-zinc-400 mt-1">{totalXP.toLocaleString("pt-BR")} XP acumulados na quadra</p>
                </div>

                {/* Share composer */}
                <div className="px-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Compartilhar na Rede</p>
                  <textarea
                    value={shareText}
                    onChange={e => setShareText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-white outline-none placeholder-zinc-600 focus:border-zinc-500 transition-colors resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="px-5 mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setJustUnlockedTier(null)}
                    className={`flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-400 hover:bg-zinc-900 transition-colors ${ctaClass}`}
                  >
                    Agora não
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      const sharePayload = {
                        title: `Card ${meta.label} ${meta.emoji} desbloqueado!`,
                        text: shareText,
                        url: profile?.id ? `${window.location.origin}/atleta/${profile.id}` : window.location.origin,
                      };
                      if (navigator.share) {
                        try { await navigator.share(sharePayload); } catch { /* dismissed */ }
                      } else {
                        await navigator.clipboard.writeText(`${shareText}\n${sharePayload.url}`).catch(() => {});
                        toast("🔗 Link copiado para compartilhar!");
                      }
                    }}
                    className={`flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-black text-zinc-200 hover:bg-zinc-900 transition-colors ${ctaClass}`}
                  >
                    Compartilhar
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={!shareText.trim()}
                    onClick={() => {
                      if (!shareText.trim()) return;
                      addPost({
                        user: {
                          name: user?.name || "Atleta",
                          avatar: profile?.avatar || user?.avatar || "user",
                          isPro: false,
                        },
                        time: "agora",
                        content: shareText,
                        media: null,
                        likes: 0,
                        comments: [],
                        isLiked: false,
                        isSaved: false,
                        pinned: false,
                        isOfficial: false,
                        targetRole: "all",
                      });
                      setJustUnlockedTier(null);
                      toast(`${meta.emoji} Conquista publicada na Rede!`);
                    }}
                    className={`flex-1 rounded-xl bg-[#EAB308] py-3 text-sm font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.25)] disabled:opacity-40 ${ctaClass}`}
                  >
                    Postar na Rede
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Sprint 81 — Share Progress Card */}
      <AnimatePresence>
        {showShareCard && user && (
          <ShareProgressCard
            student={{
              id: profile?.id ?? user.id,
              name: profile?.name ?? user.name ?? "Atleta",
              totalXP,
              tier: equippedTier.label,
              tierColor: equippedTier.color,
              streak,
              xpByFundamental,
            }}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>

      {/* ===== SESSION EXPIRED MODAL ===== */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onReconnect={recoverSession}
        onLogout={sessionForceLogout}
        recovering={sessionRecovering}
      />
    </>
  );
}
