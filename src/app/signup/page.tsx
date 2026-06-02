"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Turnstile } from "react-turnstile";
import { cadastroInviteRequired, getStoredInviteToken } from "@/lib/enrollmentSession";
import { verifyEnrollmentInviteWithServer } from "@/lib/verifyEnrollmentInvite";
import { useEnrollmentInviteGate } from "@/hooks/useEnrollmentInviteGate";
import { useTurnstile } from "@/hooks/useTurnstile";
import { EnrollmentInviteBlocked } from "@/components/enrollment/EnrollmentInviteBlocked";
import type { StudentRole } from "@/context/types";

export default function SignupPage() {
  const router = useRouter();
  const { user, authResolved } = useAuth();
  const { addStudent } = useApp();
  const inviteGate = useEnrollmentInviteGate();
  const turnstile = useTurnstile();
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<"aluno" | "observador">("aluno");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    instagram: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteGate.ready && !inviteGate.blocked && authResolved && !user) {
      router.replace("/login");
    }
  }, [inviteGate.ready, inviteGate.blocked, authResolved, user, router]);

  // Capture referral ID from URL query param and persist to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("ref");
    if (refId) {
      try {
        sessionStorage.setItem("wt_ref_id", refId);
      } catch {
        // ignore — sessionStorage may be unavailable in some contexts
      }
    }
  }, []);

  if (!inviteGate.ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" />
      </div>
    );
  }

  if (inviteGate.blocked) {
    return <EnrollmentInviteBlocked reason={inviteGate.reason} />;
  }

  if (!authResolved || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (!formData.phone.trim()) {
        throw new Error("Telefone é obrigatório");
      }

      // CAPTCHA validation (Turnstile)
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (siteKey && !turnstileToken) {
        setLoading(false);
        throw new Error("Por favor, complete o CAPTCHA antes de enviar");
      }

      if (siteKey && turnstileToken) {
        const verified = await turnstile.verify(turnstileToken);
        if (!verified) {
          setLoading(false);
          throw new Error(turnstile.error || "Falha ao verificar CAPTCHA");
        }
      }

      if (cadastroInviteRequired() && hasSupabaseEnv()) {
        const tok = getStoredInviteToken();
        if (!tok || !(await verifyEnrollmentInviteWithServer(tok))) {
          inviteGate.markInviteInvalid();
          throw new Error("Convite inválido ou desatualizado. Use o link atualizado da equipe ou abra a matrícula com o convite.");
        }
      }

      let authUid = user.authSubjectId ?? user.id;
      if (hasSupabaseEnv()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (authErr || !authData.user?.id) {
            throw new Error("Sessão expirada. Volte ao login e entre com Google novamente.");
          }
          authUid = authData.user.id;
        }
      }
      if (hasSupabaseEnv() && !authUid) {
        throw new Error("Não foi possível identificar sua conta. Volte ao login e entre com Google novamente.");
      }

      await addStudent({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: (user.email || "").trim().toLowerCase(),
        avatar: user.avatar || "",
        instagram: formData.instagram.trim(),
        status: "pending",
        plan: "",
        monthlyValue: 0,
        paymentDay: 5,
        categories: [],
        joinedAt: new Date().toISOString().split("T")[0],
        frequency: 0,
        totalClasses: 0,
        notes: "",
        authUserId: authUid,
        studentRole: selectedRole as StudentRole,
      });

      router.replace("/aguardando");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar seu perfil");
      setLoading(false);
    }
  };

  const roleCards: { role: "aluno" | "observador"; emoji: string; label: string; description: string }[] = [
    {
      role: "aluno",
      emoji: "🏐",
      label: "Atleta",
      description: "Treinos, XP e evolução gamificada",
    },
    {
      role: "observador",
      emoji: "👀",
      label: "Observador",
      description: "Acompanhe a rede e o feed da equipe",
    },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black p-4 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 pt-4">
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              router.back();
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 transition-colors hover:bg-zinc-900"
          aria-label="Voltar"
          type="button"
          data-testid="signup-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">Completar perfil</h1>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full transition-colors ${step >= 1 ? "bg-[#EAB308]" : "bg-zinc-700"}`} />
          <div className={`h-2 w-2 rounded-full transition-colors ${step >= 2 ? "bg-[#EAB308]" : "bg-zinc-700"}`} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col py-6"
            >
              <div className="mb-8">
                <h2 className="mb-2 text-2xl font-black">Bem-vindo ao Will!</h2>
                <p className="text-zinc-400">Como você vai participar da equipe?</p>
              </div>

              <div className="flex flex-col gap-3">
                {roleCards.map(({ role, emoji, label, description }) => (
                  <button
                    key={role}
                    type="button"
                    data-testid={`signup-role-${role}`}
                    onClick={() => setSelectedRole(role)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selectedRole === role
                        ? "border-[#EAB308]/50 bg-[#EAB308]/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <div className="flex-1">
                      <p className={`font-bold ${selectedRole === role ? "text-[#EAB308]" : "text-white"}`}>
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                        selectedRole === role ? "border-[#EAB308] bg-[#EAB308]" : "border-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              <button
                type="button"
                data-testid="signup-next-step"
                onClick={() => setStep(2)}
                className="mt-8 w-full rounded-lg bg-[#EAB308] py-3 text-sm font-bold text-black transition-colors hover:bg-[#EAB308]/90"
              >
                Continuar
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step-data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col py-6"
            >
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-black">Seus dados</h2>
                <p className="text-zinc-400">
                  Preencha suas informações. Um administrador analisará seu pedido.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
                {/* Nome */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-zinc-300">
                    Nome completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-600 transition-colors focus:border-[#EAB308] focus:outline-none"
                    disabled={loading}
                    data-testid="signup-name-input"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-zinc-300">
                    Telefone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(21) 99999-9999"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-600 transition-colors focus:border-[#EAB308] focus:outline-none"
                    disabled={loading}
                    data-testid="signup-phone-input"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-zinc-300">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@seu_usuario"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-600 transition-colors focus:border-[#EAB308] focus:outline-none"
                    disabled={loading}
                    data-testid="signup-instagram-input"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>
                )}

                {/* Turnstile CAPTCHA (se configurado) */}
                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <div ref={turnstileContainerRef} className="flex justify-center">
                    <Turnstile
                      userRef={turnstileContainerRef}
                      sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                      }}
                      onError={() => {
                        setTurnstileToken(null);
                        turnstile.reset();
                      }}
                      theme="dark"
                      size="normal"
                    />
                  </div>
                )}

                {/* Turnstile error */}
                {turnstile.error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    {turnstile.error}
                  </div>
                )}

                <div className="flex-1" />
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="signup-submit-button"
                  className="mt-4 w-full rounded-lg bg-[#EAB308] py-3 text-sm font-bold text-black transition-colors hover:bg-[#EAB308]/90 disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar cadastro"}
                </button>

                <Link
                  href="/login"
                  className="w-full rounded-lg border border-zinc-800 py-2 text-center text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-950"
                >
                  Cancelar
                </Link>

                <p className="text-center text-xs text-zinc-600 leading-relaxed">
                  Ao se cadastrar, você concorda com os{" "}
                  <Link href="/termos" target="_blank" className="text-zinc-400 hover:text-amber-400 underline">Termos de Uso</Link>
                  {" "}e a{" "}
                  <Link href="/privacidade" target="_blank" className="text-zinc-400 hover:text-amber-400 underline">Política de Privacidade</Link>.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
