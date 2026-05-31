-- Coach → Athlete direct messages.
-- Coach sends a personal text note to a specific student.
-- Student reads own messages; staff reads/writes all.

CREATE TABLE IF NOT EXISTS public.coach_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_name   text        NOT NULL,  -- display name of sender (denormalized for simplicity)
  to_student_id text      NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at  timestamptz DEFAULT now(),
  read_at     timestamptz
);

CREATE INDEX IF NOT EXISTS coach_messages_student_idx
  ON public.coach_messages (to_student_id, created_at DESC);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Staff can do everything
CREATE POLICY "staff_coach_messages_all" ON public.coach_messages
  FOR ALL TO authenticated
  USING  (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

-- Students can read their own messages
CREATE POLICY "student_read_own_messages" ON public.coach_messages
  FOR SELECT TO authenticated
  USING (
    to_student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  );

-- Students can mark messages as read (UPDATE read_at only)
CREATE POLICY "student_mark_read" ON public.coach_messages
  FOR UPDATE TO authenticated
  USING (
    to_student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (true);
