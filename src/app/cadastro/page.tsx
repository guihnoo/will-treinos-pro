"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Phone, Mail, AtSign, Camera, CheckCircle2, Image as ImageIcon, RefreshCw, Zap, Trophy, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { createPublicLeadRemote } from "@/lib/supabasePersistence";
import { compressImageFileToDataUrl } from "@/lib/imageCompress";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import {
  cadastroInviteRequired,
  persistInviteTokenFromSearch,
  setMatriculaChannelActive,
} from "@/lib/enrollmentSession";

const AVATAR_SEEDS = ["will1","beach2","volei3","sport4","ace5","spike6","block7","serve8","jump9","team10","coach11","pro12"];

type PhotoMode = "avatar" | "photo";

const PERKS = [
  { icon: Zap, label: "XP & Conquistas", desc: "Suba de tier e desbloqueie recompensas" },
  { icon: Trophy, label: "Ranking de Desempenho", desc: "Compare sua evolução com a turma" },
  { icon: Shield, label: "Acesso Exclusivo", desc: "Feed oficial e comunicados da equipe" },
];

function InputField({
  icon: Icon,
  ...props
}: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${focused ? "opacity-100" : "opacity-0"}`}
        style={{ boxShadow: "0 0 0 1px rgba(234,179,8,0.4), 0 0 20px rgba(234,179,8,0.08)" }}
      />
      <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused ? "text-[#EAB308]" : "text-zinc-600"}`} />
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm outline-none placeholder:text-zinc-600 transition-colors duration-200 focus:border-[#EAB308]/30"
      />
    </div>
  );
}

export default function RegistrationPage() {
  const { user, authResolved, usingSupabaseSession } = useAuth();
  const { addStudent } = useStudents();
  const { addNotification } = useNotifications();
  const router = useRouter();
  void router;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = persistInviteTokenFromSearch(window.location.search);
    const blocked = cadastroInviteRequired() && !token;
    if (!blocked) setMatriculaChannelActive();
    setInviteGate({ ready: true, blocked });
  }, []);

  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", instagram: "", avatarSeed: AVATAR_SEEDS[0] });
  const [photoMode, setPhotoMode] = useState<PhotoMode>("avatar");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [inviteGate, setInviteGate] = useState<{ ready: boolean; blocked: boolean }>({ ready: false, blocked: false });

  useBodyScrollLock(showPhotoOptions);

  const premiumAvatarSrc = photoMode === "photo" && customPhoto
    ? customPhoto
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.avatarSeed}`;
  const supabaseReady = hasSupabaseEnv();

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setCustomPhoto(dataUrl);
      setPhotoMode("photo");
      setShowPhotoOptions(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível usar esta foto.", "error");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = val;
    if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    setForm(p => ({ ...p, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast("⚠️ Preencha nome e telefone obrigatórios.");
      return;
    }
    setLoading(true);
    const studentEmail = form.email.trim().toLowerCase() || user?.email?.trim().toLowerCase() || "";
    const avatar = photoMode === "photo" && customPhoto ? customPhoto : form.avatarSeed;
    try {
      if (supabaseReady && !user) {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Cliente Supabase indisponível.");
        await createPublicLeadRemote(supabase, {
          name: form.name, phone: form.phone, email: studentEmail,
          instagram: form.instagram, avatar,
          authUserId: user?.authSubjectId ?? null,
        });
      } else {
        await addStudent({
          name: form.name, phone: form.phone, email: studentEmail,
          instagram: form.instagram, avatar, status: "pending",
          plan: "mensal", monthlyValue: 0, paymentDay: 10,
          categories: [], joinedAt: new Date().toISOString().split("T")[0],
          frequency: 0, totalClasses: 0, notes: "",
          authUserId: user?.authSubjectId || user?.id || null,
        });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Não foi possível concluir o cadastro agora.", "error");
      setLoading(false);
      return;
    }

    if (!supabaseReady) {
      addNotification({
        type: "new_student",
        title: "Novo Aluno na Fila",
        message: `${form.name} acabou de fazer o cadastro e aguarda aprovação!`,
        time: "agora", read: false,
      });
    }
    setLoading(false);
    setSubmitted(true);
    toast("✅ Cadastro enviado! Aguarde aprovação do administrador.");
  };

  const regenerateAvatar = () =>
    setForm(p => ({ ...p, avatarSeed: AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] }));

  // ── Loading gate ──
  if (!inviteGate.ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin" />
      </div>
    );
  }

  // ── Blocked (sem convite) ──
  if (inviteGate.blocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EAB308] opacity-[0.03] blur-[120px] rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800/60 bg-zinc-950/80 p-10 text-center backdrop-blur-xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20">
            <Mail className="h-8 w-8 text-[#EAB308]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Convite obrigatório</h2>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8">
            Use o link de matrícula enviado pela equipe Will Treinos. Sem esse link, o cadastro fica restrito para proteger sua turma.
          </p>
          <Link href="/login" className={`inline-flex ${TOUCH_TARGET_MIN} items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 text-sm font-semibold text-zinc-200 hover:border-[#EAB308]/40 hover:text-[#EAB308] transition-colors ${FOCUS_RING_GOLD}`}>
            Voltar ao login
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!authResolved && supabaseReady && user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin" />
      </div>
    );
  }

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="w-full max-w-sm text-center"
        >
          <div className="relative mx-auto mb-6 w-28 h-28">
            <UserAvatar name={form.name || "Atleta"} photo={premiumAvatarSrc} size="lg" className="w-28 h-28 border-4 border-[#EAB308]/60" />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-black"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-2"
          >
            Bem-vindo ao Will Treinos!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-zinc-400 text-sm leading-relaxed mb-8"
          >
            Seu cadastro foi enviado para aprovação. Assim que confirmado, você terá acesso completo ao app — XP, feed e sua evolução.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB308] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB308]" />
            </span>
            <p className="text-[11px] font-bold text-[#EAB308] uppercase tracking-wider">Aguardando aprovação</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden py-16">
      {/* Background aura */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#EAB308] opacity-[0.025] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F97316] opacity-[0.02] blur-[100px] rounded-full" />
      </div>

      {/* Nav */}
      <Link href="/" className={`fixed top-[max(1.25rem,env(safe-area-inset-top))] left-[max(1.25rem,env(safe-area-inset-left))] z-20 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} rounded-lg`}>
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar</span>
      </Link>
      <Link href="/login" className={`fixed top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 text-sm font-bold text-[#EAB308] hover:text-[#F97316] transition-colors ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} rounded-lg px-1`}>
        Entrar
      </Link>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/8 px-4 py-1.5 mb-5">
            <Trophy className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EAB308]">Alta Performance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
            Sua jornada<br />
            <span className="bg-gradient-to-r from-[#EAB308] to-[#F97316] bg-clip-text text-transparent">começa aqui</span>
          </h1>
          <p className="text-sm text-zinc-500">Crie seu perfil de atleta e comece a evoluir</p>
        </motion.div>

        {/* Perks strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {PERKS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl border border-zinc-800/60 bg-zinc-950/60 p-3 text-center backdrop-blur-sm">
              <div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#EAB308]" />
              </div>
              <p className="text-[10px] font-bold text-white leading-tight">{label}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-tight">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl border border-zinc-800/60 bg-zinc-950/70 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/60"
        >
          {/* Avatar selector */}
          <div className="flex flex-col items-center mb-7">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile} />

            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPhotoOptions(true)}
              className="relative cursor-pointer group mb-2"
            >
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#EAB308]/30 to-[#F97316]/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <UserAvatar
                name={form.name || "Atleta"}
                photo={premiumAvatarSrc}
                size="lg"
                className="relative h-24 w-24 border-2 border-[#EAB308]/40 group-hover:border-[#EAB308]/70 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[#EAB308] to-[#F97316] rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                <Camera className="w-3.5 h-3.5 text-black" />
              </div>
            </motion.div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Toque para escolher foto</p>

            {/* Photo sheet */}
            <AnimatePresence>
              {showPhotoOptions && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  role="dialog" aria-modal="true" data-modal-overlay aria-label="Escolher foto do perfil"
                  className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/80 flex flex-col justify-end"
                  onClick={() => setShowPhotoOptions(false)}
                >
                  <motion.div
                    initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
                    transition={{ type: "spring", stiffness: 400, damping: 36 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5"
                  >
                    <div className="mx-auto mb-4 w-10 h-1 rounded-full bg-zinc-700" />
                    <p className="text-xs font-bold text-zinc-500 text-center mb-4 uppercase tracking-wider">Escolher foto do perfil</p>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { icon: Camera, label: "Câmera", action: () => cameraRef.current?.click() },
                        { icon: ImageIcon, label: "Galeria", action: () => fileRef.current?.click() },
                        { icon: RefreshCw, label: "Avatar", action: regenerateAvatar },
                      ].map(({ icon: Icon, label, action }) => (
                        <motion.button key={label} whileTap={{ scale: 0.93 }} onClick={action}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308]/40 transition-colors">
                          <Icon className="w-6 h-6 text-[#EAB308]" />
                          <span className="text-xs text-zinc-400 font-bold">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-3">Avatares disponíveis</p>
                    <div className="grid grid-cols-6 gap-2 mb-5">
                      {AVATAR_SEEDS.map(seed => (
                        <motion.button key={seed} whileTap={{ scale: 0.85 }}
                          onClick={() => { setForm(p => ({ ...p, avatarSeed: seed })); setPhotoMode("avatar"); setCustomPhoto(null); setShowPhotoOptions(false); }}
                          className={`rounded-full overflow-hidden border-2 transition-all ${form.avatarSeed === seed && photoMode === "avatar" ? "border-[#EAB308] shadow-[0_0_10px_rgba(234,179,8,0.4)]" : "border-zinc-800"}`}
                        >
                          <UserAvatar name={form.name || "Atleta"} photo={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} size="sm" className="h-full w-full border-0 ring-0 shadow-none" />
                        </motion.button>
                      ))}
                    </div>
                    <button onClick={() => setShowPhotoOptions(false)}
                      className="w-full py-3.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm font-bold hover:border-zinc-700 transition-colors">
                      Cancelar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField icon={User} type="text" placeholder="Nome Completo *" required
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField icon={Phone} type="tel" placeholder="WhatsApp *" required
                value={form.phone} onChange={handlePhoneChange} />
              <InputField icon={AtSign} type="text" placeholder="@instagram"
                value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} />
            </div>

            <InputField icon={Mail} type="email" placeholder="E-mail (opcional)"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="relative w-full mt-4 overflow-hidden rounded-xl py-4 font-black text-sm text-black disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #EAB308, #F97316)" }}
            >
              <span className={`transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}>
                Entrar na Equipe
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-center text-xs text-zinc-600 mt-5">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-zinc-400 hover:text-white font-bold transition-colors">
            Faça Login
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
