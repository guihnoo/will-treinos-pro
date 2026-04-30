"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wallet, Users, CalendarRange, AlertTriangle, TrendingUp,
  ChevronRight, CheckCircle2, Clock, UserPlus
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import {
  MODAL_BADGE_ENTER,
  MODAL_DRAWER_RIGHT,
  MODAL_HEADER_ENTER,
  MODAL_OVERLAY_FADE,
  PRESS_SCALE,
  SPRING_PREMIUM,
} from "@/components/ui/motionTokens";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type ModalType = "revenue" | "students" | "lessons" | "late";

interface Props { type: ModalType; onClose: () => void; }
interface PropsWithLayout extends Props { layoutId?: string; }

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const end = value;
    if (end === 0) { setDisplayValue(0); return; }
    const duration = 1200;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplayValue(Math.floor(ease * end));
      if (progress < 1) window.requestAnimationFrame(step);
      else setDisplayValue(end);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return <>{displayValue.toLocaleString("pt-BR")}</>;
}

export default function KPIDetailModal({ type, onClose, layoutId }: PropsWithLayout) {
  const {
    payments, students, todayLessons, categories, getCategory,
    approveStudent, markPayment, updateStudent
  } = useApp();
  const { toast } = useToast();
  
  const [approvingStudent, setApprovingStudent] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({ categoryId: "", notes: "" });
  useBodyScrollLock(true);

  const configs: Record<ModalType, { title: string; icon: React.ElementType; color: string }> = {
    revenue: { title: "Detalhes de Receita", icon: Wallet, color: "#22C55E" },
    students: { title: "Alunos Cadastrados", icon: Users, color: "#8B5CF6" },
    lessons: { title: "Aulas de Hoje", icon: CalendarRange, color: "#06B6D4" },
    late: { title: "Inadimplentes", icon: AlertTriangle, color: "#EF4444" },
  };

  const cfg = configs[type];
  const Icon = cfg.icon;

  const renderContent = () => {
    switch (type) {
      case "revenue": {
        const paid = payments.filter(p => p.status === "paid");
        const pending = payments.filter(p => p.status === "pending");
        const late = payments.filter(p => p.status === "late");
        const mockMonths = [
          { month: "Jan", val: 8000 }, { month: "Fev", val: 9500 }, { month: "Mar", val: 11200 },
          { month: "Abr", val: paid.reduce((s, p) => s + p.amount, 0) }, { month: "Mai", val: 12000 }, { month: "Jun", val: 14500 }
        ];
        const maxVal = Math.max(...mockMonths.map(m => m.val));

        return (
          <>
            <div className="mb-6">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Fluxo de Caixa Mensal (H1)</h4>
              <div className="flex items-end justify-between h-24 gap-2 mb-2">
                {mockMonths.map((m, i) => (
                  <div key={m.month} className="flex flex-col items-center gap-2 flex-1 group">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(m.val / maxVal) * 100}%` }} transition={{ delay: i * 0.1 }}
                      className={`w-full rounded-t-md relative ${m.month === "Abr" ? "bg-[#22C55E]" : "bg-zinc-800 group-hover:bg-zinc-700"}`}>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap border border-zinc-800 z-10 transition-opacity">
                        R$ {m.val.toLocaleString("pt-BR")}
                      </div>
                    </motion.div>
                    <span className={`text-[10px] font-bold ${m.month === "Abr" ? "text-[#22C55E]" : "text-zinc-600"}`}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#22C55E]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-lg font-bold text-[#22C55E]">R$ <AnimatedNumber value={paid.reduce((s, p) => s + p.amount, 0)} /></p>
                <p className="text-[10px] text-zinc-500 uppercase">Recebido (Abr)</p>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#F97316]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-lg font-bold text-[#F97316]">R$ <AnimatedNumber value={pending.reduce((s, p) => s + p.amount, 0)} /></p>
                <p className="text-[10px] text-zinc-500 uppercase">Pendente</p>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#EF4444]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-lg font-bold text-[#EF4444]">R$ <AnimatedNumber value={late.reduce((s, p) => s + p.amount, 0)} /></p>
                <p className="text-[10px] text-zinc-500 uppercase">Atrasado</p>
              </div>
            </div>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Últimos Pagamentos</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {paid.slice(0, 6).map(p => {
                const st = students.find(s => s.id === p.studentId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span className="text-sm text-zinc-300">{st?.name}</span>
                    </div>
                    <span className="text-sm font-bold text-white">R$ {p.amount}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      case "students": {
        const pending = students.filter(s => s.status === "pending");
        const active = students.filter(s => s.status === "active");
        return (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center">
                <p className="text-lg font-bold text-[#22C55E]">{active.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Ativos</p>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center">
                <p className="text-lg font-bold text-[#F97316]">{pending.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Pendentes</p>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-900 text-center">
                <p className="text-lg font-bold text-zinc-400">{students.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Total</p>
              </div>
            </div>
            {pending.length > 0 && (
              <>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">⚡ Aprovar Novos Alunos</h4>
                
                {approvingStudent ? (() => {
                  const s = students.find(x => x.id === approvingStudent);
                  if (!s) return null;
                  return (
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar}`} className="w-10 h-10 rounded-full bg-zinc-900" />
                        <div>
                          <p className="font-bold text-white text-sm">{s.name}</p>
                          <p className="text-xs text-zinc-500">{s.phone} • {s.instagram}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Categoria Principal</label>
                          <select value={studentForm.categoryId} onChange={e => setStudentForm(p => ({ ...p, categoryId: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-[#EAB308]/50">
                            <option value="">Selecione...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Observações Iniciais</label>
                          <input type="text" placeholder="Ex: Precisa focar no passe..." value={studentForm.notes}
                            onChange={e => setStudentForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-[#EAB308]/50" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setApprovingStudent(null)} className="flex-1 py-2 rounded-lg text-xs font-bold text-zinc-400 bg-zinc-900 hover:text-white transition-colors">Cancelar</button>
                          <button onClick={() => {
                            if (!studentForm.categoryId) { toast("Selecione uma categoria"); return; }
                            updateStudent(s.id, { categories: [studentForm.categoryId], notes: studentForm.notes });
                            approveStudent(s.id);
                            toast(`✅ ${s.name.split(" ")[0]} foi matriculado com sucesso!`);
                            setApprovingStudent(null);
                          }} className="flex-1 py-2 rounded-lg text-xs font-bold text-black bg-[#22C55E] hover:bg-[#16A34A] transition-colors">Confirmar Matrícula</button>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {pending.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-zinc-900/50">
                        <div className="flex items-center gap-2">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar}`} className="w-7 h-7 rounded-full" />
                          <div className="flex flex-col">
                            <span className="text-sm text-zinc-300">{s.name}</span>
                            <span className="text-[10px] text-zinc-500">{s.phone}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href={`https://wa.me/55${s.phone.replace(/\D/g, '')}?text=Olá ${s.name.split(" ")[0]}, vi seu cadastro!`} target="_blank" rel="noreferrer"
                            className="px-2 py-1.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          </a>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => { setApprovingStudent(s.id); setStudentForm({ categoryId: "", notes: "" }); }}
                            className="px-3 py-1.5 rounded-lg bg-[#EAB308] text-black text-xs font-bold hover:bg-[#D9A406] shadow-sm">
                            Analisar
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {pending.length === 0 && (
              <>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Alunos Ativos Recentes</h4>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {active.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-zinc-900/50">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar}`} className="w-7 h-7 rounded-full" />
                        <div className="flex flex-col">
                          <span className="text-sm text-zinc-300">{s.name}</span>
                          <span className="text-[10px] text-zinc-500">{s.phone}</span>
                        </div>
                      </div>
                      <a href={`https://wa.me/55${s.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );
      }
      case "lessons":
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayLessons.length === 0 && <p className="text-sm text-zinc-600 text-center py-6">Nenhuma aula hoje</p>}
            {todayLessons.map(l => {
              const c = getCategory(l.categoryId);
              return (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c?.emoji}</span>
                    <div>
                      <span className="text-sm font-bold text-white">{l.title}</span>
                      <p className="text-xs text-zinc-500">{l.startTime} - {l.endTime} • {l.enrolledStudents.length} alunos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">{l.presentStudents.length}/{l.enrolledStudents.length}</span>
                    <div className="w-8 h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#EAB308] to-[#22C55E]"
                        style={{ width: l.enrolledStudents.length > 0 ? `${(l.presentStudents.length / l.enrolledStudents.length) * 100}%` : "0%" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "late": {
        const latePaymentsList = payments.filter(p => p.status === "late");
        return (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-zinc-500 font-medium">Você tem {latePaymentsList.length} cobranças pendentes</span>
              {latePaymentsList.length > 0 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Send message to the first one in list as a batch action example
                    const st = students.find(s => s.id === latePaymentsList[0].studentId);
                    if (st) {
                      const text = `Olá ${st.name.split(' ')[0]}, tudo bem? Notei que há uma mensalidade em aberto no Will Treinos. Pode verificar por favor?`;
                      window.open(`https://wa.me/55${st.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                    }
                  }}
                  className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#EF4444]/20 transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Cobrar Todos
                </motion.button>
              )}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {latePaymentsList.map(p => {
                  const st = students.find(s => s.id === p.studentId);
                  const daysLate = Math.max(0, Math.floor((Date.now() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <motion.div key={p.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-zinc-900/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${st?.avatar}`} className="w-7 h-7 rounded-full" />
                        <div>
                          <span className="text-sm text-white font-medium">{st?.name}</span>
                          <p className="text-[11px] text-[#EF4444] font-bold">{daysLate} dias de atraso</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">R$ {p.amount}</span>
                        <a href={`https://wa.me/55${st?.phone.replace(/\D/g, '')}?text=Olá ${st?.name?.split(" ")[0]}, tudo bem? Notei que há uma mensalidade em aberto...`} target="_blank" rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        </a>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { markPayment(p.id); toast(`✅ Pagamento de ${st?.name.split(" ")[0]} confirmado!`); }}
                          className="px-2.5 py-1 rounded-lg bg-[#22C55E] text-black text-xs font-bold hover:bg-[#16A34A]">
                          Pago ✓
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {latePaymentsList.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-12 h-12 text-[#22C55E] opacity-50 mb-3" />
                <p className="text-zinc-400 font-medium text-sm">Nenhuma cobrança em atraso</p>
                <p className="text-zinc-600 text-xs mt-1">Todos os pagamentos estão em dia!</p>
              </motion.div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <motion.div {...MODAL_OVERLAY_FADE}
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      className="fixed inset-0 z-[150] overflow-y-auto overscroll-y-contain bg-black/80 backdrop-blur-md flex justify-end"
      onClick={onClose}>
      <motion.div
        {...MODAL_DRAWER_RIGHT}
        transition={SPRING_PREMIUM}
        onClick={e => e.stopPropagation()}
        className="bg-[#0A0A0A] border-l border-zinc-800 h-full w-full max-w-md p-6 overflow-y-auto"
      >
        {/* Header */}
        <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
          <motion.div {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
              <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            </motion.div>
            <h3 className="text-lg font-bold text-white">{cfg.title}</h3>
          </motion.div>
          <motion.button whileTap={PRESS_SCALE} onClick={onClose} className="text-zinc-600 hover:text-white p-1"><X className="w-5 h-5" /></motion.button>
        </motion.div>

        {renderContent()}
      </motion.div>
    </motion.div>
  );
}
