-- staff_access: each authenticated user may only SELECT their own row (by JWT email).
-- Inserts/updates/deletes remain for service role / SQL editor (not the anon client).

DROP POLICY IF EXISTS "willpro_auth_all_staff_access" ON public.staff_access;

CREATE POLICY "staff_access_select_own_email"
  ON public.staff_access
  FOR SELECT
  TO authenticated
  USING (
    lower(btrim(coalesce(email, ''))) = lower(btrim(coalesce((auth.jwt() ->> 'email'), '')))
  );

COMMENT ON POLICY "staff_access_select_own_email" ON public.staff_access IS
  'App reads staff_access only to resolve role for the signed-in user; no broad list exposure.';
