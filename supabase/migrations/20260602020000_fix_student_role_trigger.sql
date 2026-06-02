-- Security Fix C1: Bloquear aluno de alterar student_role (escalada de privilégio)
-- O trigger anterior cobria status/role/email mas NÃO student_role,
-- permitindo que um aluno se autopromovesse a 'professor'.

CREATE OR REPLACE FUNCTION public.students_check_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.wt_is_staff() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio status';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Aluno não pode alterar sua própria role';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu email (entre em contato com a equipe)';
    END IF;

    -- NOVO: bloquear student_role (vetor de escalada de privilégio)
    IF NEW.student_role IS DISTINCT FROM OLD.student_role THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio papel (student_role)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.students_check_sensitive_fields IS
'Bloqueia aluno de alterar status, role, email e student_role. Apenas staff pode.';
