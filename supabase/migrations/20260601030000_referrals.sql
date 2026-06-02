-- Sprint 100: Sistema de Indicação (Referral)
-- Tabela de referrals com RLS aluno + staff

CREATE TABLE IF NOT EXISTS public.referrals (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id         text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  referred_email      text        NOT NULL,
  referred_student_id text        REFERENCES public.students(id),
  status              text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rewarded')),
  xp_awarded          integer,
  created_at          timestamptz DEFAULT now(),
  rewarded_at         timestamptz
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_email_idx ON public.referrals (referred_email);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas os próprios referrals
CREATE POLICY "student_own_referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    referrer_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  );

-- Staff tem acesso total
CREATE POLICY "staff_all_referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());
