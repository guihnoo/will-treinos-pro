import type { Payment, Student } from "@/context/types";

// UTF-8 BOM para compatibilidade com Excel brasileiro
const BOM = "﻿";

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Envolve em aspas se contiver vírgula, aspas ou quebra de linha
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function fmtCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Pagamentos ──────────────────────────────────────────────────────────────

export function generatePaymentsCSV(
  payments: Payment[],
  students: Student[],
  monthRef: string // "YYYY-MM" ou "all"
): string {
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const filtered =
    monthRef === "all"
      ? payments
      : payments.filter((p) => p.reference === monthRef);

  const headers = [
    "Nome",
    "Email",
    "Telefone",
    "Categorias",
    "Plano",
    "Mes",
    "Valor",
    "Status",
    "Data Pagamento",
  ].join(",");

  const rows = filtered.map((p) => {
    const s = studentMap.get(p.studentId);
    const statusLabel: Record<string, string> = {
      paid: "Pago",
      pending: "Pendente",
      late: "Atrasado",
    };
    return [
      esc(s?.name ?? ""),
      esc(s?.email ?? ""),
      esc(s?.phone ?? ""),
      esc((s?.categories ?? []).join("; ")),
      esc(s?.plan ?? ""),
      esc(p.reference),
      esc(fmtCurrency(p.amount)),
      esc(statusLabel[p.status] ?? p.status),
      esc(fmtDate(p.paidDate)),
    ].join(",");
  });

  return BOM + [headers, ...rows].join("\n");
}

// ─── Alunos ──────────────────────────────────────────────────────────────────

export function generateStudentsCSV(students: Student[]): string {
  const headers = [
    "Nome",
    "Email",
    "Telefone",
    "Instagram",
    "Status",
    "Plano",
    "Mensalidade",
    "Frequencia",
    "Categorias",
    "Data de Entrada",
    "Etiquetas",
  ].join(",");

  const statusLabel: Record<string, string> = {
    active: "Ativo",
    approved: "Aprovado",
    pending: "Pendente",
    suspended: "Suspenso",
    trial: "Trial",
  };

  const rows = students.map((s) =>
    [
      esc(s.name),
      esc(s.email),
      esc(s.phone),
      esc(s.instagram),
      esc(statusLabel[s.status] ?? s.status),
      esc(s.plan),
      esc(fmtCurrency(s.monthlyValue)),
      esc(`${s.frequency}x/sem`),
      esc((s.categories ?? []).join("; ")),
      esc(fmtDate(s.joinedAt)),
      esc((s.tags ?? []).join("; ")),
    ].join(",")
  );

  return BOM + [headers, ...rows].join("\n");
}

// ─── Ranking XP ──────────────────────────────────────────────────────────────

export interface RankingRow {
  name: string;
  totalXP: number;
  tier: string;
  checkins: number;
  lastActivity: string;
}

export function generateRankingCSV(rows: RankingRow[]): string {
  const headers = ["Nome", "XP Total", "Tier", "Check-ins", "Ultima Atividade"].join(",");

  const dataRows = rows.map((r) =>
    [
      esc(r.name),
      esc(r.totalXP),
      esc(r.tier),
      esc(r.checkins),
      esc(fmtDate(r.lastActivity)),
    ].join(",")
  );

  return BOM + [headers, ...dataRows].join("\n");
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
