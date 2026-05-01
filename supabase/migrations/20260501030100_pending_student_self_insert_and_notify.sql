-- Allow authenticated pending signup (OAuth sem CRM): INSERT próprio aluno com auth_user_id = auth.uid().
-- Evita RLS bloquear só quem já está logado ao enviar /cadastro.

DROP POLICY IF EXISTS "students_insert_pending_self" ON public.students;

CREATE POLICY "students_insert_pending_self"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND auth_user_id = auth.uid()
  );

COMMENT ON POLICY "students_insert_pending_self" ON public.students IS
  'Aluno em matrícula vincula auth.users ao CRM (status pending).';

-- Notificação para equipe sem depender de permissão no cliente (staff-only INSERT em notifications).

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
      'Nova inscrição',
      COALESCE(NULLIF(trim(NEW.name), ''), 'Novo aluno') || ' enviou cadastro e aguarda aprovação.',
      'agora',
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
  'Após INSERT de aluno pending (exceto demo_*), cria notificação visível para staff via RLS staff_all.';

DROP TRIGGER IF EXISTS students_notify_pending_after_insert ON public.students;

CREATE TRIGGER students_notify_pending_after_insert
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE PROCEDURE public.wt_notify_staff_new_pending_student();
