-- Documentação: colunas usadas por fetchLiveAppData (não renomear sem atualizar supabasePersistence.ts)
-- payments: student_proof_* (não proof_note / proof_submitted_at)
-- lessons: sem coach_id na tabela base
-- students: position, tags, birthdate, student_role

COMMENT ON COLUMN public.payments.student_proof_note IS 'Comprovante enviado pelo aluno (texto)';
