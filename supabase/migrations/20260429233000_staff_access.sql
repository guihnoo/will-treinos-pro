-- Staff access registry (owner/professor) for controlled role elevation by e-mail.
-- This enables invite/link onboarding without exposing admin role to open sign-ups.

CREATE TABLE IF NOT EXISTS public.staff_access (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'coach')),
  is_active boolean NOT NULL DEFAULT true,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_access_email ON public.staff_access(email);
CREATE INDEX IF NOT EXISTS idx_staff_access_active ON public.staff_access(is_active);

ALTER TABLE public.staff_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "willpro_auth_all_staff_access" ON public.staff_access;
CREATE POLICY "willpro_auth_all_staff_access"
  ON public.staff_access FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.staff_access IS 'Whitelist of staff e-mails with effective app role (admin/coach).';
COMMENT ON COLUMN public.staff_access.email IS 'Normalized lowercase e-mail used at login.';
