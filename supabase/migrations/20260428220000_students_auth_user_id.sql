-- Links operational student rows to Supabase Auth identities (auth.users.id).
-- Enables financeiro / agenda / notifications to key off students.id while JWT stays stable.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- One auth account ↔ at most one student profile (demo / production single-tenant pattern).
CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_uidx
  ON public.students(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

COMMENT ON COLUMN public.students.auth_user_id IS 'Supabase auth.users.id — binds login to CRM student row';
