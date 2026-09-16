-- Sprint 2A — QR check-in seguro: RPC atômica para registrar presença.
--
-- Problema que esta migration resolve: `lessons.present_students` é uma
-- coluna jsonb (array). Sem esta função, registrar presença exigiria um
-- padrão read → append em memória → update no client/servidor, que sofre
-- "lost update" se dois alunos fizerem check-in na mesma aula ao mesmo
-- tempo (a segunda escrita pode sobrescrever a primeira). Esta função faz
-- a leitura + verificação + escrita em uma única instrução SQL protegida
-- por `FOR UPDATE` (trava de linha), tornando a operação atômica.
--
-- SECURITY INVOKER (padrão — não é SECURITY DEFINER): esta função só é
-- chamada pelo endpoint de check-in server-side usando a
-- SUPABASE_SERVICE_ROLE_KEY, que já ignora RLS por definição. Não há
-- necessidade de elevar privilégio dentro da função — evita ampliar a
-- superfície de escalonamento.
--
-- Esta migration NÃO foi aplicada no Supabase remoto. Ela deve ser
-- aplicada manualmente/via pipeline de release controlado, fora desta
-- sprint (ver docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md).

create or replace function public.register_lesson_checkin(
  p_lesson_id text,
  p_student_id text
)
returns table (
  lesson_found boolean,
  lesson_status text,
  is_enrolled boolean,
  already_present boolean
)
language plpgsql
as $$
declare
  v_status text;
  v_enrolled boolean;
  v_already boolean;
begin
  select l.status,
         (l.enrolled_students ? p_student_id),
         (l.present_students ? p_student_id)
    into v_status, v_enrolled, v_already
    from public.lessons l
   where l.id = p_lesson_id
   for update;

  if not found then
    return query select false, null::text, false, false;
    return;
  end if;

  if v_already then
    return query select true, v_status, v_enrolled, true;
    return;
  end if;

  if v_status = 'cancelled' then
    return query select true, v_status, v_enrolled, false;
    return;
  end if;

  if not v_enrolled then
    return query select true, v_status, false, false;
    return;
  end if;

  -- Aluno inscrito, aula não cancelada, ainda não presente: registra.
  update public.lessons
     set present_students = present_students || to_jsonb(p_student_id::text),
         updated_at = now()
   where id = p_lesson_id;

  return query select true, v_status, true, false;
end;
$$;

comment on function public.register_lesson_checkin(text, text) is
  'Sprint 2A — registra presença de aluno em uma aula de forma atômica (FOR UPDATE), evitando lost update em check-ins concorrentes. Chamada só pelo endpoint server-side de check-in via QR, usando SERVICE_ROLE_KEY.';
