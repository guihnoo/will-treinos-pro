"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Database, Bell, Bot, Clock, Shield, Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Check { label: string; ok: boolean | null; detail?: string }

const CRONS = [
  { path: "/api/cron/daily-reminder",     label: "Lembrete diário (08h)" },
  { path: "/api/cron/payment-reminder",   label: "Cobrança (dias 5 e 20)" },
  { path: "/api/cron/onboarding-reminder",label: "Onboarding (09h)" },
  { path: "/api/cron/monthly-report",     label: "Relatório mensal (dia 1)" },
  { path: "/api/cron/absence-reminder",   label: "Ausências (18h)" },
  { path: "/api/cron/weekly-report",      label: "Resumo semanal (sex 18h)" },
];

const ENV_CHECKS: { key: string; label: string; isPublic?: boolean }[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL",       label: "Supabase URL",         isPublic: true  },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",  label: "Supabase Anon Key",    isPublic: true  },
  { key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",   label: "VAPID Public Key",     isPublic: true  },
];

export default function SystemStatusPage() {
  const [supabase, setSupabase]   = useState<Check>({ label: "Supabase", ok: null });
  const [envVars, setEnvVars]     = useState<Check[]>([]);
  const [tables, setTables]       = useState<Check[]>([]);
  const [push, setPush]           = useState<Check>({ label: "Push Config", ok: null });
  const [aiKey, setAiKey]         = useState<Check>({ label: "Anthropic API Key", ok: null });
  const [loading, setLoading]     = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function runChecks() {
    setLoading(true);

    // 1. Env vars (public only — accessible client-side)
    const envResults: Check[] = ENV_CHECKS.map(({ key, label }) => ({
      label,
      ok: Boolean(process.env[key]),
      detail: process.env[key] ? "Configurada" : "Não encontrada",
    }));
    setEnvVars(envResults);

    // 2. Push (VAPID public key present)
    setPush({
      label: "VAPID / Push Notifications",
      ok: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      detail: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "Chave pública detectada" : "NEXT_PUBLIC_VAPID_PUBLIC_KEY ausente",
    });

    try {
      const sb = getSupabaseClient();

      // 3. Supabase connection
      const { error: pingErr } = await sb.from("app_settings").select("id").limit(1);
      setSupabase({
        label: "Supabase Connection",
        ok: !pingErr,
        detail: pingErr ? pingErr.message : "Conectado",
      });

      // 4. Critical tables
      const REQUIRED_TABLES = [
        "students", "lessons", "payments", "notifications",
        "xp_log", "push_subscriptions", "evaluations",
        "absence_requests", "reposition_requests", "lesson_ratings",
        "weekly_highlights", "coach_messages", "student_goals",
      ];
      const tableChecks: Check[] = [];
      for (const table of REQUIRED_TABLES) {
        const { error } = await sb.from(table).select("id").limit(1);
        tableChecks.push({
          label: table,
          ok: !error,
          detail: error ? `Erro: ${error.message}` : "OK",
        });
      }
      setTables(tableChecks);

      // 5. AI key — test via a simple API call
      const { data: { session } } = await sb.auth.getSession();
      if (session?.access_token) {
        const res = await fetch("/api/ai/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ test: true }),
        });
        // If 401/403 it's auth, not AI key. If 200 or 500 with json = key is configured
        setAiKey({
          label: "Anthropic API Key",
          ok: res.status !== 503,
          detail: res.status === 200 ? "Funcionando" : res.status === 503 ? "ANTHROPIC_API_KEY ausente" : "Configurada (resposta do servidor)",
        });
      } else {
        setAiKey({ label: "Anthropic API Key", ok: null, detail: "Faça login para verificar" });
      }
    } catch (e) {
      setSupabase({ label: "Supabase Connection", ok: false, detail: String(e) });
    }

    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => { runChecks(); }, []);

  const allChecks: Check[] = [supabase, push, aiKey, ...envVars, ...tables];
  const okCount     = allChecks.filter(c => c.ok === true).length;
  const failCount   = allChecks.filter(c => c.ok === false).length;
  const healthPct   = allChecks.length > 0
    ? Math.round((okCount / allChecks.filter(c => c.ok !== null).length) * 100)
    : 0;

  function StatusIcon({ ok }: { ok: boolean | null }) {
    if (ok === null) return <RefreshCw size={14} className="text-zinc-600 animate-spin" />;
    if (ok) return <CheckCircle2 size={14} className="text-emerald-400" />;
    return <XCircle size={14} className="text-red-400" />;
  }

  function Section({ title, icon: Icon, checks, color }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; checks: Check[]; color: string }) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon size={15} className={color} />
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{title}</p>
        </div>
        <div className="space-y-1.5">
          {checks.map(c => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon ok={c.ok} />
                <span className="text-xs text-zinc-300 truncate font-mono">{c.label}</span>
              </div>
              <span className={`text-[10px] flex-shrink-0 ${c.ok ? "text-emerald-500" : c.ok === false ? "text-red-400" : "text-zinc-600"}`}>
                {c.detail ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white px-4 py-8 max-w-lg mx-auto space-y-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Status do Sistema</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {lastChecked ? `Verificado às ${lastChecked.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Verificando…"}
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={loading}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Health bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-4 ${failCount === 0 ? "border-emerald-500/30 bg-emerald-500/8" : failCount <= 2 ? "border-amber-500/30 bg-amber-500/8" : "border-red-500/30 bg-red-500/8"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-white">
            {failCount === 0 ? "Sistema saudável" : `${failCount} problema${failCount !== 1 ? "s" : ""} detectado${failCount !== 1 ? "s" : ""}`}
          </span>
          <span className={`text-sm font-black ${failCount === 0 ? "text-emerald-400" : "text-amber-400"}`}>{healthPct}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${failCount === 0 ? "bg-emerald-500" : failCount <= 2 ? "bg-amber-500" : "bg-red-500"}`}
          />
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5">{okCount} de {allChecks.filter(c => c.ok !== null).length} verificações passando</p>
      </motion.div>

      {/* Sections */}
      <Section title="Conexão" icon={Database} checks={[supabase]} color="text-blue-400" />
      <Section title="Notificações Push" icon={Bell} checks={[push]} color="text-[#EAB308]" />
      <Section title="Inteligência Artificial" icon={Bot} checks={[aiKey]} color="text-violet-400" />
      <Section title="Variáveis de Ambiente" icon={Shield} checks={envVars} color="text-emerald-400" />
      <Section title="Tabelas do Banco" icon={Database} checks={tables} color="text-cyan-400" />

      {/* Crons */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-orange-400" />
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Crons Configurados</p>
        </div>
        <div className="space-y-1.5">
          {CRONS.map(c => (
            <div key={c.path} className="flex items-center gap-2">
              <Zap size={12} className="text-orange-400 flex-shrink-0" />
              <span className="text-xs text-zinc-300 flex-1 truncate">{c.label}</span>
              <span className="text-[10px] text-zinc-600 font-mono truncate">{c.path}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-zinc-700 pb-4">
        Will Treinos PRO · Sistema de diagnóstico interno
      </p>
    </div>
  );
}
