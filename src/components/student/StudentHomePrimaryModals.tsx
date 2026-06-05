"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  Lock,
  MapPin,
  Medal,
  MessageCircle,
  Award,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
  Radio,
} from "lucide-react";
import type { CardTier, Lesson, LessonRating, LessonRatingDraft, Notification, Post, Student, User, WithoutId, PerformanceFeedback } from "@/context/types";
import type { XpLogEntry } from "@/lib/supabasePersistence";
import type { XPFloatEvent } from "@/components/XPFloatNotification";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";
import { richToast } from "@/hooks/useToast";
import { wtLsSetString } from "@/lib/willLocalStorage";
import { XPFloatNotification } from "@/components/XPFloatNotification";
import { scoreColor, TIER_META, resolveAvatarSrc } from "./studentHomeShared";
import type { AchievementTrackWithScore } from "./studentHomeShared";
import { EvolutionTrendPanel } from "./EvolutionTrendPanel";
import type { EvolutionLineChartData } from "./EvolutionTrendPanel";
import { TrackGlyph } from "./StudentHomeTrackVisuals";

// ─── Lazy-loaded panels ───────────────────────────────────────────────────────
const StudentGamificationDashboard = dynamic(
  () =>
    import("@/components/StudentGamificationDashboard").then((m) => ({
      default: m.StudentGamificationDashboard,
    })),
  { ssr: false, loading: () => null },
);
const DailyChallengesPanel = dynamic(
  () => import("@/components/gamification/DailyChallengesPanel"),
  { ssr: false, loading: () => null },
);
const AthleteTwinPanel = dynamic(
  () => import("@/components/will/AthleteTwinPanel"),
  { ssr: false, loading: () => null },
);
const StudentPillarPanel = dynamic(
  () => import("@/components/student/StudentPillarPanel"),
  { ssr: false, loading: () => null },
);
const StudentMessagesPanel = dynamic(
  () => import("@/components/student/StudentMessagesPanel"),
  { ssr: false, loading: () => null },
);
const LessonRatingSheet = dynamic(
  () => import("@/components/LessonRatingSheet"),
  { ssr: false, loading: () => null },
);
const Confetti = dynamic(
  () => import("@/components/Confetti"),
  { ssr: false, loading: () => null },
);
const ShareProgressCard = dynamic(
  () => import("@/components/student/ShareProgressCard"),
  { ssr: false, loading: () => null },
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface StudentHomePrimaryModalsProps {
  // Modal open states
  showConquistasMore: boolean;
  showNotif: boolean;
  lessonModal: Lesson | null;
  ratingLesson: Lesson | null;
  confettiActive: boolean;
  evolModal: boolean;
  trackModalId: AchievementTrackWithScore["id"] | null;
  statsModal: "aulas" | "streak" | "nota" | "freq" | null;
  showDailyQuote: boolean;
  showXpModal: boolean;
  showGamificationDashboard: boolean;
  showDailyChallenges: boolean;
  showStudentTwin: boolean;
  showPillarPanel: boolean;
  showMessagesPanel: boolean;
  justUnlockedTier: CardTier | null;
  showShareCard: boolean;

  // Setters
  setShowConquistasMore: (v: boolean) => void;
  setShowNotif: (v: boolean) => void;
  setLessonModal: (v: Lesson | null) => void;
  setRatingLesson: (v: Lesson | null) => void;
  setConfettiActive: (v: boolean) => void;
  setEvolModal: (v: boolean) => void;
  setTrackModalId: (v: AchievementTrackWithScore["id"] | null) => void;
  setStatsModal: (v: "aulas" | "streak" | "nota" | "freq" | null) => void;
  setShowDailyQuote: (v: boolean) => void;
  setShowXpModal: (v: boolean) => void;
  setShowGamificationDashboard: (v: boolean) => void;
  setShowDailyChallenges: (v: boolean) => void;
  setShowStudentTwin: (v: boolean) => void;
  setShowPillarPanel: (v: boolean) => void;
  setShowMessagesPanel: (v: boolean) => void;
  setJustUnlockedTier: (v: CardTier | null) => void;
  setShowShareCard: (v: boolean) => void;
  // From "Mais opções" sheet — secondary navigation
  setShowTimeline: (v: boolean) => void;
  setShowNotificationCenter: (v: boolean) => void;
  setShowPushSettings: (v: boolean) => void;
  setShowAchievementFeed: (v: boolean) => void;
  setShowTrainingPlan: (v: boolean) => void;
  setShowReferralPanel: (v: boolean) => void;

  // Data
  user: User | null;
  profile: Student | undefined;
  students: Student[];
  myLessons: Lesson[];
  myFeedbacks: PerformanceFeedback[];
  visibleNotifications: Notification[];
  xpLogEntries: XpLogEntry[];
  totalXP: number;
  streak: number;
  bestStreak: number;
  frequency: number;
  completedCount: number;
  completedFromLessons: number;
  avgRating: number;
  freqColor: string;
  disciplineScore: number;
  performanceScore: number;
  coachTrustScore: number;
  meritScore: number;
  currentTier: { id: string; min: number; label: string; color: string };
  nextTier: { id: string; min: number; label: string; color: string } | null;
  weeklyConsistency: number;
  evolutionLineChart: EvolutionLineChartData | null;
  evoChartIdModal: string;
  sessionsToBeatRecord: number;
  attendedLessons: Lesson[];
  attendanceDiagnostics: { recent: Lesson[]; rate: number; cause: string; impact: string; action: string };
  achievementTracks: AchievementTrackWithScore[];
  activeTrack: AchievementTrackWithScore | null;
  equippedTier: { id: string; min: number; label: string; color: string };
  xpByFundamental: Record<string, number>;
  dailyQuote: { text: string; author: string; role: string };
  crmStudentId: string | null | undefined;
  shareText: string;
  setShareText: (v: string) => void;
  xpFloatEvents: XPFloatEvent[];
  removeXPFloat: (id: string) => void;

  // Callbacks
  haptic: (pattern: number | number[]) => void;
  checkInGate: (lesson: Lesson) => { locked: boolean; reason: string; unlockLabel: string };
  getLessonRating: (lessonId: string, studentId: string) => LessonRating | undefined;
  addLessonRating: (r: LessonRatingDraft) => void;
  requestCheckIn: (lessonId: string, studentId: string) => void;
  markNotificationRead: (id: string) => void;
  refreshCoachMessagesUnread: () => void;
  addPost: (post: WithoutId<Post>) => void;
  toast: (msg: string, type?: string) => void;
  markTwinViewed: (studentId: string) => void;

  ctaClass: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StudentHomePrimaryModals({
  showConquistasMore,
  showNotif,
  lessonModal,
  ratingLesson,
  confettiActive,
  evolModal,
  trackModalId: _trackModalId,
  statsModal,
  showDailyQuote,
  showXpModal,
  showGamificationDashboard,
  showDailyChallenges,
  showStudentTwin,
  showPillarPanel,
  showMessagesPanel,
  justUnlockedTier,
  showShareCard,
  setShowConquistasMore,
  setShowNotif,
  setLessonModal,
  setRatingLesson,
  setConfettiActive,
  setEvolModal,
  setTrackModalId,
  setStatsModal,
  setShowDailyQuote,
  setShowXpModal,
  setShowGamificationDashboard,
  setShowDailyChallenges,
  setShowStudentTwin,
  setShowPillarPanel,
  setShowMessagesPanel,
  setJustUnlockedTier,
  setShowShareCard,
  setShowTimeline,
  setShowNotificationCenter,
  setShowPushSettings,
  setShowAchievementFeed,
  setShowTrainingPlan,
  setShowReferralPanel,
  user,
  profile,
  students,
  myLessons,
  myFeedbacks,
  visibleNotifications,
  xpLogEntries,
  totalXP,
  streak,
  bestStreak,
  frequency,
  completedCount,
  completedFromLessons,
  avgRating,
  freqColor,
  disciplineScore,
  performanceScore,
  coachTrustScore,
  meritScore,
  currentTier,
  nextTier,
  weeklyConsistency,
  evolutionLineChart,
  evoChartIdModal,
  sessionsToBeatRecord,
  attendedLessons,
  attendanceDiagnostics,
  achievementTracks: _achievementTracks,
  activeTrack,
  equippedTier,
  xpByFundamental,
  dailyQuote,
  crmStudentId,
  shareText,
  setShareText,
  xpFloatEvents,
  removeXPFloat,
  haptic,
  checkInGate,
  getLessonRating,
  addLessonRating,
  requestCheckIn,
  markNotificationRead,
  refreshCoachMessagesUnread,
  addPost,
  toast,
  markTwinViewed,
  ctaClass,
}: StudentHomePrimaryModalsProps) {
  return (
    <>
      {/* ─── 1. Conquistas "Mais opções" sheet ───────────────────────────────── */}
      <AnimatePresence>
        {showConquistasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Mais conquistas e atalhos"
            className="fixed inset-0 z-[85] bg-black/80 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setShowConquistasMore(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-zinc-800 bg-[#0A0A0A] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
              <h3 className="text-sm font-black text-white mb-3">Mais opções</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Progresso 🎯", action: () => setShowGamificationDashboard(true) },
                  {
                    label: "🔗 Perfil público",
                    action: () => profile?.id && window.open(`/atleta/${profile.id}`, "_blank"),
                  },
                  { label: "🕐 Jornada", action: () => setShowTimeline(true) },
                  { label: "🔔 Notificações", action: () => setShowNotificationCenter(true) },
                  { label: "📲 Push", action: () => setShowPushSettings(true) },
                  { label: "🏆 Feed da turma", action: () => setShowAchievementFeed(true), testId: "btn-achievement-feed" },
                  { label: "💪 Meu plano", action: () => setShowTrainingPlan(true), testId: "btn-training-plan" },
                  { label: "👥 Indicar amigo", action: () => setShowReferralPanel(true), testId: "btn-referral-panel" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    data-testid={(item as { testId?: string }).testId}
                    onClick={() => {
                      haptic(8);
                      item.action();
                      setShowConquistasMore(false);
                    }}
                    className={`rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-left text-[11px] font-bold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors ${ctaClass}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. Notifications drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Notificações do aluno"
            className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/80 backdrop-blur-sm flex justify-end"
            onClick={() => setShowNotif(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#050505] border-l border-zinc-800 h-full flex flex-col"
            >
              <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-sm border-b border-zinc-900 p-6 flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#EAB308]" /> Notificações
                </h2>
                <button
                  onClick={() => setShowNotif(false)}
                  className={`p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 ${FOCUS_RING_GOLD}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {visibleNotifications.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center mt-20">Sem notificações.</p>
                ) : (
                  visibleNotifications
                    .slice()
                    .reverse()
                    .map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        className={`p-4 rounded-2xl border ${
                          !n.read ? "bg-[#EAB308]/5 border-[#EAB308]/20" : "bg-zinc-900/30 border-zinc-800"
                        }`}
                      >
                        {!n.read && <div className="w-2 h-2 bg-[#EAB308] rounded-full mb-2" />}
                        <p className={`text-sm font-bold ${!n.read ? "text-white" : "text-zinc-400"}`}>{n.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                        {!n.read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className={`w-full mt-2 py-1.5 text-xs font-bold text-[#EAB308] bg-[#EAB308]/10 rounded-lg hover:bg-[#EAB308]/20 transition-colors ${ctaClass}`}
                          >
                            Marcar como lida
                          </button>
                        )}
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 3. Lesson detail sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {lessonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label={`Detalhes da aula ${lessonModal.title}`}
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setLessonModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
            >
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-start justify-between mb-4 pb-2">
                <div>
                  {lessonModal.status === "in-progress" && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full mb-2"
                    >
                      <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full" /> AO VIVO
                    </motion.span>
                  )}
                  <h2 className="text-xl font-bold text-white">{lessonModal.title}</h2>
                  <p className="text-sm text-zinc-400 mt-1">{lessonModal.date.split("-").reverse().join("/")}</p>
                </div>
                <button
                  onClick={() => setLessonModal(null)}
                  className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <Clock className="w-4 h-4 text-[#EAB308] mb-2" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Horário</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {lessonModal.startTime} – {lessonModal.endTime}
                  </p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <Users className="w-4 h-4 text-[#EAB308] mb-2" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Turma</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {lessonModal.enrolledStudents.length}/{lessonModal.maxStudents} alunos
                  </p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <MapPin className="w-4 h-4 text-[#EAB308] mb-2" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Local</p>
                  <p className="text-xs text-white mt-0.5 leading-tight">
                    {lessonModal.venueId === "v1"
                      ? "Quadra Central"
                      : lessonModal.venueId === "v2"
                        ? "Arena Beach"
                        : "Ginásio Municipal"}
                  </p>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-[#EAB308] mb-2" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Status</p>
                  <p
                    className="text-xs font-bold mt-0.5"
                    style={{
                      color: lessonModal.presentStudents.includes(user?.id || "") ? "#22C55E" : "#EAB308",
                    }}
                  >
                    {lessonModal.presentStudents.includes(user?.id || "")
                      ? "✓ Check-in feito"
                      : "Aguardando check-in"}
                  </p>
                </div>
              </div>
              {lessonModal.enrolledStudents.filter((id) => id !== user?.id).length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Colegas de Turma</p>
                  <div className="flex gap-2 flex-wrap">
                    {lessonModal.enrolledStudents
                      .filter((id) => id !== user?.id)
                      .map((sid) => {
                        const st = students.find((s) => s.id === sid);
                        return (
                          <div
                            key={sid}
                            className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-full pl-1 pr-2.5 py-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveAvatarSrc(st?.avatar, sid)}
                              alt={st?.name ?? "Aluno"}
                              className="w-6 h-6 rounded-full border border-zinc-700 object-cover flex-shrink-0"
                            />
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
                  const alreadyCheckedIn = lessonModal.presentStudents.includes(user?.id || "");
                  const myCheckIn = lessonModal.checkInRequests?.find((r) => r.studentId === user?.id);
                  const existingRating = getLessonRating(lessonModal.id, user?.id || "");

                  if (isCompleted)
                    return (
                      <div className="space-y-3">
                        {alreadyCheckedIn && (
                          <div className="flex items-center gap-2 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                            <span className="text-sm text-[#22C55E] font-bold">Presença confirmada</span>
                          </div>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setRatingLesson(lessonModal);
                            setLessonModal(null);
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                            existingRating
                              ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                              : "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                          } ${ctaClass}`}
                        >
                          <Star className={`w-4 h-4 ${existingRating ? "" : "fill-black"}`} />
                          {existingRating
                            ? `Avaliado (${((existingRating.intensidade + existingRating.tecnica + existingRating.didatica + existingRating.evolucao) / 4).toFixed(1)}/5)`
                            : "Avaliar esse Treino"}
                        </motion.button>
                      </div>
                    );

                  if (myCheckIn?.status === "pending")
                    return (
                      <div className="flex items-center gap-3 p-4 bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-2xl">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <Clock className="w-5 h-5 text-[#EAB308]" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-bold text-[#EAB308]">Aguardando confirmação</p>
                          <p className="text-xs text-zinc-500">Chegada registrada. O professor vai confirmar.</p>
                        </div>
                      </div>
                    );

                  if (alreadyCheckedIn)
                    return (
                      <div className="flex items-center gap-2 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        <span className="text-sm text-[#22C55E] font-bold">Presença confirmada pelo professor</span>
                      </div>
                    );

                  const gate = checkInGate(lessonModal);
                  if (gate.locked)
                    return (
                      <div className="flex items-center gap-3 p-4 bg-zinc-900/75 border border-zinc-700 rounded-2xl">
                        <Lock className="w-5 h-5 text-zinc-400" />
                        <div>
                          <p className="text-sm font-bold text-zinc-300">Check-in bloqueado</p>
                          <p className="text-xs text-zinc-500">{gate.reason}</p>
                        </div>
                      </div>
                    );

                  return (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        if (!user?.id) return;
                        requestCheckIn(lessonModal.id, user.id);
                        toast("📍 Chegada registrada!");
                        setLessonModal(null);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-4 bg-[#EAB308] text-black rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(234,179,8,0.2)] ${ctaClass}`}
                    >
                      <MapPin className="w-5 h-5" /> Registrar Chegada
                    </motion.button>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 4. Confetti + LessonRatingSheet ─────────────────────────────────── */}
      <Confetti active={confettiActive} onDone={() => setConfettiActive(false)} />
      <AnimatePresence>
        {ratingLesson && (
          <LessonRatingSheet
            lessonId={ratingLesson.id}
            lessonTitle={ratingLesson.title}
            lessonDate={ratingLesson.date}
            studentId={user?.id || ""}
            existingRating={getLessonRating(ratingLesson.id, user?.id || "")}
            onSubmit={(r) => {
              addLessonRating(r);
              richToast.success("Feedback enviado!", "Obrigado por avaliar o treino.");
            }}
            onClose={() => setRatingLesson(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── 5. evolModal — Desempenho & Evolução ─────────────────────────────── */}
      <AnimatePresence>
        {evolModal &&
          (() => {
            const tier =
              avgRating >= 9
                ? { label: "Élite", color: "#A78BFA", bg: "#A78BFA" }
                : avgRating >= 8
                  ? { label: "Ouro", color: "#EAB308", bg: "#EAB308" }
                  : avgRating >= 7
                    ? { label: "Prata", color: "#C0C0C0", bg: "#C0C0C0" }
                    : avgRating >= 5
                      ? { label: "Bronze", color: "#CD7F32", bg: "#CD7F32" }
                      : { label: "Iniciante", color: "#6B7280", bg: "#6B7280" };
            const trend =
              myFeedbacks.length >= 3
                ? (() => {
                    const recent = myFeedbacks.slice(0, 3).reduce((a, b) => a + b.rating, 0) / 3;
                    const older = myFeedbacks.slice(3, 6).length
                      ? myFeedbacks.slice(3, 6).reduce((a, b) => a + b.rating, 0) / myFeedbacks.slice(3, 6).length
                      : recent;
                    return recent > older + 0.3 ? "up" : recent < older - 0.3 ? "down" : "stable";
                  })()
                : "stable";
            const best = myFeedbacks.reduce((acc, f) => (f.rating > acc ? f.rating : acc), 0);
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Desempenho geral"
                className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
                onClick={() => setEvolModal(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
                >
                  <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
                  <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-4 pb-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#EAB308]" /> Desempenho Geral
                    </h2>
                    <button
                      onClick={() => setEvolModal(false)}
                      className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto space-y-4 no-scrollbar flex-1">
                    {myFeedbacks.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-400 font-bold">Nenhum feedback do professor ainda.</p>
                        <p className="text-zinc-600 text-sm mt-1">
                          Após as aulas, o professor enviará avaliações que aparecerão aqui.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Tier + Stats hero */}
                        <div
                          className="relative rounded-2xl overflow-hidden border p-5"
                          style={{
                            borderColor: `${tier.color}30`,
                            background: `linear-gradient(135deg,${tier.bg}08,transparent)`,
                          }}
                        >
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 0% 0%,${tier.bg}10,transparent 55%)` }}
                          />
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.5" />
                                <motion.circle
                                  cx="18"
                                  cy="18"
                                  r="15.9"
                                  fill="none"
                                  stroke={tier.color}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeDasharray="100"
                                  strokeDashoffset={100 - Math.min(100, (avgRating / 10) * 100)}
                                  initial={{ strokeDashoffset: 100 }}
                                  animate={{ strokeDashoffset: 100 - Math.min(100, (avgRating / 10) * 100) }}
                                  transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-xl font-black tabular-nums" style={{ color: tier.color }}>
                                  {avgRating ? avgRating.toFixed(1) : "—"}
                                </p>
                                <p className="text-[8px] text-zinc-500 font-bold">/ 10</p>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                  style={{
                                    color: tier.color,
                                    borderColor: `${tier.color}40`,
                                    background: `${tier.bg}12`,
                                  }}
                                >
                                  {tier.label}
                                </span>
                                {trend === "up" && (
                                  <span className="text-[10px] font-bold text-[#22C55E] flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" />Tendência de nota: alta
                                  </span>
                                )}
                                {trend === "down" && (
                                  <span className="text-[10px] font-bold text-[#EF4444] flex items-center gap-0.5">
                                    <TrendingDown className="w-3 h-3" />Tendência de nota: queda
                                  </span>
                                )}
                                {trend === "stable" && (
                                  <span className="text-[10px] font-bold text-zinc-400">Tendência de nota: estável</span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-white">{profile?.name?.split(" ")[0] || "Atleta"}</p>
                              <p className="text-[11px] text-zinc-500">
                                {myFeedbacks.length} avaliações · melhor nota{" "}
                                <span className="text-white font-bold">{best}</span>
                              </p>
                              <p className="text-[10px] text-zinc-600 mt-0.5">
                                Comparação entre média das 3 avaliações mais recentes vs. 3 anteriores.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* KPIs row */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Avaliações", value: myFeedbacks.length, color: "#EAB308", sub: "total" },
                            { label: "Melhor Nota", value: best, color: scoreColor(best), sub: "recorde pessoal" },
                            { label: "Frequência", value: `${frequency}%`, color: freqColor, sub: "presença" },
                          ].map((s, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                              <p className="text-xl font-black tabular-nums" style={{ color: s.color }}>
                                {s.value}
                              </p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{s.label}</p>
                              <p className="text-[9px] text-zinc-700">{s.sub}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                            Motor de avaliação composto
                          </p>
                          <div className="space-y-2">
                            {[
                              { label: "Disciplina", value: disciplineScore, color: "#22C55E" },
                              { label: "Performance técnica", value: performanceScore, color: "#EAB308" },
                              { label: "Confiança do professor", value: coachTrustScore, color: "#60A5FA" },
                            ].map((metric) => (
                              <div key={metric.label}>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[11px] text-zinc-400">{metric.label}</p>
                                  <p
                                    className="text-[11px] font-black tabular-nums"
                                    style={{ color: metric.color }}
                                  >
                                    {metric.value}
                                  </p>
                                </div>
                                <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{ duration: 0.9, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{
                                      background: `linear-gradient(to right, ${metric.color}88, ${metric.color})`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-2">
                            Este painel explica sua evolução por mérito técnico real, não apenas por presença.
                          </p>
                        </div>

                        {/* Chart */}
                        <EvolutionTrendPanel
                          idBase={evoChartIdModal}
                          chart={evolutionLineChart}
                          avgRating={avgRating}
                        />

                        {/* Latest professor notes */}
                        {myFeedbacks.some((f) => f.professorNote) && (
                          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                              Últimas observações do professor
                            </p>
                            <div className="space-y-2">
                              {myFeedbacks
                                .filter((f) => f.professorNote)
                                .slice(0, 3)
                                .map((fb) => (
                                  <div key={fb.id} className="flex gap-2.5">
                                    <div
                                      className="w-1 flex-shrink-0 rounded-full mt-0.5"
                                      style={{ background: scoreColor(fb.rating) }}
                                    />
                                    <div>
                                      <p className="text-xs text-zinc-300 leading-relaxed">"{fb.professorNote}"</p>
                                      <p className="text-[10px] text-zinc-600 mt-0.5">
                                        {new Date(fb.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                        })}{" "}
                                        · nota{" "}
                                        <span className="font-bold" style={{ color: scoreColor(fb.rating) }}>
                                          {fb.rating}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Session history */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 px-0.5">
                            Histórico de avaliações
                          </p>
                          {myFeedbacks.slice(0, 8).map((fb, i) => (
                            <motion.div
                              key={fb.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5"
                            >
                              <div className="min-w-0 flex items-center gap-2.5">
                                <div
                                  className="w-1.5 h-8 rounded-full flex-shrink-0"
                                  style={{ background: scoreColor(fb.rating) }}
                                />
                                <div>
                                  <p className="text-sm font-bold text-white truncate">{fb.trainingType}</p>
                                  <p className="text-[10px] text-zinc-500">
                                    {new Date(fb.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span
                                  className="text-lg font-black tabular-nums"
                                  style={{ color: scoreColor(fb.rating) }}
                                >
                                  {fb.rating}
                                </span>
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

      {/* ─── 6. Achievement track modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label={`Trilha ${activeTrack.label}`}
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex min-h-[100dvh] items-center justify-center p-5 py-10"
            onClick={() => setTrackModalId(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl text-left bg-[#070707] border backdrop-blur-2xl"
              style={{ borderColor: `${activeTrack.accent}35` }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%,${activeTrack.accent}22,transparent 56%)`,
                }}
              />
              <button
                onClick={() => setTrackModalId(null)}
                className="absolute top-4 right-4 z-20 p-1.5 text-zinc-600 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-full border"
                    style={{
                      color: activeTrack.accent,
                      borderColor: `${activeTrack.accent}44`,
                      background: `${activeTrack.accent}15`,
                    }}
                  >
                    trilha competitiva
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full border ${
                      activeTrack.unlocked
                        ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10"
                        : "text-zinc-500 border-zinc-700 bg-zinc-900/40"
                    }`}
                  >
                    {activeTrack.unlocked ? "desbloqueada" : "em progresso"}
                  </span>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className={activeTrack.unlocked ? "" : "opacity-50 grayscale"}>
                    <TrackGlyph
                      id={activeTrack.id}
                      accent={activeTrack.accent}
                      locked={!activeTrack.unlocked}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-white leading-tight">{activeTrack.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{activeTrack.desc}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Progresso da trilha</p>
                    <p className="text-xs font-black" style={{ color: activeTrack.accent }}>
                      {activeTrack.score}/100
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeTrack.progress}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg,${activeTrack.accent}70,${activeTrack.accent})`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    {activeTrack.unlocked
                      ? "Trilha concluída. Mantenha execução para preservar o nível."
                      : `Faltam ${activeTrack.missing} pontos para destravar.`}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Requisitos da trilha</p>
                  <div className="space-y-1.5">
                    {activeTrack.requirements.map((rule, idx) => (
                      <div key={`${activeTrack.id}-rule-${idx}`} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[9px] text-zinc-400">
                          {idx + 1}
                        </span>
                        <p className="text-[11px] text-zinc-300">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: `${activeTrack.accent}35`, background: `${activeTrack.accent}10` }}
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: activeTrack.accent }}
                  >
                    Próxima ação recomendada
                  </p>
                  <p className="text-[11px] text-zinc-200">{activeTrack.action}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 7. Stats detail modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {statsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Diagnóstico de métricas"
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setStatsModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
            >
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-4 pb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {statsModal === "aulas" && (
                    <>
                      <Trophy className="w-5 h-5 text-[#EAB308]" /> Carga Confirmada - Diagnóstico
                    </>
                  )}
                  {statsModal === "streak" && (
                    <>
                      <Radio className="w-5 h-5 text-[#EAB308]" /> Ritmo Competitivo - Diagnóstico
                    </>
                  )}
                  {statsModal === "freq" && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E]" /> Confiabilidade de Presença
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setStatsModal(null)}
                  className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 space-y-3">
                {statsModal === "aulas" && (
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
                        { label: "Total", value: completedCount, color: "#EAB308" },
                        { label: "Este Mês", value: completedFromLessons, color: "#22C55E" },
                        { label: "Meta Mensal", value: "16", color: "#8B5CF6" },
                      ].map((s, i) => (
                        <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-center">
                          <p className="text-2xl font-bold" style={{ color: s.color }}>
                            {s.value}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {attendedLessons.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{l.title}</p>
                          <p className="text-xs text-zinc-500">
                            {l.date.split("-").reverse().join("/")} · {l.startTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {statsModal === "streak" &&
                  (() => {
                    const allCompleted = myLessons
                      .filter((l) => l.status === "completed")
                      .sort((a, b) => b.date.localeCompare(a.date));
                    const last21 = allCompleted.slice(0, 21);
                    const milestones = [3, 5, 10, 15, 20, 30, 50, 100];
                    const nextM = milestones.find((m) => streak < m) ?? milestones[milestones.length - 1]!;
                    const prevM = milestones.filter((m) => m <= streak).pop() ?? 0;
                    const mPct = nextM === prevM ? 100 : Math.round(((streak - prevM) / (nextM - prevM)) * 100);
                    const now = new Date();
                    const monthLessons = myLessons.filter((l) => {
                      const d = new Date(l.date + "T12:00:00");
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                    const mAttended = monthLessons.filter((l) =>
                      l.presentStudents.includes(user?.id || ""),
                    ).length;
                    const mTotal = monthLessons.filter((l) => l.status === "completed").length;
                    const consPct = mTotal > 0 ? Math.round((mAttended / mTotal) * 100) : 0;
                    const consColor = consPct >= 80 ? "#22C55E" : consPct >= 60 ? "#EAB308" : "#EF4444";
                    return (
                      <>
                        {/* Hero */}
                        <div className="relative rounded-2xl overflow-hidden border border-[#EAB308]/20 bg-gradient-to-br from-[#EAB308]/[0.08] via-zinc-950 to-zinc-950 p-5 mb-1 text-center">
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: "radial-gradient(ellipse at 50% 0%,rgba(234,179,8,0.12),transparent 65%)",
                            }}
                          />
                          <div className="flex items-end justify-center gap-6 mb-3">
                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Atual</p>
                              <motion.p
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                className="text-6xl font-black text-white tabular-nums leading-none"
                              >
                                {streak}
                              </motion.p>
                              <p className="text-xs text-zinc-400 font-bold mt-1">treinos seguidos</p>
                            </div>
                            <div className="h-14 w-px bg-zinc-800" />
                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                                Recorde
                              </p>
                              <p className="text-4xl font-black text-[#EAB308] tabular-nums leading-none">
                                {Math.max(
                                  streak,
                                  completedCount > 0 ? Math.ceil(completedCount / 1.5) : 0,
                                )}
                              </p>
                              <p className="text-xs text-zinc-400 font-bold mt-1">melhor marca</p>
                            </div>
                          </div>
                          {streak === 0 ? (
                            <p className="text-xs text-zinc-500">
                              Compareça ao próximo treino para iniciar sua sequência.
                            </p>
                          ) : streak >= nextM ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308]" />
                              <p className="text-xs font-bold text-[#EAB308]">
                                Marco {streak} alcançado! Próximo: {nextM}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400">
                              Mais{" "}
                              <span className="text-white font-bold">{nextM - streak}</span> treinos para o marco de{" "}
                              <span className="text-[#EAB308] font-bold">{nextM}</span>
                            </p>
                          )}
                        </div>

                        {/* Milestone progress */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Próximo marco</p>
                            <p className="text-xs font-bold text-[#EAB308]">{mPct}%</p>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${mPct}%` }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-[#EAB308]/60 to-[#EAB308]"
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-zinc-600 font-bold">
                            <span>{prevM} treinos</span>
                            <span>Meta: {nextM} treinos</span>
                          </div>
                        </div>

                        {/* Calendar heat grid */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Últimos {last21.length} treinos
                            </p>
                            <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]/30 border border-[#22C55E]/50 inline-block" />
                              Presente
                              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800 border border-zinc-700 inline-block" />
                              Falta
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-1.5">
                            {last21.map((l) => {
                              const present = l.presentStudents.includes(user?.id || "");
                              const d = new Date(l.date + "T12:00:00");
                              const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                              return (
                                <div
                                  key={l.id}
                                  title={`${label} — ${present ? "Presente" : "Falta"}`}
                                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[9px] font-bold border transition-all ${
                                    present
                                      ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                                      : "bg-zinc-900 border-zinc-800 text-zinc-700"
                                  }`}
                                >
                                  {present ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <span>—</span>
                                  )}
                                  <span className="text-[8px] font-bold leading-none mt-0.5">
                                    {label.split("/")[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 space-y-1.5">
                            {last21.slice(0, 5).map((l) => {
                              const present = l.presentStudents.includes(user?.id || "");
                              const dateLabel = new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              });
                              return (
                                <div
                                  key={`streak-log-${l.id}`}
                                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/45 px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-200 truncate">{l.title}</p>
                                    <p className="text-[9px] text-zinc-600">
                                      {dateLabel} · {l.startTime}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                      present
                                        ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10"
                                        : "text-zinc-500 border-zinc-700 bg-zinc-900"
                                    }`}
                                  >
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
                            <p className="text-2xl font-black tabular-nums" style={{ color: consColor }}>
                              {consPct}%
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                              Consistência Mês
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">
                              {mAttended}/{mTotal} treinos
                            </p>
                          </div>
                          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-black text-white tabular-nums">{completedCount}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                              Total Treinos
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">histórico completo</p>
                          </div>
                        </div>

                        {/* Tactical diagnosis */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                            Diagnóstico tático da sequência
                          </p>
                          <div className="space-y-2">
                            {[
                              {
                                title: "Causa",
                                text:
                                  streak >= 5
                                    ? "Você está mantendo estímulo contínuo entre sessões."
                                    : "Intervalos longos entre sessões quebram adaptação técnica.",
                              },
                              {
                                title: "Impacto",
                                text:
                                  streak >= 5
                                    ? "Ganho de execução mais estável em saque, recepção e tempo de bola."
                                    : "Memória motora oscila e aumenta erro sob pressão.",
                              },
                              {
                                title: "Ação",
                                text:
                                  sessionsToBeatRecord === 0
                                    ? "Prioridade: defender recorde e manter janela semanal de treino."
                                    : `Prioridade: completar mais ${sessionsToBeatRecord} sessões para novo recorde.`,
                              },
                            ].map((row, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-[10px] leading-tight flex-shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-400 font-bold uppercase">
                                  {row.title}
                                </span>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">{row.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                {statsModal === "freq" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Causa</p>
                        <p className="text-[11px] text-zinc-300 mt-1">
                          {frequency >= 80
                            ? "Planejamento semanal está funcionando."
                            : "Ritmo semanal ainda irregular."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Impacto</p>
                        <p className="text-[11px] text-zinc-300 mt-1">
                          {frequency >= 80
                            ? "Maior previsibilidade de evolução técnica."
                            : "Feedback técnico não consolida com a mesma velocidade."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                        <p className="text-[9px] uppercase tracking-wider text-[#22C55E] font-bold">Ação</p>
                        <p className="text-[11px] text-zinc-100 mt-1">
                          {frequency >= 80
                            ? "Manter rotina de confirmação e check-in."
                            : "Definir presença mínima da semana com prof/admin."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
                          <motion.circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={freqColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="100"
                            strokeDashoffset={100 - frequency}
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - frequency }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-2xl font-bold text-white">{frequency}%</p>
                          <p className="text-[9px] text-zinc-500 font-bold">Frequência</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Mínimo", value: "60%", ok: frequency >= 60, color: "#EF4444" },
                        { label: "Meta", value: "80%", ok: frequency >= 80, color: "#EAB308" },
                        { label: "Elite", value: "90%+", ok: frequency >= 90, color: "#22C55E" },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border ${
                            s.ok ? "border-zinc-700 bg-zinc-900/60" : "border-zinc-800/40"
                          }`}
                        >
                          <p className="font-bold text-sm" style={{ color: s.ok ? s.color : "#52525b" }}>
                            {s.value}
                          </p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{s.label}</p>
                          {s.ok && <p className="text-[9px] text-[#22C55E] mt-0.5">✓ Atingido</p>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                      <p className="text-xs text-zinc-400">
                        Você compareceu a{" "}
                        <span className="text-white font-bold">{completedFromLessons} aulas</span> neste ciclo.
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

      {/* ─── 8. Daily motivational quote ─────────────────────────────────────── */}
      <AnimatePresence>
        {showDailyQuote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Frase motivacional do dia"
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/90 backdrop-blur-md flex min-h-[100dvh] items-center justify-center p-6 py-10"
            onClick={() => {
              wtLsSetString("daily_quote_date", new Date().toDateString());
              setShowDailyQuote(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#050505] border border-[#EAB308]/20"
            >
              {/* Animated radial aura */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-20"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(234,179,8,0.5), rgba(168,85,247,0.15), rgba(234,179,8,0.25), rgba(59,130,246,0.10), rgba(234,179,8,0.5))",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(234,179,8,0.15),transparent 60%)" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/40" />

              <div className="relative z-10 p-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#EAB308]">Frase do Dia</p>
                  </div>
                  <p className="text-[9px] text-zinc-600 font-bold">
                    {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </p>
                </div>

                {/* Decorative quote mark */}
                <p className="text-8xl font-black text-[#EAB308]/10 leading-none mb-0 -mb-6 select-none">"</p>

                {/* Quote */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold text-white leading-relaxed mb-6 mt-2"
                >
                  {dailyQuote.text}
                </motion.p>

                {/* Author */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 mb-7"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-[#EAB308]/30 to-transparent" />
                  <div className="text-right">
                    <p className="text-sm font-black text-[#EAB308]">{dailyQuote.author}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">{dailyQuote.role}</p>
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    wtLsSetString("daily_quote_date", new Date().toDateString());
                    setShowDailyQuote(false);
                    haptic([18, 12, 22]);
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-[#EAB308] via-[#F59E0B] to-[#EAB308] shadow-[0_0_24px_rgba(234,179,8,0.35)] tracking-wide"
                >
                  Vamos Treinar
                </motion.button>
                <p className="text-center text-[10px] text-zinc-700 mt-3 font-bold">
                  Toque para fechar · aparece uma vez ao dia
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 9. XP / Merit Score modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showXpModal &&
          (() => {
            const TIER_ALL = [
              { id: "tier-base", min: 0, label: "Base", color: "#6B7280" },
              { id: "tier-bronze", min: 35, label: "Bronze", color: "#CD7F32" },
              { id: "tier-silver", min: 50, label: "Prata", color: "#C0C0C0" },
              { id: "tier-gold", min: 65, label: "Ouro", color: "#EAB308" },
              { id: "tier-platinum", min: 78, label: "Platina", color: "#67E8F9" },
              { id: "tier-diamond", min: 88, label: "Diamante", color: "#60A5FA" },
              { id: "tier-legend", min: 96, label: "Lendário", color: "#A78BFA" },
            ];
            const tierProgressPct = nextTier
              ? Math.round(
                  Math.max(
                    0,
                    Math.min(
                      100,
                      ((meritScore - currentTier.min) / Math.max(1, nextTier.min - currentTier.min)) * 100,
                    ),
                  ),
                )
              : 100;
            const components = [
              {
                label: "Qualidade técnica",
                weight: "35%",
                value: Math.round(Math.min(100, avgRating * 10)),
                color: "#EAB308",
                tip: "Melhorando a nota média das avaliações do professor.",
              },
              {
                label: "Frequência",
                weight: "25%",
                value: frequency,
                color: "#22C55E",
                tip: "Comparecendo a mais treinos por semana.",
              },
              {
                label: "Presença acumulada",
                weight: "20%",
                value: Math.round(Math.min(100, completedCount * 3)),
                color: "#60A5FA",
                tip: "Cada aula completada conta para esse score.",
              },
              {
                label: "Sequência ativa",
                weight: "10%",
                value: Math.round(Math.min(100, streak * 8)),
                color: "#F97316",
                tip: "Não quebre sua sequência de presença.",
              },
              {
                label: "Consistência semanal",
                weight: "10%",
                value: weeklyConsistency,
                color: "#A78BFA",
                tip: "Treinar nos dias previstos a cada semana.",
              },
            ];
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Score de Mérito XP"
                className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
                onClick={() => setShowXpModal(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
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
                    <button
                      onClick={() => setShowXpModal(false)}
                      className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${FOCUS_RING_GOLD}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-4 no-scrollbar flex-1">
                    {/* Score hero */}
                    <div
                      className="relative rounded-2xl overflow-hidden border p-5 flex items-center gap-5"
                      style={{
                        borderColor: `${currentTier.color}30`,
                        background: `linear-gradient(135deg,${currentTier.color}08,transparent)`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(ellipse at 0% 0%,${currentTier.color}12,transparent 55%)`,
                        }}
                      />
                      <div className="relative flex-shrink-0">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.5" />
                          <motion.circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={currentTier.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="100"
                            strokeDashoffset={100 - meritScore}
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - meritScore }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.p
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                            className="text-2xl font-black tabular-nums"
                            style={{ color: currentTier.color }}
                          >
                            {meritScore}
                          </motion.p>
                          <p className="text-[9px] text-zinc-500 font-bold">/ 100</p>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5"
                          style={{
                            color: currentTier.color,
                            borderColor: `${currentTier.color}40`,
                            background: `${currentTier.color}12`,
                          }}
                        >
                          {currentTier.label}
                        </span>
                        <p className="text-sm font-bold text-white">{profile?.name?.split(" ")[0] || "Atleta"}</p>
                        {nextTier ? (
                          <>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              Faltam{" "}
                              <span className="font-bold" style={{ color: nextTier.color }}>
                                {nextTier.min - meritScore} pts
                              </span>{" "}
                              para {nextTier.label}
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tierProgressPct}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(to right, ${currentTier.color}80, ${nextTier.color})`,
                                }}
                              />
                            </div>
                            <p className="text-[9px] text-zinc-600 mt-1">
                              {tierProgressPct}% do caminho para {nextTier.label}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] text-[#A78BFA] font-bold mt-1">Tier máximo atingido!</p>
                        )}
                      </div>
                    </div>

                    {/* Tier progression */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                        Progressão de tiers
                      </p>
                      <div className="space-y-2">
                        {TIER_ALL.map((tier, i) => {
                          const isCurrentOrPast = meritScore >= tier.min;
                          const isCurrent = tier.id === currentTier.id;
                          const nextInList = TIER_ALL[i + 1];
                          return (
                            <div
                              key={tier.id}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                isCurrent ? "border-zinc-600 bg-zinc-900/60" : "border-zinc-800/40"
                              }`}
                            >
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ background: isCurrentOrPast ? tier.color : "#27272a" }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className="text-[11px] font-bold"
                                    style={{ color: isCurrentOrPast ? tier.color : "#52525b" }}
                                  >
                                    {tier.label}
                                  </p>
                                  {isCurrent && (
                                    <span
                                      className="text-[9px] font-black text-black px-1.5 py-0.5 rounded-full"
                                      style={{ background: tier.color }}
                                    >
                                      atual
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-zinc-600">
                                  {nextInList
                                    ? `${tier.min}–${nextInList.min - 1} pts`
                                    : `${tier.min}+ pts`}
                                </p>
                              </div>
                              {isCurrentOrPast && !isCurrent && (
                                <CheckCircle2
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: tier.color }}
                                />
                              )}
                              {isCurrent && (
                                <span
                                  className="text-[10px] font-black tabular-nums"
                                  style={{ color: tier.color }}
                                >
                                  {meritScore}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                        Como o score é calculado
                      </p>
                      <div className="space-y-3">
                        {components.map((c) => (
                          <div key={c.label}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] text-zinc-300">{c.label}</p>
                                <span className="text-[9px] font-bold text-zinc-600">({c.weight})</span>
                              </div>
                              <p className="text-[11px] font-black tabular-nums" style={{ color: c.color }}>
                                {c.value}
                              </p>
                            </div>
                            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${c.value}%` }}
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

                    {/* Next tier tip */}
                    {nextTier &&
                      (() => {
                        const weakest = [...components].sort(
                          (a, b) =>
                            (a.value / 100) * parseFloat(a.weight) -
                            (b.value / 100) * parseFloat(b.weight),
                        )[0]!;
                        return (
                          <div
                            className="rounded-2xl border p-4"
                            style={{ borderColor: `${nextTier.color}35`, background: `${nextTier.color}08` }}
                          >
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
                              style={{ color: nextTier.color }}
                            >
                              Como chegar ao tier {nextTier.label}
                            </p>
                            <p className="text-[11px] text-zinc-200 leading-relaxed">
                              Seu maior ganho vem de{" "}
                              <span className="font-bold" style={{ color: weakest.color }}>
                                {weakest.label.toLowerCase()}
                              </span>{" "}
                              — melhore esse componente para avançar mais rápido.
                            </p>
                            <p className="text-[9px] text-zinc-500 mt-1.5">{weakest.tip}</p>
                          </div>
                        );
                      })()}

                    {/* XP log */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5" /> Últimas conquistas
                      </p>
                      {xpLogEntries.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 text-center py-4">
                          Nenhuma conquista registrada ainda. Comece treinando!
                        </p>
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
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-900/40 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {icons[entry.type] || <Trophy className="w-3.5 h-3.5 text-zinc-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium text-zinc-300">
                                      {labels[entry.type] || entry.description}
                                    </p>
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

      {/* ─── 10. XP Float + Panel components ─────────────────────────────────── */}
      <XPFloatNotification events={xpFloatEvents} onAnimationComplete={removeXPFloat} />

      <StudentGamificationDashboard
        isOpen={showGamificationDashboard}
        onClose={() => setShowGamificationDashboard(false)}
      />

      <AnimatePresence>
        {showDailyChallenges && user?.id && (
          <DailyChallengesPanel studentId={user.id} onClose={() => setShowDailyChallenges(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentTwin && profile && (
          <AthleteTwinPanel
            student={profile}
            onClose={() => {
              setShowStudentTwin(false);
              if (user?.id) markTwinViewed(user.id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPillarPanel && <StudentPillarPanel onClose={() => setShowPillarPanel(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showMessagesPanel && crmStudentId && (
          <StudentMessagesPanel
            studentCrmId={crmStudentId}
            onClose={() => setShowMessagesPanel(false)}
            onUnreadCountChange={() => { void refreshCoachMessagesUnread(); }}
          />
        )}
      </AnimatePresence>

      {/* ─── 11. Achievement unlock share sheet ──────────────────────────────── */}
      <AnimatePresence>
        {justUnlockedTier &&
          (() => {
            const meta = TIER_META[justUnlockedTier];
            const shareProfile = students.find((s) => s.authUserId === user?.id || s.id === user?.id);
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
                  onClick={(e) => e.stopPropagation()}
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
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-1">
                      Conquista desbloqueada
                    </p>
                    <h2 className="text-2xl font-black text-white">
                      Card <span style={{ color: meta.color }}>{meta.label}</span>
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      {totalXP.toLocaleString("pt-BR")} XP acumulados na quadra
                    </p>
                  </div>

                  {/* Share composer */}
                  <div className="px-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      Compartilhar na Rede
                    </p>
                    <textarea
                      value={shareText}
                      onChange={(e) => setShareText(e.target.value)}
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
                          url: shareProfile?.id
                            ? `${window.location.origin}/atleta/${shareProfile.id}`
                            : window.location.origin,
                        };
                        if (navigator.share) {
                          try {
                            await navigator.share(sharePayload);
                          } catch {
                            /* dismissed */
                          }
                        } else {
                          await navigator.clipboard
                            .writeText(`${shareText}\n${sharePayload.url}`)
                            .catch(() => {});
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
                            avatar: shareProfile?.avatar || user?.avatar || "user",
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

      {/* ─── 12. Share Progress Card ─────────────────────────────────────────── */}
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
    </>
  );
}

export default StudentHomePrimaryModals;
