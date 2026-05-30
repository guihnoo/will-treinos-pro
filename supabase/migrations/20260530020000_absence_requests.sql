-- Student proactive absence communication.
-- Student selects an upcoming lesson they won't attend before it happens.

CREATE TABLE IF NOT EXISTS public.absence_requests (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id      uuid        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id       text        NOT NULL,  -- UUID string (no strict FK — lessons may be local)
  lesson_date     date        NOT NULL,
  lesson_title    text        NOT NULL,
  lesson_time     text,
  reason          text        NOT NULL CHECK (reason IN ('doenca','trabalho','viagem','emergencia','pessoal','outro')),
  notes           text,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','acknowledged')),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS absence_requests_student_idx
  ON public.absence_requests (student_id, lesson_date DESC);

CREATE INDEX IF NOT EXISTS absence_requests_lesson_idx
  ON public.absence_requests (lesson_id);

ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;

-- Students can insert and read their own requests
CREATE POLICY "student_own_absence_requests" ON public.absence_requests
  FOR ALL TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
  );

-- Staff can read all and update status
CREATE POLICY "staff_absence_requests_all" ON public.absence_requests
  FOR ALL TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());
