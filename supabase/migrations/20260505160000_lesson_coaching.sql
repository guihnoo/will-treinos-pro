-- Lesson sessions: tracks active aula state and coach interactions
create table if not exists lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  current_activity text, -- e.g., "aquecimento", "exercício 1", "pausa"
  coach_notes text,
  created_by text -- coach/professor id
);

-- Coach messages to group during active lesson
create table if not exists lesson_coach_messages (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null,
  session_id uuid not null references lesson_sessions(id) on delete cascade,
  coach_id text not null,
  message_type text not null default 'message' check (message_type in (
    'message',      -- Normal message to group
    'alert',        -- Urgent info (hora mudou, próximo exercício)
    'activity',     -- Marked someone as exercising/resting
    'duration_change' -- Aula extended/reduced
  )),
  content text not null,
  target_student_id text, -- null = group message, specific id = single student
  metadata jsonb,  -- activity state, new duration, etc
  created_at timestamptz not null default now()
);

-- Student activity during lesson (marked by coach)
create table if not exists lesson_student_activity (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null,
  student_id text not null,
  status text not null default 'present' check (status in (
    'present',      -- Na aula
    'exercising',   -- Fazendo exercício agora
    'resting',      -- Descansando
    'injured',      -- Lesionado/não pode participar
    'absent'        -- Faltou
  )),
  updated_at timestamptz not null default now(),
  updated_by text -- coach id
);

-- RLS Policies
alter table lesson_sessions enable row level security;
alter table lesson_coach_messages enable row level security;
alter table lesson_student_activity enable row level security;

-- Staff (admin/coach) can create and manage sessions
create policy "staff_manage_sessions" on lesson_sessions
  for all using (wt_is_staff()) with check (wt_is_staff());

-- Staff can send messages and view all
create policy "staff_manage_messages" on lesson_coach_messages
  for all using (wt_is_staff()) with check (wt_is_staff());

-- Students can only read messages from their lessons
create policy "student_read_lesson_messages" on lesson_coach_messages
  for select using (
    exists (
      select 1 from lessons l
      join lesson l2 on l2.id = l.lesson_id
      where l.lesson_id = lesson_id
        and (l2.present_students @> to_jsonb(auth.uid()::text)
             or l2.absent_students @> to_jsonb(auth.uid()::text)
             or l2.created_by = auth.uid()::text)
    )
  );

-- Staff can manage activity records
create policy "staff_manage_activity" on lesson_student_activity
  for all using (wt_is_staff()) with check (wt_is_staff());

-- Students can see their own activity
create policy "student_read_own_activity" on lesson_student_activity
  for select using (student_id = auth.uid()::text or wt_is_staff());

-- Indexes for performance
create index on lesson_sessions (lesson_id, started_at desc);
create index on lesson_coach_messages (lesson_id, created_at desc);
create index on lesson_coach_messages (session_id);
create index on lesson_student_activity (lesson_id, student_id);
