"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const { user, authResolved } = useAuth();
  const { addStudent } = useApp();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    birthdate: "",
    instagram: "",
    motivation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, user, router]);

  if (!authResolved || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-10 w-10 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin" />
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

      const newStudent = await addStudent({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: user.email || "",
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
        notes: formData.motivation.trim() || "",
        authUserId: user.authSubjectId,
      });

      router.replace("/aguardando");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar seu perfil");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold">Completar perfil</h1>
      </div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full py-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-black mb-2">Bem-vindo ao Will!</h2>
          <p className="text-zinc-400">
            Preencha seus dados para completar o cadastro. Um administrador analisará seu pedido.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Nome completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Seu nome"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:border-[#EAB308] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Telefone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(21) 99999-9999"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:border-[#EAB308] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Birthdate */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Data de nascimento</label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:border-[#EAB308] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Instagram</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@seu_usuario"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:border-[#EAB308] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Por que quer entrar?</label>
            <textarea
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="Ex: Quero melhorar meu jogo de voleibol..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:border-[#EAB308] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#EAB308] text-black font-bold text-sm hover:bg-[#EAB308]/90 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? "Enviando..." : "Enviar cadastro"}
          </button>

          <Link
            href="/login"
            className="w-full py-2 rounded-lg border border-zinc-800 text-center text-xs font-bold text-zinc-400 hover:bg-zinc-950 transition-colors"
          >
            Cancelar
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
