-- Adiciona coluna para persistir templates de avaliação no banco (staff-only)
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS evaluation_engine jsonb;

COMMENT ON COLUMN public.app_settings.evaluation_engine IS
  'JSON dos templates e critérios de avaliação do coach — substitui localStorage.';
