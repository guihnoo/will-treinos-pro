"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { motion } from "framer-motion";
import { ApprovalQueueIndicator } from "@/components/ApprovalQueueIndicator";

export const dynamic = "force-dynamic";

export default function AguardandoPage() {
  const router = useRouter();
  const { user, authResolved, logout } = useAuth();
  const { students } = useStudents();
  const [pollingActive, setPollingActive] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, user, router]);

  useEffect(() => {
    if (!pollingActive || !user) return;

    const checkApproval = () => {
      const currentStudent = students.find((s) => s.id === user.id || s.authUserId === user.authSubjectId);

      if (currentStudent && currentStudent.status === "active") {
        setPollingActive(false);
        router.replace(user.role === "coach" ? "/dashboard" : "/treinos");
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
        <div className="h-10 w-10 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Queue Indicator */}
        <ApprovalQueueIndicator />

        {/* Main Content */}
        <div className="text-center">
        {/* Loading animation */}
        <div className="mb-8 flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-zinc-800 border-t-[#EAB308] rounded-full"
          />
        </div>

        {/* Content */}
        <h1 className="text-3xl font-black mb-3">Pedido enviado!</h1>
        <p className="text-zinc-300 mb-2">
          Seu cadastro foi <span className="text-[#EAB308] font-bold">recebido com sucesso</span>.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          O administrador irá analisar seu pedido e você receberá acesso em breve. A página será atualizada automaticamente a cada 30 segundos.
        </p>

        {/* Status box */}
        <div className="rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/10 p-6 mb-8">
          <div className="flex items-center gap-3 justify-center mb-3">
            <div className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" />
            <span className="text-sm font-bold text-[#EAB308]">Aguardando aprovação</span>
          </div>
          <p className="text-xs text-zinc-400">
            Você será notificado assim que o acesso for liberado.
          </p>
        </div>

        {/* Help text */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs font-bold text-zinc-300 mb-2">O que acontece agora?</p>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>✓ Seu perfil está aguardando análise do administrador</li>
            <li>✓ Você receberá acesso quando for aprovado</li>
            <li>✓ A página atualiza automaticamente</li>
            <li>✓ Você pode fechar e voltar quando quiser</li>
          </ul>
        </div>

        {/* Actions */}
        <button
          onClick={() => logout()}
          className="w-full py-2.5 rounded-lg border border-zinc-700 text-sm font-bold text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          Sair
        </button>
        </div>
      </motion.div>
    </div>
  );
}
