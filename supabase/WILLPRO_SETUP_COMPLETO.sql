-- =============================================================================
-- WILL TREINOS PRO — SCRIPT ÚNICO DE SETUP COMPLETO
-- =============================================================================
-- Cole este arquivo inteiro no Supabase → SQL Editor → Run
-- Pode rodar mais de uma vez com segurança (IF NOT EXISTS em tudo)
-- =============================================================================

-- ─── 1. TABELAS PRINCIPAIS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.students (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  plan text NOT NULL DEFAULT '',
  monthly_value numeric NOT NULL DEFAULT 0,
  payment_day integer NOT NULL DEFAULT 5,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  joined_at text NOT NULL DEFAULT '',
  frequency numeric NOT NULL DEFAULT 0,
  total_classes numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  professor_notes text NOT NULL DEFAULT '',
  attendance_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'aluno';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_role text NOT NULL DEFAULT 'aluno';

CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_uidx
  ON public.students(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_role ON public.students(student_role);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id_role ON public.students(auth_user_id, student_role);

-- Garante check constraint nos roles (sem erro se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_role_check' AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_role_check
      CHECK (role IN ('admin', 'professor', 'aluno', 'visitor'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_student_role_check' AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_student_role_check
      CHECK (student_role IN ('aluno', 'observador', 'professor'));
  END IF;
END $$;

-- ─── 2. PAGAMENTOS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  due_date text NOT NULL,
  paid_date text,
  status text NOT NULL DEFAULT 'pending',
  method text,
  reference text NOT NULL DEFAULT '',
  student_proof_note text DEFAULT '',
  student_proof_submitted_at timestamptz,
  student_proof_data_url text,
  student_proof_file_name text,
  student_proof_mime text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);

-- ─── 3. AGENDA (AULAS) ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lessons (
  id text PRIMARY KEY,
  category_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  date date NOT NULL,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  max_students integer NOT NULL DEFAULT 12,
  lesson_type text,
  location_url text,
  enrolled_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  present_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  absent_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  waitlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  venue_id text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_trial boolean NOT NULL DEFAULT false,
  check_in_requests jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(date);

-- ─── 4. NOTIFICAÇÕES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT 'agora',
  is_read boolean NOT NULL DEFAULT false,
  student_id text,
  recipient_id text,
  is_global boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ─── 5. STAFF ACCESS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.staff_access (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'coach')),
  is_active boolean NOT NULL DEFAULT true,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_access_email ON public.staff_access(email);
CREATE INDEX IF NOT EXISTS idx_staff_access_active ON public.staff_access(is_active);

-- ─── 6. APP SETTINGS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'singleton'::text,
  enrollment_invite_code text NOT NULL DEFAULT '',
  evaluation_engine jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton_ck CHECK (id = 'singleton')
);

INSERT INTO public.app_settings (id, enrollment_invite_code)
VALUES ('singleton', '')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. FEED SOCIAL ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_avatar text NOT NULL,
  author_role text NOT NULL DEFAULT 'aluno',
  content text NOT NULL DEFAULT '',
  media_url text,
  pinned boolean NOT NULL DEFAULT false,
  is_official boolean NOT NULL DEFAULT false,
  target_role text NOT NULL DEFAULT 'all',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feed_posts_target_role_check' AND conrelid = 'public.feed_posts'::regclass
  ) THEN
    ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_target_role_check
      CHECK (target_role IN ('all', 'student', 'coach'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS feed_post_comments_post_idx ON public.feed_post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feed_post_likes_post_idx ON public.feed_post_likes(post_id);

-- ─── 8. PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'professor', 'aluno')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_role_idx ON public.push_subscriptions(role);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- ─── 9. DEV EVENTS (MONITOR) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dev_events (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX IF NOT EXISTS idx_dev_events_event_type ON public.dev_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dev_events_created_at ON public.dev_events(created_at DESC);

-- ─── 10. TRAINING PLANS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.training_plans (
  id text PRIMARY KEY,
  student_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  exercises jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_training_plans_student_id ON public.training_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_created_at ON public.training_plans(created_at DESC);

-- ─── 11. TRAINING SESSIONS / EXERCISES / LOGS ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.training_sessions (
  id text PRIMARY KEY,
  training_plan_id text NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  session_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_exercises (
  id text PRIMARY KEY,
  training_session_id text NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_sets integer NOT NULL DEFAULT 3,
  target_reps integer NOT NULL DEFAULT 10,
  target_weight_kg numeric,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_logs (
  id text PRIMARY KEY,
  training_exercise_id text NOT NULL REFERENCES public.training_exercises(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  sets_completed integer,
  reps_completed integer,
  weight_kg_actual numeric,
  effort_rating integer,
  notes text,
  synced_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_id ON public.training_sessions(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_student_date ON public.training_sessions(student_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_exercises_session_id ON public.training_exercises(training_session_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_exercise_id ON public.training_logs(training_exercise_id);

-- ─── 12. XP LOG ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.xp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  points int NOT NULL CHECK (points >= 0 AND points <= 100000),
  base_points int NOT NULL,
  multiplier_type text CHECK (multiplier_type IN (
    'ataque','levantamento','bloqueio','saque','defesa','recepcao','posicionamento','none'
  )) DEFAULT 'none',
  multiplier_value numeric(4,2) DEFAULT 1.0,
  type text NOT NULL CHECK (type IN (
    'evaluation','checkin','social_like','social_comment','training_completed','achievement_unlock'
  )),
  source_entity text,
  related_id text,
  description text,
  validation_passed boolean DEFAULT true,
  validation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX IF NOT EXISTS idx_xp_log_student_id ON public.xp_log(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_student_created ON public.xp_log(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_log_type ON public.xp_log(type);
CREATE INDEX IF NOT EXISTS idx_xp_log_validation ON public.xp_log(validation_passed) WHERE validation_passed = false;

-- ─── 13. STUDENT ACHIEVEMENTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  tier_id text NOT NULL,
  xp_threshold int NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, tier_id)
);

CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON public.student_achievements(student_id);

-- ─── 14. XP MULTIPLIERS (seed) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.xp_multipliers (
  id text PRIMARY KEY,
  fundamental text NOT NULL UNIQUE,
  multiplier numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.xp_multipliers (id, fundamental, multiplier) VALUES
  ('mult_ataque',          'ataque',          2.0),
  ('mult_levantamento',    'levantamento',    1.8),
  ('mult_bloqueio',        'bloqueio',        1.6),
  ('mult_saque',           'saque',           1.5),
  ('mult_defesa',          'defesa',          1.4),
  ('mult_recepcao',        'recepcao',        1.3),
  ('mult_posicionamento',  'posicionamento',  1.2)
ON CONFLICT (fundamental) DO NOTHING;

-- ─── 15. AUDIT LOG ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  user_id uuid,
  attempted_changes jsonb,
  blocked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ─── 16. STORAGE BUCKETS ─────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs', 'payment-proofs', false, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Verifica se o usuário logado é staff (admin ou coach)
CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    lower(COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )) IN ('admin','will_owner','owner','coach','professor','teacher')
  )
  OR EXISTS (
    SELECT 1 FROM public.staff_access sa
    WHERE COALESCE(sa.is_active, true)
      AND lower(btrim(COALESCE(sa.email,''))) = lower(btrim(COALESCE(auth.jwt() ->> 'email','')))
      AND lower(btrim(COALESCE(sa.role,''))) IN ('admin','coach')
  );
$$;

-- Verifica se é visitante (observador)
CREATE OR REPLACE FUNCTION public.wt_is_visitor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE auth_user_id = auth.uid()
      AND student_role = 'observador'
      AND status = 'active'
  );
$$;

-- Validação de convite de matrícula
CREATE OR REPLACE FUNCTION public.verify_enrollment_invite(p_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_expected text;
BEGIN
  SELECT nullif(trim(lower(enrollment_invite_code)), '')
  INTO v_expected
  FROM public.app_settings WHERE id = 'singleton';
  IF v_expected IS NULL THEN RETURN false; END IF;
  RETURN nullif(trim(lower(COALESCE(p_code,''))), '') = v_expected;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_enrollment_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_enrollment_invite(text) TO anon, authenticated;

-- Trigger: notifica staff quando novo aluno se cadastra
CREATE OR REPLACE FUNCTION public.wt_notify_staff_new_pending_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' AND NEW.id NOT LIKE 'demo\_%' ESCAPE '\' THEN
    INSERT INTO public.notifications (id, type, title, message, time, is_read, student_id, recipient_id, is_global)
    VALUES (
      gen_random_uuid()::text,
      'new_student',
      'Novo Aluno na Fila',
      COALESCE(NULLIF(trim(NEW.name),''),'Novo aluno') || ' fez o cadastro público e aguarda aprovação!',
      clock_timestamp()::text,
      false, NEW.id, NULL, false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_notify_pending_after_insert ON public.students;
CREATE TRIGGER students_notify_pending_after_insert
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.wt_notify_staff_new_pending_student();

-- Trigger: impede aluno de alterar campos sensíveis
CREATE OR REPLACE FUNCTION public.students_check_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.wt_is_staff() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio status';
    END IF;
    IF NEW.student_role IS DISTINCT FROM OLD.student_role THEN
      RAISE EXCEPTION 'Aluno não pode alterar sua própria role';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu email';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_check_sensitive_fields_trigger ON public.students;
CREATE TRIGGER students_check_sensitive_fields_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.students_check_sensitive_fields();

-- Trigger: updated_at em push_subscriptions
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_push_subscriptions_updated_at();

-- =============================================================================
-- RLS — HABILITAR EM TODAS AS TABELAS
-- =============================================================================

ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_access      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_multipliers    ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- STUDENTS
DROP POLICY IF EXISTS "students_staff_all"           ON public.students;
DROP POLICY IF EXISTS "students_self_select_update"  ON public.students;
DROP POLICY IF EXISTS "students_self_update"         ON public.students;
DROP POLICY IF EXISTS "students_insert_public_signup" ON public.students;
DROP POLICY IF EXISTS "students_insert_pending_self" ON public.students;

CREATE POLICY "students_staff_all"
  ON public.students FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

CREATE POLICY "students_self_select"
  ON public.students FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "students_self_update"
  ON public.students FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "students_insert_pending_self"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND auth_user_id = auth.uid());

-- PAYMENTS
DROP POLICY IF EXISTS "payments_staff_all"                    ON public.payments;
DROP POLICY IF EXISTS "payments_student_own_select_update"    ON public.payments;
DROP POLICY IF EXISTS "payments_student_own_update"           ON public.payments;
DROP POLICY IF EXISTS "payments_student_own_delete"           ON public.payments;

CREATE POLICY "payments_staff_all"
  ON public.payments FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

CREATE POLICY "payments_student_own_select"
  ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = public.payments.student_id
      AND s.auth_user_id = auth.uid()
      AND s.student_role != 'observador'
  ));

CREATE POLICY "payments_student_own_update"
  ON public.payments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = public.payments.student_id
      AND s.auth_user_id = auth.uid()
      AND s.student_role != 'observador'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = public.payments.student_id
      AND s.auth_user_id = auth.uid()
      AND s.student_role != 'observador'
  ));

-- LESSONS
DROP POLICY IF EXISTS "lessons_staff_all"              ON public.lessons;
DROP POLICY IF EXISTS "lessons_authenticated_select"   ON public.lessons;
DROP POLICY IF EXISTS "lessons_student_group_select"   ON public.lessons;

CREATE POLICY "lessons_staff_all"
  ON public.lessons FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

CREATE POLICY "lessons_student_own_select"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    public.wt_is_staff()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.auth_user_id = auth.uid()
        AND s.student_role != 'observador'
        AND (public.lessons.enrolled_students ? s.id)
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_staff_all"                    ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_select"   ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_update"   ON public.notifications;

CREATE POLICY "notifications_staff_all"
  ON public.notifications FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

CREATE POLICY "notifications_student_own_select"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id FROM public.students s WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_student_own_update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id FROM public.students s WHERE s.auth_user_id = auth.uid()
    )
  );

-- STAFF ACCESS
DROP POLICY IF EXISTS "staff_access_select_own_email" ON public.staff_access;

CREATE POLICY "staff_access_select_own_email"
  ON public.staff_access FOR SELECT TO authenticated
  USING (
    lower(btrim(COALESCE(email,''))) = lower(btrim(COALESCE((auth.jwt() ->> 'email'),'')))
  );

-- APP SETTINGS
DROP POLICY IF EXISTS "app_settings_staff_all" ON public.app_settings;
CREATE POLICY "app_settings_staff_all"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

-- FEED
DROP POLICY IF EXISTS "feed_posts_select_authenticated"   ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_insert_authenticated"   ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_update_staff_only"      ON public.feed_posts;

CREATE POLICY "feed_posts_select_authenticated"
  ON public.feed_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "feed_posts_insert_authenticated"
  ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "feed_posts_update_staff_only"
  ON public.feed_posts FOR UPDATE TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

DROP POLICY IF EXISTS "feed_post_likes_select_authenticated" ON public.feed_post_likes;
DROP POLICY IF EXISTS "feed_post_likes_insert_own"           ON public.feed_post_likes;
DROP POLICY IF EXISTS "feed_post_likes_delete_own"           ON public.feed_post_likes;

CREATE POLICY "feed_post_likes_select_authenticated"
  ON public.feed_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_post_likes_insert_own"
  ON public.feed_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_post_likes_delete_own"
  ON public.feed_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_post_comments_select_authenticated" ON public.feed_post_comments;
DROP POLICY IF EXISTS "feed_post_comments_insert_own"           ON public.feed_post_comments;

CREATE POLICY "feed_post_comments_select_authenticated"
  ON public.feed_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_post_comments_insert_own"
  ON public.feed_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "push_subscriptions_own"        ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_staff_read" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_own"
  ON public.push_subscriptions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_staff_read"
  ON public.push_subscriptions FOR SELECT
  USING (public.wt_is_staff());

-- DEV EVENTS
DROP POLICY IF EXISTS "admin_read_dev_events"  ON public.dev_events;
DROP POLICY IF EXISTS "app_insert_dev_events"  ON public.dev_events;

CREATE POLICY "admin_read_dev_events"
  ON public.dev_events FOR SELECT
  USING (public.wt_is_staff());

CREATE POLICY "app_insert_dev_events"
  ON public.dev_events FOR INSERT WITH CHECK (true);

-- TRAINING
DROP POLICY IF EXISTS "staff_all"         ON public.training_plans;
DROP POLICY IF EXISTS "student_read_own"  ON public.training_plans;

CREATE POLICY "training_plans_staff_all"
  ON public.training_plans FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
CREATE POLICY "training_plans_student_own"
  ON public.training_plans FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text OR public.wt_is_staff());

CREATE POLICY "training_sessions_staff_all"
  ON public.training_sessions FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
CREATE POLICY "training_sessions_student_own_select"
  ON public.training_sessions FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text);
CREATE POLICY "training_sessions_student_own_insert"
  ON public.training_sessions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "training_exercises_staff_all"
  ON public.training_exercises FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
CREATE POLICY "training_exercises_student_own"
  ON public.training_exercises FOR SELECT TO authenticated
  USING (public.wt_is_staff() OR EXISTS (
    SELECT 1 FROM public.training_sessions ts
    WHERE ts.id = training_session_id AND ts.student_id = auth.uid()::text
  ));

CREATE POLICY "training_logs_staff_all"
  ON public.training_logs FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
CREATE POLICY "training_logs_student_own_select"
  ON public.training_logs FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text);
CREATE POLICY "training_logs_student_own_insert"
  ON public.training_logs FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()::text);

-- XP LOG
DROP POLICY IF EXISTS "staff_read_all"   ON public.xp_log;
DROP POLICY IF EXISTS "staff_write_all"  ON public.xp_log;
DROP POLICY IF EXISTS "student_read_own" ON public.xp_log;
DROP POLICY IF EXISTS "system_insert"    ON public.xp_log;

CREATE POLICY "xp_log_staff_all"
  ON public.xp_log FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

CREATE POLICY "xp_log_student_own"
  ON public.xp_log FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text);

CREATE POLICY "xp_log_system_insert"
  ON public.xp_log FOR INSERT WITH CHECK (true);

-- STUDENT ACHIEVEMENTS
CREATE POLICY "achievements_staff_all"
  ON public.student_achievements FOR ALL TO authenticated
  USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());
CREATE POLICY "achievements_student_own"
  ON public.student_achievements FOR SELECT TO authenticated
  USING (student_id = auth.uid()::text);

-- XP MULTIPLIERS (leitura pública)
CREATE POLICY "xp_multipliers_public_read"
  ON public.xp_multipliers FOR SELECT USING (true);

-- AUDIT LOG
CREATE POLICY "audit_log_staff_read"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.wt_is_staff());

-- STORAGE
DROP POLICY IF EXISTS "avatars_public_read"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_write"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"       ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_owner_insert" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND split_part(name,'/',1) = auth.uid()::text);

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name,'/',1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND split_part(name,'/',1) = auth.uid()::text);

CREATE POLICY "payment_proofs_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND split_part(name,'/',1) = auth.uid()::text);

CREATE POLICY "payment_proofs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND split_part(name,'/',1) = auth.uid()::text);

-- =============================================================================
-- REALTIME (publica tabelas para subscriptions em tempo real)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.dev_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- =============================================================================
-- CONFIRMAÇÃO FINAL
-- =============================================================================

SELECT
  'Setup concluído!' AS status,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tabelas_criadas,
  now() AS executado_em;
