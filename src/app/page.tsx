"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star, CheckCircle2, Zap, BarChart3, MessageSquare, Trophy, Calendar, Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, authResolved } = useAuth();
  const router = useRouter();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "rgba(0,0,0,0.95)"]);
  const navBorder = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(63,63,70,0.5)"]);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsub = scrollY.on("change", v => setIsScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  useEffect(() => {
    if (!authResolved || !user) return;
    if (user.role === "admin" || user.role === "coach") router.push("/dashboard");
    else if (user.role === "aluno") router.push("/treinos");
  }, [user, authResolved, router]);

  const tiers = [
    { emoji: "🌱", name: "Iniciante", xp: "0 XP", benefit: "Acesso ao feed e check-in", color: "from-zinc-700 to-zinc-800", border: "border-zinc-600" },
    { emoji: "🥉", name: "Bronze", xp: "500 XP", benefit: "Card exclusivo Bronze + badge", color: "from-amber-900/60 to-zinc-900", border: "border-amber-800/50" },
    { emoji: "🥈", name: "Prata", xp: "1.500 XP", benefit: "Relatório técnico mensal", color: "from-zinc-500/40 to-zinc-900", border: "border-zinc-400/30" },
    { emoji: "🥇", name: "Ouro", xp: "3.000 XP", benefit: "Destaque no ranking + bônus XP", color: "from-yellow-600/40 to-zinc-900", border: "border-yellow-500/40" },
    { emoji: "💎", name: "Diamante", xp: "6.000 XP", benefit: "IA personalizada + plano exclusivo", color: "from-sky-600/40 to-zinc-900", border: "border-sky-400/30" },
  ];

  const steps = [
    { icon: "📋", num: "01", title: "Você se cadastra", desc: "Coach revisa e aprova seu perfil. Acesso exclusivo por convite." },
    { icon: "🏐", num: "02", title: "Vai para a quadra", desc: "Check-in GPS automático. Contador regressivo até o início da aula." },
    { icon: "📊", num: "03", title: "Professor avalia", desc: "Notas por fundamento em tempo real. XP calculado automaticamente." },
    { icon: "🏆", num: "04", title: "Você evolui", desc: "Sobe de tier, desbloqueia cards e entra no ranking dos melhores." },
  ];

  const features = [
    { icon: Zap, title: "Avaliação técnica por fundamento", desc: "7 fundamentos avaliados individualmente com XP assimétrico." },
    { icon: BarChart3, title: "Relatório mensal com IA", desc: "Análise automática de evolução, pontos fortes e áreas de melhoria." },
    { icon: MessageSquare, title: "Recados diretos ao atleta", desc: "Coach envia feedback personalizado após cada aula." },
    { icon: Trophy, title: "Destaque da semana + XP bônus", desc: "O melhor aluno da semana ganha bônus de XP e destaque no feed." },
    { icon: Calendar, title: "Gestão completa de agenda", desc: "Agende, cancele e reprograme aulas diretamente no app." },
    { icon: Bell, title: "Push notifications automáticos", desc: "Lembretes de aula, novas avaliações e aprovação de cadastro." },
  ];

  const testimonials = [
    {
      name: "João S.",
      role: "Ponteiro",
      text: "Nunca tinha visto minha evolução técnica de forma tão clara. Em 2 meses subi de Bronze para Ouro.",
      tier: "🥇 Ouro",
    },
    {
      name: "Ana L.",
      role: "Líbero",
      text: "O sistema de XP me faz querer ir em toda aula. Virou uma competição saudável com os colegas.",
      tier: "🥈 Prata",
    },
    {
      name: "Carlos M.",
      role: "Central",
      text: "O coach me mandou um plano de treino personalizado com IA. Isso é outro nível.",
      tier: "💎 Diamante",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-[#EAB308] selection:text-black">

      {/* Navbar */}
      <motion.nav
        style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
        className="fixed top-0 w-full z-50 border-b backdrop-blur-md transition-shadow"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏐</span>
            <span className="text-xl font-bold tracking-tight">
              Will<span className="text-[#EAB308]">Treinos</span> PRO
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#metodologia"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Como funciona
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-[#EAB308] text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#D9A406] transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]"
              data-testid="navbar-cta"
            >
              Quero ser Aluno
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main
        ref={heroRef}
        className="relative pt-36 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen text-center"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#EAB308] opacity-[0.04] blur-[140px] rounded-full" />

        {/* Badge ao vivo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            AO VIVO — Vagas abertas para Junho 2026
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]"
        >
          A plataforma de vôlei<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] via-[#FBBF24] to-[#EAB308]">
            mais exclusiva do Brasil
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Acompanhamento técnico em tempo real, gamificação que vicia e gestão profissional para times que querem evoluir de verdade.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/signup" data-testid="hero-primary-cta">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto bg-[#EAB308] text-black px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(234,179,8,0.35)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] transition-shadow"
            >
              Solicitar Vaga <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <a href="#metodologia">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto bg-transparent border border-zinc-700 text-white px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 hover:bg-zinc-900/60 hover:border-zinc-600 transition-all"
              data-testid="hero-secondary-cta"
            >
              Ver como funciona
            </motion.button>
          </a>
        </motion.div>

        {/* Stats inline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 mb-20"
        >
          {["500+ XP por aula", "7 fundamentos avaliados", "Cards exclusivos por tier"].map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#EAB308] flex-shrink-0" />
              <span className="font-medium text-zinc-300">{stat}</span>
            </div>
          ))}
        </motion.div>

        {/* Floating mock card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-72 rounded-3xl border border-yellow-500/30 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a1200 0%, #0d0900 60%, #111111 100%)",
              boxShadow: "0 0 60px rgba(234,179,8,0.15), 0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Brilho dourado no topo */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EAB308] to-transparent" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#EAB308] opacity-10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-3xl">🥇</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/80 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                  OURO
                </span>
              </div>

              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Atleta</p>
              <p className="text-lg font-black text-white tracking-tight mb-4">João S.</p>

              {/* XP bar */}
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">XP Total</span>
                <span className="text-yellow-400 font-black">3.240 / 6.000</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "54%" }}
                  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to right, #EAB308, #FBBF24)" }}
                />
              </div>

              {/* Fundamentos preview */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Ataque", val: 9.2 },
                  { label: "Saque", val: 8.7 },
                  { label: "Recep.", val: 7.9 },
                ].map((f) => (
                  <div key={f.label} className="text-center">
                    <p className="text-[9px] text-zinc-600 mb-0.5">{f.label}</p>
                    <p className="text-sm font-black text-yellow-400">{f.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Brilho dourado no bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EAB308]/30 to-transparent" />
          </motion.div>

          {/* Badge flutuante de XP */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
            className="absolute -top-3 -right-4 bg-green-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg"
          >
            +320 XP
          </motion.div>
        </motion.div>
      </main>

      {/* Como funciona */}
      <section id="metodologia" className="py-28 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#EAB308] mb-4">Metodologia</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Como funciona
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Linha conectora desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center md:items-start text-center md:text-left"
              >
                <div className="relative mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-zinc-800 bg-zinc-900"
                    style={{ boxShadow: "0 0 20px rgba(234,179,8,0.08)" }}
                  >
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-black text-[#EAB308] bg-black border border-[#EAB308]/30 rounded-full w-5 h-5 flex items-center justify-center">
                    {step.num.replace("0", "")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamificação */}
      <section className="py-28 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#EAB308] mb-4">Gamificação</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              O jogo começa na quadra.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FBBF24]">
                A evolução não para.
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ scale: 1.06, y: -6 }}
                className={`relative rounded-3xl border ${tier.border} p-6 cursor-default overflow-hidden group`}
                style={{
                  background: `linear-gradient(135deg, ${tier.color.replace("from-", "").replace(" to-", ", ")})`,
                }}
                data-testid={`tier-card-${tier.name.toLowerCase()}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                  style={{ boxShadow: "inset 0 0 40px rgba(234,179,8,0.07)" }} />

                <div className="text-3xl mb-3">{tier.emoji}</div>
                <h3 className="text-base font-black text-white mb-1">{tier.name}</h3>
                <p className="text-xs font-bold text-[#EAB308] mb-3">{tier.xp}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{tier.benefit}</p>

                {/* Shimmer no hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-3xl"
                  style={{
                    background: "linear-gradient(105deg, transparent 30%, rgba(234,179,8,0.06) 50%, transparent 70%)",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features do Coach */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#EAB308] mb-4">Para o treinador</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Para o treinador que<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FBBF24]">
              não aceita mediocridade
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center mb-4 group-hover:bg-[#EAB308]/15 transition-colors">
                <f.icon className="w-5 h-5 text-[#EAB308]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-28 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#EAB308] mb-4">Depoimentos</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Atletas que já estão evoluindo
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-3xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-[#EAB308] text-[#EAB308]" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-5 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                  <span className="text-xs font-bold text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20 px-2.5 py-1 rounded-full">
                    {t.tier}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-[#EAB308]/20 p-12 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d0900 0%, #111111 50%, #0d0900 100%)",
              boxShadow: "0 0 80px rgba(234,179,8,0.08)",
            }}
          >
            {/* Brilho top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EAB308] to-transparent" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-[#EAB308] opacity-[0.06] blur-3xl rounded-full pointer-events-none" />

            <div className="relative">
              <span className="text-4xl mb-6 block">🏐</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Sua vaga está esperando.
              </h2>
              <p className="text-zinc-400 mb-8 text-lg">
                Cadastro exclusivo via convite do treinador.
              </p>
              <Link href="/signup" data-testid="final-cta">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#EAB308] text-black px-10 py-4 rounded-full text-lg font-black flex items-center gap-2 mx-auto shadow-[0_0_50px_rgba(234,179,8,0.4)] hover:shadow-[0_0_70px_rgba(234,179,8,0.6)] transition-shadow"
                >
                  Solicitar Acesso <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-zinc-600">
                <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
                <Link href="/termos" className="hover:text-zinc-400 transition-colors">Termos</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏐</span>
            <span className="text-sm font-bold text-zinc-400">
              Will Treinos PRO <span className="text-zinc-600">© 2026</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-zinc-400 transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-zinc-400 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
