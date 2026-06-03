"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { STUDENT_HOME_PATH } from "@/lib/studentRoutes";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

const FEATURE_CARDS = [
  {
    icon: "🏆",
    title: "Sistema de XP e Tiers",
    desc: "Evolua de Iniciante a Elite",
  },
  {
    icon: "📊",
    title: "Avaliações técnicas",
    desc: "Veja sua evolução por fundamento",
  },
  {
    icon: "🤝",
    title: "Feedback do Coach",
    desc: "Recados e planos personalizados",
  },
  {
    icon: "🎯",
    title: "Desafios diários",
    desc: "Conquistas e ranking da turma",
  },
];

const WA_URL =
  "https://wa.me/?text=Ol%C3%A1!%20Acabei%20de%20me%20cadastrar%20no%20Will%20Treinos%20PRO%20e%20gostaria%20de%20confirmar%20meu%20acesso.";

export default function AguardandoPage() {
  const router = useRouter();
  const { user, authResolved, logout } = useAuth();
  const { students } = useStudents();
  const [pollingActive, setPollingActive] = useState(true);
  const [dotCount, setDotCount] = useState(1);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animated dots for "Analisando..."
  useEffect(() => {
    dotsIntervalRef.current = setInterval(() => {
      setDotCount((d) => (d >= 3 ? 1 : d + 1));
    }, 500);
    return () => {
      if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, user, router]);

  useEffect(() => {
    if (!pollingActive || !user) return;

    const checkApproval = () => {
      const currentStudent = students.find(
        (s) => s.id === user.id || s.authUserId === user.authSubjectId,
      );

      if (currentStudent && currentStudent.status === "active") {
        setPollingActive(false);
        router.replace(
          user.role === "admin" || user.role === "coach"
            ? "/dashboard"
            : STUDENT_HOME_PATH,
        );
      }
    };

    checkApproval();

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(checkApproval, 30_000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollingActive, user, students, router]);

  if (!authResolved || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
      {/* CSS particle field */}
      <style>{`
        @keyframes float-a { 0%,100%{transform:translateY(0) scale(1);opacity:.18} 50%{transform:translateY(-32px) scale(1.4);opacity:.45} }
        @keyframes float-b { 0%,100%{transform:translateY(0) scale(1);opacity:.12} 60%{transform:translateY(-24px) scale(1.2);opacity:.35} }
        @keyframes float-c { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.10} 50%{transform:translateY(-18px) rotate(180deg);opacity:.30} }
        @keyframes shimmer-gold { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse-ring { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:.15;transform:scale(1.6)} }
        .particle { position:absolute; border-radius:50%; pointer-events:none; }
        .p1{width:6px;height:6px;background:#EAB308;left:12%;top:18%;animation:float-a 6s ease-in-out infinite;}
        .p2{width:4px;height:4px;background:#EAB308;left:82%;top:30%;animation:float-b 7.5s ease-in-out infinite 1s;}
        .p3{width:3px;height:3px;background:#ca8a04;left:25%;top:72%;animation:float-a 9s ease-in-out infinite 2s;}
        .p4{width:5px;height:5px;background:#EAB308;left:70%;top:80%;animation:float-b 8s ease-in-out infinite 0.5s;}
        .p5{width:3px;height:3px;background:#fbbf24;left:48%;top:10%;animation:float-c 10s ease-in-out infinite 3s;}
        .p6{width:4px;height:4px;background:#ca8a04;left:90%;top:55%;animation:float-a 7s ease-in-out infinite 1.5s;}
        .p7{width:2px;height:2px;background:#EAB308;left:5%;top:50%;animation:float-b 11s ease-in-out infinite 4s;}
        .p8{width:3px;height:3px;background:#fbbf24;left:60%;top:40%;animation:float-c 8.5s ease-in-out infinite 2.5s;}
        .shimmer-gold {
          background: linear-gradient(90deg, #EAB308 0%, #fef08a 40%, #EAB308 60%, #ca8a04 100%);
          background-size: 200% auto;
          animation: shimmer-gold 3s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pulse-ring {
          animation: pulse-ring 2.5s cubic-bezier(.4,0,.6,1) infinite;
        }
      `}</style>

      {/* Particle field */}
      <div aria-hidden className="pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`particle p${i + 1}`} />
        ))}
      </div>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p className="shimmer-gold text-[11px] font-black tracking-[0.3em] uppercase">
            WILL TREINOS PRO
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-zinc-950/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        >
          {/* Status animado */}
          <div className="mb-7 flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              {/* Pulse rings */}
              <div className="pulse-ring absolute h-20 w-20 rounded-full border border-amber-500/30" />
              <div
                className="pulse-ring absolute h-16 w-16 rounded-full border border-amber-500/20"
                style={{ animationDelay: "0.4s" }}
              />
              {/* Clock icon animated */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-amber-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </motion.div>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-black text-white">
                Analisando seu perfil
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dotCount}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {".".repeat(dotCount)}
                  </motion.span>
                </AnimatePresence>
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                Tempo médio de aprovação: algumas horas
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 py-2.5 px-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-amber-400">Aguardando aprovação</span>
          </div>

          {/* Feature preview — horizontal scroll */}
          <div className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              O que te espera
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {FEATURE_CARDS.map((card) => (
                <motion.div
                  key={card.title}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex min-w-[130px] flex-shrink-0 flex-col gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-3"
                >
                  <span className="text-xl leading-none">{card.icon}</span>
                  <p className="text-[11px] font-black text-white leading-tight">{card.title}</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <motion.a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            data-testid="whatsapp-coach-btn"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 py-3 text-sm font-black text-green-400 transition hover:bg-green-500/18"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.121 1.534 5.859L.057 23.997l6.304-1.654C8.084 23.476 10 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.893c-1.854 0-3.596-.505-5.087-1.384l-.364-.216-3.742.982.999-3.648-.237-.375C2.607 15.697 2.107 13.906 2.107 12 2.107 6.518 6.518 2.107 12 2.107S21.893 6.518 21.893 12 17.482 21.893 12 21.893z" />
            </svg>
            Falar com o coach
          </motion.a>

          {/* Logout */}
          <button
            type="button"
            data-testid="logout-btn"
            onClick={() => logout()}
            className="w-full rounded-xl border border-zinc-800 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-zinc-600 hover:text-white"
          >
            Sair
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-[11px] text-zinc-600"
        >
          A página atualiza automaticamente a cada 30 segundos
        </motion.p>
      </div>
    </div>
  );
}
