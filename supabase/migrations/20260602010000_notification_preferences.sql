CREATE TABLE IF NOT EXISTS public.notification_preferences (
  student_id          text PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_reminders    boolean NOT NULL DEFAULT true,
  eval_feedback       boolean NOT NULL DEFAULT true,
  coach_messages      boolean NOT NULL DEFAULT true,
  weekly_challenge    boolean NOT NULL DEFAULT true,
  weekly_highlight    boolean NOT NULL DEFAULT true,
  fomo_reminder       boolean NOT NULL DEFAULT true,
  birthday_wishes     boolean NOT NULL DEFAULT true,
  monthly_summary     boolean NOT NULL DEFAULT true,
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_prefs" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

CREATE POLICY "staff_read_prefs" ON public.notification_preferences
  FOR SELECT TO authenticated USING (public.wt_is_staff());
