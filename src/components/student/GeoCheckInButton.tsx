"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Home, Loader2, MapPin, X } from "lucide-react";
import { checkIfAtCourt, type GeoCheckResult } from "@/lib/geolocation";
import type { CourtLocation } from "@/context/types";

type Props = {
  courtLocation?: CourtLocation | null;
  onCheckIn: (isAtCourt: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type Phase = "idle" | "detecting" | "result";

export default function GeoCheckInButton({
  courtLocation,
  onCheckIn,
  disabled,
  className = "",
  children,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [geoResult, setGeoResult] = useState<GeoCheckResult | null>(null);

  const handlePress = async () => {
    if (disabled || phase !== "idle") return;

    // No court configured → normal check-in
    if (!courtLocation?.lat) {
      onCheckIn(true);
      return;
    }

    setPhase("detecting");
    const result = await checkIfAtCourt(courtLocation);
    setGeoResult(result);
    setPhase("result");

    // Auto-proceed after showing result for 2s
    const isAtCourt = result.status === "at_court" || result.status === "permission_denied" || result.status === "unavailable";
    setTimeout(() => {
      onCheckIn(isAtCourt);
      setPhase("idle");
      setGeoResult(null);
    }, 2000);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handlePress}
        disabled={disabled || phase === "detecting"}
        className={className}
      >
        {phase === "detecting" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Verificando localização…</>
        ) : (
          children ?? <><MapPin className="h-4 w-4" /> Check-in</>
        )}
      </motion.button>

      {/* Geo result overlay */}
      <AnimatePresence>
        {phase === "result" && geoResult && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className={`absolute bottom-full mb-2 left-0 right-0 rounded-xl border px-3 py-2.5 text-center z-10 ${
              geoResult.status === "at_court"
                ? "border-emerald-500/35 bg-emerald-500/10"
                : geoResult.status === "outside"
                ? "border-amber-500/35 bg-amber-500/10"
                : "border-white/[0.08] bg-zinc-900"
            }`}
          >
            {geoResult.status === "at_court" && (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-black text-emerald-300">Você está na quadra! ✅</p>
                <p className="text-[9px] text-zinc-500">{geoResult.distanceM}m de distância · +50 XP</p>
              </>
            )}
            {geoResult.status === "outside" && (
              <>
                <Home className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <p className="text-[11px] font-black text-amber-300">Treino externo detectado 🏠</p>
                <p className="text-[9px] text-zinc-500">{geoResult.distanceM}m da quadra · +10 XP</p>
              </>
            )}
            {(geoResult.status === "permission_denied" || geoResult.status === "unavailable") && (
              <>
                <X className="h-4 w-4 text-zinc-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-zinc-300">Localização não disponível</p>
                <p className="text-[9px] text-zinc-500">Check-in registrado normalmente</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
