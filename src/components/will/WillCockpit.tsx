
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarPlus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  CreditCard,
  Dumbbell,
  MapPin,
  PlusCircle,
  Radio,
  RefreshCw,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Search,
  Newspaper,
  Users,
  WalletCards,
  X,
  Circle,
} from "lucide-react";
import type { StudentRole } from "@/context/types";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useCatalog } from "@/context/CatalogContext";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import AppEmptyState from "@/components/ui/AppEmptyState";
import AppSectionCard from "@/components/ui/AppSectionCard";
import KpiActionCard from "@/components/ui/KpiActionCard";
import CockpitHero from "./CockpitHero";
import OracleInsights from "./OracleInsights";
import CreateLessonModal from "@/components/CreateLessonModal";
import LessonRatingsSheet from "./LessonRatingsSheet";
import LiveLessonCoachPanel from "./LiveLessonCoachPanel";
import TrainingPlansPanel from "./TrainingPlansPanel";
import XPModerationPanel from "./XPModerationPanel";
import WeeklyCalendarGrid from "@/components/will/WeeklyCalendarGrid";
import KpiSparkline from "@/components/ui/KpiSparkline";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { localDateISO, getMonday, paymentReferenceForDate } from "@/lib/dateUtils";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import PushPermissionBanner from "@/components/PushPermissionBanner";
function currencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function maskPhone(phone?: string): string {
  if (!phone) return "Nao informado";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const visibleStart = digits.slice(0, 2);
  const visibleEnd = digits.slice(-2);
  return `(${visibleStart}) ****-${visibleEnd}`;
}

function hasValidPhone(phone?: string): boolean {
  if (!phone) return false;
  return phone.replace(/\D/g, "").length >= 10;
}

const haptic = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
};

const containerV = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
} as const;

const itemV = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
} as const;
const INTERACTIVE_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default function WillCockpit() {
  const router = useRouter();
  const { toast } = useToast();
  const { payments, pendingOrLatePaymentsCount, currentMonthReference, currentMonthBuckets } = usePayments();
  const { appConfig, cadastroPath, cadastroInviteUrl, generateEnrollmentInviteCode } = useAppConfig();
  const { categories, venues, getCategory } = useCatalog();
  const { user, isLive } = useAuth();
  const { lessons, todayLessons, todayEnrolledCount, updateLesson } = useLessons();
  const {
    students,
    statusCounts,
    approvalQueue,
    getStudent,
    approveStudent,
    updateStudent,
    seedPendingTuitionForStudent,
  } = useStudents();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const [showTrainingPlans, setShowTrainingPlans] = useState(false);
  const [showXPModeration, setShowXPModeration] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "trial">("all");
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedLessonLayoutId, setSelectedLessonLayoutId] = useState<string | null>(null);
  const [selectedStudentLayoutId, setSelectedStudentLayoutId] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState<null | "novo-aluno" | "nova-aula">(null);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [selectedBillingTemplate, setSelectedBillingTemplate] = useState<string | null>(null);
  const [approvalSearch, setApprovalSearch] = useState("");
  const [selectedApprovalRole, setSelectedApprovalRole] = useState<Map<string, StudentRole>>(new Map());
  const [onboardingStudentId, setOnboardingStudentId] = useState<string | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState({
    plan: "",
    monthlyValue: 0,
    paymentDay: 10,
    frequency: 2,
    notes: "",
    categoryIds: [] as string[],
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(localDateISO(new Date()));
  const [calendarWeekStart] = useState<Date>(getMonday(new Date()));

  useEffect(() => {
    if (!onboardingStudentId) return;
    const s = students.find((st) => st.id === onboardingStudentId);
    if (!s) {
      setOnboardingStudentId(null);
      return;
    }
    setOnboardingDraft({
      plan: s.plan || "mensal",
      monthlyValue: s.monthlyValue ?? 0,
      paymentDay: Math.min(28, Math.max(1, s.paymentDay ?? 10)),
      frequency: s.frequency ?? 2,
      notes: s.notes || "",
      categoryIds: [...(s.categories || [])],
    });
  }, [onboardingStudentId, students]);

  const isAnyModalOpen =
    showApprovalModal ||
    showFinancialModal ||
    showCourtModal ||
    showLessonModal ||
    showStudentModal ||
    showQuickActionModal !== null ||
    showCreateLesson ||
    showLivePanel ||
    showTrainingPlans ||
    showXPModeration ||
    onboardingStudentId !== null;
  useBodyScrollLock(isAnyModalOpen);

  const awaitingApproval = approvalQueue.length;
  const athletesToday = todayEnrolledCount;
  const pendingPaymentsCount = pendingOrLatePaymentsCount;

  const oracleCtx = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active");
    const now2 = new Date();
    const fourteenDaysAgo = new Date(now2.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentStudentIds = new Set(
      lessons
        .filter((l) => l.status !== "cancelled" && new Date(`${l.date}T00:00:00`) >= fourteenDaysAgo)
        .flatMap((l) => l.enrolledStudents),
    );
    const inactiveStudents = activeStudents.filter((s) => !recentStudentIds.has(s.id)).length;
    const lastMonthRef = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();
    const lastMonthRevenue = payments
      .filter((p) => p.status === "paid" && p.reference === lastMonthRef)
      .reduce((sum, p) => sum + p.amount, 0);
    const weekStart = new Date(now2);
    weekStart.setDate(now2.getDate() - now2.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekLessons = lessons.filter((l) => {
      if (l.status === "cancelled") return false;
      return new Date(`${l.date}T${l.startTime}:00`) >= weekStart;
    }).length;
    return {
      totalStudents: activeStudents.length,
      inactiveStudents,
      pendingPayments: pendingPaymentsCount,
      monthRevenue: currentMonthBuckets.paid,
      lastMonthRevenue,
      weekLessons,
      awaitingApproval,
      avgRating: null,
    };
  }, [students, payments, lessons, pendingPaymentsCount, currentMonthBuckets.paid, awaitingApproval]);

  const filteredApprovalQueue = useMemo(() => {
    const normalizedSearch = approvalSearch.trim().toLowerCase();
    const byFilter = approvalFilter === "all" ? approvalQueue : approvalQueue.filter((s) => s.status === approvalFilter);
    if (!normalizedSearch) return byFilter;
    return byFilter.filter((s) =>
      [s.name, s.email, s.phone, s.instagram]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [approvalFilter, approvalQueue, approvalSearch]);
  const approvalChecklistMap = useMemo(() => {
    return new Map(
      approvalQueue.map((student) => {
        const checks = {
          hasName: Boolean(student.name?.trim()),
          hasPhone: hasValidPhone(student.phone),
          hasContact: Boolean(student.email?.trim() || student.instagram?.trim()),
          hasAvatarIdentity: Boolean(student.avatar),
        };
        const isComplete = Object.values(checks).every(Boolean);
        return [student.id, { checks, isComplete }] as const;
      }),
    );
  }, [approvalQueue]);
  const allFilteredSelected =
    filteredApprovalQueue.length > 0 && filteredApprovalQueue.every((student) => selectedApprovalIds.includes(student.id));
  const selectedApprovalReadyCount = selectedApprovalIds.filter((id) => approvalChecklistMap.get(id)?.isComplete).length;
  const selectedApprovalBlockedCount = selectedApprovalIds.length - selectedApprovalReadyCount;
  const selectedLesson = useMemo(() => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null, [lessons, selectedLessonId]);
  const selectedStudent = useMemo(() => students.find((student) => student.id === selectedStudentId) ?? null, [selectedStudentId, students]);
  const billingWhatsappTemplates = useMemo(() => {
    const phoneRaw = appConfig.whatsappNumber || "";
    const phone = phoneRaw.replace(/\D/g, "");
    const safePhone = phone.length >= 10 ? (phone.startsWith("55") ? phone : `55${phone}`) : "";
    const baseUrl = `https://wa.me/${safePhone}`;
    const rows = [
      {
        id: "lembrete-pendente",
        label: "Lembrete pendente",
        text: "Ola! Passando para lembrar que seu pagamento esta pendente. No app, em Financeiro, use a chave PIX e registre o comprovante; se preferir, pode anexar o print aqui.",
      },
      {
        id: "alerta-inadimplencia",
        label: "Alerta de inadimplencia",
        text: "Ola! Identificamos mensalidade em atraso. Regularize em Financeiro no app (PIX + comprovante) ou me chame aqui com o print.",
      },
      {
        id: "negociacao",
        label: "Oferta de negociacao",
        text: "Ola! Caso precise, conseguimos ajustar a forma de pagamento desta competencia. Me chama aqui para fecharmos a melhor opcao.",
      },
    ];
    return rows.map((row) => ({
      ...row,
      href: `${baseUrl}?text=${encodeURIComponent(row.text)}`,
    }));
  }, [appConfig.whatsappNumber]);
  const canOpenBillingWhatsapp = useMemo(() => {
    const digits = (appConfig.whatsappNumber || "").replace(/\D/g, "");
    return digits.length >= 10;
  }, [appConfig.whatsappNumber]);
  const openOwnerStudentIntake = () => {
    haptic(18);
    setShowQuickActionModal(null);
    router.push(cadastroPath);
    setActionFeedback("Fluxo de cadastro de novo aluno aberto.");
  };
  const openCreateLessonFlow = () => {
    haptic(18);
    if (categories.length === 0 || venues.length === 0) {
      toast("Configure ao menos 1 categoria e 1 local antes de criar aula.", "error");
      router.push("/configuracoes");
      return;
    }
    setShowQuickActionModal(null);
    router.push("/agenda?newLesson=1");
    setActionFeedback("Formulário de nova aula aberto.");
  };

  const now = new Date();
  const todayISO = localDateISO(now);
  const todayDate = new Date(`${todayISO}T00:00:00`);
  const dayStart = new Date(todayDate);
  const dayEnd = new Date(todayDate);
  dayEnd.setHours(23, 59, 59, 999);

  const upcomingLessons = useMemo(() => {
    return lessons
      .filter((l) => l.status !== "completed" && l.status !== "cancelled")
      .map((l) => {
        const date = new Date(`${l.date}T${l.startTime}:00`);
        return { lesson: l, date };
      })
      .filter((item) => !Number.isNaN(item.date.getTime()) && item.date >= dayStart)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [dayStart, lessons]);

  const lessonsDay = useMemo(() => upcomingLessons.filter((item) => item.date >= dayStart && item.date <= dayEnd), [dayEnd, dayStart, upcomingLessons]);
  const lessonsDayTop3 = useMemo(() => lessonsDay.slice(0, 3), [lessonsDay]);
  const currentHour = now.getHours();
  const timeGreeting =
    currentHour >= 5 && currentHour < 12 ? "Bom dia" : currentHour >= 12 && currentHour < 18 ? "Boa tarde" : "Boa noite";

  // Sparkline data: last 6 months revenue
  const revenueSparkPoints = useMemo(() => {
    const months: Record<string, number> = {};
    payments.forEach((p) => {
      if (p.status === "paid") {
        const ref = p.reference; // "MAY/26" format
        months[ref] = (months[ref] ?? 0) + p.amount;
      }
    });
    // Generate last 6 months in chronological order
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const result: number[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const ref = paymentReferenceForDate(d);
      result.push(months[ref] ?? 0);
    }
    return result;
  }, [payments, now]);

  // Sparkline data: last 6 weeks active students (unique per week)
  const activeStudentsSparkPoints = useMemo(() => {
    const weekCounts: number[] = [];
    const sixWeeksAgo = new Date(now);
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - (6 * 7 - 7)); // 5 weeks back to get 6 weeks
    for (let w = 0; w < 6; w++) {
      const weekStart = new Date(sixWeeksAgo);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const active = new Set<string>();
      lessons.forEach((l) => {
        const lessonDate = new Date(`${l.date}T00:00:00`);
        if (lessonDate >= weekStart && lessonDate <= weekEnd) {
          l.enrolledStudents.forEach((sid) => active.add(sid));
        }
      });
      weekCounts.push(active.size);
    }
    return weekCounts;
  }, [lessons, now]);

  const handleCockpitResolver = () => {
    haptic(18);
    if (awaitingApproval > 0) {
      setApprovalFilter("all");
      setSelectedApprovalIds([]);
      setApprovalSearch("");
      setShowApprovalModal(true);
      return;
    }
    if (pendingPaymentsCount > 0) {
      setShowFinancialModal(true);
      return;
    }
    toast("Nada crítico na fila. Vamos para a agenda.");
    router.push("/agenda");
  };
  const resolverLabel = awaitingApproval > 0 || pendingPaymentsCount > 0 ? "Resolver primeiro gargalo" : "Tudo em dia";
   const resolverHint =
    awaitingApproval > 0
      ? `${awaitingApproval} cadastro${awaitingApproval > 1 ? "s" : ""} aguardando aprovação`
      : pendingPaymentsCount > 0
        ? `${pendingPaymentsCount} pagamento${pendingPaymentsCount > 1 ? "s" : ""} pendente${pendingPaymentsCount > 1 ? "s" : ""}`
        : "Sem pendências críticas. Priorize evolução e agenda.";
  const topDebtors = useMemo(() => {
    return payments
      .filter((p) => p.status === "late" || p.status === "pending")
      .sort((a, b) => {
        if (a.status === b.status) return b.amount - a.amount;
        if (a.status === "late") return -1;
        if (b.status === "late") return 1;
        return 0;
      })
      .slice(0, 3)
      .map((pay) => ({
        pay,
        student: getStudent(pay.studentId),
      }));
  }, [getStudent, payments]);

  if (!user) return null;
  // Bootstrap já é bloqueado pelo AuthWrapper (criticalDataLoading). Listas vazias = operação real (base nova), não "loading".

  return (
    <LayoutGroup id="cockpit-shared-layout">
    <PushPermissionBanner role={(user?.role === "coach" ? "professor" : "admin")} />
    <div className="relative isolate max-w-full min-w-0 space-y-5 overflow-x-hidden px-3 pb-12 pt-1 sm:px-4 md:px-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black" />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.28, 0.52, 0.28], scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-40 -top-44 -z-10 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.20) 0%, rgba(234,179,8,0) 68%)" }}
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-48 top-24 -z-10 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)" }}
      />

      <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-5">
      <CockpitHero
        variants={itemV}
        user={user}
        timeGreeting={timeGreeting}
        isLive={isLive}
        showPixWarning={Boolean(user.role && user.role !== "aluno" && !appConfig.pixKey?.trim())}
        onConfigurePix={() => {
          haptic(12);
          router.push("/configuracoes#recebimentos");
        }}
        awaitingApproval={awaitingApproval}
        pendingPaymentsCount={pendingPaymentsCount}
        todayLessonCount={todayLessons.length}
        athletesToday={athletesToday}
        resolverLabel={resolverLabel}
        resolverHint={resolverHint}
        onResolver={handleCockpitResolver}
      />

      <motion.div variants={itemV}>
        <div className="rounded-2xl border border-white/[0.06] bg-[#050505]/70 px-4 py-4 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <OracleInsights ctx={oracleCtx} />
        </div>
      </motion.div>

      <motion.div variants={itemV}>
        <Link
          href="/feed"
          onClick={() => haptic(12)}
          className={`flex items-center justify-between gap-3 rounded-2xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/12 via-black/40 to-black/60 px-4 py-3.5 shadow-[0_0_28px_rgba(234,179,8,0.08)] transition hover:border-yellow-400/55 hover:from-yellow-500/18 ${INTERACTIVE_FOCUS_RING}`}
          aria-label="Abrir A Rede para moderação"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-yellow-500/35 bg-yellow-500/10">
              <Newspaper className="h-5 w-5 text-[#EAB308]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-200/95">A Rede</p>
              <p className="truncate text-sm font-bold text-white">Moderar posts, comunicados e visibilidade</p>
              <p className="text-[11px] text-zinc-500">Você é o moderador oficial da comunidade.</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-yellow-400/90" />
        </Link>
      </motion.div>

      <motion.div variants={itemV}>
        <AppSectionCard
          title="Cadastro e grade"
          subtitle="Convide novos atletas e monte aulas com categoria, horário e matrícula na turma."
          rightSlot={<CalendarPlus className="h-4 w-4 text-[#EAB308]" />}
          className="relative overflow-hidden border-[#EAB308]/20 bg-[#050505]/85 backdrop-blur-2xl"
          contentClassName="pt-3"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_100%_at_0%_0%,rgba(234,179,8,0.12),transparent_55%)]" />
          <div className="relative grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/90 bg-black/50 p-4">
              <div className="flex items-center gap-2 text-[#EAB308]">
                <UserPlus className="h-5 w-5" />
                <p className="text-xs font-black uppercase tracking-wider">Novo aluno</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                Link com convite único (`?invite=`) para novos alunos. Gere outro código se o link vazar.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {cadastroInviteUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(cadastroInviteUrl);
                        haptic(12);
                        toast("Link de matrícula copiado.");
                      }}
                      className={`min-h-11 w-full rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 py-2.5 text-xs font-bold text-[#EAB308] transition hover:bg-[#EAB308]/18 ${INTERACTIVE_FOCUS_RING}`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Copiar link de matrícula
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        generateEnrollmentInviteCode();
                        haptic(12);
                        toast("Novo convite gerado. Compartilhe o link atualizado.");
                      }}
                      className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/90 bg-zinc-950/50 py-2 text-[11px] font-semibold text-zinc-400 transition hover:border-[#EAB308]/30 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Gerar novo código de convite
                    </button>
                  </>
                ) : null}
                <Link
                  href={cadastroPath}
                  onClick={() => haptic(10)}
                  className={`min-h-11 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-xs font-bold text-zinc-200 transition hover:border-[#EAB308]/35 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                >
                  Abrir cadastro de aluno
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800/90 bg-black/50 p-4">
              <div className="flex items-center gap-2 text-[#EAB308]">
                <CalendarPlus className="h-5 w-5" />
                <p className="text-xs font-black uppercase tracking-wider">Nova aula</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                Escolha categoria ({categories.length}), local ({venues.length}), horário e quem entra na turma.
              </p>
              <button
                type="button"
                onClick={() => {
                  haptic(15);
                  setShowCreateLesson(true);
                }}
                className={`mt-3 min-h-12 w-full rounded-xl border border-[#EAB308]/45 bg-gradient-to-r from-[#EAB308]/20 to-[#EAB308]/8 py-3 text-sm font-black text-[#EAB308] shadow-[0_0_24px_rgba(234,179,8,0.12)] transition hover:border-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
              >
                Montar aula na grade
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic(8);
                  router.push("/agenda");
                }}
                className={`mt-2 w-full py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 hover:text-zinc-300 ${INTERACTIVE_FOCUS_RING}`}
              >
                Ver agenda no calendário
              </button>
            </div>
          </div>
        </AppSectionCard>
      </motion.div>

      {/* Bloco 2: agenda semanal com grid interativo */}
      <motion.div variants={itemV}>
        <AppSectionCard
          title="Grade semanal"
          subtitle="Navegue semana a semana e veja todas as aulas agendadas."
          rightSlot={
            <button
              type="button"
              onClick={() => {
                haptic(12);
                router.push("/agenda");
              }}
              className={`min-h-11 shrink-0 px-2 text-[10px] font-bold text-[#EAB308] hover:underline ${INTERACTIVE_FOCUS_RING}`}
              aria-label="Abrir calendário completo na agenda"
            >
              Agenda completa
            </button>
          }
          className="relative overflow-hidden border-white/[0.08] bg-[#050505]/80 backdrop-blur-2xl"
          contentClassName="pt-3"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(59,130,246,0.14),transparent_65%)]" />
          <WeeklyCalendarGrid
            weekStart={calendarWeekStart}
            lessons={lessons}
            selectedDate={selectedCalendarDate}
            onSelectDate={(iso) => {
              haptic(12);
              setSelectedCalendarDate(iso);
            }}
            onSelectLesson={(lessonId) => {
              haptic(15);
              setSelectedLessonId(lessonId);
              setSelectedLessonLayoutId(`lesson-${lessonId}`);
              setShowLessonModal(true);
            }}
            onCreateLesson={() => {
              haptic(10);
              setShowCreateLesson(true);
            }}
            theme="admin"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => {
              haptic(12);
              setShowCourtModal(true);
            }}
            className={`min-h-11 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[#EAB308]/45 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir escalação de hoje com avatares"
          >
            Escalação com avatares
          </button>
          <button
            type="button"
            onClick={() => {
              haptic(12);
              router.push("/agenda");
            }}
            className={`min-h-11 inline-flex items-center gap-1 rounded-full border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#EAB308] transition hover:bg-[#EAB308]/18 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Ir para agenda"
          >
            Agenda
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          </div>
        </AppSectionCard>
      </motion.div>

      {/* Bloco 3: financeiro + aprovações */}
      <motion.div variants={itemV} className="grid gap-3 lg:grid-cols-2">
        <KpiActionCard
          accent="emerald"
          title="Saúde Financeira - Mês Atual"
          icon={WalletCards}
          onClick={() => setShowFinancialModal(true)}
          aria-label="Abrir painel financeiro e cobrança por WhatsApp"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">Recebido</p>
              <p className="text-lg font-black text-emerald-300 tabular-nums">{currencyBRL(currentMonthBuckets.paid)}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">A receber</p>
              <p className="text-lg font-black text-amber-300 tabular-nums">{currencyBRL(currentMonthBuckets.pending)}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">Inadimplentes</p>
              <p className="text-lg font-black text-red-300 tabular-nums">{currencyBRL(currentMonthBuckets.late)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-500">Toque para abrir cobrança tática por WhatsApp.</p>
            <span className="text-[10px] font-bold text-zinc-400">{currentMonthReference}</span>
          </div>
          <KpiSparkline points={revenueSparkPoints} accent="emerald" label="últimos 6 meses" animated />
        </KpiActionCard>

        <KpiActionCard
          accent="gold"
          title="Fila de Aprovação"
          icon={ShieldAlert}
          onClick={() => {
            setApprovalFilter("all");
            setSelectedApprovalIds([]);
            setApprovalSearch("");
            setShowApprovalModal(true);
          }}
          aria-label="Abrir fila de aprovação de cadastros"
        >
          <p className="text-[11px] text-zinc-500">Pendências de entrada para resolver agora</p>
          <p className="text-4xl font-black text-white tabular-nums">{awaitingApproval}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-bold text-[#EAB308]">
              <Users className="h-3 w-3" /> {statusCounts.trial} em experimental
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-300">
              <CreditCard className="h-3 w-3" /> {pendingPaymentsCount} pagamentos pendentes
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setApprovalFilter("trial");
                setSelectedApprovalIds([]);
                setApprovalSearch("");
                setShowApprovalModal(true);
              }}
              className="min-h-11 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[#EAB308]/45 hover:text-[#EAB308]"
            >
              Abrir fila de trial
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <KpiSparkline points={activeStudentsSparkPoints} accent="gold" label="atletas ativos 6 semanas" animated />
        </KpiActionCard>
      </motion.div>

      {/* Bloco 4: ações rápidas */}
      <motion.div variants={itemV}>
        <AppSectionCard
          title="Ações rápidas"
          subtitle="Atalhos operacionais para acelerar o dia."
          rightSlot={<Coins className="h-4 w-4 text-[#EAB308]" />}
          className="relative overflow-hidden border-white/[0.08] bg-[#050505]/80 backdrop-blur-2xl"
          contentClassName="pt-3"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(234,179,8,0.12),transparent_65%)]" />
          <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={cadastroPath}
            onClick={() => {
              haptic(20);
              setActionFeedback("Fluxo de cadastro de novo aluno aberto.");
            }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-gradient-to-r from-[#EAB308]/15 to-[#EAB308]/5 px-4 py-3 text-sm font-black text-[#EAB308] transition-all hover:border-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir fluxo rápido de cadastro de aluno"
          >
            <UserPlus className="h-5 w-5" />
            Novo Aluno
          </Link>
          <Link
            href="/agenda?newLesson=1"
            onClick={() => {
              haptic(20);
              setActionFeedback("Fluxo de criação de aula aberto.");
            }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition-all hover:border-white/30 hover:bg-white/10 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir fluxo rápido de nova aula"
          >
            <PlusCircle className="h-5 w-5 text-[#EAB308]" />
            Nova Aula
          </Link>
          <Link
            href="/feed"
            onClick={() => {
              haptic(20);
              setActionFeedback("A Rede aberta com moderação do dono.");
            }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-500/35 bg-yellow-500/10 px-4 py-3 text-sm font-black text-yellow-200 transition-all hover:border-yellow-400/60 hover:bg-yellow-500/15 sm:col-span-2 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir A Rede com moderação ativa"
          >
            <Newspaper className="h-5 w-5 text-[#EAB308]" />
            A Rede (Moderação Ativa)
          </Link>
          <button
            type="button"
            onClick={() => {
              haptic(20);
              setShowTrainingPlans(true);
            }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-200 transition-all hover:border-emerald-400/60 hover:bg-emerald-500/15 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir planos de treino"
          >
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            Planos de Treino
          </button>
          <button
            type="button"
            onClick={() => {
              haptic(20);
              setShowXPModeration(true);
            }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition-all hover:border-red-400/60 hover:bg-red-500/15 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Revisar transações de XP bloqueadas"
          >
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Moderar XP
          </button>
          </div>
        </AppSectionCard>
      </motion.div>
      </motion.div>

      <AnimatePresence>
        {showApprovalModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Modal de aprovação de alunos"
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/70`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => {
              setShowApprovalModal(false);
              setSelectedApprovalIds([]);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowApprovalModal(false);
                setSelectedApprovalIds([]);
              }
            }}
            tabIndex={-1}
          >
            <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between gap-3">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Fila de Aprovação</motion.p>
                  <h3 className="text-lg font-black text-white">Ação direta de cadastro e conversão</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE}
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedApprovalIds([]);
                  }}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200 transition hover:border-white/30"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>

              {cadastroInviteUrl ? (
                <div className="mb-3 shrink-0 rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#EAB308]">Convite de matrícula</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-zinc-300" title={cadastroInviteUrl}>
                    {cadastroInviteUrl}
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(cadastroInviteUrl);
                        haptic(12);
                        toast("Link copiado. Envie por WhatsApp ou e-mail.");
                      }}
                      className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#EAB308]/40 bg-black/40 py-2 text-xs font-bold text-[#EAB308] transition hover:bg-[#EAB308]/15 ${INTERACTIVE_FOCUS_RING}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        generateEnrollmentInviteCode();
                        haptic(10);
                        toast("Novo código. Use o link atualizado.");
                      }}
                      className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-[#EAB308]/35 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Novo código
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mb-3 shrink-0 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalFilter("all")}
                  className={`min-h-11 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                    approvalFilter === "all"
                      ? "border-[#EAB308]/45 bg-[#EAB308]/15 text-[#EAB308]"
                      : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/30"
                  }`}
                >
                  Todos ({approvalQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter("pending")}
                  className={`min-h-11 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                    approvalFilter === "pending"
                      ? "border-[#EAB308]/45 bg-[#EAB308]/15 text-[#EAB308]"
                      : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/30"
                  }`}
                >
                  Pendentes ({approvalQueue.filter((student) => student.status === "pending").length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter("trial")}
                  className={`min-h-11 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                    approvalFilter === "trial"
                      ? "border-[#EAB308]/45 bg-[#EAB308]/15 text-[#EAB308]"
                      : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/30"
                  }`}
                >
                  Trial ({approvalQueue.filter((student) => student.status === "trial").length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (allFilteredSelected) {
                      setSelectedApprovalIds((prev) =>
                        prev.filter((id) => !filteredApprovalQueue.some((student) => student.id === id)),
                      );
                      return;
                    }
                    setSelectedApprovalIds((prev) => {
                      const merged = new Set([...prev, ...filteredApprovalQueue.map((student) => student.id)]);
                      return Array.from(merged);
                    });
                  }}
                  className="min-h-11 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-200 transition hover:border-white/30"
                >
                  {allFilteredSelected ? "Desmarcar lista" : "Selecionar lista"}
                </button>
                <button
                  type="button"
                  disabled={selectedApprovalReadyCount === 0}
                  onClick={() => {
                    selectedApprovalIds.forEach((id) => {
                      if (approvalChecklistMap.get(id)?.isComplete) {
                        approveStudent(id);
                      }
                    });
                    setSelectedApprovalIds([]);
                  }}
                  className="min-h-11 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400/55 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Aprovar selecionados ({selectedApprovalReadyCount})
                </button>
              </div>
              <div className="mb-3 shrink-0">
                <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-2 focus-within:border-[#EAB308]/45">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    placeholder="Busca rapida por nome, email, telefone ou instagram"
                    className={`min-h-11 w-full bg-transparent text-[12px] text-zinc-100 outline-none placeholder:text-zinc-500 ${INTERACTIVE_FOCUS_RING}`}
                    aria-label="Busca rápida na fila de aprovação"
                  />
                  {approvalSearch ? (
                    <button
                      type="button"
                      onClick={() => setApprovalSearch("")}
                      className={`min-h-11 min-w-11 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-[10px] font-bold text-zinc-300 transition hover:border-white/25 ${INTERACTIVE_FOCUS_RING}`}
                      aria-label="Limpar busca da fila de aprovação"
                    >
                      Limpar
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 px-1 text-[10px] text-zinc-500">
                  {filteredApprovalQueue.length} resultado(s) encontrado(s) na fila atual
                </p>
              </div>
              {selectedApprovalBlockedCount > 0 ? (
                <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                  {selectedApprovalBlockedCount} selecionado(s) bloqueado(s) por checklist incompleto.
                </div>
              ) : null}

              <div className={`${MODAL_BODY_SCROLL} space-y-2`}>
                {filteredApprovalQueue.length === 0 ? (
                  <AppEmptyState
                    icon={approvalSearch ? Search : Users}
                    title={approvalSearch ? "Nenhum atleta encontrado" : "Fila limpa neste filtro"}
                    description={
                      approvalSearch
                        ? "Tente outro termo na busca ou limpe para ver todos os cadastros elegíveis."
                        : "Nenhum atleta pendente ou experimental para este filtro no momento."
                    }
                    actionLabel={approvalSearch ? "Limpar busca" : undefined}
                    onAction={approvalSearch ? () => setApprovalSearch("") : undefined}
                    className="border-emerald-500/35 bg-emerald-500/10 text-start"
                  />
                ) : (
                  filteredApprovalQueue.map((student) => {
                    const checklist = approvalChecklistMap.get(student.id);
                    const isReady = checklist?.isComplete ?? false;
                    return (
                    <motion.div key={student.id} layoutId={`student-card-approval-${student.id}`} className="rounded-xl border border-zinc-800/90 bg-black/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <UserAvatar name={student.name} photo={student.avatar} size="sm" />
                            <p className="truncate text-sm font-black text-zinc-100">{student.name}</p>
                          </div>
                          <label className="mb-2 inline-flex cursor-pointer items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#EAB308]"
                              checked={selectedApprovalIds.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApprovalIds((prev) => (prev.includes(student.id) ? prev : [...prev, student.id]));
                                  return;
                                }
                                setSelectedApprovalIds((prev) => prev.filter((id) => id !== student.id));
                              }}
                            />
                            Selecionar para lote
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            Status atual:{" "}
                            <span className="font-semibold text-zinc-300">
                              {student.status === "trial" ? "Experimental" : "Pendente"}
                            </span>{" "}
                            · objetivo semanal: {student.frequency}x por semana
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${
                            student.status === "trial"
                              ? "border-sky-500/35 bg-sky-500/10 text-sky-300"
                              : "border-[#EAB308]/35 bg-[#EAB308]/10 text-[#EAB308]"
                          }`}
                        >
                          {student.status === "trial" ? "TRIAL" : "PENDENTE"}
                        </span>
                      </div>

                      <div className="mt-2 rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAB308]">Identidade confirmada</p>
                        <div className="mt-2 flex items-center gap-2">
                          <UserAvatar name={student.name} photo={student.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-bold text-zinc-100">{student.name}</p>
                            <p className="truncate text-[10px] text-zinc-400">
                              {student.email || "Sem e-mail"} · {maskPhone(student.phone)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              checklist?.checks.hasName ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"
                            }`}
                          >
                            Nome: {checklist?.checks.hasName ? "ok" : "faltando"}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              checklist?.checks.hasPhone ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"
                            }`}
                          >
                            Telefone: {checklist?.checks.hasPhone ? "ok" : "incompleto"}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              checklist?.checks.hasContact ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"
                            }`}
                          >
                            Contato extra: {checklist?.checks.hasContact ? "ok" : "faltando"}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              checklist?.checks.hasAvatarIdentity ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-red-500/35 bg-red-500/10 text-red-200"
                            }`}
                          >
                            Avatar: {checklist?.checks.hasAvatarIdentity ? "ok" : "faltando"}
                          </span>
                        </div>
                      </div>
                      {!isReady ? (
                        <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-200">
                          Aprovacao bloqueada: complete os dados minimos antes de ativar o atleta.
                        </div>
                      ) : null}

                      {isReady && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Escolher papel</p>
                          <div className="flex gap-2">
                            {(['aluno', 'professor', 'visitor'] as const).map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  const newMap = new Map(selectedApprovalRole);
                                  newMap.set(student.id, role);
                                  setSelectedApprovalRole(newMap);
                                }}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition ${
                                  (selectedApprovalRole.get(student.id) || 'aluno') === role
                                    ? role === 'aluno'
                                      ? 'border-[#EAB308]/50 bg-[#EAB308]/20 text-[#EAB308]'
                                      : role === 'professor'
                                      ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                                      : 'border-zinc-500/50 bg-zinc-500/20 text-zinc-200'
                                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'
                                } border`}
                              >
                                {role === 'aluno' ? '🎯 Aluno' : role === 'professor' ? '🎓 Professor' : '👁️ Visitante'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 grid gap-2">
                        <button
                          type="button"
                          disabled={!isReady}
                          onClick={() => {
                            setOnboardingStudentId(student.id);
                          }}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#EAB308]/45 bg-[#EAB308]/12 px-3 py-2 text-xs font-bold text-[#EAB308] transition hover:bg-[#EAB308]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <UserCheck className="h-4 w-4" />
                          {isReady ? "Completar plano e aprovar" : "Complete o checklist primeiro"}
                        </button>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={!isReady}
                            onClick={() => {
                              const role = selectedApprovalRole.get(student.id) || 'aluno';
                              approveStudent(student.id, role);
                              setSelectedApprovalIds((prev) => prev.filter((id) => id !== student.id));
                              setSelectedApprovalRole((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(student.id);
                                return newMap;
                              });
                              setActionFeedback(`Atleta ${student.name} aprovado como ${role}.`);
                            }}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/55 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar rápido
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setSelectedStudentLayoutId(`student-card-approval-${student.id}`);
                              setShowStudentModal(true);
                            }}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-[#EAB308]/45 hover:text-[#EAB308]"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Ver ficha
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })
                )}
              </div>
              {actionFeedback ? (
                <div className="mt-3 shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
                  {actionFeedback}
                </div>
              ) : null}
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {onboardingStudentId ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Completar plano e aprovar aluno"
            className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/75`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => setOnboardingStudentId(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOnboardingStudentId(null);
            }}
            tabIndex={-1}
          >
            <div className={MODAL_OVERLAY_CENTER_WRAP}>
              <motion.section
                initial={{ opacity: 0, y: 36, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.98 }}
                transition={SPRING_PREMIUM}
                onClick={(e) => e.stopPropagation()}
                className={`my-auto w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
              >
                {(() => {
                  const obStudent = students.find((s) => s.id === onboardingStudentId);
                  if (!obStudent) return null;
                  return (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar name={obStudent.name} photo={obStudent.avatar} size="md" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#EAB308]">Ativar aluno</p>
                            <h3 className="truncate text-lg font-black text-white">{obStudent.name}</h3>
                            <p className="truncate text-[11px] text-zinc-500">{obStudent.email || maskPhone(obStudent.phone)}</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={PRESS_SCALE}
                          type="button"
                          onClick={() => setOnboardingStudentId(null)}
                          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200"
                          aria-label="Fechar"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                      <div className={`${MODAL_BODY_SCROLL} space-y-3 text-left`}>
                        <p className="text-[11px] leading-relaxed text-zinc-500">
                          Defina plano, mensalidade e frequência antes de liberar o app. Se a mensalidade for maior que zero, criamos automaticamente a cobrança{" "}
                          <strong className="text-zinc-400">pendente do mês atual</strong> no Financeiro (sem duplicar se já existir).
                        </p>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Nome do plano</span>
                          <input
                            type="text"
                            value={onboardingDraft.plan}
                            onChange={(e) => setOnboardingDraft((d) => ({ ...d, plan: e.target.value }))}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-[#EAB308]/45"
                            placeholder="Ex.: Grupo Mensal, VIP Performance…"
                          />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Mensalidade (R$)</span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={onboardingDraft.monthlyValue || ""}
                              onChange={(e) =>
                                setOnboardingDraft((d) => ({
                                  ...d,
                                  monthlyValue: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-[#EAB308]/45"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Dia do pagamento</span>
                            <input
                              type="number"
                              min={1}
                              max={28}
                              value={onboardingDraft.paymentDay}
                              onChange={(e) =>
                                setOnboardingDraft((d) => ({
                                  ...d,
                                  paymentDay: Math.min(28, Math.max(1, Math.round(Number(e.target.value)) || 10)),
                                }))
                              }
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-[#EAB308]/45"
                            />
                          </label>
                        </div>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Frequência (aulas por semana — referência operacional)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={14}
                            value={onboardingDraft.frequency}
                            onChange={(e) =>
                              setOnboardingDraft((d) => ({
                                ...d,
                                frequency: Math.max(0, Math.round(Number(e.target.value)) || 0),
                              }))
                            }
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-[#EAB308]/45"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Observações internas</span>
                          <textarea
                            value={onboardingDraft.notes}
                            onChange={(e) => setOnboardingDraft((d) => ({ ...d, notes: e.target.value }))}
                            rows={3}
                            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-[#EAB308]/45"
                            placeholder="Combinados com o atleta, vínculo com turma…"
                          />
                        </label>
                        {categories.length > 0 ? (
                          <div>
                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                              Modalidades / categorias
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {categories.map((c) => {
                                const on = onboardingDraft.categoryIds.includes(c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() =>
                                      setOnboardingDraft((d) => ({
                                        ...d,
                                        categoryIds: on
                                          ? d.categoryIds.filter((id) => id !== c.id)
                                          : [...d.categoryIds, c.id],
                                      }))
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                      on
                                        ? "border-[#EAB308]/50 bg-[#EAB308]/15 text-[#EAB308]"
                                        : "border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:border-zinc-600"
                                    }`}
                                  >
                                    <span className="mr-1">{c.emoji}</span>
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setOnboardingStudentId(null)}
                          className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-zinc-300 hover:border-white/25"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sid = onboardingStudentId;
                            if (!sid) return;
                            const mv = Math.max(0, Number(onboardingDraft.monthlyValue) || 0);
                            const pd = Math.min(28, Math.max(1, Math.round(Number(onboardingDraft.paymentDay)) || 10));
                            updateStudent(sid, {
                              status: "active",
                              plan: onboardingDraft.plan.trim() || "mensal",
                              monthlyValue: mv,
                              paymentDay: pd,
                              frequency: Math.max(0, Math.round(Number(onboardingDraft.frequency)) || 0),
                              notes: onboardingDraft.notes.trim(),
                              categories: onboardingDraft.categoryIds,
                            });
                            void seedPendingTuitionForStudent(sid, mv, pd);
                            setOnboardingStudentId(null);
                            setSelectedApprovalIds((prev) => prev.filter((id) => id !== sid));
                            setActionFeedback(`${obStudent.name} ativo com plano e valores definidos.`);
                            toast("Aluno aprovado com cadastro complementado.");
                            haptic(20);
                          }}
                          className="min-h-11 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25"
                        >
                          Confirmar e liberar acesso
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showFinancialModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Modal financeiro tático"
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/70`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowFinancialModal(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowFinancialModal(false);
            }}
            tabIndex={-1}
          >
            <div className={MODAL_OVERLAY_CENTER_WRAP}>
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-4 backdrop-blur-3xl sm:p-5 ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Financeiro Tático</motion.p>
                  <h3 className="text-lg font-black text-white">Painel financeiro do mes atual ({currentMonthReference})</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowFinancialModal(false)} className={`min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 ${INTERACTIVE_FOCUS_RING}`}>
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className={MODAL_BODY_SCROLL}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">Recebido (paid)</p>
                    <p className="text-xl font-black text-emerald-300">{currencyBRL(currentMonthBuckets.paid)}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">A receber (pending)</p>
                    <p className="text-xl font-black text-amber-300">{currencyBRL(currentMonthBuckets.pending)}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">Inadimplentes (late)</p>
                    <p className="text-xl font-black text-red-300">{currencyBRL(currentMonthBuckets.late)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/45 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAB308]">Cobrança assistida por WhatsApp</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Selecione um template e dispare a mensagem para o número oficial.</p>
                  <div className="mt-2 space-y-2">
                    {billingWhatsappTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          if (!canOpenBillingWhatsapp) {
                            toast("WhatsApp do financeiro nao configurado. Atualize em Configuracoes.", "error");
                            return;
                          }
                          setSelectedBillingTemplate(template.id);
                          if (typeof window !== "undefined") window.open(template.href, "_blank", "noopener,noreferrer");
                          toast(`Template "${template.label}" aberto no WhatsApp.`);
                        }}
                        disabled={!canOpenBillingWhatsapp}
                        className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-[11px] transition ${INTERACTIVE_FOCUS_RING} ${
                          selectedBillingTemplate === template.id
                            ? "border-[#EAB308]/45 bg-[#EAB308]/12 text-[#EAB308]"
                            : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25"
                        } ${!canOpenBillingWhatsapp ? "cursor-not-allowed opacity-60" : ""}`}
                        aria-label={`Enviar template ${template.label} por WhatsApp`}
                      >
                        <p className="font-bold">{template.label}</p>
                        <p className="text-zinc-500">Abrir conversa com texto pré-preenchido</p>
                      </button>
                    ))}
                  </div>
                  {topDebtors.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/45 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Pendências críticas</p>
                      <div className="mt-2 space-y-1.5">
                        {topDebtors.map(({ pay, student }) => (
                          <button
                            key={pay.id}
                            type="button"
                            onClick={() => {
                              setShowFinancialModal(false);
                              router.push("/financeiro");
                            }}
                            className={`flex min-h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-left text-[11px] text-zinc-300 transition hover:border-[#EAB308]/30 ${INTERACTIVE_FOCUS_RING}`}
                          >
                            <span className="min-w-0 truncate font-bold">
                              {student?.name ?? "Aluno"} · {pay.reference}
                            </span>
                            <span className={`shrink-0 font-black ${pay.status === "late" ? "text-red-300" : "text-amber-300"}`}>
                              {currencyBRL(pay.amount)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFinancialModal(false);
                          router.push("/financeiro");
                        }}
                        className={`mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-zinc-200 transition hover:border-[#EAB308]/35 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                      >
                        Ver todos no financeiro
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      haptic(20);
                      setShowFinancialModal(false);
                      router.push("/configuracoes#recebimentos");
                    }}
                    className={`mt-3 min-h-11 w-full rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/12 px-3 py-2 text-sm font-black text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                    aria-label="Cadastrar chave PIX e WhatsApp para os alunos pagarem"
                  >
                    Cadastrar chave PIX (recebimento)
                  </button>
                  <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                    Comprovante é só na área do aluno (Financeiro). Aqui você define a chave que aparece para ele pagar.
                  </p>
                  {cadastroInviteUrl ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Convite — link com código</p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-400">{cadastroInviteUrl}</p>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(cadastroInviteUrl);
                          haptic(12);
                          toast("Link de cadastro copiado.");
                        }}
                        className={`mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2 text-[11px] font-bold text-zinc-200 hover:border-[#EAB308]/40 hover:text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar link para novo aluno
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showCourtModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Modal de escalação de hoje"
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowCourtModal(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowCourtModal(false);
            }}
            tabIndex={-1}
          >
            <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Escalação de Hoje</motion.p>
                  <h3 className="text-lg font-black text-white">Ações de quadra e avaliação individual</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowCourtModal(false)} className={`min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 ${INTERACTIVE_FOCUS_RING}`}>
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className={`${MODAL_BODY_SCROLL} mt-4 space-y-4`}>
                {todayLessons.length === 0 ? (
                  <AppEmptyState
                    icon={MapPin}
                    title="Sem aulas para hoje"
                    description='Monte a escalação na agenda — use "Nova Aula" ou abra o calendário completo.'
                    actionLabel="Ir para agenda"
                    onAction={() => {
                      haptic(12);
                      setShowCourtModal(false);
                      router.push("/agenda");
                    }}
                    className="border-zinc-800/90 bg-black/45 text-start"
                  />
                ) : (
                  todayLessons.map((lesson) => (
                    <motion.button
                      key={lesson.id}
                      type="button"
                      whileHover={{ y: -2, borderColor: "rgba(234,179,8,0.35)" }}
                      whileTap={PRESS_SCALE}
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        setSelectedLessonLayoutId(`lesson-card-court-${lesson.id}`);
                        setShowLessonModal(true);
                      }}
                      layoutId={`lesson-card-court-${lesson.id}`}
                      className={`w-full rounded-xl border border-zinc-800/90 bg-black/45 p-3 text-left transition hover:border-[#EAB308]/35 ${INTERACTIVE_FOCUS_RING}`}
                    >
                      <p className="text-sm font-black text-zinc-100">{lesson.title}</p>
                      <p className="text-[11px] text-zinc-500">
                        {lesson.startTime} - {lesson.endTime} · {lesson.enrolledStudents.length}/{lesson.maxStudents} atletas
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {lesson.enrolledStudents.slice(0, 4).map((sid) => {
                          const athlete = getStudent(sid);
                          if (!athlete) return null;
                          return <UserAvatar key={`${lesson.id}-${sid}`} name={athlete.name} photo={athlete.avatar} size="sm" />;
                        })}
                        {lesson.enrolledStudents.length > 4 ? (
                          <span className="text-[10px] font-bold text-zinc-400">+{lesson.enrolledStudents.length - 4} atletas</span>
                        ) : null}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showLessonModal && selectedLesson ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Modal da aula ${selectedLesson.title}`}
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/75`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => {
              setShowLessonModal(false);
              setSelectedLessonLayoutId(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowLessonModal(false);
                setSelectedLessonLayoutId(null);
              }
            }}
            tabIndex={-1}
          >
            <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Aula e Avaliação Individual</motion.p>
                  <h3 className="text-lg font-black text-white">{selectedLesson.title}</h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedLesson.date.split("-").reverse().join("/")} · {selectedLesson.startTime} - {selectedLesson.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={PRESS_SCALE}
                    type="button"
                    onClick={() => {
                      setShowLivePanel(true);
                      setShowLessonModal(false);
                    }}
                    className={`min-h-11 min-w-11 rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/20 transition ${INTERACTIVE_FOCUS_RING}`}
                    title="Abrir painel ao vivo"
                  >
                    <Radio className="mx-auto h-4 w-4 text-[#EAB308]" />
                  </motion.button>
                  <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => {
                    setShowLessonModal(false);
                    setSelectedLessonLayoutId(null);
                  }} className={`min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 ${INTERACTIVE_FOCUS_RING}`}>
                    <X className="mx-auto h-4 w-4 text-zinc-200" />
                  </motion.button>
                </div>
              </motion.div>
              <div className={`${MODAL_BODY_SCROLL} flex min-h-0 flex-col`}>
                <LessonRatingsSheet 
                  lesson={selectedLesson} 
                  onSave={() => {
                    setActionFeedback(`Avaliação da aula "${selectedLesson.title}" salva no cofre de performance.`);
                    setShowLessonModal(false);
                    setSelectedLessonLayoutId(null);
                  }} 
                />
              </div>
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentModal && selectedStudent ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label={`Ficha do atleta ${selectedStudent.name}`}
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => {
              setShowStudentModal(false);
              setSelectedStudentLayoutId(null);
            }}
          >
            <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
            <motion.section
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Ficha do Atleta</motion.p>
                  <h3 className="text-lg font-black text-white">{selectedStudent.name}</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => {
                  setShowStudentModal(false);
                  setSelectedStudentLayoutId(null);
                }} className={`min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 ${INTERACTIVE_FOCUS_RING}`}>
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className={`${MODAL_BODY_SCROLL} mt-1 space-y-4 text-[12px] text-zinc-300`}>
                <div className="rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAB308]">Identidade visual ativa</p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserAvatar name={selectedStudent.name} photo={selectedStudent.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold text-zinc-100">{selectedStudent.name}</p>
                      <p className="truncate text-[10px] text-zinc-400">
                        {selectedStudent.email || "Sem e-mail"} · {maskPhone(selectedStudent.phone)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3">Plano: {selectedStudent.plan}</div>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3">Frequencia alvo: {selectedStudent.frequency}x semana</div>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3">Status: {selectedStudent.status}</div>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3">Contato: {selectedStudent.phone} · {selectedStudent.email}</div>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3">Observacoes: {selectedStudent.notes || "Sem observacoes"}</div>
              </div>
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickActionModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Ações rápidas do cockpit"
            className={`fixed inset-0 z-[220] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/75`}
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowQuickActionModal(null)}
          >
            <div className={MODAL_OVERLAY_CENTER_WRAP}>
            <motion.section
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-4 backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 shrink-0 flex items-center justify-between">
                <h3 className="text-lg font-black text-white">
                  {showQuickActionModal === "novo-aluno" ? "Pré-cadastro rápido de atleta" : "Criar aula rápida"}
                </h3>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowQuickActionModal(null)} className={`min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 ${INTERACTIVE_FOCUS_RING}`}>
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className={`${MODAL_BODY_SCROLL} space-y-2`}>
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3 text-[12px] text-zinc-300">
                  {showQuickActionModal === "novo-aluno"
                    ? "Fluxo interno: validar dados, classificar trial/pending e enviar para fila de aprovação sem sair do cockpit."
                    : "Fluxo interno: definir horário, categoria e turma com confirmação rápida para operação do dia."}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showQuickActionModal === "novo-aluno") {
                      openOwnerStudentIntake();
                    } else {
                      openCreateLessonFlow();
                    }
                  }}
                  className={`min-h-11 w-full rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/12 px-3 py-2 text-sm font-black text-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
                >
                  {showQuickActionModal === "novo-aluno" ? "Abrir cadastro de aluno" : "Abrir montagem de aula"}
                </button>
              </div>
            </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CreateLessonModal isOpen={showCreateLesson} onClose={() => setShowCreateLesson(false)} defaultDate={localDateISO()} />

      <AnimatePresence>
        {showLivePanel && selectedLesson ? (
          <LiveLessonCoachPanel
            lesson={selectedLesson}
            students={students}
            onClose={() => setShowLivePanel(false)}
            onEndClass={() => {
              setShowLivePanel(false);
              setActionFeedback(`Aula "${selectedLesson.title}" encerrada.`);
              updateLesson(selectedLesson.id, { status: "completed" });
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showTrainingPlans ? (
          <TrainingPlansPanel
            plans={[] as any[]}
            students={students}
            onClose={() => setShowTrainingPlans(false)}
            onSelectPlan={(plan) => {
              setActionFeedback(`Plano de treino "${plan.title}" selecionado.`);
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showXPModeration ? (
          <XPModerationPanel
            onClose={() => setShowXPModeration(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
    </LayoutGroup>
  );
}

