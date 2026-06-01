import type { Student, Payment } from "@/context/types";

function esc(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function download(content: string, filename: string) {
  const bom = "﻿"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentsCsv(students: Student[]) {
  const headers = ["Nome", "Email", "Telefone", "Plano", "Mensalidade", "Frequência/sem", "Status", "Cadastro"];
  const rows = students.map(s => [
    s.name,
    s.email,
    s.phone,
    s.plan,
    s.monthlyValue,
    s.frequency,
    s.status,
    s.joinedAt ? new Date(s.joinedAt).toLocaleDateString("pt-BR") : "",
  ].map(esc).join(","));

  download([headers.join(","), ...rows].join("\n"), `alunos_${dateSlug()}.csv`);
}

export function exportPaymentsCsv(payments: Payment[], students: Student[]) {
  const studentMap = new Map(students.map(s => [s.id, s.name]));
  const headers = ["Aluno", "Referência", "Valor", "Vencimento", "Pagamento", "Status", "Método"];
  const rows = payments.map(p => [
    studentMap.get(p.studentId) ?? p.studentId,
    p.reference,
    `R$ ${p.amount.toFixed(2).replace(".", ",")}`,
    p.dueDate ? new Date(p.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "",
    p.paidDate ? new Date(p.paidDate + "T00:00:00").toLocaleDateString("pt-BR") : "",
    p.status === "paid" ? "Pago" : p.status === "late" ? "Atrasado" : "Pendente",
    p.method ?? "",
  ].map(esc).join(","));

  download([headers.join(","), ...rows].join("\n"), `pagamentos_${dateSlug()}.csv`);
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
