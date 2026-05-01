-- Configuração singleton por projeto (convite de matrícula). Staff R/W; sem leitura anon.

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'singleton'::text,
  enrollment_invite_code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton_ck CHECK (id = 'singleton')
);

INSERT INTO public.app_settings (id, enrollment_invite_code)
VALUES ('singleton', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_staff_all" ON public.app_settings;

CREATE POLICY "app_settings_staff_all"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

COMMENT ON TABLE public.app_settings IS 'Chaves operacionais singleton (ex.: código público de convite em /cadastro?invite=).';
