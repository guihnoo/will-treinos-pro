"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, CheckCircle2, XCircle, AlertTriangle,
  Phone, Mail, TrendingUp, ChevronRight, X, MessageSquare,
  Send, Dumbbell, UserCheck, UserX, PhoneCall, DollarSign, Activity, RotateCcw, Star, Copy, Link2,
} from "lucide-react";
import type { Student } from "@/context/types";
import { STUDENT_TAGS, type StudentTag } from "@/lib/studentTags";
import { useAuth } from "@/context/AuthContext";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { useToast } from "@/components/Toast";
import TrainingPlanEditor from "@/components/TrainingPlanEditor";
import PerformanceEvalModal from "@/components/PerformanceEvalModal";
import { avatarSrc } from "@/lib/avatarSrc";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppPageHeader from "@/components/ui/AppPageHeader";
import StatCard from "@/components/ui/StatCard";
import AppEmptyState from "@/components/ui/AppEmptyState";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

function Sparkline({ data, color }: { data: { status: string }[]; color: string }) {
  if (!data || data.length === 0) return <div className="w-16 h-5" />;
  const bars = data.slice(-8);
  return (
    <svg width="40" height="16" viewBox={`0 0 ${bars.length * 6 - 1} 16`} className="flex-shrink-0">
      {bars.map((b, i) => (
        <rect key={i} x={i * 6} y={b.status === 'present' ? 2 : 10} width="4" height={b.status === 'present' ? 14 : 6}
          rx="1" fill={b.status === 'present' ? color : '#3f3f46'} opacity="0.9" />
      ))}
    </svg>
  );
}

type FilterType = "all" | "active" | "pending" | "suspended" | "trial";

type ProfileTabId = "geral" | "desempenho" | "financeiro";

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: "geral", label: "Visão Geral" },
  { id: "desempenho", label: "Desempenho" },
  { id: "financeiro", label: "Financeiro" },
];

export default function AlunosPage() {
  const { user, usingSupabaseSession } = useAuth();
  const {
    students,
    statusCounts,
    activeStudents,
    activeStudentsRevenue,
    activeStudentsAvgFrequency,
    approveStudent,
    suspendStudent,
    updateStudent,
  } = useStudents();
  const { payments, currentMonthReference, getStudentCurrentPayment } = usePayments();
  const { cadastroInviteUrl } = useAppConfig();
  const { categories } = useCatalog();
  const { quickMessages } = useCoaching();
  const { criticalDataLoading, criticalDataError, retryCriticalDataSync } = useCriticalData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [tagFilter, setTagFilter] = useState<StudentTag | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [trainingStudent, setTrainingStudent] = useState<Student | null>(null);
  const [evalStudent, setEvalStudent] = useState<Student | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTabId>("geral");
  const [busyStudentAction, setBusyStudentAction] = useState<{ id: string; kind: "approve" | "suspend" } | null>(null);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  useBodyScrollLock(Boolean(selectedStudent || trainingStudent || evalStudent));

  const filtered = useMemo(() => {
    return students
      .filter(s => filter === "all" || s.status === filter)
      .filter(s => !tagFilter || (s.tags ?? []).includes(tagFilter))
      .filter(s => {
        const normalize = (str: string) =>
          str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        return normalize(s.name).includes(normalize(search));
      });
  }, [students, filter, tagFilter, search]);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Ativo", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    pending: { label: "Pendente", color: "#F97316", bg: "rgba(249,115,22,0.1)" },
    suspended: { label: "Suspenso", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    trial: { label: "Trial", color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: students.length },
    { key: "active", label: "Ativos", count: statusCounts.active },
    { key: "pending", label: "Pendentes", count: statusCounts.pending },
    { key: "suspended", label: "Suspensos", count: statusCounts.suspended },
    { key: "trial", label: "Trial", count: statusCounts.trial },
  ];

  const applyTemplate = (template: string, student: Student) => {
    const pay = getStudentCurrentPayment(student.id);
    return template
      .replace("{nome}", student.name.split(" ")[0])
      .replace("{valor}", student.monthlyValue.toString())
      .replace("{categoria}", student.categories?.[0] || "aula")
      .replace("{referencia}", pay?.reference || currentMonthReference)
      .replace("{horario}", "18:00");
  };

  const openWhatsApp = (phone: string, name: string, msg = '') => {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    const text = msg || `Olá ${name.split(' ')[0]}, tudo bem?`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };
  const markStudentActionBusy = (id: string, kind: "approve" | "suspend") => {
    setBusyStudentAction({ id, kind });
    window.setTimeout(() => setBusyStudentAction((current) => (current?.id === id ? null : current)), 700);
  };

  if (usingSupabaseSession && criticalDataLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AppPageHeader
          title="Gestão de Alunos"
          subtitle="Sincronizando base em tempo real..."
          icon={Users}
        />
        <div className="space-y-3">
          <SkeletonLoader className="h-20" lines={2} />
          <SkeletonLoader className="h-28" lines={4} />
          <SkeletonLoader className="h-44" lines={5} />
        </div>
      </div>
    );
  }

  if (usingSupabaseSession && criticalDataError) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AppPageHeader
          title="Gestão de Alunos"
          subtitle="Falha de sincronização. Você pode tentar novamente sem recarregar."
          icon={Users}
        />
        <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-6">
          <p className="text-sm font-bold text-red-300">Erro de sincronização</p>
          <p className="mt-2 text-sm text-zinc-300">{criticalDataError}</p>
          <button
            type="button"
            onClick={() => void retryCriticalDataSync()}
            className={`mt-4 inline-flex rounded-xl border border-red-300/35 bg-black/35 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10 ${ctaClass}`}
          >
            Tentar sincronizar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <AppPageHeader
        title="Gestão de Alunos"
        subtitle="Gerencie cadastros, aprovações e perfis dos alunos."
        icon={Users}
      />

      {user?.role !== "aluno" && cadastroInviteUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-col gap-2 rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-2">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#EAB308]">Link de matrícula (convite)</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-300" title={cadastroInviteUrl}>
                {cadastroInviteUrl}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">Mesmo link configurado no cockpit; inclui código ?invite= para controle de acesso.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(cadastroInviteUrl);
              toast("Link copiado.");
            }}
            className={`inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#EAB308]/45 bg-black/30 px-4 py-2 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/15 sm:self-center ${ctaClass}`}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </button>
        </motion.div>
      ) : null}

      {/* Stats Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users, label: "Total", value: students.length, color: "#EAB308", sub: "cadastrados" },
          {
            icon: CheckCircle2,
            label: "Ativos",
            value: activeStudents,
            color: "#22C55E",
            sub: "matriculados",
          },
          { icon: DollarSign, label: "Receita/mês", value: `R$ ${activeStudentsRevenue.toLocaleString("pt-BR")}`, color: "#06B6D4", sub: "alunos ativos" },
          { icon: Activity, label: "Freq. Média", value: `${activeStudentsAvgFrequency}%`, color: "#8B5CF6", sub: "presença global" },
        ].map((stat, i) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            subtitle={stat.sub}
            delay={0.06 + i * 0.04}
          />
        ))}
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar aluno por nome..."
            className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors placeholder-zinc-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${ctaClass} ${
                filter === f.key
                  ? "bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                  : "bg-[#0A0A0A] text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {f.label}
              <span className={`text-xs font-bold ${filter === f.key ? "text-black/60" : "text-zinc-600"}`}>({f.count})</span>
            </motion.button>
          ))}
        </div>

        {/* Tag filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTagFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${ctaClass} ${
              tagFilter === null
                ? "bg-zinc-700 text-white border-zinc-600"
                : "bg-[#0A0A0A] text-zinc-500 border-zinc-800 hover:border-zinc-600"
            }`}
          >
            Todas as tags
          </motion.button>
          {(Object.entries(STUDENT_TAGS) as [StudentTag, (typeof STUDENT_TAGS)[StudentTag]][]).map(([key, tag]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTagFilter(tagFilter === key ? null : key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${ctaClass} ${
                tagFilter === key
                  ? `${tag.bg} ${tag.border}`
                  : "bg-[#0A0A0A] text-zinc-500 border-zinc-800 hover:border-zinc-600"
              }`}
              style={tagFilter === key ? { color: tag.color } : {}}
            >
              {tag.icon} {tag.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Student List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState
            icon={Users}
            title="Nenhum aluno encontrado"
            description="Ajuste a busca ou limpe os filtros para ver a lista completa."
            actionLabel="Limpar filtros"
            onAction={() => {
              setSearch("");
              setFilter("all");
              setTagFilter(null);
            }}
          />
        ) : null}
        {filtered.map((student, i) => {
          const status = statusConfig[student.status];
          const pay = getStudentCurrentPayment(student.id);
          return (
            <div key={student.id} className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              {/* Swipe Background Actions */}
              <div className="absolute inset-0 flex justify-between items-center px-5">
                <div className="flex items-center gap-2 text-[#22C55E]">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-[#EF4444]">
                  <span className="text-[10px] font-bold uppercase">{student.status === "pending" ? "Aprovar" : "Suspender"}</span>
                  {student.status === "pending" ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]"/> : <UserX className="w-4 h-4" />}
                </div>
              </div>

              {/* Draggable Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(e, info) => {
                  if (info.offset.x > 80) {
                     window.open(`https://wa.me/55${student.phone.replace(/\D/g, '')}?text=Olá ${student.name.split(" ")[0]}, tudo bem?`, "_blank");
                  } else if (info.offset.x < -80) {
                     if (busyStudentAction?.id === student.id) return;
                     if (student.status === "active") {
                        markStudentActionBusy(student.id, "suspend");
                        suspendStudent(student.id); toast(`${student.name.split(" ")[0]} suspenso`, "error");
                     } else if (student.status === "pending") {
                        markStudentActionBusy(student.id, "approve");
                        approveStudent(student.id); toast(`✅ ${student.name.split(" ")[0]} aprovado!`);
                        setSelectedStudent({ ...student, status: "active" });
                        setProfileTab("financeiro");
                     }
                  }
                }}
                onClick={() => setSelectedStudent(student)}
                className="relative z-10 flex items-center justify-between p-4 bg-[#0A0A0A] rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img src={avatarSrc(student.avatar)}
                      className="w-10 h-10 rounded-full border-2 border-zinc-800 object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A]"
                      style={{ background: status.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{student.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>{student.plan}</span>
                      {student.monthlyValue > 0 && <span className="text-zinc-600">R$ {student.monthlyValue}</span>}
                    </div>
                    {(student.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(student.tags ?? []).map((tag) => {
                          const cfg = STUDENT_TAGS[tag as StudentTag];
                          if (!cfg) return null;
                          return (
                            <span
                              key={tag}
                              className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${cfg.bg} ${cfg.border}`}
                              style={{ color: cfg.color }}
                            >
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {student.attendanceHistory && (
                    <Sparkline data={student.attendanceHistory} color="#22C55E" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={e => { e.stopPropagation(); openWhatsApp(student.phone, student.name); }}
                    className={`w-8 h-8 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center hover:bg-[#22C55E]/20 transition-colors flex-shrink-0 ${ctaClass}`}>
                    <PhoneCall className="w-3.5 h-3.5" />
                  </motion.button>
                  {student.status === "pending" && (
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={e => { 
                        e.stopPropagation(); 
                        if (busyStudentAction?.id === student.id) return;
                        markStudentActionBusy(student.id, "approve");
                        approveStudent(student.id); 
                        toast(`✅ ${student.name.split(" ")[0]} aprovado!`);
                        setSelectedStudent({ ...student, status: "active" });
                        setProfileTab("financeiro");
                      }}
                      disabled={busyStudentAction?.id === student.id}
                      className={`w-8 h-8 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center hover:bg-[#22C55E]/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${ctaClass}`}>
                      {busyStudentAction?.id === student.id && busyStudentAction.kind === "approve" ? (
                        <RotateCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                  {pay?.status === "late" && (
                    <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded-full">ATRASO</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Student Detail Drawer */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Detalhe do aluno"
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => { setSelectedStudent(null); setShowMessage(false); }}
          >
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0A0A0A] border-l border-zinc-800 h-full overflow-y-auto p-6"
            >
              {/* Close */}
              <button onClick={() => { setSelectedStudent(null); setShowMessage(false); setProfileTab("geral"); }}
                className={`absolute top-4 right-4 text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-zinc-900 transition-colors z-10 ${FOCUS_RING_GOLD}`}>
                <X className="w-5 h-5" />
              </button>

              {/* Profile Header */}
              <div className="text-center mb-6 pt-4">
                <img src={avatarSrc(selectedStudent.avatar)}
                  className="w-20 h-20 rounded-full mx-auto border-4 border-[#EAB308]/30 mb-3 object-cover" />
                <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ color: statusConfig[selectedStudent.status].color, background: statusConfig[selectedStudent.status].bg }}>
                    {statusConfig[selectedStudent.status].label}
                  </span>
                  <span className="text-xs text-zinc-500">{selectedStudent.plan}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800 mb-6">
                {PROFILE_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setProfileTab(tab.id)}
                    className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${FOCUS_RING_GOLD} ${
                      profileTab === tab.id ? "text-[#EAB308] border-[#EAB308]" : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                {profileTab === "geral" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    {/* Contact */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-black/50 border border-zinc-900">
                        <Phone className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-300">{selectedStudent.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-black/50 border border-zinc-900">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-300">{selectedStudent.email}</span>
                      </div>
                    </div>

                    {/* Categories */}
                    {selectedStudent.categories.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Categorias de Treino</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.categories.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            return cat && (
                              <span key={catId} className="text-xs font-bold px-3 py-1.5 rounded-lg text-black" style={{ background: cat.color }}>
                                {cat.emoji} {cat.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedStudent.notes && (
                      <div className="mb-6 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                        <p className="text-xs text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">Observações do Coach</p>
                        <p className="text-sm text-zinc-300">{selectedStudent.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {profileTab === "desempenho" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    {/* Medical Alert */}
                    {(selectedStudent.professorNotes) && (
                      <div className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-700/40 relative overflow-hidden">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                          📋 Obs. do Professor <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold ml-1">🔒 só prof. edita</span>
                        </h4>
                        <p className="text-sm text-zinc-300">{selectedStudent.professorNotes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="text-center p-4 rounded-xl bg-black/50 border border-zinc-900">
                        <p className="text-2xl font-bold text-white">{selectedStudent.totalClasses}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Aulas Realizadas</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-black/50 border border-zinc-900">
                        <p className="text-2xl font-bold text-[#EAB308]">{selectedStudent.frequency}%</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Frequência Global</p>
                      </div>
                    </div>

                    {/* Attendance Chart (Sparkline/Trend) */}
                    <div className="bg-black/50 border border-zinc-900 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Últimas Aulas</h4>
                      </div>
                      <div className="flex gap-2 items-end h-10">
                        {selectedStudent.attendanceHistory ? (
                          selectedStudent.attendanceHistory.map((h, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end group relative cursor-help">
                              <div 
                                className={`w-full rounded-sm transition-all ${h.status === 'present' ? 'bg-[#22C55E] h-full opacity-80 group-hover:opacity-100' : 'bg-[#EF4444] h-2 opacity-80 group-hover:opacity-100'}`} 
                              />
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0A0A0A] text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap border border-zinc-700 z-10">
                                {h.date.split('-').reverse().slice(0,2).join('/')} - {h.status === 'present' ? 'Veio' : 'Faltou'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="w-full flex items-center justify-center h-full text-[10px] text-zinc-600 font-mono">Sem dados recentes</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {profileTab === "financeiro" && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="bg-[#0A0A0A] border border-zinc-800 rounded-xl p-5 mb-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Configuração do Plano</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tipo de Plano</label>
                          <select 
                            value={selectedStudent.plan || ""}
                            onChange={(e) => {
                              const plan = e.target.value;
                              updateStudent(selectedStudent.id, { plan });
                              setSelectedStudent((prev) => (prev ? { ...prev, plan } : prev));
                            }}
                            className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#EAB308]/50"
                          >
                            <option value="Mensal">Mensal</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Avulso">Avulso</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Valor (R$)</label>
                            <input 
                              type="number"
                              value={selectedStudent.monthlyValue || 0}
                              onChange={e => {
                                const val = Number(e.target.value);
                                updateStudent(selectedStudent.id, { monthlyValue: val });
                                setSelectedStudent(prev => prev ? { ...prev, monthlyValue: val } : prev);
                              }}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#EAB308]/50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dia Vencimento</label>
                            <input 
                              type="number" min="1" max="31"
                              value={selectedStudent.paymentDay || 5}
                              onChange={e => {
                                const val = Number(e.target.value);
                                updateStudent(selectedStudent.id, { paymentDay: val });
                                setSelectedStudent(prev => prev ? { ...prev, paymentDay: val } : prev);
                              }}
                              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#EAB308]/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Último Pagamento</h4>
                    {(() => {
                      const pay = payments.find(p => p.studentId === selectedStudent.id);
                      if (!pay) return <p className="text-xs text-zinc-600">Nenhum registro encontrado.</p>;
                      return (
                        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">{pay.reference}</p>
                            <p className="text-xs text-zinc-500">Venc: {pay.dueDate}</p>
                          </div>
                          {pay.status === "paid" ? (
                            <span className="px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold rounded-lg border border-[#22C55E]/20">PAGO</span>
                          ) : pay.status === "late" ? (
                            <span className="px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] text-xs font-bold rounded-lg border border-[#EF4444]/20">ATRASADO</span>
                          ) : (
                            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700">PENDENTE</span>
                          )}
                        </div>
                      )
                    })()}
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 mb-6">
                {selectedStudent.status === "pending" && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { 
                      approveStudent(selectedStudent.id); 
                      toast(`✅ ${selectedStudent.name.split(" ")[0]} aprovado!`); 
                      setSelectedStudent(prev => prev ? { ...prev, status: "active" } : prev);
                      setProfileTab("financeiro"); 
                    }}
                    className={`w-full py-3 rounded-xl bg-[#22C55E] text-white font-bold flex items-center justify-center gap-2 ${ctaClass}`}>
                    <UserCheck className="w-4 h-4" /> Aprovar Aluno e Configurar Financeiro
                  </motion.button>
                )}
                {selectedStudent.status === "suspended" && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { approveStudent(selectedStudent.id); toast(`✅ ${selectedStudent.name.split(" ")[0]} reativado!`); setSelectedStudent(null); }}
                    className={`w-full py-3 rounded-xl bg-[#06B6D4] text-white font-bold flex items-center justify-center gap-2 ${ctaClass}`}>
                    <RotateCcw className="w-4 h-4" /> Reativar Aluno
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => openWhatsApp(selectedStudent.phone, selectedStudent.name)}
                  className={`w-full py-3 rounded-xl bg-[#22C55E] text-white font-bold flex items-center justify-center gap-2 ${ctaClass}`}>
                  <PhoneCall className="w-4 h-4" /> Abrir WhatsApp
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowMessage(!showMessage)}
                  className={`w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold flex items-center justify-center gap-2 ${ctaClass}`}>
                  <MessageSquare className="w-4 h-4" /> Enviar Mensagem via WA
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setEvalStudent(selectedStudent)}
                  className={`w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-bold flex items-center justify-center gap-2 ${ctaClass}`}>
                  <Star className="w-4 h-4" /> Avaliar Desempenho
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setTrainingStudent(selectedStudent)}
                  className={`w-full py-3 rounded-xl bg-zinc-900 text-white font-bold border border-zinc-800 flex items-center justify-center gap-2 ${ctaClass}`}>
                  <Dumbbell className="w-4 h-4" /> Criar Treino Personalizado
                </motion.button>
                {selectedStudent.status === "active" && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { suspendStudent(selectedStudent.id); toast(`${selectedStudent.name.split(" ")[0]} foi suspenso`, "error"); setSelectedStudent(null); }}
                    className={`w-full py-3 rounded-xl bg-zinc-900 text-[#EF4444] font-bold border border-zinc-800 flex items-center justify-center gap-2 ${ctaClass}`}>
                    <UserX className="w-4 h-4" /> Suspender
                  </motion.button>
                )}
              </div>

              {/* Quick Messages */}
              <AnimatePresence>
                {showMessage && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="border border-zinc-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mensagens Rápidas para {selectedStudent.name.split(" ")[0]}</h4>
                      <div className="space-y-2">
                        {quickMessages.map(qm => (
                          <motion.button key={qm.id} whileTap={{ scale: 0.98 }}
                            onClick={() => setMessageText(applyTemplate(qm.template, selectedStudent))}
                            className={`w-full text-left p-3 rounded-lg bg-black/50 border border-zinc-900 hover:border-zinc-700 transition-colors ${ctaClass}`}>
                            <span className="text-xs font-bold text-[#EAB308]">{qm.label}</span>
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{applyTemplate(qm.template, selectedStudent)}</p>
                          </motion.button>
                        ))}
                      </div>
                      <div className="relative mt-3">
                        <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                          placeholder={`Mensagem para ${selectedStudent.name.split(" ")[0]}...`}
                          className="w-full bg-black border border-zinc-800 rounded-xl p-3 pr-12 text-sm text-white outline-none focus:border-[#22C55E]/50 transition-colors resize-none placeholder-zinc-600"
                          rows={3} />
                        <button
                          onClick={() => messageText && openWhatsApp(selectedStudent.phone, selectedStudent.name, messageText)}
                          className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${messageText ? "bg-[#22C55E] text-white" : "text-zinc-600"} ${FOCUS_RING_GOLD}`}>
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training Plan Editor */}
      <AnimatePresence>
        {trainingStudent && (
          <TrainingPlanEditor student={trainingStudent} onClose={() => setTrainingStudent(null)} />
        )}
      </AnimatePresence>

      {/* Performance Eval Modal */}
      <AnimatePresence>
        {evalStudent && (
          <PerformanceEvalModal
            student={evalStudent}
            lessonId="manual"
            lessonTitle="Avaliação Manual"
            onClose={() => setEvalStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
