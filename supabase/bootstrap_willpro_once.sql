-- =============================================================================
-- WILL TREINOS PRO — Bootstrap único por projeto Supabase (SQL Editor)
-- =============================================================================
-- Rode este ficheiro UMA VEZ por ambiente (projeto novo ou após recriar DB).
-- O cliente anon/authenticated NÃO pode inserir em staff_access — só SQL Editor
-- (role postgres) ou service_role.
--
-- Depois disto:
--   • wt_is_staff() passa a reconhecer estes emails como admin/coach (OAuth OK).
--   • O cockpit lista alunos/pagamentos porque as políticas usam wt_is_staff().
--
-- Substitua os emails pelos reais (minúsculas, iguais ao Google Auth).
-- =============================================================================

-- Dono(s) / gestor(es)
INSERT INTO public.staff_access (id, email, role, is_active)
VALUES
  (gen_random_uuid()::text, 'substitua-email-dono@gmail.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Opcional: segundo admin ou professor
-- INSERT INTO public.staff_access (id, email, role, is_active)
-- VALUES (gen_random_uuid()::text, 'professor@gmail.com', 'coach', true)
-- ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;

-- =============================================================================
-- Política de auto-inscrição OAuth (aluno pending + auth_user_id = auth.uid())
-- Se o cadastro público /signup falhar com RLS, aplique a migração:
--   supabase/migrations/20260501030100_pending_student_self_insert_and_notify.sql
-- =============================================================================
