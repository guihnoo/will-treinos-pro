-- Dev Events Table for Real-Time Monitoring
-- Logs every important app action (student creation, lesson creation, check-in, etc.)

create table if not exists dev_events (
  id bigint primary key generated always as identity,
  event_type text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamp with time zone default now() not null,
  created_by text
);

-- Índices para queries rápidas
create index if not exists idx_dev_events_event_type on dev_events(event_type);
create index if not exists idx_dev_events_entity_type on dev_events(entity_type);
create index if not exists idx_dev_events_created_at on dev_events(created_at desc);
create index if not exists idx_dev_events_entity_id on dev_events(entity_id);

-- RLS: Only admin can read
alter table dev_events enable row level security;

create policy "admin_read_dev_events" on dev_events
  for select
  using (
    (select auth.jwt() ->> 'role') = 'authenticated'
    and exists (
      select 1 from students s
      where s.auth_user_id = auth.uid()
      and s.role = 'admin'
    )
  );

create policy "app_insert_dev_events" on dev_events
  for insert
  with check (true);

-- Função helper para inserir eventos (chamada via AppContext)
create or replace function log_dev_event(
  p_event_type text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_details jsonb default null,
  p_created_by text default null
) returns bigint as $$
declare
  v_id bigint;
begin
  insert into dev_events (event_type, entity_type, entity_id, details, created_by)
  values (p_event_type, p_entity_type, p_entity_id, p_details, p_created_by)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql;
