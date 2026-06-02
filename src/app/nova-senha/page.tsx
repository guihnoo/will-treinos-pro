"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase envia o token via fragment (#access_token=...) após clicar no link
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não conferem."); return; }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Cliente Supabase indisponível.");

      const { error: sbError } = await supabase.auth.updateUser({ password });
      if (sbError) throw sbError;
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar senha.");
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

          {done ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[#EAB308]" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Senha atualizada!</h2>
              <p className="text-sm text-zinc-500">Redirecionando para o login…</p>
            </div>
          ) : (
            <form onSubmit={e => void handleSubmit(e)} className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#EAB308]" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Nova senha</h2>
                </div>
                <p className="text-xs text-zinc-600">Escolha uma senha forte com pelo menos 8 caracteres.</p>
              </div>

              <div className="space-y-2.5">
                <div className="relative">
                  <label htmlFor="new-password" className="sr-only">Nova senha</label>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nova senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-xl bg-zinc-900 border border-white/[0.07] px-4 py-3 pr-11 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#EAB308]/50 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">Confirmar senha</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirmar senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                    className={`w-full rounded-xl bg-zinc-900 border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition-all disabled:opacity-50 ${
                      confirm && confirm !== password ? "border-red-500/50" : "border-white/[0.07] focus:border-[#EAB308]/50"
                    }`}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              {!sessionReady && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  Sessão não detectada. Use o link recebido por e-mail para acessar esta página.
                </p>
              )}

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading || !password || !confirm || !sessionReady}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-opacity disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)" }}
              >
                {loading && <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />}
                {loading ? "Salvando…" : "Salvar nova senha"}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
