-- Função atômica para inscrição/desinscricao em aula
CREATE OR REPLACE FUNCTION public.enroll_student_in_lesson(
  p_lesson_id text,
  p_student_id text,
  p_action text  -- 'enroll' | 'unenroll'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson record;
  v_enrolled text[];
  v_spots_left integer;
BEGIN
  -- Lock a linha da aula para evitar race condition
  SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'lesson_not_found');
  END IF;

  IF v_lesson.status <> 'scheduled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'lesson_not_scheduled');
  END IF;

  v_enrolled := COALESCE(v_lesson.enrolled_students, '{}');

  IF p_action = 'enroll' THEN
    -- Verificar se já está inscrito
    IF p_student_id = ANY(v_enrolled) THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_enrolled');
    END IF;
    -- Verificar vagas (atomicamente)
    IF v_lesson.max_students IS NOT NULL AND array_length(v_enrolled, 1) >= v_lesson.max_students THEN
      RETURN jsonb_build_object('success', false, 'error', 'lesson_full');
    END IF;
    -- Inscrever
    UPDATE public.lessons
    SET enrolled_students = array_append(v_enrolled, p_student_id)
    WHERE id = p_lesson_id;
    v_spots_left := COALESCE(v_lesson.max_students, 999) - COALESCE(array_length(v_enrolled, 1), 0) - 1;

  ELSIF p_action = 'unenroll' THEN
    UPDATE public.lessons
    SET enrolled_students = array_remove(v_enrolled, p_student_id)
    WHERE id = p_lesson_id;
    v_spots_left := COALESCE(v_lesson.max_students, 999) - COALESCE(array_length(v_enrolled, 1), 0) + 1;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_action');
  END IF;

  RETURN jsonb_build_object('success', true, 'spotsLeft', v_spots_left);
END;
$$;

GRANT EXECUTE ON FUNCTION public.enroll_student_in_lesson TO authenticated;
