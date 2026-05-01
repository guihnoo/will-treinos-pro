"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, CalendarRange, Star, Play } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect them to their respective dashboards.
  // We can just keep them on the landing page if we want, or redirect. 
  // Let's redirect to agenda/dashboard for admin.
  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.role === "coach") router.push("/dashboard");
      if (user.role === "aluno") router.push("/treinos");
    }
  }, [user, router]);

  if (user) return null; // Prevent flash of landing page if logged in

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden selection:bg-[#EAB308] selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏐</span>
            <span className="text-xl font-bold tracking-tight">Will<span className="text-[#EAB308]">Treinos</span> PRO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#EAB308] text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#D9A406] transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh] text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EAB308] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vagas Abertas para Novas Turmas</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Eleve seu Vôlei ao <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FBBF24]">Próximo Nível</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Metodologia exclusiva, treinos personalizados e acompanhamento de performance em tempo real. Transforme sua forma de jogar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/cadastro">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-[#EAB308] text-black px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                Quero ser Aluno <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="#metodologia">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-transparent border border-zinc-700 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors">
                <Play className="w-5 h-5" /> Ver Metodologia
              </motion.button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-[#EAB308] hover:underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </motion.div>

        {/* Features Preview */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 relative z-10 w-full text-left">
          {[
            { icon: Trophy, title: "Performance Track", desc: "Acompanhe sua evolução jogo a jogo com métricas e feedbacks diretos do professor." },
            { icon: Users, title: "Comunidade Ativa", desc: "Faça parte de um ecossistema com alunos engajados, feed social e networking." },
            { icon: CalendarRange, title: "Flexibilidade", desc: "Agende e cancele aulas pelo app, veja a lotação das turmas e receba avisos em tempo real." }
          ].map((f, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#EAB308]/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-[#EAB308]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
