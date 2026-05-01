"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  CalendarRange, Wallet, Users, TrendingUp, Clock, MoreVertical,
  Plus, Bell, ChevronRight, AlertTriangle, CheckCircle2, UserPlus,
  Zap, Target, ArrowUpRight, Eye, MessageSquare, Star,
  Volleyball
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePayments } from "@/context/PaymentsContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KPIDetailModal from "@/components/KPIDetailModal";
import LessonDetailModal from "@/components/LessonDetailModal";
import CreateLessonModal from "@/components/CreateLessonModal";
import WeatherWidget from "@/components/WeatherWidget";
import { CARD_HOVER_LIFT, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import { avatarSrc } from "@/lib/avatarSrc";

const MotionLink = motion(Link);
const toKpiLayoutId = (label: string) =>
  `kpi-card-${label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

// ─── KPI CARD ───
function KPICard({ icon: Icon, label, value, sub, color, delay, onClick, sparkline, isPulsing }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string; delay: number; onClick: () => void;
  sparkline?: number[]; isPulsing?: boolean; layoutId?: string;
}) {
  const layoutId = toKpiLayoutId(label);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      layoutId={layoutId}
      whileHover={CARD_HOVER_LIFT}
      whileTap={PRESS_SCALE}
      onClick={onClick}
      className={`bg-[#0A0A0A] border rounded-2xl p-5 relative overflow-hidden cursor-pointer group ${isPulsing ? 'border-[#EAB308]/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-zinc-800/60'}`}
    >
      {/* Pulse Effect for urgent items */}
      {isPulsing && (
        <motion.div
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-[#EAB308]/10 pointer-events-none"
        />
      )}

      {/* Background Sparkline */}
      {sparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <polyline
              points={sparkline.map((val, i) => `${(i / (sparkline.length - 1)) * 100},${30 - (val / Math.max(...sparkline)) * 30}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-white relative z-10">{value}</p>
      <p className="text-sm text-zinc-500 mt-0.5 relative z-10">{label}</p>
      <p className="text-xs mt-2 font-medium relative z-10" style={{ color }}>{sub}</p>
    </motion.div>
  );
}

// ─── ALERT CARD ───
function AlertCard({ icon: Icon, text, color, link, delay }: {
  icon: React.ElementType; text: string; color: string; link: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <Link href={link} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/50 bg-black/40 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all group cursor-pointer">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex-1">{text}</span>
        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
      </Link>
    </motion.div>
  );
}

export default function AdminDashboardHome() {
  const {
    todayLessons, students, categories, notifications,
    unreadNotifications, pendingStudents,
    monthlyRevenue, activeStudents, checkInStudent,
    getStudent, getCategory,
  } = useApp();
  const { latePayments } = usePayments();

  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [kpiModal, setKpiModal] = useState<"revenue" | "students" | "lessons" | "late" | null>(null);
  const [lessonModal, setLessonModal] = useState<string | null>(null);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [selectedKpiLayoutId, setSelectedKpiLayoutId] = useState<string | null>(null);
  const [selectedLessonLayoutId, setSelectedLessonLayoutId] = useState<string | null>(null);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const router = useRouter();
  const getCategoryInfo = (catId: string) => getCategory(catId);

  const todayDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const revenueGoal = 15000;
  const revenuePercent = Math.round((monthlyRevenue / revenueGoal) * 100);

  const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

  return (
    <LayoutGroup id="admin-home-shared-layout">
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div variants={containerV} initial="hidden" animate="visible" className="space-y-6 pb-28">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {getGreeting()}, <span className="text-[#EAB308]">Will</span>
              <motion.span animate={{ rotate: [0, 14, -8, 14, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }} className="text-2xl">🏐</motion.span>
            </h1>
            <p className="text-zinc-500 mt-1 capitalize text-sm">{todayDate}</p>
          </div>

          <div className="flex items-center gap-4 flex-col sm:flex-row w-full md:w-auto">
            <WeatherWidget />

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <MotionLink
                href="/will/evaluations/templates"
                prefetch
                whileHover={{ scale: 1.03 }}
                whileTap={PRESS_SCALE}
                className="flex flex-1 md:flex-none w-full md:w-auto items-center justify-center gap-2 border border-[#EAB308]/35 bg-[#EAB308]/10 px-4 py-2.5 rounded-xl text-sm font-bold text-[#EAB308] hover:bg-[#EAB308]/15 transition-all"
              >
                <Target className="w-4 h-4 shrink-0" /> Motor de Avaliação
              </MotionLink>
              <MotionLink
                href="/agenda"
                prefetch
                whileHover={{ scale: 1.03 }}
                whileTap={PRESS_SCALE}
                className="flex flex-1 md:flex-none w-full md:w-auto items-center justify-center gap-2 bg-[#0A0A0A] border border-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:border-zinc-600 transition-all"
              >
                <Plus className="w-4 h-4 shrink-0 text-[#EAB308]" /> Nova Aula
              </MotionLink>
              <MotionLink
                href="/alunos"
                prefetch
                whileHover={{ scale: 1.03 }}
                whileTap={PRESS_SCALE}
                className="flex flex-1 md:flex-none w-full md:w-auto items-center justify-center gap-2 bg-[#EAB308] text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:bg-[#D9A406] transition-all"
              >
                <UserPlus className="w-4 h-4 shrink-0" /> Aprovações ({pendingStudents})
              </MotionLink>
            </div>
        </div>
      </motion.div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Wallet} label="Receita Mês" value={`R$ ${monthlyRevenue.toLocaleString("pt-BR")}`}
            sub={`${revenuePercent}% da meta (R$ ${revenueGoal.toLocaleString("pt-BR")})`} color="#22C55E" delay={0.1} onClick={() => { setSelectedKpiLayoutId(toKpiLayoutId("Receita Mês")); setKpiModal("revenue"); }} sparkline={[10, 20, 15, 30, 25, 40, 50, monthlyRevenue/100]} />
          <KPICard icon={Users} label="Alunos Ativos" value={String(activeStudents)}
            sub={`${pendingStudents} aguardando aprovação`} color="#8B5CF6" delay={0.15} onClick={() => { setSelectedKpiLayoutId(toKpiLayoutId("Alunos Ativos")); setKpiModal("students"); }} isPulsing={pendingStudents > 0} />
          <KPICard icon={CalendarRange} label="Aulas Hoje" value={String(todayLessons.length)}
            sub={`${todayLessons.reduce((a, l) => a + l.enrolledStudents.length, 0)} alunos no total`} color="#06B6D4" delay={0.2} onClick={() => { setSelectedKpiLayoutId(toKpiLayoutId("Aulas Hoje")); setKpiModal("lessons"); }} />
          <KPICard icon={AlertTriangle} label="Inadimplentes" value={String(latePayments)}
            sub="Necessitam contato urgente" color="#EF4444" delay={0.25} onClick={() => { setSelectedKpiLayoutId(toKpiLayoutId("Inadimplentes")); setKpiModal("late"); }} isPulsing={latePayments > 0} />
        </div>

        {/* ── REVENUE BAR ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: revenuePercent < 40 ? '#EF4444' : revenuePercent < 80 ? '#EAB308' : '#22C55E' }} /> Progresso da Meta Mensal
            </span>
            <span className="text-sm font-bold" style={{ color: revenuePercent < 40 ? '#EF4444' : revenuePercent < 80 ? '#EAB308' : '#22C55E' }}>R$ {monthlyRevenue.toLocaleString("pt-BR")} / R$ {revenueGoal.toLocaleString("pt-BR")} — {revenuePercent}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(revenuePercent, 100)}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: revenuePercent < 40 ? 'linear-gradient(to right,#EF4444,#DC2626)' : revenuePercent < 80 ? 'linear-gradient(to right,#EAB308,#CA8A04)' : 'linear-gradient(to right,#22C55E,#16A34A)' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-zinc-600 font-mono">R$ 0</span>
            <span className="text-[10px] font-bold" style={{ color: revenuePercent < 40 ? '#EF4444' : revenuePercent < 80 ? '#EAB308' : '#22C55E' }}>{revenuePercent < 40 ? '🔴 Crítico' : revenuePercent < 80 ? '🟡 Em andamento' : '🟢 Meta atingida!'}</span>
            <span className="text-[10px] text-zinc-600 font-mono">R$ {revenueGoal.toLocaleString('pt-BR')}</span>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* ── AGENDA DO DIA ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="w-full bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAB308] opacity-[0.02] blur-3xl rounded-full" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-[#EAB308]" /> Aulas de Hoje
              </h2>
              <Link href="/agenda" className="text-sm text-zinc-500 hover:text-[#EAB308] flex items-center gap-1 transition-colors">
                Ver Agenda <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar relative z-10 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
              {todayLessons.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((lesson, i) => {
                const cat = getCategoryInfo(lesson.categoryId);
                const isExpanded = expandedLesson === lesson.id;
                const isOngoing = lesson.status === 'in-progress';
                const isDone = lesson.status === 'completed';
                return (
                  <motion.div key={lesson.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="min-w-[300px] sm:min-w-[340px] snap-center flex-shrink-0"
                  >
                    <motion.div
                      layoutId={`lesson-row-${lesson.id}`}
                      whileHover={{ y: -3, borderColor: "rgba(234,179,8,0.3)" }}
                      transition={SPRING_PREMIUM}
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      className={`flex flex-col justify-between gap-4 p-5 rounded-2xl border bg-black/60 backdrop-blur-sm cursor-pointer transition-all h-full ${
                        isOngoing ? 'border-[#EF4444]/60 shadow-[0_0_18px_rgba(239,68,68,0.15)]' :
                        isDone ? 'border-[#22C55E]/40' : 'border-zinc-800/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase text-black" style={{ background: cat?.color || "#666" }}>
                          {cat?.emoji} {cat?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          {isOngoing && (
                            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                              className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block" />AO VIVO
                            </motion.span>
                          )}
                          {isDone && (
                            <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/30">✓ CONCLUÍDA</span>
                          )}
                          {!isOngoing && !isDone && (
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">{lesson.startTime}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        <span className={`font-bold text-base md:text-lg block mb-1 ${isDone ? 'text-zinc-500' : 'text-white'}`}>{lesson.title}</span>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.startTime}–{lesson.endTime}</span>
                          <span>{lesson.enrolledStudents.length}/{lesson.maxStudents} alunos</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/50">
                        <div className="flex -space-x-2">
                          {lesson.enrolledStudents.slice(0, 4).map(sid => {
                            const st = getStudent(sid);
                            return st && (
                              <img key={sid} src={avatarSrc(st.avatar, st.name)}
                                className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] object-cover" title={st.name} />
                            );
                          })}
                          {lesson.enrolledStudents.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">+{lesson.enrolledStudents.length - 4}</div>
                          )}
                          {lesson.enrolledStudents.length === 0 && (
                            <span className="text-[10px] text-zinc-600 font-bold uppercase">Aula Vazia</span>
                          )}
                        </div>
                        <motion.button whileTap={PRESS_SCALE}
                          onClick={(e) => { e.stopPropagation(); setSelectedLessonLayoutId(`lesson-row-${lesson.id}`); setLessonModal(lesson.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EAB308]/10 text-[#EAB308] hover:bg-[#EAB308]/20 transition-colors">
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Expanded: Check-in */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 ml-2 border-l-2 border-zinc-800 space-y-2 mt-2">
                            {lesson.enrolledStudents.map(sid => {
                              const st = getStudent(sid);
                              const isPresent = lesson.presentStudents.includes(sid);
                              const isAbsent = lesson.absentStudents.includes(sid);
                              return st && (
                                <div key={sid} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50">
                                  <div className="flex items-center gap-2">
                                    <img src={avatarSrc(st.avatar, st.name)} className="w-6 h-6 rounded-full object-cover" />
                                    <span className="text-sm text-zinc-300">{st.name}</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <motion.button whileTap={PRESS_SCALE} onClick={(e) => { e.stopPropagation(); checkInStudent(lesson.id, sid, true); }}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${isPresent ? 'bg-[#22C55E] text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>✓</motion.button>
                                    <motion.button whileTap={PRESS_SCALE} onClick={(e) => { e.stopPropagation(); checkInStudent(lesson.id, sid, false); }}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${isAbsent ? 'bg-[#EF4444] text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>✗</motion.button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── ALERTS, QUICK ACTIONS & FEED ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Notifications */}
            <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#EAB308]" /> Alertas
                  {unreadNotifications > 0 && (
                    <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadNotifications}</span>
                  )}
                </h3>
              </div>
              <div className="space-y-2">
                {pendingStudents > 0 && (
                  <AlertCard icon={UserPlus} text={`${pendingStudents} alunos aguardando aprovação`} color="#8B5CF6" link="/alunos" delay={0.45} />
                )}
                {latePayments > 0 && (
                  <AlertCard icon={AlertTriangle} text={`${latePayments} pagamentos em atraso`} color="#EF4444" link="/financeiro" delay={0.5} />
                )}
                <AlertCard icon={Star} text="Bruno Torres — recorde pessoal no salto!" color="#EAB308" link="/alunos" delay={0.55} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#EAB308]" /> Ações Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Aprovar Alunos", icon: CheckCircle2, color: "#22C55E", action: () => router.push("/alunos"), badge: pendingStudents },
                  { label: "Inadimplentes", icon: AlertTriangle, color: "#EF4444", action: () => router.push("/financeiro"), badge: latePayments },
                  { label: "Nova Aula", icon: Plus, color: "#06B6D4", action: () => setShowCreateLesson(true), badge: 0 },
                  { label: "Feed", icon: Eye, color: "#8B5CF6", action: () => router.push("/feed"), badge: 0 },
                ].map((action, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.04 }} whileTap={PRESS_SCALE}
                    onClick={action.action}
                    className="p-3 rounded-xl border border-zinc-800/50 bg-black/40 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all cursor-pointer text-center relative">
                    <action.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: action.color }} />
                    <span className="text-xs text-zinc-400 font-medium">{action.label}</span>
                    {action.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{action.badge}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Activity Feed */}
            <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5 h-full">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#EAB308]" /> Atividades Recentes
              </h3>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((n, i) => {
                  const typeColor = n.type === 'new_student' ? '#8B5CF6' : n.type === 'payment_late' ? '#EF4444' : n.type === 'performance' ? '#EAB308' : '#06B6D4';
                  const typeLabel = n.type === 'new_student' ? 'Lead' : n.type === 'payment_late' ? 'Financeiro' : n.type === 'performance' ? 'Destaque' : 'Aviso';
                  return (
                    <motion.div key={n.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {n.studentId ? (
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${n.studentId}`}
                            className="w-9 h-9 rounded-full border-2 border-zinc-800" />
                        ) : (
                          <div className="w-9 h-9 rounded-full border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-zinc-500" />
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A]" style={{ background: typeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: typeColor }}>{typeLabel}</span>
                          <span className="text-[10px] text-zinc-600">{n.time}</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* KPI Detail Modal */}
      <AnimatePresence>
        {kpiModal && <KPIDetailModal type={kpiModal} layoutId={selectedKpiLayoutId ?? undefined} onClose={() => { setKpiModal(null); setSelectedKpiLayoutId(null); }} />}
      </AnimatePresence>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {lessonModal && (() => {
          const lesson = todayLessons.find(l => l.id === lessonModal);
          return lesson ? <LessonDetailModal lesson={lesson} layoutId={selectedLessonLayoutId ?? undefined} onClose={() => { setLessonModal(null); setSelectedLessonLayoutId(null); }} /> : null;
        })()}
      </AnimatePresence>

      <CreateLessonModal isOpen={showCreateLesson} onClose={() => setShowCreateLesson(false)} />
    </div>
    </LayoutGroup>
  );
}
