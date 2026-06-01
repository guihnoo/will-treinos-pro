CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start     date        NOT NULL,
  title          text        NOT NULL,
  description    text,
  challenge_type text        NOT NULL DEFAULT 'checkins' CHECK (challenge_type IN ('checkins','xp','classes','streak')),
  target_value   integer     NOT NULL,
  xp_bonus       integer     NOT NULL DEFAULT 100,
  created_by     uuid,
  created_at     timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_challenges_week_start_idx ON public.weekly_challenges (week_start);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_challenges" ON public.weekly_challenges;
CREATE POLICY "staff_all_challenges" ON public.weekly_challenges
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

DROP POLICY IF EXISTS "student_read_challenges" ON public.weekly_challenges;
CREATE POLICY "student_read_challenges" ON public.weekly_challenges
  FOR SELECT TO authenticated USING (true);
