"use client";

import React, { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  parseStudentsCSV,
  validateStudentRow,
  downloadCSVTemplate,
  type CSVStudentRow,
} from "@/lib/csvImport";
import { useStudents } from "@/context/StudentsContext";
import { useToast } from "@/components/Toast";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP } from "@/components/ui/modalScrollClasses";
import { SPRING_PREMIUM, MODAL_OVERLAY_FADE } from "@/components/ui/motionTokens";

interface Props {
  onClose: () => void;
  onGoToApproval: () => void;
}

type Step = "upload" | "preview" | "importing" | "done";

interface ParsedRow {
  row: CSVStudentRow;
  index: number;
  errors: string[];
}

export default function ImportStudentsModal({ onClose, onGoToApproval }: Props) {
  const { addStudent } = useStudents();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const errorRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleParse = useCallback((text: string) => {
    const { rows, errors } = parseStudentsCSV(text);
    const mapped: ParsedRow[] = rows.map((row, i) => ({
      row,
      index: i,
      errors: validateStudentRow(row, i),
    }));
    setParsedRows(mapped);
    setParseErrors(errors);
    if (errors.length > 0 && rows.length === 0) return;
    setStep("preview");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(csv|txt)$/i)) {
        toast("Somente arquivos .csv ou .txt são aceitos.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
        handleParse(text);
      };
      reader.readAsText(file, "utf-8");
    },
    [handleParse, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setStep("importing");
    setImportProgress(0);
    let count = 0;

    const BATCH = 10;
    for (let i = 0; i < validRows.length; i += BATCH) {
      const batch = validRows.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async ({ row }) => {
          try {
            await addStudent({
              name: row.name.trim(),
              email: row.email?.trim() ?? "",
              phone: row.phone?.trim() ?? "",
              avatar: "",
              instagram: "",
              status: "pending",
              plan: row.plan?.trim() ?? "mensal",
              monthlyValue: row.monthlyValue ?? 0,
              paymentDay: 10,
              frequency: 2,
              categories: [],
              joinedAt: new Date().toISOString().slice(0, 10),
              totalClasses: 0,
              notes: row.notes?.trim() ?? "",
            });
            count++;
          } catch {
            // silently skip failed rows — they can retry later
          }
        }),
      );
      setImportProgress(Math.round(((i + BATCH) / validRows.length) * 100));
    }

    setImportedCount(count);
    setStep("done");
  };

  const progressClamped = Math.min(100, importProgress);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Importar alunos via CSV"
      className={`fixed inset-0 z-[250] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80 backdrop-blur-sm`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-full max-w-2xl rounded-3xl border border-teal-500/20 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-400">
                Importação em Massa
              </p>
              <h2 className="text-base font-black text-white">Importar Alunos via CSV</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="import-students-close"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`${MODAL_BODY_SCROLL} p-5`}>
            <AnimatePresence mode="wait">
              {/* ── Step 1: Upload ── */}
              {step === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-[11px] text-zinc-400">
                    Colunas aceitas:{" "}
                    <span className="font-bold text-white">
                      nome*
                    </span>
                    , email, telefone, categoria, plano, mensalidade, observações{" "}
                    <span className="text-zinc-600">(* obrigatório)</span>
                  </p>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="csv-dropzone"
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-all ${
                      dragActive
                        ? "border-teal-400/70 bg-teal-500/8"
                        : "border-zinc-700/60 bg-zinc-900/30 hover:border-teal-500/40 hover:bg-teal-500/5"
                    }`}
                  >
                    <Upload className={`h-8 w-8 ${dragActive ? "text-teal-400" : "text-zinc-500"}`} />
                    <div>
                      <p className="text-sm font-bold text-zinc-200">
                        Arraste o CSV aqui ou clique para selecionar
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Formatos aceitos: .csv, .txt · Separador ; ou ,
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Paste CSV text */}
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold text-zinc-500">
                      Ou cole o conteúdo CSV diretamente:
                    </p>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder={"nome,email,telefone\nJoão Silva,joao@email.com,(11) 99999-0000"}
                      rows={5}
                      data-testid="csv-textarea"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 font-mono text-[11px] text-zinc-200 placeholder-zinc-600 focus:border-teal-500/60 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {parseErrors.length > 0 && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-[11px] text-red-300">
                      {parseErrors.map((e, i) => (
                        <p key={i}>{e}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="btn-download-template"
                      onClick={() => downloadCSVTemplate()}
                      className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar template CSV
                    </button>
                    <button
                      type="button"
                      data-testid="btn-parse-csv"
                      disabled={!csvText.trim()}
                      onClick={() => handleParse(csvText)}
                      className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-[11px] font-black text-teal-200 transition hover:bg-teal-500/20 disabled:opacity-40"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Processar texto colado
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Preview ── */}
              {step === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                      {validRows.length} aluno{validRows.length !== 1 ? "s" : ""} para importar
                    </span>
                    {errorRows.length > 0 && (
                      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-300">
                        {errorRows.length} erro{errorRows.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Table preview */}
                  <div className="max-h-72 overflow-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-zinc-900">
                        <tr className="border-b border-zinc-800">
                          <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-zinc-500">#</th>
                          <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-zinc-500">Nome</th>
                          <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-zinc-500">Email</th>
                          <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-zinc-500">Telefone</th>
                          <th className="px-3 py-2 text-left font-black uppercase tracking-wider text-zinc-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map(({ row, index, errors: rowErrors }) => (
                          <tr
                            key={index}
                            className={`border-b border-zinc-800/50 ${rowErrors.length > 0 ? "bg-red-500/8" : "bg-zinc-900/30"}`}
                            title={rowErrors.length > 0 ? rowErrors.join(" | ") : undefined}
                          >
                            <td className="px-3 py-2 text-zinc-600">{index + 2}</td>
                            <td className="px-3 py-2 font-bold text-white">{row.name || <span className="text-red-400">—</span>}</td>
                            <td className="px-3 py-2 text-zinc-400">{row.email || "—"}</td>
                            <td className="px-3 py-2 text-zinc-400">{row.phone || "—"}</td>
                            <td className="px-3 py-2">
                              {rowErrors.length > 0 ? (
                                <span className="flex items-center gap-1 text-red-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  Erro
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 10 && (
                      <div className="border-t border-zinc-800 px-3 py-2 text-[10px] text-zinc-500">
                        Mostrando 10 de {parsedRows.length} registros.
                      </div>
                    )}
                  </div>

                  {errorRows.length > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/6 px-3 py-2.5 text-[11px] text-red-300 space-y-1">
                      {errorRows.slice(0, 3).map(({ errors: rowErrors }, i) => (
                        <p key={i}>{rowErrors[0]}</p>
                      ))}
                      {errorRows.length > 3 && (
                        <p className="text-zinc-500">...e mais {errorRows.length - 3} erro{errorRows.length - 3 !== 1 ? "s" : ""}.</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="btn-back-to-upload"
                      onClick={() => { setStep("upload"); setParseErrors([]); }}
                      className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-600"
                    >
                      Corrigir erros
                    </button>
                    {validRows.length > 0 && (
                      <button
                        type="button"
                        data-testid="btn-start-import"
                        onClick={() => void handleImport()}
                        className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-[11px] font-black text-teal-200 transition hover:bg-teal-500/20"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Importar {validRows.length} aluno{validRows.length !== 1 ? "s" : ""}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Importing ── */}
              {step === "importing" && (
                <motion.div
                  key="importing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 py-8 text-center"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
                  <div>
                    <p className="text-base font-bold text-white">Importando alunos…</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Processando em lotes. Não feche esta janela.
                    </p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="mb-2 flex justify-between text-[10px] font-bold text-zinc-500">
                      <span>Progresso</span>
                      <span>{progressClamped}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        className="h-full rounded-full bg-teal-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progressClamped}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Done ── */}
              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5 py-8 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">
                      {importedCount} aluno{importedCount !== 1 ? "s" : ""} importado{importedCount !== 1 ? "s" : ""} com sucesso!
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-400">
                      Agora aprove-os na fila de cadastro da aba Turma.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="btn-close-import"
                      onClick={onClose}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-600"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      data-testid="btn-go-to-approval"
                      onClick={() => { onClose(); onGoToApproval(); }}
                      className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-[11px] font-black text-teal-200 transition hover:bg-teal-500/20"
                    >
                      Ver fila de aprovação
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
