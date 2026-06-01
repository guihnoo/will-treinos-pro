-- Adiciona coluna tags na tabela students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

COMMENT ON COLUMN public.students.tags IS 'Etiquetas do coach: vip, em_risco, destaque, iniciante, trial';
