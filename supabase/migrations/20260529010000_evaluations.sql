-- Tabela de histórico de avaliações por aluno.
-- Persiste os scores por pilar (físico, técnico, tático, atitude, evolução)
-- para análise de progresso, fadiga preditiva e relatórios ao longo do tempo.

CREATE TABLE IF NOT EXISTS public.evaluations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  text        NOT NULL,
  lesson_id   text,
  lesson_title text,
  scores      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  avg_score   numeric(3,1),
  notes       text,
  created_by  text,       -- auth user id do coach/admin
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.evaluations (student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations (created_at DESC);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Staff lê e escreve tudo
CREATE POLICY "evaluations_staff_all"
  ON public.evaluations
  FOR ALL
  TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

-- Aluno lê apenas suas próprias avaliações
CREATE POLICY "evaluations_student_read_own"
  ON public.evaluations
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.evaluations IS
  'Histórico de avaliações técnicas por aluno. Scores por pilar: fisico, tecnico, tatico, atitude, evolucao (0-10).';
