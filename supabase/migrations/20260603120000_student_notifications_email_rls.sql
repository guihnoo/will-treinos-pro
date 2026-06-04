-- Permite aluno ler recados/notificações quando a linha CRM ainda só bate por e-mail
-- (auth_user_id NULL — comum em matrículas manuais antes do primeiro link-student).

DROP POLICY IF EXISTS "student_read_own_messages" ON public.coach_messages;
CREATE POLICY "student_read_own_messages" ON public.coach_messages
  FOR SELECT TO authenticated
  USING (
    to_student_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
         OR (
           s.auth_user_id IS NULL
           AND lower(trim(s.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
         )
    )
  );

DROP POLICY IF EXISTS "student_mark_read" ON public.coach_messages;
CREATE POLICY "student_mark_read" ON public.coach_messages
  FOR UPDATE TO authenticated
  USING (
    to_student_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
         OR (
           s.auth_user_id IS NULL
           AND lower(trim(s.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
         )
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_recipient_or_global_select" ON public.notifications;
CREATE POLICY "notifications_recipient_or_global_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    is_global = true
    OR (
      NOT wt_is_visitor()
      AND recipient_id IN (
        SELECT s.id
        FROM public.students s
        WHERE s.auth_user_id = auth.uid()
           OR (
             s.auth_user_id IS NULL
             AND lower(trim(s.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
           )
      )
    )
  );

DROP POLICY IF EXISTS "notifications_recipient_or_global_update" ON public.notifications;
CREATE POLICY "notifications_recipient_or_global_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
         OR (
           s.auth_user_id IS NULL
           AND lower(trim(s.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
         )
    )
  )
  WITH CHECK (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
         OR (
           s.auth_user_id IS NULL
           AND lower(trim(s.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
         )
    )
  );
