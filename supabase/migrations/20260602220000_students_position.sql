-- Posição na quadra (perfil do aluno) — evita erro "column students.position does not exist"
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS position text;

COMMENT ON COLUMN public.students.position IS 'Posição preferida do atleta (ex.: levantador, oposto, líbero)';
