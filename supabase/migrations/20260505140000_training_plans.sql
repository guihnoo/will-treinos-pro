-- Training Plans table for coaching system
create table if not exists training_plans (
  id text primary key,
  student_id text not null,
  title text not null default '',
  exercises jsonb not null default '[]',
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz
);

-- Enable RLS
alter table training_plans enable row level security;

-- Staff (coach/admin) can read and write all training plans
create policy "staff_all" on training_plans
  for all using (wt_is_staff()) with check (wt_is_staff());

-- Students can only read their own training plans
create policy "student_read_own" on training_plans
  for select using (student_id = auth.uid()::text or wt_is_staff());

-- Index for performance
create index idx_training_plans_student_id on training_plans (student_id);
create index idx_training_plans_created_at on training_plans (created_at desc);
