"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Crosshair, Loader2, MapPin, Save, Trash2 } from "lucide-react";
import { getCurrentCoords } from "@/lib/geolocation";
import type { CourtLocation } from "@/context/types";

interface Props {
  current: CourtLocation | null | undefined;
  onSave: (loc: CourtLocation | null) => void;
}

export default function CourtLocationSettings({ current, onSave }: Props) {
  const [lat, setLat] = useState(current?.lat?.toString() ?? "");
  const [lng, setLng] = useState(current?.lng?.toString() ?? "");
  const [radiusM, setRadiusM] = useState(current?.radiusM?.toString() ?? "300");
  const [label, setLabel] = useState(current?.label ?? "Quadra Principal");
  const [detecting, setDetecting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDetect = async () => {
    setDetecting(true);
    const coords = await getCurrentCoords();
    if (coords) {
      setLat(coords.lat.toFixed(6));
      setLng(coords.lng.toFixed(6));
    }
    setDetecting(false);
  };

  const handleSave = () => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radiusM, 10);

    if (!lat || !lng || isNaN(parsedLat) || isNaN(parsedLng)) return;

    onSave({
      lat: parsedLat,
      lng: parsedLng,
      radiusM: isNaN(parsedRadius) ? 300 : Math.max(50, Math.min(2000, parsedRadius)),
      label: label.trim() || "Quadra Principal",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRemove = () => {
    setLat(""); setLng(""); setSaved(false);
    onSave(null);
  };

  const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#EAB308]" />
          <p className="text-[13px] font-black text-white">Localização da Quadra</p>
        </div>
        {current?.lat && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5" /> Ativa
          </span>
        )}
      </div>

      <p className="text-[11px] text-zinc-500">
        Configure as coordenadas da quadra para verificar automaticamente se o aluno está presente no check-in.
        Alunos fora do raio recebem 10 XP (treino externo) ao invés de 50 XP (na quadra).
      </p>

      {/* Label */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Nome da quadra</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Quadra Central, Ginásio Municipal…"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-600"
        />
      </div>

      {/* Detect button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleDetect}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.08] py-2.5 text-[11px] font-black text-cyan-300 transition-all hover:bg-cyan-500/15 disabled:opacity-50"
      >
        {detecting
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detectando localização…</>
          : <><Crosshair className="h-3.5 w-3.5" /> Usar minha localização atual (esteja na quadra)</>
        }
      </motion.button>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-23.550520"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-700"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-46.633308"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-700"
          />
        </div>
      </div>

      {/* Radius */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">
          Raio de check-in: <span className="text-[#EAB308]">{radiusM}m</span>
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={radiusM}
          onChange={(e) => setRadiusM(e.target.value)}
          className="w-full accent-[#EAB308]"
        />
        <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5">
          <span>50m</span>
          <span>1000m</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {current?.lat && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/15 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!hasCoords || saved}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black transition-all disabled:opacity-50 ${
            saved
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-[#EAB308]/35 bg-[#EAB308]/10 text-amber-200 hover:bg-[#EAB308]/15"
          }`}
        >
          {saved
            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Localização salva!</>
            : <><Save className="h-3.5 w-3.5" /> Salvar localização</>
          }
        </motion.button>
      </div>

      {hasCoords && (
        <p className="text-[9px] text-zinc-700 text-center">
          📍 {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)} · raio {radiusM}m
        </p>
      )}
    </div>
  );
}
