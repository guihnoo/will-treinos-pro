"use client";

import React, { useEffect, useMemo, useState } from "react";


import { CloudRain, Sun, Cloud, Wind, Clock, Sunset } from "lucide-react";
import { motion } from "framer-motion";

// Use real weather via Open-Meteo API and Geolocation, plus a Live Clock.
export default function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const [weather, setWeather] = useState<{ temp: number; condition: string; wind: number } | null>(null);
  const [time, setTime] = useState<string>("");
  const [clientHour, setClientHour] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("Localizando...");

  // Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClientHour(now.getHours());
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Weather effect
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          const w = data.current_weather;
          let condition = "Céu Limpo";
          if (w.weathercode >= 1 && w.weathercode <= 3) condition = "Parcialmente Nublado";
          if (w.weathercode >= 45 && w.weathercode <= 48) condition = "Nevoeiro";
          if (w.weathercode >= 51 && w.weathercode <= 67) condition = "Chuva";
          if (w.weathercode >= 71) condition = "Neve";
          if (w.weathercode >= 95) condition = "Tempestade";

          setWeather({
            temp: Math.round(w.temperature),
            condition,
            wind: Math.round(w.windspeed)
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationName("Seu Local");
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to Rio de Janeiro if location is denied
          setLocationName("Rio de Janeiro");
          fetchWeather(-22.9068, -43.1729);
        }
      );
    } else {
      setLocationName("Rio de Janeiro");
      fetchWeather(-22.9068, -43.1729);
    }
  }, []);

  const hour = useMemo(() => clientHour ?? 12, [clientHour]);
  const dayPeriod = hour >= 0 && hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
  const getMoonIllumination = () => {
    const now = new Date();
    const base = new Date("2001-01-24T13:07:00Z").getTime();
    const synodicMonth = 29.530588853 * 24 * 60 * 60 * 1000;
    const age = ((now.getTime() - base) % synodicMonth + synodicMonth) % synodicMonth;
    const phase = age / synodicMonth;
    const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
    return Math.max(0.06, Math.min(0.98, illumination));
  };
  const moonIllumination = useMemo(() => getMoonIllumination(), [clientHour]);

  const MoonPhaseIcon = ({ size = 16 }: { size?: number }) => {
    const litWidth = 2 + moonIllumination * 20;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-[0_0_12px_rgba(148,163,184,0.45)]">
        <circle cx="12" cy="12" r="9.5" fill="#0b1221" stroke="rgba(148,163,184,0.65)" strokeWidth="1.2" />
        <ellipse cx="12" cy="12" rx={litWidth / 2} ry="9.2" fill="#E2E8F0" />
      </svg>
    );
  };
  const SunBurstIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-[0_0_12px_rgba(234,179,8,0.45)]">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="4.6" fill="url(#sunCore)" />
      <g stroke="#FACC15" strokeWidth="1.4" strokeLinecap="round">
        <line x1="12" y1="1.6" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.4" />
        <line x1="1.6" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.4" y2="12" />
        <line x1="4.2" y1="4.2" x2="5.9" y2="5.9" />
        <line x1="18.1" y1="18.1" x2="19.8" y2="19.8" />
        <line x1="18.1" y1="5.9" x2="19.8" y2="4.2" />
        <line x1="4.2" y1="19.8" x2="5.9" y2="18.1" />
      </g>
    </svg>
  );

  const Icon = weather?.condition === "Chuva" ? CloudRain :
               weather?.condition === "Céu Limpo" ? (dayPeriod === "night" ? null : dayPeriod === "afternoon" ? Sunset : Sun) : Cloud;
  const iconColor = weather?.condition === "Céu Limpo" ? (dayPeriod === "night" ? "#E2E8F0" : "#EAB308") :
                    weather?.condition === "Chuva" ? "#06B6D4" : "#9CA3AF";

  const periodLabel = dayPeriod === "morning" ? "Manhã Solar" : dayPeriod === "afternoon" ? "Fim de Tarde" : "Noite Lunar";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${
          dayPeriod === "night" ? "bg-[#06080f]/75" : dayPeriod === "afternoon" ? "bg-[#100d08]/70" : "bg-black/55"
        }`}
      >
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
          <Clock className="w-3 h-3 text-[#EAB308]" />
          {time || "--:--:--"}
        </span>
        <span className="h-3 w-px bg-zinc-700/80" />
        {!weather ? (
          <span className="text-[10px] font-bold text-zinc-500">Carregando clima</span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {dayPeriod === "night" && weather.condition === "Céu Limpo" ? (
              <motion.span animate={{ rotate: [0, 1.2, -1.2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                <MoonPhaseIcon size={14} />
              </motion.span>
            ) : weather.condition === "Céu Limpo" && dayPeriod !== "night" ? (
              <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SunBurstIcon size={14} />
              </motion.span>
            ) : Icon ? (
              <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
            ) : null}
            <span className="text-[11px] font-bold text-white">{weather.temp}°C</span>
            <span className="hidden sm:inline text-[10px] text-zinc-400">{periodLabel}</span>
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-wrap md:flex-nowrap items-center gap-4 p-2 px-4 rounded-xl bg-black/60 border border-zinc-800/60 backdrop-blur-md shadow-sm">
      
      {/* Live Time */}
      <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
        <Clock className="w-4 h-4 text-[#EAB308]" />
        <span className="font-bold text-white tracking-widest text-sm font-mono">{time || "--:--:--"}</span>
      </div>

      {/* Weather */}
      {!weather ? (
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-5 h-5 bg-zinc-800 rounded-full" />
          <div className="w-16 h-4 bg-zinc-800 rounded-md" />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {dayPeriod === "night" && weather.condition === "Céu Limpo" ? (
              <motion.span animate={{ rotate: [0, 1.2, -1.2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                <MoonPhaseIcon size={18} />
              </motion.span>
            ) : weather.condition === "Céu Limpo" && dayPeriod !== "night" ? (
              <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SunBurstIcon size={18} />
              </motion.span>
            ) : Icon ? (
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            ) : null}
            <span className="font-bold text-white text-sm">{weather.temp}°C</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 border-l border-zinc-800 pl-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{locationName}</span>
              <span className="text-xs text-zinc-300 truncate max-w-[100px] leading-tight">{weather.condition}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md ml-1">
              <Wind className="w-3 h-3" /> {weather.wind} km/h
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
