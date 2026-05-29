-- Adiciona localização da quadra principal à tabela singleton de configurações.
-- Usado pelo app para verificar geolocalização no check-in do aluno.

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS court_location jsonb;

COMMENT ON COLUMN public.app_settings.court_location IS
  'Coordenadas da quadra: { lat, lng, radiusM, label }. Null = geolocalização desativada.';
