-- Presence tracking for live lessons
create table if not exists lesson_presence (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  last_heartbeat timestamp with time zone default now(),
  is_active boolean default true,
  unique(lesson_id, student_id)
);

-- RLS policies
alter table lesson_presence enable row level security;

-- Admin + Coach can read any presence
create policy "staff_read_presence" on lesson_presence
  for select
  using (
    exists(
      select 1 from staff_access
      where email = auth.jwt() ->> 'email'
      and is_active = true
    )
  );

-- Student can read presence for their own lessons
create policy "student_read_presence" on lesson_presence
  for select
  using (
    student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
    and exists(
      select 1 from lessons
      where id = lesson_id
      and array[student_id] && enrolled_students
    )
  );

-- Student can insert their own presence
create policy "student_insert_presence" on lesson_presence
  for insert
  with check (
    student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
  );

-- Student can update their own presence (heartbeat)
create policy "student_update_presence" on lesson_presence
  for update
  using (
    student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
  )
  with check (
    student_id = (
      select id from students
      where email = auth.jwt() ->> 'email'
      limit 1
    )
  );

-- Index for fast lookups
create index if not exists idx_lesson_presence_lesson_id on lesson_presence(lesson_id);
create index if not exists idx_lesson_presence_student_id on lesson_presence(student_id);
create index if not exists idx_lesson_presence_active on lesson_presence(is_active);
