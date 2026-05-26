-- =============================================================================
-- WILL TREINOS PRO — Diagnóstico de Migrations
-- Cole no SQL Editor do Supabase e rode para ver o que está aplicado
-- =============================================================================

SELECT
  'staff_access table'          AS check_item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_access') AS applied
UNION ALL SELECT
  'students.auth_user_id column',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'auth_user_id')
UNION ALL SELECT
  'students.student_role column',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'student_role')
UNION ALL SELECT
  'wt_is_staff() function',
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'wt_is_staff')
UNION ALL SELECT
  'app_settings table (invite code)',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings')
UNION ALL SELECT
  'verify_enrollment_invite() RPC',
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_enrollment_invite')
UNION ALL SELECT
  'push_subscriptions table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions')
UNION ALL SELECT
  'xp_log table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xp_log')
UNION ALL SELECT
  'student_achievements table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_achievements')
UNION ALL SELECT
  'lesson_presence table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_presence')
UNION ALL SELECT
  'training_plans table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_plans')
UNION ALL SELECT
  'dev_events table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dev_events')
UNION ALL SELECT
  'feed posts table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts')
UNION ALL SELECT
  'notifications table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
UNION ALL SELECT
  'lessons table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons')
UNION ALL SELECT
  'payments table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments')
UNION ALL SELECT
  'staff_access row (admin cadastrado)',
  EXISTS (SELECT 1 FROM public.staff_access WHERE is_active = true)
ORDER BY applied ASC, check_item ASC;
