CREATE TABLE IF NOT EXISTS public.evaluation_templates (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id   text        NOT NULL,
  name          text        NOT NULL,
  weights       jsonb       NOT NULL DEFAULT '{}',
  -- weights: {"fisico": 1.5, "tecnico": 2.0, "tatico": 1.8, "atitude": 1.0, "evolucao": 1.2}
  is_default    boolean     NOT NULL DEFAULT false,
  created_by    uuid,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_templates" ON public.evaluation_templates;
CREATE POLICY "staff_all_templates" ON public.evaluation_templates
  FOR ALL TO authenticated USING (public.wt_is_staff()) WITH CHECK (public.wt_is_staff());

DROP POLICY IF EXISTS "student_read_templates" ON public.evaluation_templates;
CREATE POLICY "student_read_templates" ON public.evaluation_templates
  FOR SELECT TO authenticated USING (true);
