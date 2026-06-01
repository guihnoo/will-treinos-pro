-- Sprint 64: adiciona coluna birthdate na tabela students
-- Formato esperado: 'YYYY-MM-DD' (apenas mês e dia são usados para aniversário)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS birthdate date;

COMMENT ON COLUMN public.students.birthdate IS 'Data de nascimento do aluno. Usado para envio automático de parabéns.';
