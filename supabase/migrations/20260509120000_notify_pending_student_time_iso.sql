-- Normaliza notificação do trigger: horário parseável no cliente + texto alinhado ao /cadastro.

CREATE OR REPLACE FUNCTION public.wt_notify_staff_new_pending_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     AND NEW.status = 'pending'
     AND NEW.id NOT LIKE 'demo\_%' ESCAPE '\'
  THEN
    INSERT INTO public.notifications (
      id,
      type,
      title,
      message,
      time,
      is_read,
      student_id,
      recipient_id,
      is_global
    )
    VALUES (
      gen_random_uuid()::text,
      'new_student',
      'Novo Aluno na Fila',
      COALESCE(NULLIF(trim(NEW.name), ''), 'Novo aluno') || ' fez o cadastro público e aguarda aprovação!',
      clock_timestamp()::text,
      false,
      NEW.id,
      NULL,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.wt_notify_staff_new_pending_student IS
  'Após INSERT de aluno pending (exceto demo_*), cria notificação staff com time UTC texto parseável pelo JS.';
