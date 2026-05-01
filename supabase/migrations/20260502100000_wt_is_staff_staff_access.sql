-- RLS: OAuth/Google often ships JWT without user_metadata.role — UI dev toggle cannot change Postgres.
-- Extend wt_is_staff() so an active staff_access row for the signed-in e-mail grants the same powers as JWT staff claims.
-- After migrate: INSERT INTO staff_access (id, email, role, is_active) VALUES (gen_random_uuid()::text, 'seu@email.com', 'admin', true);

CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    lower(
      COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        ''
      )
    ) IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher')
  )
  OR EXISTS (
    SELECT 1
    FROM public.staff_access sa
    WHERE COALESCE(sa.is_active, true)
      AND lower(btrim(COALESCE(sa.email, ''))) = lower(btrim(COALESCE(auth.jwt() ->> 'email', '')))
      AND lower(btrim(COALESCE(sa.role, ''))) IN ('admin', 'coach')
  );
$$;

COMMENT ON FUNCTION public.wt_is_staff IS
  'True when JWT role claims denote staff, or when an active staff_access row matches auth.jwt() email (OAuth-safe).';
