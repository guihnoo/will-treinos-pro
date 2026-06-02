/**
 * csvImport.ts — Utilitário para importação de alunos via CSV.
 * Suporta separador ; ou , (auto-detect), BOM UTF-8, headers em PT e EN.
 */

export type CSVStudentRow = {
  name: string;
  email: string;
  phone: string;
  category?: string;
  plan?: string;
  monthlyValue?: number;
  notes?: string;
};

/** Mapeamento de headers em português → chave canônica */
const PT_HEADER_MAP: Record<string, keyof CSVStudentRow> = {
  nome: "name",
  email: "email",
  telefone: "phone",
  fone: "phone",
  celular: "phone",
  categoria: "category",
  plano: "plan",
  mensalidade: "monthlyValue",
  valor: "monthlyValue",
  observacoes: "notes",
  observações: "notes",
  obs: "notes",
};

/** Mapeamento de headers em inglês → chave canônica */
const EN_HEADER_MAP: Record<string, keyof CSVStudentRow> = {
  name: "name",
  email: "email",
  phone: "phone",
  category: "category",
  plan: "plan",
  monthly_value: "monthlyValue",
  monthlyvalue: "monthlyValue",
  notes: "notes",
};

function normalizeHeader(h: string): keyof CSVStudentRow | null {
  const key = h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove accents for matching
  return PT_HEADER_MAP[key] ?? EN_HEADER_MAP[key] ?? null;
}

/** Remove BOM UTF-8 (EF BB BF) que editores como Excel adicionam */
function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

/** Detecta separador: conta ocorrências de ; e , na primeira linha */
function detectSeparator(firstLine: string): ";" | "," {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

/**
 * Faz parse de um CSV de alunos. Retorna rows válidas e erros de parsing.
 * Headers obrigatório: nome/name.
 */
export function parseStudentsCSV(csvText: string): {
  rows: CSVStudentRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: CSVStudentRow[] = [];

  const cleaned = stripBOM(csvText.trim());
  if (!cleaned) {
    errors.push("Arquivo vazio.");
    return { rows, errors };
  }

  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    errors.push("O arquivo deve ter pelo menos uma linha de cabeçalho e uma de dados.");
    return { rows, errors };
  }

  const sep = detectSeparator(lines[0]);

  /** Faz split respeitando campos com aspas */
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === sep && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerParts = splitLine(lines[0]);
  const columnMap: Map<number, keyof CSVStudentRow> = new Map();

  headerParts.forEach((h, idx) => {
    const mapped = normalizeHeader(h);
    if (mapped) columnMap.set(idx, mapped);
  });

  if (!Array.from(columnMap.values()).includes("name")) {
    errors.push(
      'Coluna "nome" (ou "name") não encontrada. Verifique os cabeçalhos do arquivo.',
    );
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = splitLine(lines[i]);
    const raw: Partial<Record<keyof CSVStudentRow, string>> = {};

    columnMap.forEach((field, idx) => {
      const val = parts[idx]?.trim() ?? "";
      if (val) raw[field] = val;
    });

    const row: CSVStudentRow = {
      name: raw.name ?? "",
      email: raw.email ?? "",
      phone: raw.phone ?? "",
      category: raw.category,
      plan: raw.plan,
      monthlyValue: raw.monthlyValue ? Number(raw.monthlyValue.replace(",", ".")) : undefined,
      notes: raw.notes,
    };

    rows.push(row);
  }

  return { rows, errors };
}

/** Valida uma row individual. Retorna lista de erros (vazia = OK). */
export function validateStudentRow(row: CSVStudentRow, index: number): string[] {
  const errs: string[] = [];
  const lineRef = `Linha ${index + 2}`;

  if (!row.name || row.name.trim().length < 2) {
    errs.push(`${lineRef}: Nome obrigatório (mínimo 2 caracteres).`);
  }

  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      errs.push(`${lineRef}: E-mail inválido "${row.email}".`);
    }
  }

  if (row.monthlyValue !== undefined && Number.isNaN(row.monthlyValue)) {
    errs.push(`${lineRef}: Mensalidade deve ser um número.`);
  }

  return errs;
}

/** Gera e faz download de um CSV template de exemplo */
export function downloadCSVTemplate(): void {
  const headers = "nome,email,telefone,categoria,plano,mensalidade,observacoes";
  const ex1 = "João Silva,joao@email.com,(11) 99999-9999,Vôlei Avançado,mensal,350,Aluno dedicado";
  const ex2 = "Maria Santos,maria@email.com,(11) 88888-8888,Iniciantes,trimestral,300,";
  const content = [headers, ex1, ex2].join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-importacao-alunos.csv";
  a.click();
  URL.revokeObjectURL(url);
}
