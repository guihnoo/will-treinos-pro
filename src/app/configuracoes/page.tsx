"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, MapPin, Clock, Tag, Plus, X, Trash2, Edit3,
  ExternalLink, Save, ChevronRight, Globe, QrCode, UserCircle, Lock, LockOpen, Eraser, Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useCatalog } from "@/context/CatalogContext";
import { useStudents } from "@/context/StudentsContext";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import type { AppConfig, StudentProfileEditPolicy } from "@/context/types";
import { resolveStudentProfilePolicy } from "@/lib/studentProfilePolicy";
import { clearTransactionalLocalStorage } from "@/lib/willLocalDataPolicy";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { useRouter, useSearchParams } from "next/navigation";
import AppPageHeader from "@/components/ui/AppPageHeader";
import AppSectionCard from "@/components/ui/AppSectionCard";
import CourtLocationSettings from "@/components/will/CourtLocationSettings";
import dynamic from "next/dynamic";

const NotificationPreferencesPanel = dynamic(
  () => import("@/components/student/NotificationPreferencesPanel"),
  { ssr: false, loading: () => <div className="h-40 rounded-xl bg-zinc-900/40 animate-pulse" /> }
);

type Tab = "categorias" | "locais" | "jornada" | "recebimentos" | "perfilAluno" | "notificacoes";

function timeToHours(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

export default function ConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appConfig, updateAppConfig } = useAppConfig();
  const {
    categories,
    venues,
    workHours,
    addCategory,
    updateCategory,
    deleteCategory,
    addVenue,
    updateVenue,
    deleteVenue,
    setWorkHours,
    getVenueMapsUrl,
  } = useCatalog();
  const { user } = useAuth();
  const { students } = useStudents();
  const { toast } = useToast();
  const studentProfile =
    students.find((s) => s.authUserId === user?.id || s.id === user?.id) ?? null;

  /** Conta pessoal do atleta (role aluno ou link do Perfil ?conta=1). */
  const isStudentAccount =
    user?.role === "aluno" || searchParams.get("conta") === "1";
  /** Admin/coach abrindo config no modo conta do atleta. */
  const isStaffPreviewingAthleteAccount =
    (user?.role === "admin" || user?.role === "coach") &&
    searchParams.get("conta") === "1";

  const [tab, setTab] = useState<Tab>(isStudentAccount ? "notificacoes" : "categorias");
  const [pixDraft, setPixDraft] = useState<AppConfig>(appConfig);

  useEffect(() => {
    setPixDraft(appConfig);
  }, [appConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#recebimentos" && !isStudentAccount) {
      setTab("recebimentos");
    }
  }, [user, isStudentAccount]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddVenue, setShowAddVenue] = useState(false);
  useBodyScrollLock(showAddCat || showAddVenue);
  const [newCat, setNewCat] = useState({ name: "", color: "#EAB308", emoji: "🏐", maxStudents: 10, defaultPrice: 100, isCustom: true });
  const [newVenue, setNewVenue] = useState({ name: "", photo: "", address: "", lat: -22.9, lng: -43.2 });
  const [wh, setWh] = useState(workHours);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = isStudentAccount
    ? [{ key: "notificacoes" as const, label: "Notificações", icon: Bell }]
    : [
        { key: "recebimentos" as const, label: "Recebimentos PIX", icon: QrCode },
        { key: "perfilAluno" as const, label: "Perfil do aluno", icon: UserCircle },
        { key: "categorias" as const, label: "Categorias", icon: Tag },
        { key: "locais" as const, label: "Locais", icon: MapPin },
        { key: "jornada" as const, label: "Jornada", icon: Clock },
      ];

  useEffect(() => {
    if (isStudentAccount && tab !== "notificacoes") {
      setTab("notificacoes");
    }
  }, [isStudentAccount, tab]);

  const handleAddCat = () => {
    if (!newCat.name) return;
    addCategory(newCat);
    setNewCat({ name: "", color: "#EAB308", emoji: "🏐", maxStudents: 10, defaultPrice: 100, isCustom: true });
    setShowAddCat(false);
  };

  const handleAddVenue = () => {
    if (!newVenue.name) return;
    addVenue(newVenue);
    setNewVenue({ name: "", photo: "", address: "", lat: -22.9, lng: -43.2 });
    setShowAddVenue(false);
  };

  const handleSaveWH = () => { setWorkHours(wh); };

  const EMOJIS = ["🏐","⚡","🚀","✨","💪","🏆","⭐","🎯","👶","👫","👥","🎓","🧘","🏃","💎","🌊"];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {isStaffPreviewingAthleteAccount && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
        >
          Modo visualização: conta do atleta (notificações).{" "}
          <button
            type="button"
            onClick={() => router.push("/configuracoes")}
            className="font-semibold text-yellow-400 underline-offset-2 hover:underline"
          >
            Voltar às configurações do cockpit
          </button>
        </motion.div>
      )}
      <AppPageHeader
        title="Configurações"
        subtitle={
          isStudentAccount
            ? "Preferências de notificação da sua conta."
            : "Categorias, locais, jornada e chave PIX de recebimento."
        }
        icon={Settings}
        className="mb-6"
        rightSlot={
          user ? (
            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/35 px-3 py-2 cursor-pointer hover:bg-zinc-900 transition-colors"
            >
              <UserAvatar name={user.name} photo={user.avatar} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Editar Perfil</p>
              </div>
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(t => (
          <motion.button key={t.key} whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              tab === t.key
                ? "bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                : "bg-[#0A0A0A] text-zinc-400 border-zinc-800 hover:border-zinc-600"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </motion.button>
        ))}
      </div>

      {/* ─── RECEBIMENTOS (staff): PIX exibido ao aluno — comprovante só na área do aluno ─── */}
      {tab === "recebimentos" && !isStudentAccount && (
        <motion.div id="recebimentos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <AppSectionCard
            title="Dados de recebimento PIX"
            subtitle="Você recebe nesta chave. O aluno vê estes dados em Financeiro e registra o comprovante por lá."
            rightSlot={<QrCode className="w-5 h-5 text-[#EAB308]" />}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome no PIX (recebedor)</label>
                <input
                  value={pixDraft.pixOwnerName}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixOwnerName: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                  placeholder="Ex.: Will Treinos / CNPJ fantasia"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tipo de chave</label>
                <select
                  value={pixDraft.pixKeyType}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixKeyType: e.target.value as AppConfig["pixKeyType"] }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave aleatória</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Chave PIX</label>
                <input
                  value={pixDraft.pixKey}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixKey: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-[#EAB308]/50"
                  placeholder="E-mail, CPF, telefone ou chave copia e cola"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">WhatsApp para cobrança / comprovante</label>
                <input
                  value={pixDraft.whatsappNumber}
                  onChange={(e) => setPixDraft((p) => ({ ...p, whatsappNumber: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                  placeholder="5511999999999 (com DDD)"
                />
                <p className="text-[11px] text-zinc-600 mt-1.5">Usado nos templates do cockpit e no botão de comprovante do aluno.</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  updateAppConfig(pixDraft);
                  toast("Dados de recebimento salvos.");
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm"
              >
                <Save className="w-4 h-4" /> Salvar recebimentos
              </motion.button>
            </div>
          </AppSectionCard>

          <AppSectionCard
            title="Cache local (navegador)"
            subtitle={
              hasSupabaseEnv()
                ? "Os dados oficiais vêm do Supabase. O navegador pode guardar cópia antiga — limpe antes de operar só com cadastros reais."
                : "Útil se você ainda usa dados de demonstração salvos neste aparelho."
            }
            rightSlot={<Eraser className="w-5 h-5 text-zinc-500" />}
          >
            <p className="text-[12px] leading-relaxed text-zinc-500">
              Remove do dispositivo: alunos, aulas, pagamentos, notificações, feedbacks, planos de treino e posts locais.
              Mantém categorias, locais, jornada e recebimentos (PIX) configurados aqui.
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    "Limpar dados transacionais deste navegador e recarregar? Você fará login de novo se a sessão depender do cache.",
                  )
                ) {
                  return;
                }
                clearTransactionalLocalStorage();
                toast("Cache transacional limpo. Recarregando…");
                window.setTimeout(() => window.location.reload(), 400);
              }}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500/15"
            >
              <Eraser className="h-4 w-4" />
              Limpar dados de teste / cache e recarregar
            </motion.button>
          </AppSectionCard>
        </motion.div>
      )}

      {tab === "perfilAluno" && !isStudentAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <AppSectionCard
            title="O que o aluno pode editar em /perfil"
            subtitle="Campos bloqueados ficam só leitura no app do aluno. Dados sensíveis continuam sob controle da equipe."
            rightSlot={<UserCircle className="w-5 h-5 text-[#EAB308]" />}
          >
            <p className="mb-4 text-[12px] leading-relaxed text-zinc-500">
              Use para evitar que o aluno altere e-mail institucional, foto oficial da academia etc. Padrão: tudo liberado.
            </p>
            <div className="space-y-2">
              {(
                [
                  { key: "phone" as const, label: "WhatsApp / telefone" },
                  { key: "email" as const, label: "E-mail" },
                  { key: "instagram" as const, label: "Instagram" },
                  { key: "notes" as const, label: "Observações pessoais" },
                  { key: "avatar" as const, label: "Foto de perfil" },
                ] satisfies { key: keyof StudentProfileEditPolicy; label: string }[]
              ).map((row) => {
                const policy = resolveStudentProfilePolicy(appConfig);
                const allowed = policy[row.key];
                return (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-black/40 px-3 py-2.5"
                  >
                    <span className="text-sm font-bold text-zinc-200">{row.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const merged = resolveStudentProfilePolicy(appConfig);
                        const nextVal = !merged[row.key];
                        updateAppConfig({
                          studentProfilePolicy: { ...appConfig.studentProfilePolicy, [row.key]: nextVal },
                        });
                        toast(nextVal ? `${row.label}: liberado.` : `${row.label}: bloqueado para o aluno.`);
                      }}
                      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition ${
                        allowed
                          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-600 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {allowed ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {allowed ? "Liberado" : "Bloqueado"}
                    </button>
                  </div>
                );
              })}
            </div>
          </AppSectionCard>
        </motion.div>
      )}

      {/* ─── CATEGORIAS ─── */}
      {tab === "categorias" && !isStudentAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AppSectionCard
            title="Categorias de Aula"
            subtitle="Padronize tipos de treino, capacidade e preço base."
            rightSlot={
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddCat(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold">
                <Plus className="w-4 h-4" /> Nova Categoria
              </motion.button>
            }
            contentClassName="space-y-3 pt-3"
          >
            {categories.map((cat, i) => (
              <motion.div key={cat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${cat.color}20` }}>
                    {cat.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{cat.name}</span>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                      {cat.isCustom && <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">CUSTOM</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>Máx: {cat.maxStudents} {cat.maxStudents === 1 ? "aluno" : "alunos"}</span>
                      <span>R$ {cat.defaultPrice}</span>
                    </div>
                  </div>
                </div>

                {cat.isCustom && (
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors md:opacity-0 md:group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AppSectionCard>

          {/* Add Category Modal */}
          <AnimatePresence>
            {showAddCat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Nova categoria"
                className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/70 backdrop-blur-sm p-4 flex min-h-[100dvh] items-start justify-center py-8 sm:items-center sm:py-12"
                onClick={() => setShowAddCat(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
                    <button onClick={() => setShowAddCat(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Emoji</label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map(e => (
                          <motion.button key={e} whileTap={{ scale: 0.9 }}
                            onClick={() => setNewCat(p => ({ ...p, emoji: e }))}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-all ${
                              newCat.emoji === e ? "border-[#EAB308] bg-[#EAB308]/10" : "border-zinc-800 bg-black/50 hover:border-zinc-600"
                            }`}>{e}</motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome</label>
                      <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Beach Vôlei" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Cor</label>
                        <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
                          className="w-full h-10 rounded-xl border border-zinc-800 bg-black cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Máx Alunos</label>
                        <input type="number" value={newCat.maxStudents} onChange={e => setNewCat(p => ({ ...p, maxStudents: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Preço Padrão (R$)</label>
                      <input type="number" value={newCat.defaultPrice} onChange={e => setNewCat(p => ({ ...p, defaultPrice: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddCat}
                      className="w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                      Criar Categoria
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── LOCAIS ─── */}
      {tab === "locais" && !isStudentAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Geolocalização da quadra */}
          <CourtLocationSettings
            current={appConfig.courtLocation}
            onSave={(loc) => updateAppConfig({ courtLocation: loc })}
          />

          <AppSectionCard
            title="Locais de Treino"
            subtitle="Gerencie quadras e endereços oficiais da operação."
            rightSlot={
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddVenue(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold">
                <Plus className="w-4 h-4" /> Novo Local
              </motion.button>
            }
            contentClassName="space-y-3 pt-3"
          >
            {venues.map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#EAB308]" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm">{v.name}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{v.address}</p>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">{v.lat.toFixed(4)}, {v.lng.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={getVenueMapsUrl(v.id)} target="_blank" rel="noopener"
                      className="p-2 rounded-lg text-zinc-600 hover:text-[#EAB308] hover:bg-[#EAB308]/10 transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteVenue(v.id)}
                      className="p-2 rounded-lg text-zinc-600 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors md:opacity-0 md:group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AppSectionCard>

          {/* Add Venue Modal */}
          <AnimatePresence>
            {showAddVenue && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Novo local de treino"
                className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/70 backdrop-blur-sm p-4 flex min-h-[100dvh] items-start justify-center py-8 sm:items-center sm:py-12"
                onClick={() => setShowAddVenue(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">Novo Local</h3>
                    <button onClick={() => setShowAddVenue(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome</label>
                      <input value={newVenue.name} onChange={e => setNewVenue(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Ginásio Olímpico" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Endereço</label>
                      <input value={newVenue.address} onChange={e => setNewVenue(p => ({ ...p, address: e.target.value }))}
                        placeholder="Rua, número — Bairro, Cidade" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Latitude</label>
                        <input type="number" step="0.0001" value={newVenue.lat} onChange={e => setNewVenue(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Longitude</label>
                        <input type="number" step="0.0001" value={newVenue.lng} onChange={e => setNewVenue(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddVenue}
                      className="w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                      Adicionar Local
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── JORNADA ─── */}
      {tab === "jornada" && !isStudentAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <AppSectionCard
            title="Jornada de Trabalho"
            subtitle="Defina o horário de funcionamento padrão. A agenda respeitará esses limites."
            rightSlot={<Clock className="w-5 h-5 text-[#EAB308]" />}
          >

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Início</label>
                <input type="time" value={wh.start} onChange={e => setWh(p => ({ ...p, start: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-mono outline-none focus:border-[#EAB308]/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Fim</label>
                <input type="time" value={wh.end} onChange={e => setWh(p => ({ ...p, end: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-mono outline-none focus:border-[#EAB308]/50" />
              </div>
            </div>

            {/* Visual timeline */}
            <div className="bg-black rounded-xl p-4 border border-zinc-900 mb-6">
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
              <div className="h-6 bg-zinc-900 rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    left: `${(timeToHours(wh.start) / 24) * 100}%`,
                    width: `${((timeToHours(wh.end) - timeToHours(wh.start)) / 24) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute h-full bg-gradient-to-r from-[#EAB308] to-[#F97316] rounded-full"
                />
              </div>
              <p className="text-center text-sm text-zinc-400 mt-3">
                {(timeToHours(wh.end) - timeToHours(wh.start)).toFixed(1).replace(".0", "")}h de operação diária
              </p>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveWH}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm">
              <Save className="w-4 h-4" /> Salvar Jornada
            </motion.button>
          </AppSectionCard>
        </motion.div>
      )}

      {/* ─── NOTIFICACOES (aluno) ─── */}
      {tab === "notificacoes" && isStudentAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <AppSectionCard
            title="Preferências de Notificação"
            subtitle="Escolha quais pushes você quer receber. As alterações são salvas automaticamente."
            rightSlot={<Bell className="w-5 h-5 text-amber-400" />}
          >
            {studentProfile?.id ? (
              <NotificationPreferencesPanel studentId={studentProfile.id} />
            ) : (
              <p className="text-sm text-zinc-500">Perfil de aluno não encontrado.</p>
            )}
          </AppSectionCard>
        </motion.div>
      )}
    </div>
  );
}
