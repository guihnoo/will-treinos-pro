-- Phase 8: Gamification system with XP audit trail

-- XP Multipliers by volleyball fundamental (reference table)
create table if not exists xp_multipliers (
  id text primary key,
  fundamental text not null unique, -- ataque, levantamento, bloqueio, saque, defesa, recepção, posicionamento
  multiplier numeric not null default 1.0,
  created_at timestamptz not null default now()
);

-- XP Audit log — complete history of XP gains
create table if not exists xp_log (
  id text primary key,
  student_id text not null,
  source text not null, -- "lesson_rating", "check_in", "check_in_external", "social_action"
  fundamental text, -- null for check_in; set for lesson_rating
  base_xp integer not null,
  multiplier numeric not null default 1.0,
  total_xp integer not null,
  lesson_id text, -- foreign key if from lesson rating
  note text,
  created_at timestamptz not null default now()
);

-- Award/Card system — unlock badges by reaching XP thresholds
create table if not exists awards (
  id text primary key,
  student_id text not null,
  tier text not null, -- bronze, prata, ouro, diamante, elite
  xp_threshold integer not null, -- 500, 1500, 3000, 6000, 10000
  unlocked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table xp_multipliers enable row level security;
alter table xp_log enable row level security;
alter table awards enable row level security;

-- RLS: xp_multipliers — public read
create policy "public_read" on xp_multipliers
  for select using (true);

-- RLS: xp_log
create policy "staff_all" on xp_log
  for all using (wt_is_staff()) with check (wt_is_staff());

create policy "student_read_own" on xp_log
  for select using (student_id = auth.uid()::text);

create policy "system_insert" on xp_log
  for insert with check (true); -- backend services insert XP logs

-- RLS: awards
create policy "staff_all" on awards
  for all using (wt_is_staff()) with check (wt_is_staff());

create policy "student_read_own" on awards
  for select using (student_id = auth.uid()::text);

-- Indexes for performance
create index idx_xp_log_student_created on xp_log(student_id, created_at desc);
create index idx_xp_log_source on xp_log(source);
create index idx_xp_log_fundamental on xp_log(fundamental);
create index idx_awards_student_tier on awards(student_id, tier);
create index idx_awards_xp_threshold on awards(xp_threshold);
create index idx_xp_multipliers_fundamental on xp_multipliers(fundamental);

-- Seed default multipliers
insert into xp_multipliers (id, fundamental, multiplier) values
  ('mult_ataque', 'ataque', 2.0),
  ('mult_levantamento', 'levantamento', 1.8),
  ('mult_bloqueio', 'bloqueio', 1.6),
  ('mult_saque', 'saque', 1.5),
  ('mult_defesa', 'defesa', 1.4),
  ('mult_recepção', 'recepção', 1.3),
  ('mult_posicionamento', 'posicionamento', 1.2)
on conflict (fundamental) do nothing;

-- Seed award tiers
insert into awards (id, student_id, tier, xp_threshold) values
  ('award_bronze', null, 'bronze', 500),
  ('award_prata', null, 'prata', 1500),
  ('award_ouro', null, 'ouro', 3000),
  ('award_diamante', null, 'diamante', 6000),
  ('award_elite', null, 'elite', 10000)
on conflict do nothing;
