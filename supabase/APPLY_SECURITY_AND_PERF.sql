-- ============================================================
-- WILL TREINOS PRO — Migrations de Segurança + Performance
-- Aplicar no Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SEGURANÇA C1: Bloquear student_role (escalada de privilégio)
-- ────────────────────────────────────────────────────────────
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
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Aluno não pode alterar sua própria role';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu email (entre em contato com a equipe)';
    END IF;
    IF NEW.student_role IS DISTINCT FROM OLD.student_role THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio papel (student_role)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 2. SEGURANÇA A1: wt_is_staff sem user_metadata (editável pelo usuário)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    lower(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', ''))
    IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher')
  )
  OR EXISTS (
    SELECT 1 FROM public.staff_access sa
    WHERE COALESCE(sa.is_active, true)
      AND lower(btrim(COALESCE(sa.email, ''))) = lower(btrim(COALESCE(auth.jwt() ->> 'email', '')))
      AND lower(btrim(COALESCE(sa.role, ''))) IN ('admin', 'coach')
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 3. PERFORMANCE: 11 índices críticos
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_xp_log_student_created   ON public.xp_log(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_awards_student            ON public.awards(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date              ON public.lessons(date ASC);
CREATE INDEX IF NOT EXISTS idx_payments_due_date         ON public.payments(due_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created     ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_created          ON public.students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id     ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_date     ON public.absence_requests(lesson_date, status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_student ON public.training_sessions(student_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_xp_log_created_at         ON public.xp_log(created_at DESC);

SELECT 'Migrations aplicadas com sucesso!' AS status;
