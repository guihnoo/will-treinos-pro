-- Phase 7: Complete Training System CRUD

-- Training Sessions: each workout instance
create table if not exists training_sessions (
  id text primary key,
  training_plan_id text not null references training_plans(id) on delete cascade,
  student_id text not null,
  session_date date not null,
  status text not null default 'pending', -- pending, in_progress, completed, skipped
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Training Exercises: individual exercises in a session
create table if not exists training_exercises (
  id text primary key,
  training_session_id text not null references training_sessions(id) on delete cascade,
  name text not null,
  target_sets integer not null default 3,
  target_reps integer not null default 10,
  target_weight_kg numeric,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Training Logs: mark exercise as completed (with actual values)
create table if not exists training_logs (
  id text primary key,
  training_exercise_id text not null references training_exercises(id) on delete cascade,
  student_id text not null,
  completed_at timestamptz not null default now(),
  sets_completed integer,
  reps_completed integer,
  weight_kg_actual numeric,
  effort_rating integer, -- 1-10 scale
  notes text,
  synced_at timestamptz
);

-- Enable RLS on all tables
alter table training_sessions enable row level security;
alter table training_exercises enable row level security;
alter table training_logs enable row level security;

-- RLS Policies for training_sessions
create policy "staff_all" on training_sessions
  for all using (wt_is_staff()) with check (wt_is_staff());

create policy "student_read_own" on training_sessions
  for select using (student_id = auth.uid()::text);

create policy "student_insert_own" on training_sessions
  for insert with check (student_id = auth.uid()::text);

create policy "student_update_own" on training_sessions
  for update using (student_id = auth.uid()::text);

-- RLS Policies for training_exercises
create policy "staff_all" on training_exercises
  for all using (
    (select wt_is_staff()) or
    (select student_id from training_sessions where id = training_session_id) = auth.uid()::text
  )
  with check (
    (select wt_is_staff()) or
    (select student_id from training_sessions where id = training_session_id) = auth.uid()::text
  );

create policy "student_read_own" on training_exercises
  for select using (
    (select student_id from training_sessions where id = training_session_id) = auth.uid()::text or
    wt_is_staff()
  );

-- RLS Policies for training_logs
create policy "staff_all" on training_logs
  for all using (wt_is_staff()) with check (wt_is_staff());

create policy "student_read_own" on training_logs
  for select using (student_id = auth.uid()::text);

create policy "student_insert_own" on training_logs
  for insert with check (student_id = auth.uid()::text);

-- Indexes for performance
create index idx_training_sessions_plan_id on training_sessions(training_plan_id);
create index idx_training_sessions_student_date on training_sessions(student_id, session_date);
create index idx_training_exercises_session_id on training_exercises(training_session_id);
create index idx_training_logs_exercise_id on training_logs(training_exercise_id);
create index idx_training_logs_student_completed on training_logs(student_id, completed_at desc);
