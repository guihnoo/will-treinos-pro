-- Lessons RLS hardening dedicated migration:
-- - staff/admin full write access
-- - students only read lessons in their own enrolled list

create or replace function public.wt_is_staff()
returns boolean
language sql
stable
as $$
  select lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) in ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

alter table public.lessons enable row level security;

drop policy if exists "lessons_staff_all" on public.lessons;
drop policy if exists "lessons_authenticated_select" on public.lessons;
drop policy if exists "lessons_student_group_select" on public.lessons;

create policy "lessons_staff_all"
on public.lessons
for all
to authenticated
using (public.wt_is_staff())
with check (public.wt_is_staff());

create policy "lessons_student_group_select"
on public.lessons
for select
to authenticated
using (
  public.wt_is_staff()
  or exists (
    select 1
    from public.students s
    where s.auth_user_id = auth.uid()
      and (public.lessons.enrolled_students ? s.id)
  )
);
