"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
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
import { compressImageFileToDataUrl } from "@/lib/imageCompress";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { getStoredInviteToken } from "@/lib/enrollmentSession";

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
        className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm outline-none placeholder:text-white/30 transition-all duration-200 focus:border-[#EAB308]/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function CadastroPageContent() {
  const { user, authResolved, usingSupabaseSession, loginWithOAuth } = useAuth();
  const { addStudent, students } = useStudents();
  const { addNotification } = useNotifications();
  const router = useRouter();
  void router;

  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Se o usuário logou com Google, preenche automaticamente
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    instagram: "",
    avatarSeed: AVATAR_SEEDS[0]
  });
  const [photoMode, setPhotoMode] = useState<PhotoMode>(user?.avatar ? "photo" : "avatar");
  const [customPhoto, setCustomPhoto] = useState<string | null>(user?.avatar || null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Redirecionar aluno já aprovado para dashboard
  useEffect(() => {
    if (user && authResolved && usingSupabaseSession && user.role === "aluno") {
      // Se é aluno (role confirmado), vai para dashboard
      router.replace("/dashboard");
    }
  }, [user, authResolved, usingSupabaseSession, router]);

  // Update form if user auth resolves later
  useEffect(() => {
    if (user && !submitted) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email || ""
      }));
      if (user.avatar && photoMode === "avatar") {
        setCustomPhoto(user.avatar);
        setPhotoMode("photo");
      }
    }
  }, [user, submitted, photoMode]);

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

  const handleOAuthLogin = async () => {
    if (!supabaseReady) {
      toast("Configure o Supabase primeiro.", "error");
      return;
    }
    setIsGoogleLoading(true);
    const result = await loginWithOAuth("google");
    if (result.ok === false) {
      setIsGoogleLoading(false);
      toast(result.message, "error");
    }
    // se ok, ele faz redirect automático
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast("⚠️ Preencha nome e telefone obrigatórios.", "error");
      return;
    }
    if (!user) {
      toast("⚠️ Registre-se com o Google primeiro para continuar.", "error");
      return;
    }
    setLoading(true);
    const studentEmail = form.email.trim().toLowerCase() || user?.email?.trim().toLowerCase() || "";
    const avatar = photoMode === "photo" && customPhoto ? customPhoto : form.avatarSeed;

    let authUid: string | null | undefined = user?.authSubjectId || user?.id || null;
    if (supabaseReady) {
      const sb = getSupabaseClient();
      if (sb) {
        const { data: authData, error: authErr } = await sb.auth.getUser();
        if (!authErr && authData.user?.id) authUid = authData.user.id;
      }
    }

    try {
      if (supabaseReady) {
        // Fluxo logado: usa o método do contexto que já cria o aluno e despacha eventos localmente
        await addStudent({
          name: form.name, phone: form.phone, email: studentEmail,
          instagram: form.instagram, avatar, status: "pending",
          plan: "mensal", monthlyValue: 0, paymentDay: 10,
          categories: [], joinedAt: new Date().toISOString().split("T")[0],
          frequency: 0, totalClasses: 0, notes: "",
          authUserId: authUid ?? null,
        });

        // Notificação para staff: trigger Postgres `wt_notify_staff_new_pending_student`
        // (evita duplicar a mesma linha com insertNotificationRemote no cliente).
      } else {
        // Fallback local se supabase falhar
        await addStudent({
          name: form.name, phone: form.phone, email: studentEmail,
          instagram: form.instagram, avatar, status: "pending",
          plan: "mensal", monthlyValue: 0, paymentDay: 10,
          categories: [], joinedAt: new Date().toISOString().split("T")[0],
          frequency: 0, totalClasses: 0, notes: "",
          authUserId: authUid ?? null,
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
    toast("✅ Cadastro enviado! Aguarde aprovação.");
  };

  const regenerateAvatar = () =>
    setForm(p => ({ ...p, avatarSeed: AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] }));

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EAB308] opacity-[0.1] blur-[100px] rounded-full" />
        </div>
        
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <div className="relative mx-auto mb-6 w-28 h-28">
            <UserAvatar name={form.name || "Atleta"} photo={premiumAvatarSrc} size="lg" className="w-28 h-28 border-4 border-[#EAB308]/60" />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-2 italic uppercase"
          >
            Sua vaga foi reservada!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-white/50 text-sm leading-relaxed mb-8"
          >
            Seu cadastro foi enviado com sucesso. Assim que confirmado pela equipe, você terá acesso total à arena.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB308] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB308]" />
            </span>
            <p className="text-[11px] font-bold text-[#EAB308] uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Aguardando liberação</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden py-16 text-[#e5e2e1]" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Background Layer Premium */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 0 M0 50 L100 50 M50 0 L50 100 M0 100 L100 100' fill='none' stroke='white' stroke-opacity='1' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="fixed -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)", filter: "blur(120px)" }}
      />
      <div className="fixed -bottom-[10%] -left-[10%] w-[600px] h-[600px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,106,6,0.1) 0%, transparent 70%)", filter: "blur(120px)" }}
      />

      {/* Nav */}
      <Link href="/" className={`fixed top-[max(1.25rem,env(safe-area-inset-top))] left-[max(1.25rem,env(safe-area-inset-left))] z-20 flex items-center gap-2 text-white/40 hover:text-white transition-colors ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} rounded-lg`}>
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar</span>
      </Link>
      <Link href="/login" className={`fixed top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 text-sm font-bold text-[#EAB308] hover:text-[#F97316] transition-colors ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} rounded-lg px-1 uppercase tracking-widest`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Entrar
      </Link>

      <div className="relative z-10 w-full max-w-lg mt-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-1.5 mb-5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            <Trophy className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EAB308]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Alta Performance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-2">
            Sua jornada<br />
            <span style={{ background: "linear-gradient(to right, #EAB308, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>começa aqui</span>
          </h1>
          <p className="text-sm text-white/50">Crie seu perfil de atleta e comece a evoluir.</p>
        </motion.div>

        {/* Perks strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {PERKS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center backdrop-blur-sm"
                 style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)" }}>
              <div className="mx-auto mb-3 w-8 h-8 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#EAB308]" />
              </div>
              <p className="text-[10px] font-bold text-white leading-tight uppercase tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
              <p className="text-[9px] text-white/40 mt-1.5 leading-tight">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden p-6 md:p-8 shadow-2xl shadow-black"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Top gold accent line */}
          <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(to right, transparent, #EAB308, transparent)" }} />

          {/* Se não tem user e supabase logado -> exibe OAuth */}
          {!user && supabaseReady && (
            <div className="mb-8">
              <button 
                onClick={handleOAuthLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "white", color: "black", border: "1px solid rgba(255,255,255,0.8)" }}
              >
                {isGoogleLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Registrar com Google
              </button>
              <div className="flex items-center gap-3 mt-6 mb-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-white/30" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Após autorizar, complete os dados</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          {/* Avatar selector */}
          <div className={`flex flex-col items-center mb-7 transition-opacity duration-300 ${!user ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile} />

            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => user && setShowPhotoOptions(true)}
              className="relative cursor-pointer group mb-2"
            >
              <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md" 
                   style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.4), rgba(249,115,22,0.4))" }}/>
              <UserAvatar
                name={form.name || "Atleta"}
                photo={premiumAvatarSrc}
                size="lg"
                className="relative h-24 w-24 border-2 border-[#EAB308]/40 group-hover:border-[#EAB308] transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#131313] shadow-lg"
                   style={{ background: "linear-gradient(135deg, #EAB308, #F97316)" }}>
                <Camera className="w-3.5 h-3.5 text-black" />
              </div>
            </motion.div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Toque para alterar</p>

            {/* Photo sheet */}
            <AnimatePresence>
              {showPhotoOptions && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  role="dialog" aria-modal="true" data-modal-overlay aria-label="Escolher foto do perfil"
                  className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/80 flex flex-col justify-end backdrop-blur-sm"
                  onClick={() => setShowPhotoOptions(false)}
                >
                  <motion.div
                    initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
                    transition={{ type: "spring", stiffness: 400, damping: 36 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full rounded-t-3xl border-t border-white/10 p-6"
                    style={{ background: "#131313" }}
                  >
                    <div className="mx-auto mb-6 w-12 h-1.5 rounded-full bg-white/10" />
                    <p className="text-[11px] font-bold text-white/50 text-center mb-6 uppercase tracking-[0.2em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Escolher foto de perfil</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { icon: Camera, label: "Câmera", action: () => cameraRef.current?.click() },
                        { icon: ImageIcon, label: "Galeria", action: () => fileRef.current?.click() },
                        { icon: RefreshCw, label: "Avatar", action: regenerateAvatar },
                      ].map(({ icon: Icon, label, action }) => (
                        <motion.button key={label} whileTap={{ scale: 0.93 }} onClick={action}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#EAB308]/40 hover:bg-[#EAB308]/5 transition-all">
                          <Icon className="w-6 h-6 text-[#EAB308]" />
                          <span className="text-xs text-white/70 font-bold tracking-wide">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Avatares premium</p>
                    <div className="grid grid-cols-6 gap-3 mb-6">
                      {AVATAR_SEEDS.map(seed => (
                        <motion.button key={seed} whileTap={{ scale: 0.85 }}
                          onClick={() => { setForm(p => ({ ...p, avatarSeed: seed })); setPhotoMode("avatar"); setCustomPhoto(null); setShowPhotoOptions(false); }}
                          className={`rounded-full overflow-hidden border-2 transition-all ${form.avatarSeed === seed && photoMode === "avatar" ? "border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-110" : "border-white/10 hover:border-white/30"}`}
                        >
                          <UserAvatar name={form.name || "Atleta"} photo={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} size="sm" className="h-full w-full border-0 ring-0 shadow-none" />
                        </motion.button>
                      ))}
                    </div>
                    <button onClick={() => setShowPhotoOptions(false)}
                      className="w-full py-4 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:border-white/20 hover:text-white transition-colors">
                      Cancelar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity duration-300 ${!user ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <InputField icon={User} type="text" placeholder="Nome Completo *" required disabled={!user}
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField icon={Phone} type="tel" placeholder="WhatsApp *" required disabled={!user}
                value={form.phone} onChange={handlePhoneChange} />
              <InputField icon={AtSign} type="text" placeholder="@instagram" disabled={!user}
                value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} />
            </div>

            <InputField icon={Mail} type="email" placeholder="E-mail"
              disabled={true} // Ocultado se não logado, e desabilitado se logado pelo Google.
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
            />

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading || !user}
              className="relative w-full mt-6 overflow-hidden rounded-xl py-4 font-bold text-sm text-black disabled:opacity-60 disabled:cursor-not-allowed tracking-wide shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              style={{ background: "linear-gradient(135deg, #EAB308, #F97316)" }}
            >
              <span className={`transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}>
                Finalizar Inscrição
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
          className="text-center text-[11px] text-white/40 mt-6 font-medium tracking-wide uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Já tem uma conta aprovada?{" "}
          <Link href="/login" className="text-[#EAB308] hover:text-[#F97316] font-bold transition-colors">
            Acesse a Arena
          </Link>
        </motion.p>
      </div>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <motion.div className="h-8 w-8 rounded-full border-2 border-[#EAB308]/20 border-t-[#EAB308]"
          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
      </div>
    }>
      <CadastroPageContent />
    </Suspense>
  );
}
