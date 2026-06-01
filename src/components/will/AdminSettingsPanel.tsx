"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  DollarSign,
  Bell,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import {
  MODAL_BADGE_ENTER,
  MODAL_HEADER_ENTER,
  MODAL_OVERLAY_FADE,
  PRESS_SCALE,
  SPRING_PREMIUM,
} from "@/components/ui/motionTokens";
import { useAppConfig } from "@/context/AppConfigContext";
import { useToast } from "@/components/Toast";
import CourtLocationSettings from "./CourtLocationSettings";
import type { AppConfig, WorkingHoursDay } from "@/context/types";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const DEFAULT_WORKING_HOURS: Record<string, WorkingHoursDay> = {
  "0": { open: "08:00", close: "18:00", closed: true },
  "1": { open: "07:00", close: "21:00", closed: false },
  "2": { open: "07:00", close: "21:00", closed: false },
  "3": { open: "07:00", close: "21:00", closed: false },
  "4": { open: "07:00", close: "21:00", closed: false },
  "5": { open: "07:00", close: "21:00", closed: false },
  "6": { open: "08:00", close: "18:00", closed: false },
};

const PAYMENT_DAY_OPTIONS = [1, 5, 10, 15, 20, 25] as const;
const PIX_KEY_TYPES = [
  { value: "email", label: "E-mail" },
  { value: "cpf", label: "CPF/CNPJ" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave aleatória" },
] as const;

// ─── Section Accordion ────────────────────────────────────────────────────────

interface AccordionSectionProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ icon, label, badge, open, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        data-testid={`settings-tab-${label.toLowerCase().replace(/\s/g, "-")}`}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAB308]/10 text-[#EAB308]">
            {icon}
          </div>
          <p className="text-sm font-bold text-white">{label}</p>
          {badge && (
            <span className="rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.05]">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">{children}</p>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-600"
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        {description && <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[#EAB308]" : "bg-zinc-800"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AdminSettingsPanel({ onClose }: Props) {
  const { appConfig, updateAppConfig } = useAppConfig();
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openSection, setOpenSection] = useState<"academia" | "financeiro" | "notificacoes" | "localizacao">("academia");

  // ── Local state (mirrors appConfig) ──────────────────────────────────────
  const [academyName, setAcademyName] = useState(appConfig.academyName ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(appConfig.welcomeMessage ?? "");
  const [workingHours, setWorkingHours] = useState<Record<string, WorkingHoursDay>>(
    appConfig.workingHours ?? DEFAULT_WORKING_HOURS
  );

  const [defaultMonthlyValue, setDefaultMonthlyValue] = useState(
    appConfig.defaultMonthlyValue?.toString() ?? ""
  );
  const [defaultPaymentDay, setDefaultPaymentDay] = useState<number>(
    appConfig.defaultPaymentDay ?? 10
  );
  const [pixKey, setPixKey] = useState(appConfig.pixKey ?? "");
  const [pixKeyType, setPixKeyType] = useState<AppConfig["pixKeyType"]>(appConfig.pixKeyType ?? "email");
  const [pixOwnerName, setPixOwnerName] = useState(appConfig.pixOwnerName ?? "");

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(
    appConfig.dailyReminderEnabled ?? false
  );
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(
    appConfig.paymentReminderEnabled ?? false
  );
  const [welcomePushMessage, setWelcomePushMessage] = useState(
    appConfig.welcomePushMessage ?? ""
  );

  // ── Debounced save ─────────────────────────────────────────────────────────
  const save = useCallback(
    (patch: Partial<typeof appConfig>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateAppConfig(patch);
        toast("Configurações salvas", "success");
      }, 500);
    },
    [updateAppConfig, toast]
  );

  // Academia fields
  const handleAcademyName = (v: string) => {
    setAcademyName(v);
    save({ academyName: v });
  };
  const handleWelcomeMessage = (v: string) => {
    setWelcomeMessage(v);
    save({ welcomeMessage: v });
  };
  const handleWorkingHours = (day: string, field: keyof WorkingHoursDay, value: string | boolean) => {
    const updated = {
      ...workingHours,
      [day]: { ...workingHours[day]!, [field]: value } as WorkingHoursDay,
    };
    setWorkingHours(updated);
    save({ workingHours: updated });
  };

  // Financeiro fields
  const handleDefaultMonthlyValue = (v: string) => {
    setDefaultMonthlyValue(v);
    const parsed = parseFloat(v);
    if (!isNaN(parsed) && parsed >= 0) save({ defaultMonthlyValue: parsed });
  };
  const handleDefaultPaymentDay = (v: number) => {
    setDefaultPaymentDay(v);
    save({ defaultPaymentDay: v });
  };
  const handlePixKey = (v: string) => {
    setPixKey(v);
    save({ pixKey: v });
  };
  const handlePixKeyType = (v: typeof pixKeyType) => {
    setPixKeyType(v);
    save({ pixKeyType: v });
  };
  const handlePixOwnerName = (v: string) => {
    setPixOwnerName(v);
    save({ pixOwnerName: v });
  };

  // Notifications fields
  const handleDailyReminder = (v: boolean) => {
    setDailyReminderEnabled(v);
    save({ dailyReminderEnabled: v });
  };
  const handlePaymentReminder = (v: boolean) => {
    setPaymentReminderEnabled(v);
    save({ paymentReminderEnabled: v });
  };
  const handleWelcomePushMessage = (v: string) => {
    setWelcomePushMessage(v);
    save({ welcomePushMessage: v });
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleSection = (s: typeof openSection) =>
    setOpenSection((prev) => (prev === s ? "academia" : s));

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      aria-label="Configurações do Admin"
      className={`fixed inset-0 z-[250] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#050505]/95 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <motion.div
            {...MODAL_HEADER_ENTER}
            transition={SPRING_PREMIUM}
            className="mb-4 shrink-0 flex items-center justify-between p-5 pb-0"
          >
            <div>
              <motion.p
                {...MODAL_BADGE_ENTER}
                transition={SPRING_PREMIUM}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]"
              >
                Configurações
              </motion.p>
              <h3 className="text-lg font-black text-white mt-0.5">Painel do Admin</h3>
            </div>
            <motion.button
              whileTap={PRESS_SCALE}
              type="button"
              onClick={onClose}
              data-testid="btn-close-settings"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-200" />
            </motion.button>
          </motion.div>

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5 space-y-3 mt-1`}>
            {/* ── Aba 1 — Academia ─────────────────────────────────────────── */}
            <AccordionSection
              icon={<Building2 className="h-4 w-4" />}
              label="Academia"
              open={openSection === "academia"}
              onToggle={() => toggleSection("academia")}
            >
              <div>
                <Label>Nome da academia</Label>
                <Input
                  value={academyName}
                  onChange={handleAcademyName}
                  placeholder="Ex: Will Treinos PRO"
                  maxLength={80}
                />
              </div>

              <div>
                <Label>Mensagem de boas-vindas (max 200 chars)</Label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => handleWelcomeMessage(e.target.value)}
                  placeholder="Mensagem exibida para novos alunos ao entrar na plataforma…"
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-600 resize-none"
                />
                <p className="text-right text-[10px] text-zinc-600 mt-0.5">{welcomeMessage.length}/200</p>
              </div>

              <div>
                <Label>Horários de funcionamento</Label>
                <div className="space-y-2">
                  {DAYS.map((dayLabel, idx) => {
                    const key = String(idx);
                    const day = workingHours[key] ?? DEFAULT_WORKING_HOURS[key]!;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                      >
                        <p className="w-8 text-[11px] font-bold text-zinc-400 flex-shrink-0">{dayLabel}</p>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!day.closed}
                          onClick={() => handleWorkingHours(key, "closed", !day.closed)}
                          className={`flex-shrink-0 h-5 w-9 rounded-full transition-colors ${
                            !day.closed ? "bg-[#EAB308]" : "bg-zinc-800"
                          }`}
                        >
                          <span
                            className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ml-0.5 ${
                              !day.closed ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        {!day.closed ? (
                          <>
                            <input
                              type="time"
                              value={day.open}
                              onChange={(e) => handleWorkingHours(key, "open", e.target.value)}
                              className="rounded-lg border border-white/[0.07] bg-zinc-900 px-2 py-1 text-[11px] text-white outline-none focus:border-[#EAB308]/30 transition-all w-[90px]"
                            />
                            <span className="text-zinc-600 text-[10px]">até</span>
                            <input
                              type="time"
                              value={day.close}
                              onChange={(e) => handleWorkingHours(key, "close", e.target.value)}
                              className="rounded-lg border border-white/[0.07] bg-zinc-900 px-2 py-1 text-[11px] text-white outline-none focus:border-[#EAB308]/30 transition-all w-[90px]"
                            />
                          </>
                        ) : (
                          <p className="text-[10px] text-zinc-600 italic">Fechado</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionSection>

            {/* ── Aba 2 — Financeiro ─────────────────────────────────────── */}
            <AccordionSection
              icon={<DollarSign className="h-4 w-4" />}
              label="Financeiro"
              open={openSection === "financeiro"}
              onToggle={() => toggleSection("financeiro")}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mensalidade padrão (R$)</Label>
                  <Input
                    type="number"
                    value={defaultMonthlyValue}
                    onChange={handleDefaultMonthlyValue}
                    placeholder="250"
                  />
                </div>
                <div>
                  <Label>Dia de vencimento padrão</Label>
                  <select
                    value={defaultPaymentDay}
                    onChange={(e) => handleDefaultPaymentDay(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#EAB308]/40 transition-all"
                  >
                    {PAYMENT_DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Tipo da chave PIX</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PIX_KEY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handlePixKeyType(t.value as typeof pixKeyType)}
                      className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
                        pixKeyType === t.value
                          ? "border-[#EAB308]/50 bg-[#EAB308]/15 text-amber-300"
                          : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/15"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Chave PIX</Label>
                <Input
                  value={pixKey}
                  onChange={handlePixKey}
                  placeholder={
                    pixKeyType === "email"
                      ? "seuemail@exemplo.com"
                      : pixKeyType === "cpf"
                      ? "000.000.000-00"
                      : pixKeyType === "telefone"
                      ? "+55 11 99999-9999"
                      : "Chave aleatória gerada pelo banco"
                  }
                />
              </div>

              <div>
                <Label>Nome do recebedor PIX</Label>
                <Input
                  value={pixOwnerName}
                  onChange={handlePixOwnerName}
                  placeholder="Nome exibido no PIX do aluno"
                  maxLength={60}
                />
              </div>

              {!pixKey.trim() && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5">
                  <p className="text-[11px] text-amber-300/80">
                    Configure a chave PIX para gerar QR Code automaticamente na tela de pagamento do aluno.
                  </p>
                </div>
              )}
            </AccordionSection>

            {/* ── Aba 3 — Notificações ───────────────────────────────────── */}
            <AccordionSection
              icon={<Bell className="h-4 w-4" />}
              label="Notificações"
              open={openSection === "notificacoes"}
              onToggle={() => toggleSection("notificacoes")}
            >
              <Toggle
                checked={dailyReminderEnabled}
                onChange={handleDailyReminder}
                label="Lembrete diário ativo"
                description="Informativo — indica que o cron de lembrete diário está habilitado no servidor."
              />
              <Toggle
                checked={paymentReminderEnabled}
                onChange={handlePaymentReminder}
                label="Lembrete de pagamento ativo"
                description="Informativo — indica que o cron de cobrança automática está habilitado."
              />

              <div>
                <Label>Mensagem de boas-vindas (push ao aprovar aluno)</Label>
                <textarea
                  value={welcomePushMessage}
                  onChange={(e) => handleWelcomePushMessage(e.target.value)}
                  placeholder="Ex: Seja bem-vindo ao Will Treinos PRO! Seu treino começa agora. 🏐"
                  rows={3}
                  maxLength={200}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-[#EAB308]/40 transition-all placeholder-zinc-600 resize-none"
                />
              </div>
            </AccordionSection>

            {/* ── Aba 4 — Localização ────────────────────────────────────── */}
            <AccordionSection
              icon={<MapPin className="h-4 w-4" />}
              label="Localização da Quadra"
              badge={appConfig.courtLocation?.lat ? "Ativa" : undefined}
              open={openSection === "localizacao"}
              onToggle={() => toggleSection("localizacao")}
            >
              <p className="text-[11px] text-zinc-500 mb-3">
                Configurar a localização da quadra ativa o check-in com GPS. Alunos fora do raio recebem XP reduzido (treino externo).
              </p>
              <CourtLocationSettings
                current={appConfig.courtLocation}
                onSave={(loc) => updateAppConfig({ courtLocation: loc })}
              />
            </AccordionSection>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

