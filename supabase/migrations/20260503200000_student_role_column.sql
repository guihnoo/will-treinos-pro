-- Fase 1: Add role column to students + visitor RLS

-- 1. Add role column (diferencia aluno/professor/visitor)
ALTER TABLE students ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'aluno'
  CHECK (role IN ('admin', 'professor', 'aluno', 'visitor'));

-- 2. Create visitor helper function
CREATE OR REPLACE FUNCTION wt_is_visitor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE auth_user_id = auth.uid()
      AND role = 'visitor'
      AND status = 'active'
  );
$$;

-- 3. Update payments RLS: visitors cannot access payments
ALTER POLICY "payments_student_own_select_update" ON payments
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.auth_user_id = auth.uid()
        AND s.id = student_id
        AND s.role != 'visitor'
    )
  );

-- 4. Update lessons RLS: visitors cannot access lessons
ALTER POLICY "lessons_student_group_select" ON lessons
  USING (
    wt_is_staff()
    OR (
      enrolled_students ? (
        SELECT s.id FROM students s
        WHERE s.auth_user_id = auth.uid()
          AND s.role != 'visitor'
      )
    )
  );

-- 5. Update notifications RLS: visitors can only see global notifications
ALTER POLICY "notifications_recipient_or_global_select" ON notifications
  USING (
    is_global = true
    OR (
      NOT wt_is_visitor()
      AND recipient_id IN (
        SELECT s.id FROM students s
        WHERE s.auth_user_id = auth.uid()
      )
    )
  );

-- 6. Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id_role ON students(auth_user_id, role);
