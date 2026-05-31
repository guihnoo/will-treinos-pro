-- Weekly Highlight: coach picks one athlete as star of the week.
-- One highlight per calendar week (keyed by Monday's date).

CREATE TABLE IF NOT EXISTS public.weekly_highlights (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  text    NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start  date    NOT NULL,          -- ISO Monday of the week (YYYY-MM-DD)
  note        text,                       -- personal message from coach (optional)
  awarded_by  uuid,                       -- auth.users.id of staff who set it
  xp_awarded  integer NOT NULL DEFAULT 150,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT weekly_highlights_one_per_week UNIQUE (week_start)
);

CREATE INDEX IF NOT EXISTS weekly_highlights_student_idx
  ON public.weekly_highlights (student_id, week_start DESC);

ALTER TABLE public.weekly_highlights ENABLE ROW LEVEL SECURITY;

-- Staff can do everything
CREATE POLICY "staff_highlights_all" ON public.weekly_highlights
  FOR ALL TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

-- Students can read their own highlights
CREATE POLICY "student_read_own_highlight" ON public.weekly_highlights
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  );
