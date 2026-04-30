-- Run in Supabase SQL editor after applying migration 20260429233000_staff_access.sql
-- Depois rode também 20260429233100_staff_access_rls_select_own.sql (ou cole o SQL de lá)
-- para que cada usuário só veja a própria linha em staff_access — não a lista inteira.
-- Replace e-mails with real owner/professional accounts.

INSERT INTO public.staff_access (id, email, role, is_active, invited_by)
VALUES
  ('staff_owner_primary', 'cityvoleicampeonatos@gmail.com', 'admin', true, 'manual_seed'),
  ('staff_coach_primary', 'futuro.prof@exemplo.com', 'coach', true, 'manual_seed')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
