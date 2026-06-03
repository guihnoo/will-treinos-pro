-- WILL TREINOS PRO — Verificação rápida de produção (idempotente, só leitura)
-- Rodar no Supabase → SQL Editor.

SELECT 'staff_access' AS check, COUNT(*)::int AS rows, COUNT(*) FILTER (WHERE is_active)::int AS active
FROM staff_access;

SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('wt_is_staff', 'enroll_student_in_lesson', 'students_check_sensitive_fields');

SELECT 'referrals' AS tbl, to_regclass('public.referrals') IS NOT NULL AS ok
UNION ALL SELECT 'notification_preferences', to_regclass('public.notification_preferences') IS NOT NULL
UNION ALL SELECT 'xp_log', to_regclass('public.xp_log') IS NOT NULL;
