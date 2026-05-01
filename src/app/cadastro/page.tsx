"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Phone, Mail, AtSign, Camera, CheckCircle2, Image as ImageIcon, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { createPublicLeadRemote } from "@/lib/supabasePersistence";
import { compressImageFileToDataUrl } from "@/lib/imageCompress";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { setMatriculaChannelActive } from "@/lib/enrollmentSession";

const AVATAR_SEEDS = ["will1","beach2","volei3","sport4","ace5","spike6","block7","serve8","jump9","team10","coach11","pro12"];

type PhotoMode = "avatar" | "photo";

export default function RegistrationPage() {
  const { user, authResolved, usingSupabaseSession, addStudent, addNotification } = useApp();
  const router = useRouter();

  useEffect(() => {
    setMatriculaChannelActive();
  }, []);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", instagram: "",
    avatarSeed: AVATAR_SEEDS[0]
  });
  const [photoMode, setPhotoMode] = useState<PhotoMode>("avatar");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  useBodyScrollLock(showPhotoOptions);
  const premiumAvatarSrc = photoMode === "photo" && customPhoto ? customPhoto : `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.avatarSeed}`;
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

    const studentEmail = form.email.trim().toLowerCase() || user?.email?.trim().toLowerCase() || "";
    const avatar = photoMode === "photo" && customPhoto ? customPhoto : form.avatarSeed;
    try {
      if (supabaseReady && !user) {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Cliente Supabase indisponível.");
        await createPublicLeadRemote(supabase, {
          name: form.name,
          phone: form.phone,
          email: studentEmail,
          instagram: form.instagram,
          avatar,
          authUserId: user?.authSubjectId ?? null,
        });
      } else {
        await addStudent({
          name: form.name,
          phone: form.phone,
          email: studentEmail,
          instagram: form.instagram,
          avatar,
          status: "pending",
          plan: "mensal",
          monthlyValue: 0,
          paymentDay: 10,
          categories: [],
          joinedAt: new Date().toISOString().split("T")[0],
          frequency: 0,
          totalClasses: 0,
          notes: "",
          authUserId: user?.authSubjectId || user?.id || null,
        });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Não foi possível concluir o cadastro agora.", "error");
      return;
    }

    const usedAnonymousLead = supabaseReady && !user;
    if (!usingSupabaseSession || usedAnonymousLead) {
      addNotification({
        type: "new_student",
        title: "Novo Aluno na Fila",
        message: `${form.name} acabou de fazer o cadastro e aguarda aprovação!`,
        time: "agora",
        read: false,
      });
    }

    setSubmitted(true);
    toast("✅ Cadastro enviado com sucesso! Aguarde aprovação do administrador.");
    
  };

  const regenerateAvatar = () =>
    setForm(p => ({ ...p, avatarSeed: AVATAR_SEEDS[Math.floor(Math.random()*AVATAR_SEEDS.length)] }));

  if (!authResolved && supabaseReady && user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin" aria-hidden />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-black/50 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <UserAvatar name={form.name || "Novo Aluno"} photo={premiumAvatarSrc} size="lg" />
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="w-20 h-20 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro Enviado!</h2>
          <p className="text-zinc-500 mb-6">Seus dados foram enviados para o Will. Assim que ele aprovar, você terá acesso completo ao app.</p>
          <p className="text-xs text-zinc-600">Você receberá atualização quando o dono aprovar seu cadastro.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EAB308] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className={`absolute top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] text-zinc-500 hover:text-white flex items-center gap-2 transition-colors z-10 ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} rounded-lg`}>
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-black/60 border border-zinc-800/60 p-6 md:p-8 rounded-3xl backdrop-blur-md relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Sua Jornada Começa Aqui</h1>
          <p className="text-sm text-zinc-500">Crie seu perfil para acessar os treinos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo / Avatar Selector */}
        <div className="flex flex-col items-center justify-center mb-6">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile}/>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFile}/>

          {/* Avatar preview */}
          <motion.div whileTap={{scale:0.95}} onClick={()=>setShowPhotoOptions(true)} className="relative cursor-pointer group">
            <UserAvatar
              name={form.name || "Novo Aluno"}
              photo={premiumAvatarSrc}
              size="lg"
              className="h-24 w-24 border-4 border-[#EAB308]/60 group-hover:border-[#EAB308] transition-colors"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white"/>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#EAB308] rounded-full flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-black"/>
            </div>
          </motion.div>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wider font-bold">Toque para escolher foto</p>

          {/* Photo options sheet */}
          <AnimatePresence>
            {showPhotoOptions && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Escolher foto do perfil"
                className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/70 flex flex-col justify-end" onClick={()=>setShowPhotoOptions(false)}>
                <motion.div initial={{y:100}} animate={{y:0}} exit={{y:100}} onClick={e=>e.stopPropagation()}
                  className="w-full bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-5">
                  <p className="text-sm font-bold text-zinc-400 text-center mb-4 uppercase tracking-wider">Escolher foto do perfil</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <motion.button whileTap={{scale:0.95}} onClick={()=>{cameraRef.current?.click();}}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                      <Camera className="w-6 h-6 text-[#EAB308]"/>
                      <span className="text-xs text-zinc-400 font-bold">Câmera</span>
                    </motion.button>
                    <motion.button whileTap={{scale:0.95}} onClick={()=>{fileRef.current?.click();}}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                      <ImageIcon className="w-6 h-6 text-[#EAB308]"/>
                      <span className="text-xs text-zinc-400 font-bold">Galeria</span>
                    </motion.button>
                    <motion.button whileTap={{scale:0.95}} onClick={regenerateAvatar}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#EAB308] transition-colors">
                      <RefreshCw className="w-6 h-6 text-[#EAB308]"/>
                      <span className="text-xs text-zinc-400 font-bold">Avatar</span>
                    </motion.button>
                  </div>
                  {/* Avatar grid */}
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-2">Avatares disponíveis</p>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {AVATAR_SEEDS.map(seed=>(
                      <motion.button key={seed} whileTap={{scale:0.85}}
                        onClick={()=>{setForm(p=>({...p,avatarSeed:seed}));setPhotoMode("avatar");setCustomPhoto(null);setShowPhotoOptions(false);}}
                        className={`rounded-full overflow-hidden border-2 transition-all ${form.avatarSeed===seed&&photoMode==="avatar"?"border-[#EAB308]":"border-zinc-800"}`}>
                        <UserAvatar name={form.name || "Aluno"} photo={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} size="sm" className="h-full w-full border-0 ring-0 shadow-none" />
                      </motion.button>
                    ))}
                  </div>
                  <button onClick={()=>setShowPhotoOptions(false)} className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-500 text-sm font-bold">Cancelar</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Nome Completo *" required
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="tel" placeholder="WhatsApp *" required
                  value={form.phone} onChange={handlePhoneChange}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
              </div>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="@instagram"
                  value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" placeholder="E-mail (opcional)"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            className="w-full bg-[#EAB308] text-black py-4 rounded-xl font-bold text-sm mt-6 hover:bg-[#D9A406] transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            Finalizar Cadastro
          </motion.button>
        </form>
        
        <p className="text-center text-xs text-zinc-500 mt-6">
          Já tem uma conta? <Link href="/login" className="text-white hover:underline font-bold">Faça Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
