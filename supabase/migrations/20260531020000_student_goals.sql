-- Sprint 40: Coach sets goals for individual students.
-- Student sees progress bar + deadline in their profile.

CREATE TABLE IF NOT EXISTS public.student_goals (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by     uuid,                           -- auth.users.id of coach/admin
  title          text        NOT NULL,
  description    text,
  target_type    text        NOT NULL DEFAULT 'xp'
                   CHECK (target_type IN ('xp', 'checkins', 'tier', 'custom')),
  target_value   integer,                        -- e.g. 3000 XP or 20 check-ins
  target_tier    text,                           -- for type=tier: 'ouro', 'diamante', etc.
  deadline       date,
  status         text        NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'achieved', 'cancelled')),
  achieved_at    timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_goals_student_idx
  ON public.student_goals (student_id, created_at DESC);

ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_read_own_goals" ON public.student_goals
  FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "staff_goals_all" ON public.student_goals
  FOR ALL TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());
