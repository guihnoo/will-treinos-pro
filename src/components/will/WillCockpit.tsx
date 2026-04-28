
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  MapPin,
  PlusCircle,
  UserPlus,
  ShieldAlert,
  Search,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import WeatherWidget from "@/components/WeatherWidget";
import { GoldVolleyballBadge } from "@/components/ui/WillPremiumAssets";
import UserAvatar from "@/components/ui/UserAvatar";
import LessonRatingsSheet from "./LessonRatingsSheet";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import { localDateISO, paymentReferenceForDate } from "@/lib/dateUtils";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
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
  const { payments, students, lessons, todayLessons, user, getCategory, getStudent, approveStudent, appConfig } = useApp();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "trial">("all");
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedLessonLayoutId, setSelectedLessonLayoutId] = useState<string | null>(null);
  const [selectedStudentLayoutId, setSelectedStudentLayoutId] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState<null | "novo-aluno" | "nova-aula">(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [selectedBillingTemplate, setSelectedBillingTemplate] = useState<string | null>(null);
  const [approvalSearch, setApprovalSearch] = useState("");

  const isAnyModalOpen =
    showApprovalModal ||
    showFinancialModal ||
    showCourtModal ||
    showLessonModal ||
    showStudentModal ||
    showQuickActionModal !== null;
  useBodyScrollLock(isAnyModalOpen);

  const currentMonthReference = useMemo(() => paymentReferenceForDate(), []);
  const financialBuckets = useMemo(() => {
    const monthPayments = payments.filter((p) => p.reference === currentMonthReference);
    const paid = monthPayments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
    const pending = monthPayments.filter((p) => p.status === "pending").reduce((acc, p) => acc + p.amount, 0);
    const late = monthPayments.filter((p) => p.status === "late").reduce((acc, p) => acc + p.amount, 0);
    return { paid, pending, late };
  }, [payments, currentMonthReference]);

  const awaitingApproval = students.filter((s) => s.status === "pending" || s.status === "trial").length;
  const athletesToday = todayLessons.reduce((acc, l) => acc + l.enrolledStudents.length, 0);
  const pendingPaymentsCount = payments.filter((p) => p.status === "pending" || p.status === "late").length;
  const approvalQueue = useMemo(
    () => students.filter((s) => s.status === "pending" || s.status === "trial"),
    [students],
  );
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
  const shouldShowSkeleton = payments.length === 0 && students.length === 0 && lessons.length === 0;
  if (shouldShowSkeleton) {
    return (
      <div className="space-y-4">
        <SkeletonLoader className="h-28" lines={4} />
        <SkeletonLoader className="h-36" lines={5} />
        <div className="grid gap-3 lg:grid-cols-2">
          <SkeletonLoader className="h-40" lines={4} />
          <SkeletonLoader className="h-40" lines={4} />
        </div>
      </div>
    );
  }

  return (
    <LayoutGroup id="cockpit-shared-layout">
    <motion.div variants={containerV} initial="hidden" animate="visible" className="relative isolate space-y-5 overflow-x-hidden pb-12">
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

      <motion.section
        variants={itemV}
        className="relative min-h-[240px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#050505]/80 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.75)] ring-1 ring-[#EAB308]/20 backdrop-blur-3xl sm:p-6"
      >
        <Image
          src="/assets/premium_dashboard_header.png"
          alt="Premium Background"
          fill
          className="absolute inset-0 -z-10 object-cover opacity-50 pointer-events-none"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(5,5,5,0.95))",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#EAB308]/50 to-transparent" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 backdrop-blur-xl shadow-inner">
                <WeatherWidget compact />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-1.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#EAB308]">WILL Cockpit</p>
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl drop-shadow-lg">Centro de Comando</h1>
            <p className="mt-2 text-sm text-zinc-400 font-medium">
              Resumo do que importa hoje — aprofunde nos modais ou na agenda completa.
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden sm:block">
              <GoldVolleyballBadge />
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#050505]/60 px-4 py-3 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              <UserAvatar name={user.name} photo={user.avatar} size="md" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#EAB308]">Comando Ativo</p>
                <p className="truncate text-sm font-black text-white">
                  {timeGreeting}, {user.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 space-y-3 border-t border-white/[0.08] pt-5">
          {user.role && user.role !== "aluno" && !appConfig.pixKey?.trim() ? (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-3 py-2.5 text-[11px] leading-snug text-amber-100">
              <span className="font-black text-amber-400">PIX </span>
              Chave ainda não cadastrada — alunos não veem dados para pagar.{" "}
              <button
                type="button"
                onClick={() => {
                  haptic(12);
                  router.push("/configuracoes#recebimentos");
                }}
                className="font-black text-[#EAB308] underline underline-offset-2 decoration-[#EAB308]/50"
              >
                Configurar recebimentos
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Cadastros</p>
              <p className="text-xl font-black tabular-nums text-[#EAB308]">{awaitingApproval}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Pagamentos</p>
              <p className="text-xl font-black tabular-nums text-amber-300">{pendingPaymentsCount}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Quadra hoje</p>
              <p className="text-xl font-black tabular-nums text-white">{todayLessons.length}</p>
              <p className="text-[9px] font-bold text-zinc-500">{athletesToday} atletas</p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={PRESS_SCALE}
            onClick={handleCockpitResolver}
            className={`flex min-h-12 w-full items-center justify-center rounded-xl border border-[#EAB308]/45 bg-[#EAB308]/12 px-4 text-sm font-black text-[#EAB308] transition hover:bg-[#EAB308]/18 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Resolver primeiro gargalo: aprovações ou financeiro"
          >
            {resolverLabel}
          </motion.button>
        </div>
      </motion.section>

      {/* Bloco 2: agenda operacional compacta (home) */}
      <motion.section variants={itemV} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505]/80 p-4 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(59,130,246,0.14),transparent_65%)]" />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#EAB308]" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Próximas na quadra (hoje)</p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic(12);
              router.push("/agenda");
            }}
            className={`min-h-11 shrink-0 px-2 text-[10px] font-bold text-[#EAB308] hover:underline ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir calendário completo na agenda"
          >
            Calendário completo
          </button>
        </div>
        <div className="space-y-2">
          {lessonsDay.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/90 bg-black/45 px-3 py-2 text-[12px] text-zinc-400" role="status" aria-live="polite">
              Nenhuma aula para hoje.
            </div>
          ) : null}
          {lessonsDayTop3.map((item, i) => {
            const lesson = item.lesson;
            const category = getCategory(lesson.categoryId);
            const startHour = Number(lesson.startTime.split(":")[0] ?? "0");
            const endHour = Number(lesson.endTime.split(":")[0] ?? "0");
            const inCurrentHour = currentHour >= startHour && currentHour <= endHour;
            return (
              <motion.button
                key={`day-${lesson.id}`}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                onClick={() => {
                  haptic(15);
                  setSelectedLessonId(lesson.id);
                  setSelectedLessonLayoutId(`lesson-card-day-${lesson.id}`);
                  setShowLessonModal(true);
                }}
                layoutId={`lesson-card-day-${lesson.id}`}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition hover:border-[#EAB308]/35 ${
                  inCurrentHour ? "border-[#EAB308]/45 bg-[#EAB308]/10" : "border-zinc-800/90 bg-black/45"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[12px] font-bold text-zinc-200">{lesson.title}</p>
                  <span className="whitespace-nowrap text-[10px] font-bold text-zinc-400">{lesson.startTime}</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                  {category?.name ?? "Sessão"} · {lesson.enrolledStudents.length}/{lesson.maxStudents} atletas
                </p>
                {inCurrentHour ? (
                  <span className="mt-1.5 inline-flex rounded-full border border-[#EAB308]/35 bg-[#EAB308]/10 px-2 py-0.5 text-[10px] font-bold text-[#EAB308]">
                    Em andamento agora
                  </span>
                ) : null}
              </motion.button>
            );
          })}
          {lessonsDay.length > lessonsDayTop3.length ? (
            <p className="text-center text-[10px] text-zinc-500" aria-live="polite">
              +{lessonsDay.length - lessonsDayTop3.length} aula{lessonsDay.length - lessonsDayTop3.length > 1 ? "s" : ""} hoje — ver na agenda
            </p>
          ) : null}
        </div>
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
      </motion.section>

      {/* Bloco 3: financeiro + aprovações */}
      <motion.div variants={itemV} className="grid gap-3 lg:grid-cols-2">
        <motion.article
          whileHover={{
            y: -4,
            scale: 1.01,
            borderColor: "rgba(34,197,94,0.45)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.58), 0 0 0 1px rgba(34,197,94,0.18), 0 0 32px rgba(34,197,94,0.15)",
          }}
          whileTap={PRESS_SCALE}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#050505]/80 p-4 backdrop-blur-2xl transition-colors hover:bg-[#0a0a0a] min-h-[176px]"
          onClick={() => setShowFinancialModal(true)}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,197,94,0.19),transparent_58%)] opacity-80" />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Saúde Financeira - Mês Atual</p>
            <WalletCards className="h-4 w-4 text-[#EAB308]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">Recebido</p>
              <p className="text-lg font-black text-emerald-300 tabular-nums">{currencyBRL(financialBuckets.paid)}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">A receber</p>
              <p className="text-lg font-black text-amber-300 tabular-nums">{currencyBRL(financialBuckets.pending)}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5">
              <p className="text-[10px] text-zinc-300">Inadimplentes</p>
              <p className="text-lg font-black text-red-300 tabular-nums">{currencyBRL(financialBuckets.late)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-500">Toque para abrir cobrança tática por WhatsApp.</p>
            <span className="text-[10px] font-bold text-zinc-400">{currentMonthReference}</span>
          </div>
        </motion.article>

        <motion.article
          whileHover={{
            y: -4,
            scale: 1.01,
            borderColor: "rgba(234,179,8,0.45)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.58), 0 0 0 1px rgba(234,179,8,0.14), 0 0 32px rgba(234,179,8,0.14)",
          }}
          whileTap={PRESS_SCALE}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#050505]/80 p-4 backdrop-blur-2xl transition-colors hover:bg-[#0a0a0a] min-h-[176px]"
          onClick={() => {
            setApprovalFilter("all");
            setSelectedApprovalIds([]);
            setApprovalSearch("");
            setShowApprovalModal(true);
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(234,179,8,0.16),transparent_56%)] opacity-80" />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Fila de Aprovação</p>
            <ShieldAlert className="h-4 w-4 text-[#EAB308]" />
          </div>
          <p className="text-[11px] text-zinc-500">Pendências de entrada para resolver agora</p>
          <p className="text-4xl font-black text-white tabular-nums">{awaitingApproval}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-bold text-[#EAB308]">
              <Users className="h-3 w-3" /> {students.filter((s) => s.status === "trial").length} em experimental
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
        </motion.article>
      </motion.div>

      {/* Bloco 4: ações rápidas */}
      <motion.section variants={itemV} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505]/80 p-4 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,rgba(234,179,8,0.12),transparent_65%)]" />
        <div className="mb-2 flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#EAB308]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ações rápidas</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mt-2">
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(234,179,8,0.2)" }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => { haptic(20); router.push("/alunos"); }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-gradient-to-r from-[#EAB308]/15 to-[#EAB308]/5 px-4 py-3 text-sm font-black text-[#EAB308] transition-all hover:border-[#EAB308] ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir fluxo rápido de novo aluno"
          >
            <UserPlus className="h-5 w-5" />
            Novo Aluno
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => { haptic(20); router.push("/agenda"); }}
            className={`min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition-all hover:border-white/30 hover:bg-white/10 ${INTERACTIVE_FOCUS_RING}`}
            aria-label="Abrir fluxo rápido de nova aula"
          >
            <PlusCircle className="h-5 w-5 text-[#EAB308]" />
            Nova Aula
          </motion.button>
        </div>
      </motion.section>

      <AnimatePresence>
        {showApprovalModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Modal de aprovação de alunos"
            className="fixed inset-0 z-[70] flex items-end justify-center overflow-hidden bg-black/70 p-3 sm:items-center sm:p-6"
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
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto my-4 w-full max-w-2xl transform overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 text-left shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between gap-3">
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

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]">
                {filteredApprovalQueue.length === 0 ? (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-[12px] text-emerald-200" role="status" aria-live="polite">
                    {approvalSearch
                      ? "Nenhum atleta encontrado para essa busca. Tente outro termo."
                      : "Nenhum atleta para esse filtro. Operação limpa para hoje."}
                    {approvalSearch ? (
                      <button
                        type="button"
                        onClick={() => setApprovalSearch("")}
                        className="mt-2 min-h-11 w-full rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-100"
                      >
                        Limpar busca
                      </button>
                    ) : null}
                  </div>
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

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={!isReady}
                          onClick={() => {
                            approveStudent(student.id);
                            setSelectedApprovalIds((prev) => prev.filter((id) => id !== student.id));
                            setActionFeedback(`Atleta ${student.name} aprovado com sucesso.`);
                          }}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/55 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isReady ? "Aprovar atleta" : "Checklist pendente"}
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
                          Ver ficha no cockpit
                        </button>
                      </div>
                    </motion.div>
                    );
                  })
                )}
              </div>
              {actionFeedback ? (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
                  {actionFeedback}
                </div>
              ) : null}
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
            className="fixed inset-0 z-[70] flex items-end justify-center overflow-hidden bg-black/70 p-3 sm:items-center sm:p-6"
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowFinancialModal(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowFinancialModal(false);
            }}
            tabIndex={-1}
          >
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="my-2 flex h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-4 backdrop-blur-3xl sm:h-auto sm:max-h-[calc(100dvh-1.5rem)] sm:p-5"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Financeiro Tático</motion.p>
                  <h3 className="text-lg font-black text-white">Painel financeiro do mes atual ({currentMonthReference})</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowFinancialModal(false)} className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5">
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">Recebido (paid)</p>
                    <p className="text-xl font-black text-emerald-300">{currencyBRL(financialBuckets.paid)}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">A receber (pending)</p>
                    <p className="text-xl font-black text-amber-300">{currencyBRL(financialBuckets.pending)}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-[10px] text-zinc-300">Inadimplentes (late)</p>
                    <p className="text-xl font-black text-red-300">{currencyBRL(financialBuckets.late)}</p>
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
                        className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-[11px] transition ${
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
                            className="flex min-h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-left text-[11px] text-zinc-300 transition hover:border-[#EAB308]/30"
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
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showCourtModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Modal de escalação de hoje"
            className="fixed inset-0 z-[70] overflow-y-auto overscroll-y-contain bg-black/80"
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowCourtModal(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowCourtModal(false);
            }}
            tabIndex={-1}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="my-4 w-full max-w-2xl transform overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 text-left shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Escalação de Hoje</motion.p>
                  <h3 className="text-lg font-black text-white">Ações de quadra e avaliação individual</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowCourtModal(false)} className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5">
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className="mt-4 space-y-4">
                {todayLessons.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800/90 bg-black/45 px-3 py-2 text-[12px] text-zinc-400">
                    Sem aulas para hoje. Use "Nova Aula" para montar a escalação com um toque.
                  </div>
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
                      className="w-full rounded-xl border border-zinc-800/90 bg-black/45 p-3 text-left transition hover:border-[#EAB308]/35"
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
            className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-black/75 p-3 sm:items-center sm:p-6"
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
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="my-4 w-full max-w-2xl transform overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 text-left shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Aula e Avaliação Individual</motion.p>
                  <h3 className="text-lg font-black text-white">{selectedLesson.title}</h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedLesson.date.split("-").reverse().join("/")} · {selectedLesson.startTime} - {selectedLesson.endTime}
                  </p>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => {
                  setShowLessonModal(false);
                  setSelectedLessonLayoutId(null);
                }} className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5">
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]">
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
            className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/80"
            {...MODAL_OVERLAY_FADE}
            onClick={() => {
              setShowStudentModal(false);
              setSelectedStudentLayoutId(null);
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <motion.section
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="my-4 w-full max-w-xl transform overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 text-left shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between">
                <div>
                  <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Ficha do Atleta</motion.p>
                  <h3 className="text-lg font-black text-white">{selectedStudent.name}</h3>
                </div>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => {
                  setShowStudentModal(false);
                  setSelectedStudentLayoutId(null);
                }} className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5">
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className="mt-4 space-y-4 text-[12px] text-zinc-300">
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
            className="fixed inset-0 z-[85] flex items-end justify-center overflow-hidden bg-black/75 p-3 sm:items-center sm:p-6"
            {...MODAL_OVERLAY_FADE}
            onClick={() => setShowQuickActionModal(null)}
          >
            <motion.section
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={SPRING_PREMIUM}
              onClick={(e) => e.stopPropagation()}
              className="my-2 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-4 backdrop-blur-3xl"
            >
              <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black text-white">
                  {showQuickActionModal === "novo-aluno" ? "Pré-cadastro rápido de atleta" : "Criar aula rápida"}
                </h3>
                <motion.button whileTap={PRESS_SCALE} type="button" onClick={() => setShowQuickActionModal(null)} className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5">
                  <X className="mx-auto h-4 w-4 text-zinc-200" />
                </motion.button>
              </motion.div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]">
                <div className="rounded-xl border border-zinc-800/90 bg-black/45 p-3 text-[12px] text-zinc-300">
                  {showQuickActionModal === "novo-aluno"
                    ? "Fluxo interno: validar dados, classificar trial/pending e enviar para fila de aprovação sem sair do cockpit."
                    : "Fluxo interno: definir horário, categoria e turma com confirmação rápida para operação do dia."}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showQuickActionModal === "novo-aluno") {
                      router.push("/alunos");
                    } else {
                      router.push("/agenda");
                    }
                    setActionFeedback(showQuickActionModal === "novo-aluno" ? "Fluxo de novo aluno aberto." : "Fluxo de nova aula aberto.");
                    setShowQuickActionModal(null);
                  }}
                  className="min-h-11 w-full rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/12 px-3 py-2 text-sm font-black text-[#EAB308]"
                >
                  Abrir fluxo completo
                </button>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
    </LayoutGroup>
  );
}

