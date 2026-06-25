"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center px-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EAB308] opacity-[0.04] blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
        className="relative text-center max-w-lg"
        data-testid="not-found-page"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[120px] font-black leading-none tracking-tighter mb-2"
          style={{
            background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-2xl font-bold text-white mb-3">Essa página não existe</p>
          <p className="text-zinc-500 mb-10 text-base">
            Parece que você foi para fora da quadra.
          </p>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-[#EAB308] text-black px-7 py-3.5 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-shadow"
              data-testid="not-found-home-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </motion.button>
          </Link>
        </motion.div>

        {/* Decoração */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-16 right-0 text-5xl opacity-10 pointer-events-none select-none"
        >
          🏐
        </motion.div>
      </motion.div>
    </div>
  );
}
