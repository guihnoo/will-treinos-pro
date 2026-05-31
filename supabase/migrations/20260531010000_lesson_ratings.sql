-- Sprint 34: Student lesson ratings persisted to Supabase.
-- Students rate completed lessons they attended; coach sees NPS per lesson.

CREATE TABLE IF NOT EXISTS public.lesson_ratings (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id    text        NOT NULL,
  student_id   text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_date  date        NOT NULL,
  lesson_title text        NOT NULL,
  mood         text        NOT NULL CHECK (mood IN ('excelente','bom','cansativo','dificil')),
  intensidade  smallint    NOT NULL CHECK (intensidade BETWEEN 1 AND 5),
  tecnica      smallint    NOT NULL CHECK (tecnica BETWEEN 1 AND 5),
  didatica     smallint    NOT NULL CHECK (didatica BETWEEN 1 AND 5),
  evolucao     smallint    NOT NULL CHECK (evolucao BETWEEN 1 AND 5),
  avg_score    numeric(3,2) GENERATED ALWAYS AS
                 ((intensidade + tecnica + didatica + evolucao)::numeric / 4) STORED,
  comment      text,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT lesson_ratings_one_per_student UNIQUE (lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS lesson_ratings_lesson_idx
  ON public.lesson_ratings (lesson_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lesson_ratings_student_idx
  ON public.lesson_ratings (student_id, lesson_date DESC);

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Students can insert/read their own ratings
CREATE POLICY "student_own_lesson_ratings" ON public.lesson_ratings
  FOR ALL TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Staff can read all ratings (NPS analytics)
CREATE POLICY "staff_lesson_ratings_read" ON public.lesson_ratings
  FOR SELECT TO authenticated
  USING (public.wt_is_staff());
