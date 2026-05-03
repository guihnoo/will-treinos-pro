-- Validação pública do código de matrícula sem expor SELECT em app_settings para anon.

create or replace function public.verify_enrollment_invite(p_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_expected text;
begin
  select nullif(trim(lower(enrollment_invite_code)), '')
  into v_expected
  from app_settings
  where id = 'singleton';

  if v_expected is null then
    return false;
  end if;

  return nullif(trim(lower(coalesce(p_code, ''))), '') = v_expected;
end;
$$;

revoke all on function public.verify_enrollment_invite(text) from public;
grant execute on function public.verify_enrollment_invite(text) to anon, authenticated;

comment on function public.verify_enrollment_invite(text) is
  'True quando p_code coincide com app_settings.enrollment_invite_code (singleton). Código vazio no servidor ⇒ false.';
