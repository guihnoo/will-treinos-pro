-- Core RLS hardening:
-- - staff (admin/coach) keeps operational full access
-- - student sees only own data where possible
-- - lessons remain readable by authenticated users, but writes become staff-only

CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

COMMENT ON FUNCTION public.wt_is_staff IS
'True when JWT role represents owner/admin/coach. Used by RLS policies.';

-- students
DROP POLICY IF EXISTS "willpro_auth_all_students" ON public.students;
DROP POLICY IF EXISTS "students_staff_all" ON public.students;
DROP POLICY IF EXISTS "students_self_select_update" ON public.students;

CREATE POLICY "students_staff_all"
  ON public.students
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "students_self_select_update"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "students_self_update"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- payments
DROP POLICY IF EXISTS "willpro_auth_all_payments" ON public.payments;
DROP POLICY IF EXISTS "payments_staff_all" ON public.payments;
DROP POLICY IF EXISTS "payments_student_own_select_update" ON public.payments;

CREATE POLICY "payments_staff_all"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "payments_student_own_select_update"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "payments_student_own_update"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  );

-- lessons
DROP POLICY IF EXISTS "willpro_auth_all_lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_staff_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_authenticated_select" ON public.lessons;

CREATE POLICY "lessons_staff_all"
  ON public.lessons
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "lessons_authenticated_select"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

-- notifications
DROP POLICY IF EXISTS "willpro_auth_all_notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_staff_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_update" ON public.notifications;

CREATE POLICY "notifications_staff_all"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "notifications_recipient_or_global_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
    )
  );

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
    )
  )
  WITH CHECK (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
    )
  );
