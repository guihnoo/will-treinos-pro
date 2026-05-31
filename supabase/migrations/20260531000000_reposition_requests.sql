-- Sprint 33: Reposition system — student requests a replacement lesson after missing one.
-- Flow: student picks available lesson → auto-enrolled → coach notified.

CREATE TABLE IF NOT EXISTS public.reposition_requests (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id          uuid        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  absence_request_id  uuid        REFERENCES public.absence_requests(id) ON DELETE SET NULL,
  target_lesson_id    text        NOT NULL,
  target_lesson_date  date        NOT NULL,
  target_lesson_title text        NOT NULL,
  target_lesson_time  text,
  status              text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmed_by        uuid,
  confirmed_at        timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reposition_requests_student_idx
  ON public.reposition_requests (student_id, target_lesson_date DESC);

CREATE INDEX IF NOT EXISTS reposition_requests_lesson_idx
  ON public.reposition_requests (target_lesson_id);

ALTER TABLE public.reposition_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_reposition_requests" ON public.reposition_requests
  FOR ALL TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "staff_reposition_requests_all" ON public.reposition_requests
  FOR ALL TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());
