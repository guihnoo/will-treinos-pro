-- RLS Hardening Phase 2: CHECK constraints para impedir auto-promotion
-- Impedir que aluno consegua mudar próprio status ou role via UPDATE

-- ============================================================================
-- PROBLEMA: Aluno consegue fazer UPDATE students SET status = 'active'
-- SOLUÇÃO: Adicionar CHECK constraint + trigger
-- ============================================================================

-- CREATE: Trigger para bloquear UPDATE de campos críticos por não-staff
CREATE OR REPLACE FUNCTION public.students_check_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não é staff (admin/coach):
  IF NOT public.wt_is_staff() THEN
    -- Aluno não consegue mudar status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio status';
    END IF;

    -- Aluno não consegue mudar role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Aluno não pode alterar sua própria role';
    END IF;

    -- Aluno não consegue mudar email
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu email (entre em contato com a equipe)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- DROP trigger if exists
DROP TRIGGER IF EXISTS students_check_sensitive_fields_trigger ON public.students;

-- CREATE trigger
CREATE TRIGGER students_check_sensitive_fields_trigger
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.students_check_sensitive_fields();

COMMENT ON TRIGGER students_check_sensitive_fields_trigger ON public.students IS
'Bloqueia aluno de fazer UPDATE em campos sensíveis (status, role, email). Apenas staff consegue.';

-- ============================================================================
-- PROBLEMA: Aluno consegue fazer DELETE em próprios payments comprovantes
-- SOLUÇÃO: Bloquear DELETE para aluno (apenas soft-delete flag)
-- ============================================================================

-- DROP old policy
DROP POLICY IF EXISTS "payments_student_own_delete" ON public.payments;

-- CREATE new: Aluno NÃO consegue fazer DELETE, apenas UPDATE proof
-- (DELETE fica para staff/admin only)
CREATE POLICY "payments_student_own_delete"
  ON public.payments
  FOR DELETE
  TO authenticated
  USING (false);  -- NUNCA consegue deletar (nem staff deve deletes aqui)

COMMENT ON POLICY "payments_student_own_delete" ON public.payments IS
'Bloqueia DELETE para todos. Use soft-delete (is_deleted flag) em vez de DELETE direto.';

-- ============================================================================
-- AUDIT: Detectar tentativas de UPDATE sensível
-- ============================================================================

-- CREATE: Tabela de audit log (se não existir)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action text NOT NULL,  -- 'UPDATE', 'DELETE', 'INSERT'
  table_name text NOT NULL,  -- 'students', 'payments'
  record_id text NOT NULL,
  user_id uuid,
  attempted_changes jsonb,
  blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- DROP policy if exists
DROP POLICY IF EXISTS "audit_log_staff_read" ON public.audit_log;

-- CREATE policy: Staff consegue ler audit log
CREATE POLICY "audit_log_staff_read"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.wt_is_staff());

-- ============================================================================
-- TRIGGER: Log UPDATE attempts em students (sensível)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_students_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes jsonb := jsonb_object_aggs(key, (row_to_json(new)->key))
             FROM (SELECT key FROM jsonb_object_keys(row_to_json(new) - row_to_json(old)) key) x;
BEGIN
  INSERT INTO public.audit_log (action, table_name, record_id, user_id, attempted_changes, blocked)
  VALUES ('UPDATE', 'students', NEW.id, auth.uid(), changes, false);
  RETURN NEW;
END;
$$;

-- DROP trigger if exists
DROP TRIGGER IF EXISTS audit_students_update_trigger ON public.students;

-- CREATE trigger
CREATE TRIGGER audit_students_update_trigger
AFTER UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.audit_students_update();

COMMENT ON TRIGGER audit_students_update_trigger ON public.students IS
'Registra todos UPDATE em students na tabela audit_log para rastreamento.';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Teste: Aluno tenta mudar status próprio (deve falhar)
-- SELECT * FROM students WHERE auth_user_id = auth.uid();
-- UPDATE students SET status = 'active' WHERE auth_user_id = auth.uid();
-- → Expected: ERROR "Aluno não pode alterar seu próprio status"

-- Teste: Admin consegue mudar status
-- (Admin consegue porque wt_is_staff() = true)
