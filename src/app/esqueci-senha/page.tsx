"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Cliente Supabase indisponível.");

      const { error: sbError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (sbError) throw sbError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12">
      <div
        className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        className="w-full max-w-sm"
      >
        <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, #EAB308, transparent)" }} />
        <div className="rounded-b-2xl border border-t-0 border-zinc-800/80 bg-zinc-950/90 p-8 shadow-2xl" style={{ backdropFilter: "blur(24px)" }}>

          <Link href="/login" className="mb-6 flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-fit">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
          </Link>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-[#EAB308]" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">E-mail enviado!</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Verifique sua caixa de entrada em <span className="text-zinc-300">{email}</span> e clique no link para redefinir sua senha.
                </p>
                <p className="mt-3 text-xs text-zinc-600">Não recebeu? Confira o spam ou tente novamente.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={e => void handleSubmit(e)} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[#EAB308]" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Recuperar senha</h2>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

                <div>
                  <label htmlFor="reset-email" className="sr-only">E-mail</label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-xl bg-zinc-900 border border-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#EAB308]/50 focus:shadow-[0_0_0_3px_rgba(234,179,8,0.1)] transition-all duration-150 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-opacity disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)" }}
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {loading ? "Enviando…" : "Enviar link de recuperação"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
