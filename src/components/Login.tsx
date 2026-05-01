"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, GraduationCap, Volleyball } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/context/types";

const ROLES: { role: Role; title: string; desc: string; icon: React.ElementType; color: string }[] = [
  { role: "admin", title: "Administrador", desc: "Gestão Total — Financeiro, Aprovações, Agenda, Feed", icon: Shield, color: "#EAB308" },
  { role: "coach", title: "Professor", desc: "Check-in de Presença, Feedback, Agenda de Aulas", icon: GraduationCap, color: "#06B6D4" },
  { role: "aluno", title: "Aluno", desc: "Meus Treinos, Feed Oficial, Performance", icon: Volleyball, color: "#8B5CF6" },
];

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EAB308] opacity-[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#8B5CF6] opacity-[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Logo Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 mb-8 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EAB308] to-[#F97316] shadow-[0_0_40px_rgba(234,179,8,0.3)] mx-auto mb-5 flex items-center justify-center"
        >
          <span className="text-3xl">🏐</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold tracking-wider"
        >
          WILL<span className="text-[#EAB308]">PRO</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-500 text-sm mt-2 tracking-wide"
        >
          Plataforma Premium de Gestão de Vôlei
        </motion.p>
      </motion.div>

      {/* Login Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md space-y-3 relative z-10"
      >
        {ROLES.map((r, i) => (
          <motion.button
            key={r.role}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => login(r.role)}
            className="w-full p-5 rounded-2xl border border-zinc-800/60 bg-[#0A0A0A] hover:bg-zinc-900/80 transition-all flex items-center gap-4 group relative overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: r.color }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${r.color}15` }}>
              <r.icon className="w-6 h-6" style={{ color: r.color }} />
            </div>
            <div className="flex-1 text-left">
              <span className="font-bold text-lg text-white group-hover:text-[#EAB308] transition-colors block">{r.title}</span>
              <span className="text-xs text-zinc-500">{r.desc}</span>
            </div>
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 group-hover:text-[#EAB308] transition-colors"
              whileHover={{ x: 4 }}
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-zinc-700 text-xs mt-8 relative z-10 tracking-wider"
      >
        © 2026 Will Treinos PRO — v2.0
      </motion.p>
    </div>
  );
}
