"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Payment, PaymentStatus, WithoutId } from "@/context/types";
import { dueDateForBillingMonth, localDateISO, paymentReferenceForDate } from "@/lib/dateUtils";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  insertPaymentRemote,
  markPaymentPaidRemote,
  submitStudentProofRemote,
  uploadPaymentProofToStorage,
} from "@/lib/supabasePersistence";
import { validateAndScanPaymentProof } from "@/lib/paymentProofValidator";
import { logDevEvent } from "@/lib/devEventsLogger";
import { willUid } from "@/lib/willUid";

export function usePaymentMutations(options: {
  usingSupabaseSession: boolean;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  setCriticalDataError: Dispatch<SetStateAction<string | null>>;
}) {
  const { usingSupabaseSession, supabaseAuthUserRef, setPayments, setCriticalDataError } = options;

  const seedPendingTuitionForStudent = useCallback(
    async (studentId: string, monthlyValue: number, paymentDay: number) => {
      if (!String(studentId || "").trim() || monthlyValue <= 0) return;
      const ref = paymentReferenceForDate();
      const dueDate = dueDateForBillingMonth(paymentDay);
      if (!usingSupabaseSession) {
        setPayments((prev) => {
          if (prev.some((p) => p.studentId === studentId && p.reference === ref)) return prev;
          return [
            {
              id: `pay_${willUid()}`,
              studentId,
              amount: monthlyValue,
              dueDate,
              paidDate: null,
              status: "pending" as PaymentStatus,
              method: null,
              reference: ref,
            },
            ...prev,
          ];
        });
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) return;
      try {
        const { data: existing } = await supabase
          .from("payments")
          .select("id")
          .eq("student_id", studentId)
          .eq("reference", ref)
          .maybeSingle();
        if (existing) return;
        const created = await insertPaymentRemote(supabase, {
          studentId,
          amount: monthlyValue,
          dueDate,
          paidDate: null,
          status: "pending",
          method: null,
          reference: ref,
        });
        setPayments((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
      } catch (error) {
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar mensalidade pendente.");
      }
    },
    [usingSupabaseSession, setPayments, setCriticalDataError],
  );

  const markPayment = useCallback(
    (id: string, method: string = "pix") => {
      const selectedMethod = method || "pix";
      if (!usingSupabaseSession) {
        setPayments((p) =>
          p.map((py) =>
            py.id === id
              ? { ...py, status: "paid" as PaymentStatus, paidDate: localDateISO(), method: selectedMethod }
              : py,
          ),
        );
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        return;
      }
      void markPaymentPaidRemote(supabase, id, selectedMethod)
        .then((updated) => {
          setPayments((p) => p.map((py) => (py.id === id ? updated : py)));
          void logDevEvent("payment_marked", "payment", id, {
            studentId: updated.studentId,
            amount: updated.amount,
            method: updated.method,
          });
        })
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao confirmar pagamento."));
    },
    [usingSupabaseSession, setPayments, setCriticalDataError],
  );

  const createPayment = useCallback(
    async (payload: WithoutId<Payment> & { id?: string }): Promise<Payment> => {
      const ref = payload.reference || paymentReferenceForDate();
      const newPayment: Payment = {
        id: payload.id || `pay_${willUid()}`,
        studentId: payload.studentId,
        amount: payload.amount,
        dueDate: payload.dueDate || localDateISO(),
        paidDate: payload.status === "paid" ? (payload.paidDate || localDateISO()) : null,
        status: payload.status || "pending",
        method: payload.method || null,
        reference: ref,
      };

      if (!usingSupabaseSession) {
        setPayments((prev) => [newPayment, ...prev]);
        return newPayment;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Cliente Supabase indisponível.");
      }

      try {
        const created = await insertPaymentRemote(supabase, {
          ...payload,
          reference: ref,
        });
        setPayments((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        return created;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Falha ao registrar pagamento.";
        setCriticalDataError(msg);
        throw error;
      }
    },
    [usingSupabaseSession, setPayments, setCriticalDataError],
  );

  const generateMonthlyBillingBatch = useCallback(
    async (
      studentsList: Array<{ id: string; monthlyValue: number; paymentDay: number; status: string }>,
      referenceMonth?: string,
    ): Promise<{ createdCount: number; skippedCount: number }> => {
      const ref = referenceMonth || paymentReferenceForDate();
      const eligibleStudents = studentsList.filter(
        (s) => s.status === "active" && s.monthlyValue > 0,
      );

      let createdCount = 0;
      let skippedCount = 0;

      for (const student of eligibleStudents) {
        const dueDate = dueDateForBillingMonth(student.paymentDay);
        if (!usingSupabaseSession) {
          setPayments((prev) => {
            if (prev.some((p) => p.studentId === student.id && p.reference === ref)) {
              skippedCount++;
              return prev;
            }
            createdCount++;
            return [
              {
                id: `pay_${willUid()}`,
                studentId: student.id,
                amount: student.monthlyValue,
                dueDate,
                paidDate: null,
                status: "pending" as PaymentStatus,
                method: null,
                reference: ref,
              },
              ...prev,
            ];
          });
          continue;
        }

        const supabase = getSupabaseClient();
        if (!supabase) continue;

        try {
          const { data: existing } = await supabase
            .from("payments")
            .select("id")
            .eq("student_id", student.id)
            .eq("reference", ref)
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }

          const created = await insertPaymentRemote(supabase, {
            studentId: student.id,
            amount: student.monthlyValue,
            dueDate,
            paidDate: null,
            status: "pending",
            method: null,
            reference: ref,
          });
          setPayments((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
          createdCount++;
        } catch {
          // segue para próximo aluno
        }
      }

      return { createdCount, skippedCount };
    },
    [usingSupabaseSession, setPayments],
  );

  const submitStudentPaymentProof = useCallback(
    (
      id: string,
      payload: {
        note: string;
        attachment?: { file?: File; previewUrl?: string; fileName: string; mime: string } | null;
      },
    ) => {
      if (!usingSupabaseSession) {
        const trimmed = payload.note.trim();
        const at = new Date().toISOString();
        setPayments((p) =>
          p.map((py) => {
            if (py.id !== id) return py;
            let next: Payment = {
              ...py,
              studentProofNote: trimmed || py.studentProofNote,
              studentProofSubmittedAt: at,
            };
            if (payload.attachment === null) {
              next = {
                ...next,
                studentProofDataUrl: undefined,
                studentProofFileName: undefined,
                studentProofMime: undefined,
              };
            } else if (payload.attachment) {
              next = {
                ...next,
                studentProofDataUrl: payload.attachment.previewUrl,
                studentProofFileName: payload.attachment.fileName,
                studentProofMime: payload.attachment.mime,
              };
            }
            return next;
          }),
        );
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        return;
      }
      const currentAuthId = supabaseAuthUserRef.current?.id;
      if (!currentAuthId) {
        setCriticalDataError("Sessão Supabase indisponível.");
        return;
      }
      const submitRemote = async () => {
        if (payload.attachment === null) {
          return submitStudentProofRemote(supabase, id, { note: payload.note, attachment: null });
        }
        if (payload.attachment?.file) {
          // VALIDAÇÃO: Checar arquivo antes de fazer upload
          const validation = await validateAndScanPaymentProof(payload.attachment.file);
          if (!validation.valid) {
            throw new Error(validation.message);
          }
          const storagePath = await uploadPaymentProofToStorage(supabase, currentAuthId, payload.attachment.file);
          return submitStudentProofRemote(supabase, id, {
            note: payload.note,
            attachment: {
              url: storagePath,
              fileName: payload.attachment.fileName,
              mime: payload.attachment.mime,
            },
          });
        }
        if (payload.attachment?.previewUrl) {
          return submitStudentProofRemote(supabase, id, {
            note: payload.note,
            attachment: {
              url: payload.attachment.previewUrl,
              fileName: payload.attachment.fileName,
              mime: payload.attachment.mime,
            },
          });
        }
        return submitStudentProofRemote(supabase, id, { note: payload.note, attachment: undefined });
      };
      void submitRemote()
        .then((updated) => {
          setPayments((p) => p.map((pay) => (pay.id === id ? updated : pay)));
          // Fire-and-forget push notification to admin
          try {
            const sb = getSupabaseClient();
            if (sb) {
              void sb.auth.getSession().then(({ data: { session } }) => {
                if (!session?.access_token) return;
                const studentName = supabaseAuthUserRef.current?.user_metadata?.name as string | undefined ?? "Aluno";
                void fetch("/api/push/send", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    targetRole: "admin",
                    payload: {
                      title: "💰 Comprovante recebido!",
                      body: `${studentName} enviou comprovante de ${updated.reference}`,
                      url: "/financeiro",
                    },
                  }),
                }).catch(() => { /* ignore push failure */ });
              });
            }
          } catch { /* ignore push failure */ }
        })
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar comprovante: " + (error instanceof Error ? error.message : "erro desconhecido")));
    },
    [usingSupabaseSession, supabaseAuthUserRef, setPayments, setCriticalDataError],
  );

  return {
    seedPendingTuitionForStudent,
    markPayment,
    submitStudentPaymentProof,
    createPayment,
    generateMonthlyBillingBatch,
  };
}
