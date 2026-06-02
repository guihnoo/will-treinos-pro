-- =============================================================
-- WILL TREINOS PRO — Migrations pendentes (Sprints 15–110)
-- Seguro para rodar múltiplas vezes (IF NOT EXISTS / OR REPLACE)
-- Rodar no Supabase → SQL Editor → New Query → Run All
-- =============================================================

-- ── Sprint 15: Geolocalização da quadra ──────────────────────
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS court_location jsonb;

-- ── Sprint 16: Histórico de avaliações ───────────────────────
CREATE TABLE IF NOT EXISTS public.evaluations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  text        NOT NULL,
  lesson_id   text,
  lesson_title text,
  scores      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  avg_score   numeric(3,1),
  notes       text,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.evaluations (student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations (created_at DESC);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evaluations_staff_all" ON public.evaluations;
CREATE POLICY "evaluations_staff_all" ON public.evaluations
  FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
DROP POLICY IF EXISTS "evaluations_student_read_own" ON public.evaluations;
CREATE POLICY "evaluations_student_read_own" ON public.evaluations
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- ── Sprint 21: Recados do coach ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_name     text        NOT NULL,
  to_student_id text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message       text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at    timestamptz DEFAULT now(),
  read_at       timestamptz
);
CREATE INDEX IF NOT EXISTS coach_messages_student_idx
  ON public.coach_messages (to_student_id, created_at DESC);
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_coach_messages_all" ON public.coach_messages;
CREATE POLICY "staff_coach_messages_all" ON public.coach_messages
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
DROP POLICY IF EXISTS "student_read_own_messages" ON public.coach_messages;
CREATE POLICY "student_read_own_messages" ON public.coach_messages
  FOR SELECT TO authenticated
  USING (to_student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "student_mark_read" ON public.coach_messages;
CREATE POLICY "student_mark_read" ON public.coach_messages
  FOR UPDATE TO authenticated
  USING (to_student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (true);

-- ── Sprint 22: Destaque da Semana ────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_highlights (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  text    NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start  date    NOT NULL,
  note        text,
  awarded_by  uuid,
  xp_awarded  integer NOT NULL DEFAULT 150,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT weekly_highlights_one_per_week UNIQUE (week_start)
);
CREATE INDEX IF NOT EXISTS weekly_highlights_student_idx
  ON public.weekly_highlights (student_id, week_start DESC);
ALTER TABLE public.weekly_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_highlights_all" ON public.weekly_highlights;
CREATE POLICY "staff_highlights_all" ON public.weekly_highlights
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
DROP POLICY IF EXISTS "student_read_own_highlight" ON public.weekly_highlights;
CREATE POLICY "student_read_own_highlight" ON public.weekly_highlights
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- ── Sprint 24: Comunicar falta ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.absence_requests (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id      text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id       text        NOT NULL,
  lesson_date     date        NOT NULL,
  lesson_title    text        NOT NULL,
  lesson_time     text,
  reason          text        NOT NULL CHECK (reason IN ('doenca','trabalho','viagem','emergencia','pessoal','outro')),
  notes           text,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','acknowledged')),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS absence_requests_student_idx
  ON public.absence_requests (student_id, lesson_date DESC);
CREATE INDEX IF NOT EXISTS absence_requests_lesson_idx
  ON public.absence_requests (lesson_id);
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_own_absence_requests" ON public.absence_requests;
CREATE POLICY "student_own_absence_requests" ON public.absence_requests
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_absence_requests_all" ON public.absence_requests;
CREATE POLICY "staff_absence_requests_all" ON public.absence_requests
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

-- ── Sprint 33: Reposição inteligente ─────────────────────────
CREATE TABLE IF NOT EXISTS public.reposition_requests (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id          text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  absence_request_id  uuid        REFERENCES public.absence_requests(id) ON DELETE SET NULL,
  target_lesson_id    text        NOT NULL,
  target_lesson_date  date        NOT NULL,
  target_lesson_title text        NOT NULL,
  target_lesson_time  text,
  status              text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','cancelled')),
  confirmed_by        uuid,
  confirmed_at        timestamptz,
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reposition_requests_student_idx
  ON public.reposition_requests (student_id, target_lesson_date DESC);
CREATE INDEX IF NOT EXISTS reposition_requests_lesson_idx
  ON public.reposition_requests (target_lesson_id);
ALTER TABLE public.reposition_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_own_reposition_requests" ON public.reposition_requests;
CREATE POLICY "student_own_reposition_requests" ON public.reposition_requests
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_reposition_requests_all" ON public.reposition_requests;
CREATE POLICY "staff_reposition_requests_all" ON public.reposition_requests
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

-- ── Sprint 34: Avaliações pós-aula (ratings) ─────────────────
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
DROP POLICY IF EXISTS "student_own_lesson_ratings" ON public.lesson_ratings;
CREATE POLICY "student_own_lesson_ratings" ON public.lesson_ratings
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_lesson_ratings_read" ON public.lesson_ratings;
CREATE POLICY "staff_lesson_ratings_read" ON public.lesson_ratings
  FOR SELECT TO authenticated USING (public.wt_is_staff());

-- ── Sprint 40: Metas do aluno ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_goals (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by     uuid,
  title          text        NOT NULL,
  description    text,
  target_type    text        NOT NULL DEFAULT 'xp'
                   CHECK (target_type IN ('xp','checkins','tier','custom')),
  target_value   integer,
  target_tier    text,
  deadline       date,
  status         text        NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','achieved','cancelled')),
  achieved_at    timestamptz,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_goals_student_idx
  ON public.student_goals (student_id, created_at DESC);
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_read_own_goals" ON public.student_goals;
CREATE POLICY "student_read_own_goals" ON public.student_goals
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_goals_all" ON public.student_goals;
CREATE POLICY "staff_goals_all" ON public.student_goals
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

-- ── Sprint 61: Desafio Semanal ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start     date        NOT NULL,
  title          text        NOT NULL,
  description    text,
  challenge_type text        NOT NULL DEFAULT 'checkins'
                   CHECK (challenge_type IN ('checkins','xp','classes','streak')),
  target_value   integer     NOT NULL,
  xp_bonus       integer     NOT NULL DEFAULT 100,
  created_by     uuid,
  created_at     timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS weekly_challenges_week_start_idx
  ON public.weekly_challenges (week_start);
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all_challenges" ON public.weekly_challenges;
CREATE POLICY "staff_all_challenges" ON public.weekly_challenges
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
DROP POLICY IF EXISTS "student_read_challenges" ON public.weekly_challenges;
CREATE POLICY "student_read_challenges" ON public.weekly_challenges
  FOR SELECT TO authenticated USING (true);

-- ── Sprint 67: Templates de avaliação ───────────────────────
CREATE TABLE IF NOT EXISTS public.evaluation_templates (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id   text        NOT NULL,
  name          text        NOT NULL,
  weights       jsonb       NOT NULL DEFAULT '{}',
  is_default    boolean     NOT NULL DEFAULT false,
  created_by    uuid,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all_templates" ON public.evaluation_templates;
CREATE POLICY "staff_all_templates" ON public.evaluation_templates
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
DROP POLICY IF EXISTS "student_read_templates" ON public.evaluation_templates;
CREATE POLICY "student_read_templates" ON public.evaluation_templates
  FOR SELECT TO authenticated USING (true);

-- ── Sprint 64: Aniversário do aluno ─────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS birthdate date;

-- ── Sprint 91: Tags do aluno ─────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- ── Sprint 100: Sistema de Indicação ─────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id         text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  referred_email      text        NOT NULL,
  referred_student_id text        REFERENCES public.students(id),
  status              text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rewarded')),
  xp_awarded          integer,
  created_at          timestamptz DEFAULT now(),
  rewarded_at         timestamptz
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_email_idx ON public.referrals (referred_email);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_own_referrals" ON public.referrals;
CREATE POLICY "student_own_referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_all_referrals" ON public.referrals;
CREATE POLICY "staff_all_referrals" ON public.referrals
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

-- ── Sprint 105: Inscrição atômica em aula (anti-race-condition) ──
CREATE OR REPLACE FUNCTION public.enroll_student_in_lesson(
  p_lesson_id text,
  p_student_id text,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson record;
  v_enrolled text[];
  v_spots_left integer;
BEGIN
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'lesson_not_found');
  END IF;
  IF v_lesson.status <> 'scheduled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'lesson_not_scheduled');
  END IF;
  v_enrolled := COALESCE(v_lesson.enrolled_students, '{}');
  IF p_action = 'enroll' THEN
    IF p_student_id = ANY(v_enrolled) THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_enrolled');
    END IF;
    IF v_lesson.max_students IS NOT NULL AND array_length(v_enrolled, 1) >= v_lesson.max_students THEN
      RETURN jsonb_build_object('success', false, 'error', 'lesson_full');
    END IF;
    UPDATE public.lessons SET enrolled_students = array_append(v_enrolled, p_student_id) WHERE id = p_lesson_id;
    v_spots_left := COALESCE(v_lesson.max_students, 999) - COALESCE(array_length(v_enrolled, 1), 0) - 1;
  ELSIF p_action = 'unenroll' THEN
    UPDATE public.lessons SET enrolled_students = array_remove(v_enrolled, p_student_id) WHERE id = p_lesson_id;
    v_spots_left := COALESCE(v_lesson.max_students, 999) - COALESCE(array_length(v_enrolled, 1), 0) + 1;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_action');
  END IF;
  RETURN jsonb_build_object('success', true, 'spotsLeft', v_spots_left);
END;
$$;
GRANT EXECUTE ON FUNCTION public.enroll_student_in_lesson TO authenticated;

-- ── Sprint 106: Preferências de notificação do aluno ─────────
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
DROP POLICY IF EXISTS "student_own_prefs" ON public.notification_preferences;
CREATE POLICY "student_own_prefs" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "staff_read_prefs" ON public.notification_preferences;
CREATE POLICY "staff_read_prefs" ON public.notification_preferences
  FOR SELECT TO authenticated USING (public.wt_is_staff());

-- =============================================================
-- FIM — todas as migrations aplicadas com segurança
-- =============================================================
