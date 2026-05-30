"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, Sun, Cloud, Wind, Thermometer, AlertTriangle, X, CheckCircle2, Loader2, CloudLightning } from "lucide-react";
import { useLessons } from "@/context/LessonsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { localDateISO } from "@/lib/dateUtils";
import type { CourtForecastResult, HourlySlot } from "@/app/api/weather/court/route";

type LessonRainRisk = {
  lessonId: string;
  title: string;
  startTime: string;
  date: string;
  maxPrecipProb: number;
  categoryColor: string;
};

let cachedForecast: { data: CourtForecastResult; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function weatherIcon(slot: HourlySlot | undefined, size = 16) {
  if (!slot) return <Cloud size={size} className="text-zinc-500" />;
  if (slot.precipProb > 60 || slot.weatherCode >= 51) return <CloudRain size={size} className="text-blue-400" />;
  if (slot.weatherCode >= 95) return <CloudLightning size={size} className="text-violet-400" />;
  if (slot.weatherCode >= 45) return <Cloud size={size} className="text-zinc-400" />;
  return <Sun size={size} className="text-yellow-400" />;
}

function precipBar(prob: number) {
  const color =
    prob > 70 ? "bg-blue-500" : prob > 40 ? "bg-blue-400/70" : "bg-blue-300/40";
  return (
    <div className="relative h-1 w-full rounded-full bg-zinc-800">
      <div className={`absolute left-0 top-0 h-full rounded-full ${color} transition-all`} style={{ width: `${prob}%` }} />
    </div>
  );
}

export default function CourtWeatherPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { lessons, updateLesson } = useLessons();
  const { getCategory } = useCatalog();

  const [forecast, setForecast] = useState<CourtForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (cachedForecast && Date.now() - cachedForecast.fetchedAt < CACHE_TTL) {
      setForecast(cachedForecast.data);
      return;
    }
    setLoading(true);
    fetch("/api/weather/court")
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<CourtForecastResult>;
      })
      .then((data) => {
        if (!data || "error" in data) return;
        cachedForecast = { data, fetchedAt: Date.now() };
        setForecast(data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Find upcoming lessons (today + tomorrow) with rain risk
  const lessonRisks = useMemo((): LessonRainRisk[] => {
    if (!forecast) return [];
    const today = localDateISO();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    return lessons
      .filter(
        (l) =>
          l.status === "scheduled" &&
          (l.date === today || l.date === tomorrowStr)
      )
      .flatMap((l) => {
        const lessonHour = l.startTime?.slice(0, 2);
        const datePrefix = l.date;
        const slots =
          l.date === today ? forecast.today : forecast.tomorrow;
        const relevant = slots.filter(
          (s) => s.time.startsWith(datePrefix) && s.time.slice(11, 13) === lessonHour
        );
        const maxPrecip = Math.max(0, ...relevant.map((s) => s.precipProb));
        if (maxPrecip < 50) return [];
        const cat = getCategory(l.categoryId);
        return [
          {
            lessonId: l.id,
            title: l.title || cat?.name || "Aula",
            startTime: l.startTime,
            date: l.date,
            maxPrecipProb: maxPrecip,
            categoryColor: cat?.color ?? "#EAB308",
          },
        ];
      })
      .sort((a, b) => b.maxPrecipProb - a.maxPrecipProb);
  }, [forecast, lessons, getCategory]);

  // Current conditions — highest precip hour within ±2h window
  const currentSlot = useMemo(() => {
    if (!forecast?.today) return undefined;
    const nowH = new Date().getHours();
    return forecast.today.find((s) => {
      const h = parseInt(s.time.slice(11, 13));
      return Math.abs(h - nowH) <= 1;
    });
  }, [forecast]);

  async function handleCancelLesson(risk: LessonRainRisk) {
    if (!user) return;
    setCancellingId(risk.lessonId);
    try {
      await updateLesson(risk.lessonId, { status: "cancelled" });

      // Notify enrolled students via push
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (session?.access_token) {
        const lesson = lessons.find((l) => l.id === risk.lessonId);
        await fetch("/api/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            payload: {
              title: `⛈️ Aula cancelada por chuva`,
              body: `${risk.title} ${risk.date === localDateISO() ? "hoje" : "amanhã"} às ${risk.startTime} foi cancelada. Solicite reposição no app!`,
              url: "/dashboard",
              icon: "/icons/icon-192.png",
            },
            targetRole: "aluno",
          }),
        });
      }

      toast(`✅ ${risk.title} cancelada. Notificações enviadas.`);
    } catch {
      toast("Erro ao cancelar aula.");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
        <span className="text-xs text-zinc-600">Carregando clima da quadra…</span>
      </div>
    );
  }

  if (!forecast || dismissed) return null;

  const hasRainRisk = lessonRisks.length > 0;
  const borderColor = hasRainRisk ? "border-blue-500/40" : "border-zinc-800/60";
  const bgColor = hasRainRisk ? "bg-blue-950/40" : "bg-zinc-950/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border ${borderColor} ${bgColor} p-4 backdrop-blur-md`}
    >
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-full p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label="Fechar widget de clima"
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${hasRainRisk ? "border-blue-500/35 bg-blue-500/10" : "border-zinc-700/50 bg-zinc-900/60"} flex-shrink-0`}>
          {weatherIcon(currentSlot, 18)}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Clima — {forecast.label}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {currentSlot && (
              <>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  <Thermometer size={12} className="text-zinc-500" />
                  {currentSlot.temp}°C
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <CloudRain size={11} />
                  {currentSlot.precipProb}% chuva
                </span>
              </>
            )}
            {!currentSlot && <span className="text-xs text-zinc-500">Sem dados de hora atual</span>}
          </div>
        </div>
        {hasRainRisk && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-[10px] font-black text-blue-300">
            <AlertTriangle size={10} />
            Alerta
          </span>
        )}
      </div>

      {/* Hourly strip — next 6 hours */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {forecast.today
          .filter((s) => {
            const h = parseInt(s.time.slice(11, 13));
            const nowH = new Date().getHours();
            return h >= nowH && h < nowH + 6;
          })
          .slice(0, 6)
          .map((s) => (
            <div key={s.time} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-zinc-600">{s.time.slice(11, 16)}</span>
              {weatherIcon(s, 12)}
              <span className="text-[9px] font-bold text-zinc-400">{s.precipProb}%</span>
              {precipBar(s.precipProb)}
            </div>
          ))}
      </div>

      {/* Rain alerts per lesson */}
      <AnimatePresence>
        {lessonRisks.map((risk) => (
          <motion.div
            key={risk.lessonId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3 py-2.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: risk.categoryColor }} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{risk.title}</p>
                <p className="text-[10px] text-blue-300">
                  {risk.date === localDateISO() ? "Hoje" : "Amanhã"} {risk.startTime} · {risk.maxPrecipProb}% chuva
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              disabled={cancellingId === risk.lessonId}
              onClick={() => handleCancelLesson(risk)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-blue-500/35 bg-blue-500/15 px-2.5 py-1.5 text-[10px] font-black text-blue-200 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
            >
              {cancellingId === risk.lessonId ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <X size={10} />
              )}
              Cancelar + notificar
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {!hasRainRisk && (
        <div className="flex items-center gap-2 mt-1">
          <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
          <p className="text-[11px] text-emerald-300 font-bold">Sem risco de chuva nas aulas de hoje e amanhã.</p>
        </div>
      )}
    </motion.div>
  );
}
