-- Phase 8: XP Log — audit trail, multipliers by fundamental, anti-cheat validation

create table if not exists xp_log (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references students(auth_user_id) on delete cascade,
  points int not null check (points >= 0 and points <= 100000), -- max 100k XP per transaction (anti-cheat)
  base_points int not null, -- before multiplier
  multiplier_type text check (multiplier_type in (
    'ataque', 'levantamento', 'bloqueio', 'saque', 'defesa', 'recepcao', 'posicionamento', 'none'
  )) default 'none',
  multiplier_value numeric(2,1) default 1.0,
  type text not null check (type in (
    'evaluation', 'checkin', 'social_like', 'social_comment', 'training_completed', 'achievement_unlock'
  )),
  source_entity text, -- 'lesson', 'training_plan', 'post', 'achievement'
  related_id text, -- uuid of lesson/training_plan/post/etc
  description text,
  validation_passed boolean default true, -- anti-cheat flag (duplicate check, rate limit, etc)
  validation_notes text, -- reason if validation_passed = false
  created_at timestamptz not null default now(),
  created_by text -- coach/admin who initiated (for staff actions)
);

-- Enable RLS
alter table xp_log enable row level security;

-- Staff can read all XP logs and insert on behalf of students
create policy "staff_read_all" on xp_log
  for select using (wt_is_staff());

create policy "staff_write_all" on xp_log
  for insert with check (wt_is_staff());

-- Students can only read their own XP logs (not write)
create policy "student_read_own" on xp_log
  for select using (student_id = auth.email::text or student_id = auth.uid()::text);

-- Indexes for performance
create index idx_xp_log_student_id on xp_log (student_id);
create index idx_xp_log_student_created on xp_log (student_id, created_at desc);
create index idx_xp_log_type on xp_log (type);
create index idx_xp_log_created_at on xp_log (created_at desc);
create index idx_xp_log_validation on xp_log (validation_passed) where validation_passed = false;

-- Achievements/Cards progression tracking
create table if not exists student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references students(auth_user_id) on delete cascade,
  tier_id text not null, -- 'bronze', 'prata', 'ouro', 'diamante', 'elite'
  xp_threshold int not null, -- XP required to unlock this tier
  unlocked_at timestamptz not null default now(),
  unique (student_id, tier_id)
);

alter table student_achievements enable row level security;

create policy "staff_read_all" on student_achievements
  for select using (wt_is_staff());

create policy "student_read_own" on student_achievements
  for select using (student_id = auth.email::text or student_id = auth.uid()::text);

create index idx_student_achievements_student on student_achievements (student_id);
create index idx_student_achievements_tier on student_achievements (student_id, tier_id);
