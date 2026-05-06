-- Training Plans & Exercises (Phase 7)
create table if not exists training_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references students(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists training_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references training_plans(id) on delete cascade,
  week_number integer not null check (week_number >= 1 and week_number <= 52),
  day_name text not null check (day_name in ('segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo')),
  exercise_name text not null,
  sets integer not null default 3 check (sets >= 1 and sets <= 10),
  reps_min integer default null,
  reps_max integer default null,
  duration_minutes integer default null,
  intensity text default 'moderado' check (intensity in ('leve', 'moderado', 'intenso', 'máximo')),
  notes text,
  completed_at timestamp with time zone default null,
  completed_reps integer default null,
  completed_weight numeric(8,2) default null,
  created_at timestamp with time zone default now(),
  unique(plan_id, week_number, day_name, exercise_name)
);

-- RLS Policies
alter table training_plans enable row level security;
alter table training_exercises enable row level security;

-- Coach can read/write their own plans
create policy "coach_read_own_plans" on training_plans
  for select
  using (coach_id = auth.uid() or exists(
    select 1 from staff_access
    where email = auth.jwt() ->> 'email'
    and is_active = true
  ));

create policy "coach_create_plan" on training_plans
  for insert
  with check (coach_id = auth.uid() or exists(
    select 1 from staff_access
    where email = auth.jwt() ->> 'email'
    and is_active = true
  ));

create policy "coach_update_plan" on training_plans
  for update
  using (coach_id = auth.uid() or exists(
    select 1 from staff_access
    where email = auth.jwt() ->> 'email'
    and is_active = true
  ))
  with check (coach_id = auth.uid() or exists(
    select 1 from staff_access
    where email = auth.jwt() ->> 'email'
    and is_active = true
  ));

-- Student can read their own plans and mark exercises complete
create policy "student_read_own_plans" on training_plans
  for select
  using (student_id = (
    select id from students
    where email = auth.jwt() ->> 'email'
    limit 1
  ));

-- Exercises: coach writes, student can update completion
create policy "read_exercises" on training_exercises
  for select
  using (exists(
    select 1 from training_plans
    where id = plan_id
    and (
      coach_id = auth.uid()
      or student_id = (
        select id from students
        where email = auth.jwt() ->> 'email'
        limit 1
      )
      or exists(
        select 1 from staff_access
        where email = auth.jwt() ->> 'email'
        and is_active = true
      )
    )
  ));

create policy "coach_write_exercises" on training_exercises
  for insert
  with check (exists(
    select 1 from training_plans
    where id = plan_id
    and coach_id = auth.uid()
  ));

create policy "coach_update_exercises" on training_exercises
  for update
  using (exists(
    select 1 from training_plans
    where id = plan_id
    and coach_id = auth.uid()
  ))
  with check (exists(
    select 1 from training_plans
    where id = plan_id
    and coach_id = auth.uid()
  ));

create policy "student_mark_complete" on training_exercises
  for update
  using (exists(
    select 1 from training_plans tp
    where tp.id = plan_id
    and tp.student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
  ))
  with check (exists(
    select 1 from training_plans tp
    where tp.id = plan_id
    and tp.student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
  ));

-- Indexes
create index if not exists idx_training_plans_coach_id on training_plans(coach_id);
create index if not exists idx_training_plans_student_id on training_plans(student_id);
create index if not exists idx_training_plans_status on training_plans(status);
create index if not exists idx_training_exercises_plan_id on training_exercises(plan_id);
create index if not exists idx_training_exercises_week_day on training_exercises(plan_id, week_number, day_name);
