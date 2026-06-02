-- Performance: índices críticos identificados na auditoria
-- Reduzem ~50ms por query nas operações mais frequentes

-- GamificationContext: query mais frequente do aluno
CREATE INDEX IF NOT EXISTS idx_xp_log_student_created
  ON public.xp_log(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_awards_student
  ON public.awards(student_id);

-- fetchLiveAppData: queries do bootstrap
CREATE INDEX IF NOT EXISTS idx_lessons_date
  ON public.lessons(date ASC);

CREATE INDEX IF NOT EXISTS idx_payments_due_date
  ON public.payments(due_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_created
  ON public.students(created_at DESC);

-- Autenticação: resolver student por auth_user_id (muito frequente)
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id
  ON public.students(auth_user_id);

-- Absence requests
CREATE INDEX IF NOT EXISTS idx_absence_requests_date_status
  ON public.absence_requests(lesson_date, status);

-- Training sessions
CREATE INDEX IF NOT EXISTS idx_training_sessions_student
  ON public.training_sessions(student_id, session_date DESC);

-- XP log: queries de leaderboard por período
CREATE INDEX IF NOT EXISTS idx_xp_log_created_at
  ON public.xp_log(created_at DESC);
