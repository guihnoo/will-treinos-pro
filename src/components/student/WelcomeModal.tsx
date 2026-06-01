"use client";

import { motion, AnimatePresence } from "framer-motion";

interface WelcomeModalProps {
  name: string;
  onClose: () => void;
}

const BULLETS = [
  { icon: "⚡", text: "Seu XP começa hoje" },
  { icon: "🎯", text: "Primeiro desafio desbloqueado" },
  { icon: "🏆", text: "Caminho para Elite aberto" },
];

export default function WelcomeModal({ name, onClose }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        onClick={onClose}
        data-testid="welcome-modal-overlay"
      >
        {/* Animated gold particle */}
        <style>{`
          @keyframes wm-float { 0%,100%{transform:translateY(0) scale(1);opacity:.25} 50%{transform:translateY(-40px) scale(1.8);opacity:.55} }
          @keyframes wm-bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-14px)} 70%{transform:translateY(-6px)} }
          .wm-particle { pointer-events:none; position:absolute; width:8px; height:8px; border-radius:50%; background:#EAB308; top:20%; left:50%; translate:-50% 0; animation:wm-float 4s ease-in-out infinite; }
          .wm-ball { animation:wm-bounce 1.4s ease-in-out infinite; display:inline-block; }
        `}</style>

        <motion.div
          key="welcome-card"
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-500/25 shadow-[0_32px_100px_rgba(0,0,0,0.9)]"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.12) 0%, #09090b 55%, #000 100%)",
          }}
          data-testid="welcome-modal-card"
        >
          {/* Gold particle at center top */}
          <div aria-hidden className="wm-particle" />

          <div className="relative px-7 pb-8 pt-10 text-center">
            {/* Volleyball emoji bouncing */}
            <div className="mb-5 text-5xl leading-none">
              <span className="wm-ball" role="img" aria-label="vôlei">🏐</span>
            </div>

            <h2 className="mb-1.5 text-xl font-black text-[#EAB308] leading-tight">
              Bem-vindo ao Will Treinos PRO,<br />
              <span className="text-white">{name}!</span>
            </h2>

            <p className="mb-6 text-sm text-zinc-400">
              Você está oficialmente na equipe.
            </p>

            {/* Bullets */}
            <ul className="mb-7 space-y-2.5 text-left">
              {BULLETS.map((b) => (
                <li
                  key={b.icon}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-2.5"
                >
                  <span className="text-lg leading-none">{b.icon}</span>
                  <span className="text-sm font-bold text-zinc-200">{b.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              data-testid="welcome-modal-cta"
              className="w-full rounded-xl bg-[#EAB308] py-3.5 text-sm font-black text-black shadow-[0_0_24px_rgba(234,179,8,0.4)] transition hover:bg-amber-400"
            >
              Começar minha jornada
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
