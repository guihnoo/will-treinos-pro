"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  Star,
  MessageCircle,
  Trophy,
  Zap,
  Heart,
  Gift,
  BarChart3,
  Check,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  fetchStudentPrefs,
  saveStudentPrefs,
  defaultPrefs,
  type NotificationPrefs,
  type NotificationPrefKey,
} from "@/lib/notificationPrefs";
import { useToast } from "@/components/Toast";

type PrefRow = {
  key: NotificationPrefKey;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

const PREF_ROWS: PrefRow[] = [
  {
    key: "lesson_reminders",
    label: "Lembretes de aula",
    description: "Aviso antes do início de cada treino",
    icon: Calendar,
    color: "text-amber-400",
  },
  {
    key: "eval_feedback",
    label: "Feedback de avaliação",
    description: "Quando o coach publicar sua nota",
    icon: Star,
    color: "text-yellow-400",
  },
  {
    key: "coach_messages",
    label: "Mensagens do coach",
    description: "Comunicados e recados diretos",
    icon: MessageCircle,
    color: "text-blue-400",
  },
  {
    key: "weekly_challenge",
    label: "Desafio semanal",
    description: "Novo desafio toda segunda-feira",
    icon: Trophy,
    color: "text-orange-400",
  },
  {
    key: "weekly_highlight",
    label: "Destaque da semana",
    description: "Reconhecimento por desempenho",
    icon: Zap,
    color: "text-purple-400",
  },
  {
    key: "fomo_reminder",
    label: "Lembrete de inatividade",
    description: "Aviso quando você ficar alguns dias sem treinar",
    icon: Heart,
    color: "text-red-400",
  },
  {
    key: "birthday_wishes",
    label: "Parabéns de aniversário",
    description: "Mensagem especial no seu dia",
    icon: Gift,
    color: "text-pink-400",
  },
  {
    key: "monthly_summary",
    label: "Resumo mensal",
    description: "Relatório do seu mês de treinos",
    icon: BarChart3,
    color: "text-emerald-400",
  },
];

type Props = {
  studentId: string;
};

export default function NotificationPreferencesPanel({ studentId }: Props) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs(studentId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }

    fetchStudentPrefs(sb, studentId).then((fetched) => {
      if (fetched) setPrefs(fetched);
      else setPrefs(defaultPrefs(studentId));
      setLoading(false);
    });
  }, [studentId]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleToggle = useCallback(
    (key: NotificationPrefKey) => {
      const updated = { ...prefs, [key]: !prefs[key] };
      setPrefs(updated);

      // Debounced auto-save (800ms)
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        const sb = getSupabaseClient();
        if (!sb) { setSaving(false); return; }

        const ok = await saveStudentPrefs(sb, {
          student_id: studentId,
          lesson_reminders: updated.lesson_reminders,
          eval_feedback: updated.eval_feedback,
          coach_messages: updated.coach_messages,
          weekly_challenge: updated.weekly_challenge,
          weekly_highlight: updated.weekly_highlight,
          fomo_reminder: updated.fomo_reminder,
          birthday_wishes: updated.birthday_wishes,
          monthly_summary: updated.monthly_summary,
        });
        setSaving(false);
        if (ok) {
          toast("Preferencias de notificacao salvas.");
        } else {
          toast("Erro ao salvar preferencias.");
        }
      }, 800);
    },
    [prefs, studentId, toast]
  );

  const allActive = PREF_ROWS.every((r) => prefs[r.key]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-zinc-900/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="notification-preferences-panel">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Notificacoes push
          </span>
        </div>
        <AnimatePresence>
          {saving && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Salvando…
            </motion.span>
          )}
          {!saving && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"
            >
              <Check className="h-3 w-3" />
              {allActive ? "Todas ativas" : "Personalizado"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Preference toggles */}
      <motion.div
        layout
        className="space-y-2"
      >
        {PREF_ROWS.map((row) => {
          const enabled = prefs[row.key];
          const Icon = row.icon;
          return (
            <motion.button
              key={row.key}
              layout
              type="button"
              onClick={() => handleToggle(row.key)}
              data-testid={`pref-toggle-${row.key}`}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                enabled
                  ? "border-zinc-700/60 bg-zinc-900/60"
                  : "border-zinc-800/40 bg-zinc-900/20 opacity-60"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon */}
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  enabled ? "bg-zinc-800" : "bg-zinc-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${enabled ? row.color : "text-zinc-600"}`} />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold leading-tight ${enabled ? "text-zinc-100" : "text-zinc-500"}`}>
                  {row.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{row.description}</p>
              </div>

              {/* Switch */}
              <div
                className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${
                  enabled ? "bg-amber-500" : "bg-zinc-700"
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                  animate={{ left: enabled ? "calc(100% - 1.125rem)" : "0.125rem" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
