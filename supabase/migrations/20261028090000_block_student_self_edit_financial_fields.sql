-- Fecha brecha de RLS: aluno conseguia alterar o próprio valor de mensalidade e dia de
-- pagamento via API direta (a UI nunca ofereceu esse campo, mas a policy
-- students_self_update + o gatilho de campos sensíveis não bloqueavam essas duas colunas).
-- A partir de agora, só staff (professor/dono) grava monthly_value e payment_day.
CREATE OR REPLACE FUNCTION public.students_check_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    IF NEW.student_role IS DISTINCT FROM OLD.student_role THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio papel (student_role)';
    END IF;
    IF NEW.monthly_value IS DISTINCT FROM OLD.monthly_value THEN
      RAISE EXCEPTION 'Aluno não pode alterar o valor da própria mensalidade (fale com o professor/dono)';
    END IF;
    IF NEW.payment_day IS DISTINCT FROM OLD.payment_day THEN
      RAISE EXCEPTION 'Aluno não pode alterar o próprio dia de pagamento (fale com o professor/dono)';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
