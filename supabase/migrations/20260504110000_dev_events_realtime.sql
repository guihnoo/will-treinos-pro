-- Dev monitor: Postgres Realtime (postgres_changes) + SELECT via wt_is_staff (OAuth-safe)

-- 1) SELECT para qualquer staff (JWT ou staff_access), não só linha students.role = admin
drop policy if exists "admin_read_dev_events" on public.dev_events;

create policy "admin_read_dev_events" on public.dev_events
  for select
  using (
    wt_is_staff()
    or exists (
      select 1
      from public.students s
      where s.auth_user_id = auth.uid()
        and s.role = 'admin'
    )
  );

-- 2) Incluir tabela na publication do Realtime (idempotente)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'dev_events'
     ) then
    alter publication supabase_realtime add table public.dev_events;
  end if;
end $$;
