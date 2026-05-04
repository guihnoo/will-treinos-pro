'use client';

import * as Sentry from "@sentry/nextjs";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Global error boundary for React Server Components.
 * Captures rendering errors and sends them to Sentry.
 * This page is shown when an error occurs in the root layout or any page.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // Report error to Sentry
  Sentry.captureException(error);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="pt-BR">
      <body className="bg-[#000000] text-white">
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-gradient-to-b from-[#0A0A0A] to-[#050505] p-8 text-center shadow-2xl"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20"
            >
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </motion.div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-black text-white">Oops!</h1>

            {/* Message */}
            <p className="mb-6 text-zinc-400">
              Algo deu errado. Nossos engenheiros foram notificados e estão investigando.
            </p>

            {/* Dev Details */}
            {isDev && error.message && (
              <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 text-left">
                <p className="text-xs font-mono text-zinc-400">
                  <span className="block text-red-400 font-bold mb-1">Erro:</span>
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-zinc-500 mt-2">
                    <span className="block text-zinc-400 font-bold mb-1">Digest:</span>
                    {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#EAB308] to-[#F97316] px-4 py-3 font-bold text-black transition hover:opacity-90"
              >
                <RotateCw className="h-4 w-4" />
                Tentar Novamente
              </motion.button>
              <motion.a
                whileTap={{ scale: 0.95 }}
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 font-semibold text-white transition hover:bg-zinc-900/50"
              >
                Ir para Início
              </motion.a>
            </div>

            {/* Footer */}
            <p className="mt-4 text-xs text-zinc-500">
              ID do erro: {error.digest || "unknown"}
            </p>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
