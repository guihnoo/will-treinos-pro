-- XP Log table for auditability and history tracking
create table if not exists xp_log (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  points int not null,
  type text not null check (type in (
    'evaluation', 'checkin', 'feedback', 'feed_like', 'feed_comment', 'training_completed'
  )),
  description text,
  related_id text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table xp_log enable row level security;

-- Staff (coach/admin) can read all XP logs
create policy "staff_all" on xp_log
  for all using (wt_is_staff()) with check (wt_is_staff());

-- Students can only read their own XP logs
create policy "student_read_own" on xp_log
  for select using (student_id = auth.uid()::text);

-- Indexes for performance
create index idx_xp_log_student_id on xp_log (student_id);
create index idx_xp_log_student_created on xp_log (student_id, created_at desc);
create index idx_xp_log_created_at on xp_log (created_at desc);
