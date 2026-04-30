"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, Phone, Mail, AtSign, Save, Edit3, LogOut,
  Trophy, Calendar, TrendingUp, Star, CheckCircle2,
  Image as ImageIcon, RefreshCw, X, Shield, ChevronRight
} from "lucide-react";
import { useApp, type Student } from "@/context/AppContext";
import { resolveStudentProfilePolicy } from "@/lib/studentProfilePolicy";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { uploadAvatarToStorage } from "@/lib/supabasePersistence";

import UserAvatar from "@/components/ui/UserAvatar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppPageHeader from "@/components/ui/AppPageHeader";
import AppSectionCard from "@/components/ui/AppSectionCard";

const AVATAR_SEEDS = ["Ricardo","spike","ace","beach","volei","sport","pro","elite","serve","jump","block","team"];
const scoreColor = (s: number) => s >= 8 ? "#22C55E" : s >= 6 ? "#EAB308" : "#EF4444";
const resolveAvatarSrc = (avatar: string | null | undefined, fallbackSeed: string) => {
  if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
  if (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`;
};

export default function PerfilPage() {
  const { user, students, feedbacks, lessons, updateStudent, updateUser, logout, appConfig, usingSupabaseSession } = useApp();
  const profilePolicy = useMemo(() => resolveStudentProfilePolicy(appConfig), [appConfig]);
  const isStudent = user?.role === "aluno";
  const canEditField = (key: keyof typeof profilePolicy) => !isStudent || profilePolicy[key];
  const canEditAnyField =
    !isStudent || Object.values(profilePolicy).some(Boolean);
  const { toast } = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const profile = students.find(s => s.id === user?.id);
  const [editing, setEditing] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  useBodyScrollLock(showPhotoSheet);
  const [form, setForm] = useState({
    phone: profile?.phone || "",
    email: profile?.email || "",
    instagram: profile?.instagram || "",
    notes: profile?.notes || "",
  });
  const [avatar, setAvatar] = useState(profile?.avatar || user?.avatar || "Ricardo");
  const [customPhoto, setCustomPhoto] = useState<string | null>(
    (profile?.avatar || user?.avatar || "").startsWith("data:") ? (profile?.avatar || user?.avatar || "") : null
  );

  const myLessons = lessons.filter(l => l.enrolledStudents.includes(user?.id || ""));
  const completedCount = myLessons.filter(l => l.presentStudents.includes(user?.id || "")).length;
  const myFeedbacks = feedbacks.filter(f => f.studentId === user?.id).sort((a, b) => b.date.localeCompare(a.date));
  const avgRating = myFeedbacks.length > 0 ? (myFeedbacks.reduce((s, f) => s + f.rating, 0) / myFeedbacks.length).toFixed(1) : "—";
  const frequency = profile?.frequency || Math.min(100, completedCount > 0 ? Math.round((completedCount / Math.max(profile?.totalClasses || completedCount, 1)) * 100) : 0);
  const level = Math.max(1, Math.floor(completedCount / 4) + 1);
  const xp = completedCount * 120 + Math.round((frequency / 100) * 180);
  const xpCurrent = xp % 1000;
  const xpPct = Math.max(8, Math.min(100, (xpCurrent / 1000) * 100));
  const technicalFocus = profile?.categories?.[0] || "Vôlei";
  const haptic = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  };

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Arquivo inválido. Selecione uma imagem.");
      return;
    }
    if (usingSupabaseSession) {
      const supabase = getSupabaseClient();
      const storageUserId = user?.authSubjectId || profile?.authUserId || "";
      if (!supabase || !storageUserId) {
        toast("Sessão indisponível para upload da foto.", "error");
        return;
      }
      try {
        const avatarUrl = await uploadAvatarToStorage(supabase, storageUserId, file);
        setCustomPhoto(null);
        setAvatar(avatarUrl);
        if (profile?.id) {
          updateStudent(profile.id, { avatar: avatarUrl });
        } else if (user?.id) {
          updateUser(user.id, { avatar: avatarUrl });
        }
        setShowPhotoSheet(false);
        toast("📸 Foto enviada e salva!");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Não foi possível enviar a foto.", "error");
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const raw = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const max = 720;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast("Erro ao processar imagem.");
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const optimized = canvas.toDataURL("image/jpeg", 0.86);
        setCustomPhoto(optimized);
        setAvatar(optimized);
        if (profile?.id) {
          updateStudent(profile.id, { avatar: optimized });
        } else if (user?.id) {
          updateUser(user.id, { avatar: optimized });
        }
        setShowPhotoSheet(false);
        toast("📸 Foto carregada e salva!");
      };
      img.onerror = () => toast("Erro ao ler imagem. Tente outra foto.");
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (profile) {
      const patch: Partial<Student> = {};
      if (canEditField("phone")) patch.phone = form.phone;
      if (canEditField("email")) patch.email = form.email;
      if (canEditField("instagram")) patch.instagram = form.instagram;
      if (canEditField("notes")) patch.notes = form.notes;
      if (canEditField("avatar")) patch.avatar = avatar;
      if (Object.keys(patch).length) updateStudent(profile.id, patch);
    } else if (user) {
      if (canEditField("avatar")) updateUser(user.id, { avatar });
    }
    setEditing(false);
    haptic([30, 40, 30]);
    const stamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    toast(`✅ Atualizado em ${stamp}`);
  };

  const handleLogout = () => { haptic(25); logout(); router.push("/login"); };

  const currentAvatar = resolveAvatarSrc(customPhoto || avatar, "Ricardo");

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-28">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile} />

      {/* Header */}
      <AppPageHeader
        title="Meu Perfil"
        subtitle={
          isStudent && !canEditAnyField
            ? "Seus dados estão em modo somente leitura (definido pela academia em Configurações)."
            : "Identidade esportiva, evolução e dados que você pode atualizar — conforme permissões da academia."
        }
        icon={User}
        className="mb-6"
        rightSlot={
          !editing && canEditAnyField ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { haptic(20); setEditing(true); }}
            className="min-h-11 flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900/70 backdrop-blur-md border border-zinc-700 text-zinc-300 rounded-xl text-sm font-bold hover:border-[#EAB308]/60 transition-colors flex-shrink-0">
            <Edit3 className="w-4 h-4" /> Editar
          </motion.button>
          ) : editing ? (
            <div className="flex gap-2 flex-shrink-0">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { haptic(15); setEditing(false); }}
              className="min-h-11 px-3 sm:px-4 py-2 bg-zinc-900/70 backdrop-blur-md border border-zinc-800 text-zinc-400 rounded-xl text-sm font-bold">
              Cancelar
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave}
              className="min-h-11 flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(234,179,8,0.25)]">
              <Save className="w-4 h-4" /> Salvar
              </motion.button>
            </div>
          ) : null
        }
      />

      {/* Athlete Identity Card */}
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="bg-[#0A0A0A]/85 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 mb-5 relative overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAB308] opacity-[0.08] blur-[70px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#EAB308] opacity-[0.04] blur-[60px] rounded-full" />
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar with edit button */}
          <div className="relative flex-shrink-0">
            <motion.div whileTap={{ scale: 0.95 }} onClick={() => editing && canEditField("avatar") && setShowPhotoSheet(true)}
              className={`relative ${editing && canEditField("avatar") ? "cursor-pointer" : ""}`}>
              <UserAvatar
                name={user?.name || "Aluno"}
                photo={currentAvatar}
                size="lg"
                className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-[#EAB308]/65"
              />
              {editing && canEditField("avatar") && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </motion.div>
            {editing && canEditField("avatar") && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { haptic(20); setShowPhotoSheet(true); }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#EAB308] rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-black" />
              </motion.button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#EAB308]/90 mb-1">Athlete ID</p>
            <h2 className="text-2xl font-bold text-white truncate">{user?.name}</h2>
            <p className="text-zinc-500 text-sm mt-0.5">{profile?.plan || "Aluno"} · Desde {profile?.joinedAt ? new Date(profile.joinedAt+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}) : "—"}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-bold text-black bg-[#EAB308] px-2 py-0.5 rounded-full uppercase tracking-wider">
                {profile?.status === "active" ? "✓ Ativo" : profile?.status === "pending" ? "⏳ Pendente" : profile?.status || "Aluno"}
              </span>
              {profile?.categories[0] && (
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{profile.categories[0]}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Level</p>
            <p className="text-lg font-black text-[#EAB308]">Lv. {level}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">XP</p>
            <p className="text-lg font-black text-white">{xp}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Foco</p>
            <p className="text-sm font-bold text-white truncate">{technicalFocus}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            <span>Progressão semanal</span>
            <span className="text-[#EAB308]">{xpCurrent}/1000 XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-900 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#EAB308]/75 to-[#EAB308]"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Aulas", value: completedCount, color: "#EAB308", icon: Calendar },
          { label: "Frequência", value: `${frequency}%`, color: frequency >= 80 ? "#22C55E" : "#F97316", icon: TrendingUp },
          { label: "Nota Média", value: avgRating, color: avgRating !== "—" ? scoreColor(parseFloat(avgRating)) : "#52525b", icon: Star },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
              className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-lg opacity-20" style={{ background: s.color }} />
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Editable Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="mb-5">
        <AppSectionCard
          title="Dados de Contato"
          subtitle={
            isStudent
              ? "Campos com cadeado são definidos só pela equipe (Configurações → Perfil do aluno)."
              : "Mantenha seus canais atualizados para comunicação rápida."
          }
          rightSlot={<Shield className="w-4 h-4 text-[#EAB308]" />}
          className="bg-[#0A0A0A]/85 backdrop-blur-xl border-white/[0.08]"
          contentClassName="space-y-4 pt-3"
        >
        {[
          { label: "WhatsApp", key: "phone", icon: Phone, placeholder: "(21) 99999-9999", type: "tel" },
          { label: "E-mail", key: "email", icon: Mail, placeholder: "seu@email.com", type: "email" },
          { label: "Instagram", key: "instagram", icon: AtSign, placeholder: "@seu.perfil", type: "text" },
        ].map(field => {
          const Icon = field.icon;
          const fk = field.key as "phone" | "email" | "instagram";
          const editable = canEditField(fk);
          return (
            <div key={field.key} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 flex items-center gap-2">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{field.label}</p>
                  {isStudent && !editable ? (
                    <span className="text-[9px] font-bold uppercase text-zinc-500">🔒 academia</span>
                  ) : null}
                </div>
                {editing && editable ? (
                  <input type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full min-h-11 bg-zinc-900/75 border border-zinc-700/90 rounded-xl py-2 px-3 text-white text-sm outline-none focus:border-[#EAB308]/60 focus:ring-2 focus:ring-[#EAB308]/20 transition-all" />
                ) : (
                  <p className="text-sm text-white truncate">{form[field.key as keyof typeof form] || <span className="text-zinc-600">Não informado</span>}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Observations */}
        {(profile?.notes || editing) && (canEditField("notes") || !isStudent || profile?.notes) && (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Observações</p>
              {isStudent && !canEditField("notes") ? (
                <span className="text-[9px] font-bold uppercase text-zinc-500">🔒 academia</span>
              ) : null}
            </div>
            {editing && canEditField("notes") ? (
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                placeholder="Alguma observação..."
                className="w-full bg-zinc-900/75 border border-zinc-700/90 rounded-xl py-2.5 px-3 text-white text-sm outline-none focus:border-[#EAB308]/60 focus:ring-2 focus:ring-[#EAB308]/20 resize-none transition-all" />
            ) : (
              <p className="text-sm text-zinc-400 italic">{profile?.notes || "—"}</p>
            )}
          </div>
        )}

        {profile?.professorNotes && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">📋 Obs. do Professor</p>
              <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-bold">🔒 só o prof. edita</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{profile.professorNotes}</p>
          </div>
        )}
        </AppSectionCard>
      </motion.div>

      {/* Evolution summary */}
      {myFeedbacks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-5">
          <AppSectionCard
            title="Histórico de Avaliações"
            subtitle="Evolução técnica nas últimas sessões."
            rightSlot={<Star className="w-4 h-4 text-[#EAB308]" />}
            contentClassName="pt-3"
          >
          <div className="space-y-2">
            {myFeedbacks.slice(0, 5).map((fb, i) => (
              <motion.div key={fb.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40">
                <div>
                  <p className="text-sm font-bold text-white">{fb.trainingType}</p>
                  <p className="text-xs text-zinc-500">{new Date(fb.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ borderColor: scoreColor(fb.rating) }}>
                    <span className="text-sm font-bold" style={{ color: scoreColor(fb.rating) }}>{fb.rating}</span>
                  </div>
                  {i > 0 && (() => {
                    const prev = myFeedbacks[i - 1];
                    const diff = fb.rating - prev.rating;
                    return diff !== 0 && (
                      <span className={`text-[10px] font-bold ${diff > 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
          </div>
          </AppSectionCard>
        </motion.div>
      )}

      {/* Logout */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
        className="w-full min-h-11 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-zinc-800 text-zinc-500 hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-all font-bold text-sm">
        <LogOut className="w-4 h-4" /> Sair da conta
      </motion.button>

      {/* Photo options sheet */}
      <AnimatePresence>
        {showPhotoSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Opções de foto do perfil"
            className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/80 flex flex-col justify-end" onClick={() => setShowPhotoSheet(false)}>
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl max-w-2xl mx-auto max-h-[92dvh] overflow-y-auto shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
            >
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-2" />
              <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm px-5 py-3 border-b border-zinc-900">
                <p className="text-sm font-bold text-zinc-400 text-center uppercase tracking-wider">Foto do Perfil</p>
              </div>
              <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { haptic(20); cameraRef.current?.click(); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                  <Camera className="w-6 h-6 text-[#EAB308]" />
                  <span className="text-xs text-zinc-400 font-bold">Câmera</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { haptic(20); fileRef.current?.click(); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                  <ImageIcon className="w-6 h-6 text-[#EAB308]" />
                  <span className="text-xs text-zinc-400 font-bold">Galeria</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                  const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
                  haptic(20);
                  setAvatar(seed); setCustomPhoto(null); setShowPhotoSheet(false); toast("🎭 Avatar atualizado!");
                }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                  <RefreshCw className="w-6 h-6 text-[#EAB308]" />
                  <span className="text-xs text-zinc-400 font-bold">Avatar</span>
                </motion.button>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-2">Escolher avatar</p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {AVATAR_SEEDS.map(seed => (
                  <motion.button key={seed} whileTap={{ scale: 0.85 }}
                    onClick={() => { setAvatar(seed); setCustomPhoto(null); setShowPhotoSheet(false); }}
                    className={`rounded-full overflow-hidden border-2 transition-all ${avatar === seed && !customPhoto ? "border-[#EAB308]" : "border-zinc-800"}`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} className="w-full h-full" />
                  </motion.button>
                ))}
              </div>
              <button onClick={() => setShowPhotoSheet(false)} className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-500 text-sm font-bold">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
