-- =============================================================================
-- WILL TREINOS PRO — Reset to Zero
-- Apaga TODOS os dados operacionais e mantém apenas:
--   • staff_access (admins)
--   • app_settings (singleton)
--   • xp_multipliers (referência)
--   • awards (tiers de referência sem student_id)
-- =============================================================================

-- Ordem respeita foreign keys (dependentes primeiro)

-- Feed
DELETE FROM public.feed_post_comments;
DELETE FROM public.feed_post_likes;
DELETE FROM public.feed_posts;

-- XP e conquistas
DELETE FROM public.xp_log;
DELETE FROM public.student_achievements;
DELETE FROM public.awards WHERE student_id IS NOT NULL; -- mantém seeds sem dono

-- Treinos
DELETE FROM public.training_logs;
DELETE FROM public.training_exercises;
DELETE FROM public.training_sessions;
DELETE FROM public.training_plans;

-- Financeiro e aulas
DELETE FROM public.payments;
DELETE FROM public.notifications;
DELETE FROM public.lessons;

-- Alunos (exceto quem é admin — serão recriados ao logar)
DELETE FROM public.students
WHERE email NOT IN (
  SELECT email FROM public.staff_access WHERE is_active = true
);

-- Dev events
DELETE FROM public.dev_events;

-- Audit log
DELETE FROM public.audit_log;

-- Push subscriptions (usuário vai re-autorizar)
DELETE FROM public.push_subscriptions;

-- Confirma
SELECT
  'students'    AS tabela, COUNT(*) AS restam FROM public.students
UNION ALL SELECT 'lessons',     COUNT(*) FROM public.lessons
UNION ALL SELECT 'payments',    COUNT(*) FROM public.payments
UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL SELECT 'xp_log',      COUNT(*) FROM public.xp_log
UNION ALL SELECT 'feed_posts',  COUNT(*) FROM public.feed_posts
UNION ALL SELECT 'training_plans', COUNT(*) FROM public.training_plans
UNION ALL SELECT 'staff_access (mantido)', COUNT(*) FROM public.staff_access
ORDER BY tabela;
