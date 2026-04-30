alter table public.students enable row level security;

drop policy if exists "students_insert_public_signup" on public.students;
create policy "students_insert_public_signup"
on public.students
for insert
to anon, authenticated
with check (
  status = 'pending'
  and auth_user_id is null
);
