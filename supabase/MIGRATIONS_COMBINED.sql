-- ═══════════════════════════════════════════════════════
-- Will Treinos PRO — Todas as Migrações (concatenadas)
-- Copie & cole no Supabase Dashboard → SQL Editor
-- Data: 03/05/2026, 15:25:13
-- ═══════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────
-- [1/20] 20260428210000_willpro_live_schema.sql
-- ─────────────────────────────────────────────────────

-- WILLPRO: core tables for live Supabase data (students, payments, agenda, notifications).
-- Run via Supabase SQL editor or `supabase db push` after linking the project.

-- ─── STUDENTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  plan text NOT NULL DEFAULT '',
  monthly_value numeric NOT NULL DEFAULT 0,
  payment_day integer NOT NULL DEFAULT 5,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  joined_at text NOT NULL DEFAULT '',
  frequency numeric NOT NULL DEFAULT 0,
  total_classes numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  professor_notes text NOT NULL DEFAULT '',
  attendance_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  due_date text NOT NULL,
  paid_date text,
  status text NOT NULL DEFAULT 'pending',
  method text,
  reference text NOT NULL DEFAULT '',
  student_proof_note text DEFAULT '',
  student_proof_submitted_at timestamptz,
  student_proof_data_url text,
  student_proof_file_name text,
  student_proof_mime text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);

-- ─── LESSONS (Agenda) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id text PRIMARY KEY,
  category_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  date date NOT NULL,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  max_students integer NOT NULL DEFAULT 12,
  lesson_type text,
  location_url text,
  enrolled_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  present_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  absent_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  waitlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  venue_id text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_trial boolean NOT NULL DEFAULT false,
  check_in_requests jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(date);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT 'agora',
  is_read boolean NOT NULL DEFAULT false,
  student_id text,
  recipient_id text,
  is_global boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ─── RLS (authenticated JWT required) ─────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "willpro_auth_all_students" ON public.students;
CREATE POLICY "willpro_auth_all_students"
  ON public.students FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "willpro_auth_all_payments" ON public.payments;
CREATE POLICY "willpro_auth_all_payments"
  ON public.payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "willpro_auth_all_lessons" ON public.lessons;
CREATE POLICY "willpro_auth_all_lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "willpro_auth_all_notifications" ON public.notifications;
CREATE POLICY "willpro_auth_all_notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);



-- ─────────────────────────────────────────────────────
-- [2/20] 20260428220000_students_auth_user_id.sql
-- ─────────────────────────────────────────────────────

-- Links operational student rows to Supabase Auth identities (auth.users.id).
-- Enables financeiro / agenda / notifications to key off students.id while JWT stays stable.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- One auth account ↔ at most one student profile (demo / production single-tenant pattern).
CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_uidx
  ON public.students(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

COMMENT ON COLUMN public.students.auth_user_id IS 'Supabase auth.users.id — binds login to CRM student row';



-- ─────────────────────────────────────────────────────
-- [3/20] 20260429183000_align_notification_recipients.sql
-- ─────────────────────────────────────────────────────

-- Align demo notifications: student drawer keys off recipient_id (CRM students.id), like financeiro.
-- Admin/coach still see all rows; rows without recipient_id and not global remain staff-only.

UPDATE public.notifications SET recipient_id = 'demo_stu_pedro' WHERE id = 'demo_nf_pedro';
UPDATE public.notifications SET recipient_id = 'demo_stu_julia' WHERE id = 'demo_nf_atraso';
UPDATE public.notifications SET recipient_id = 'demo_stu_ricardo' WHERE id = 'demo_nf_feedback';



-- ─────────────────────────────────────────────────────
-- [4/20] 20260429233000_staff_access.sql
-- ─────────────────────────────────────────────────────

-- Staff access registry (owner/professor) for controlled role elevation by e-mail.
-- This enables invite/link onboarding without exposing admin role to open sign-ups.

CREATE TABLE IF NOT EXISTS public.staff_access (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'coach')),
  is_active boolean NOT NULL DEFAULT true,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_access_email ON public.staff_access(email);
CREATE INDEX IF NOT EXISTS idx_staff_access_active ON public.staff_access(is_active);

ALTER TABLE public.staff_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "willpro_auth_all_staff_access" ON public.staff_access;
CREATE POLICY "willpro_auth_all_staff_access"
  ON public.staff_access FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.staff_access IS 'Whitelist of staff e-mails with effective app role (admin/coach).';
COMMENT ON COLUMN public.staff_access.email IS 'Normalized lowercase e-mail used at login.';



-- ─────────────────────────────────────────────────────
-- [5/20] 20260429233100_staff_access_rls_select_own.sql
-- ─────────────────────────────────────────────────────

-- staff_access: each authenticated user may only SELECT their own row (by JWT email).
-- Inserts/updates/deletes remain for service role / SQL editor (not the anon client).

DROP POLICY IF EXISTS "willpro_auth_all_staff_access" ON public.staff_access;

CREATE POLICY "staff_access_select_own_email"
  ON public.staff_access
  FOR SELECT
  TO authenticated
  USING (
    lower(btrim(coalesce(email, ''))) = lower(btrim(coalesce((auth.jwt() ->> 'email'), '')))
  );

COMMENT ON POLICY "staff_access_select_own_email" ON public.staff_access IS
  'App reads staff_access only to resolve role for the signed-in user; no broad list exposure.';



-- ─────────────────────────────────────────────────────
-- [6/20] 20260430001000_core_rls_hardening.sql
-- ─────────────────────────────────────────────────────

-- Core RLS hardening:
-- - staff (admin/coach) keeps operational full access
-- - student sees only own data where possible
-- - lessons remain readable by authenticated users, but writes become staff-only

CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

COMMENT ON FUNCTION public.wt_is_staff IS
'True when JWT role represents owner/admin/coach. Used by RLS policies.';

-- students
DROP POLICY IF EXISTS "willpro_auth_all_students" ON public.students;
DROP POLICY IF EXISTS "students_staff_all" ON public.students;
DROP POLICY IF EXISTS "students_self_select_update" ON public.students;

CREATE POLICY "students_staff_all"
  ON public.students
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "students_self_select_update"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "students_self_update"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- payments
DROP POLICY IF EXISTS "willpro_auth_all_payments" ON public.payments;
DROP POLICY IF EXISTS "payments_staff_all" ON public.payments;
DROP POLICY IF EXISTS "payments_student_own_select_update" ON public.payments;

CREATE POLICY "payments_staff_all"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "payments_student_own_select_update"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "payments_student_own_update"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = public.payments.student_id
        AND s.auth_user_id = auth.uid()
    )
  );

-- lessons
DROP POLICY IF EXISTS "willpro_auth_all_lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_staff_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_authenticated_select" ON public.lessons;

CREATE POLICY "lessons_staff_all"
  ON public.lessons
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "lessons_authenticated_select"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

-- notifications
DROP POLICY IF EXISTS "willpro_auth_all_notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_staff_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_or_global_update" ON public.notifications;

CREATE POLICY "notifications_staff_all"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

CREATE POLICY "notifications_recipient_or_global_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_recipient_or_global_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_global = true
    OR recipient_id IN (
      SELECT s.id
      FROM public.students s
      WHERE s.auth_user_id = auth.uid()
    )
  );



-- ─────────────────────────────────────────────────────
-- [7/20] 20260430012000_feed_real_tables.sql
-- ─────────────────────────────────────────────────────

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_avatar text not null,
  author_role text not null default 'aluno',
  content text not null default '',
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_post_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index if not exists feed_post_comments_post_idx on public.feed_post_comments (post_id, created_at desc);
create index if not exists feed_post_likes_post_idx on public.feed_post_likes (post_id);

alter table public.feed_posts enable row level security;
alter table public.feed_post_likes enable row level security;
alter table public.feed_post_comments enable row level security;

drop policy if exists "feed_posts_select_authenticated" on public.feed_posts;
create policy "feed_posts_select_authenticated"
on public.feed_posts
for select
to authenticated
using (true);

drop policy if exists "feed_posts_insert_authenticated" on public.feed_posts;
create policy "feed_posts_insert_authenticated"
on public.feed_posts
for insert
to authenticated
with check (true);

drop policy if exists "feed_post_likes_select_authenticated" on public.feed_post_likes;
create policy "feed_post_likes_select_authenticated"
on public.feed_post_likes
for select
to authenticated
using (true);

drop policy if exists "feed_post_likes_insert_own" on public.feed_post_likes;
create policy "feed_post_likes_insert_own"
on public.feed_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "feed_post_likes_delete_own" on public.feed_post_likes;
create policy "feed_post_likes_delete_own"
on public.feed_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "feed_post_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_select_authenticated"
on public.feed_post_comments
for select
to authenticated
using (true);

drop policy if exists "feed_post_comments_insert_own" on public.feed_post_comments;
create policy "feed_post_comments_insert_own"
on public.feed_post_comments
for insert
to authenticated
with check (auth.uid() = user_id);



-- ─────────────────────────────────────────────────────
-- [8/20] 20260430013000_students_public_signup_policy.sql
-- ─────────────────────────────────────────────────────

alter table public.students enable row level security;

drop policy if exists "students_insert_public_signup" on public.students;
create policy "students_insert_public_signup"
on public.students
for insert
to anon, authenticated
with check (
  status = 'pending'
  and auth_user_id is null
);



-- ─────────────────────────────────────────────────────
-- [9/20] 20260430021000_lessons_rls.sql
-- ─────────────────────────────────────────────────────

-- Lessons RLS hardening dedicated migration:
-- - staff/admin full write access
-- - students only read lessons in their own enrolled list

create or replace function public.wt_is_staff()
returns boolean
language sql
stable
as $$
  select lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) in ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

alter table public.lessons enable row level security;

drop policy if exists "lessons_staff_all" on public.lessons;
drop policy if exists "lessons_authenticated_select" on public.lessons;
drop policy if exists "lessons_student_group_select" on public.lessons;

create policy "lessons_staff_all"
on public.lessons
for all
to authenticated
using (public.wt_is_staff())
with check (public.wt_is_staff());

create policy "lessons_student_group_select"
on public.lessons
for select
to authenticated
using (
  public.wt_is_staff()
  or exists (
    select 1
    from public.students s
    where s.auth_user_id = auth.uid()
      and (public.lessons.enrolled_students ? s.id)
  )
);



-- ─────────────────────────────────────────────────────
-- [10/20] 20260430032000_storage_buckets.sql
-- ─────────────────────────────────────────────────────

-- Storage buckets for media scalability:
-- - avatars: public profile photos
-- - payment-proofs: private payment attachments

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "payment_proofs_owner_select" on storage.objects;
create policy "payment_proofs_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "payment_proofs_owner_insert" on storage.objects;
create policy "payment_proofs_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);



-- ─────────────────────────────────────────────────────
-- [11/20] 20260430040000_feed_moderation.sql
-- ─────────────────────────────────────────────────────

-- Feed moderation layer for owner/admin:
-- - pin posts
-- - official announcements
-- - role-targeted communication
-- - soft delete

alter table public.feed_posts
  add column if not exists pinned boolean not null default false,
  add column if not exists is_official boolean not null default false,
  add column if not exists target_role text not null default 'all',
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feed_posts_target_role_check'
      and conrelid = 'public.feed_posts'::regclass
  ) then
    alter table public.feed_posts
      add constraint feed_posts_target_role_check
      check (target_role in ('all', 'student', 'coach'));
  end if;
end $$;

create or replace function public.wt_is_staff()
returns boolean
language sql
stable
as $$
  select lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) in ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

drop policy if exists "feed_posts_update_staff_only" on public.feed_posts;
create policy "feed_posts_update_staff_only"
on public.feed_posts
for update
to authenticated
using (public.wt_is_staff())
with check (public.wt_is_staff());



-- ─────────────────────────────────────────────────────
-- [12/20] 20260501030100_pending_student_self_insert_and_notify.sql
-- ─────────────────────────────────────────────────────

-- Allow authenticated pending signup (OAuth sem CRM): INSERT próprio aluno com auth_user_id = auth.uid().
-- Evita RLS bloquear só quem já está logado ao enviar /cadastro.

DROP POLICY IF EXISTS "students_insert_pending_self" ON public.students;

CREATE POLICY "students_insert_pending_self"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND auth_user_id = auth.uid()
  );

COMMENT ON POLICY "students_insert_pending_self" ON public.students IS
  'Aluno em matrícula vincula auth.users ao CRM (status pending).';

-- Notificação para equipe sem depender de permissão no cliente (staff-only INSERT em notifications).

CREATE OR REPLACE FUNCTION public.wt_notify_staff_new_pending_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     AND NEW.status = 'pending'
     AND NEW.id NOT LIKE 'demo\_%' ESCAPE '\'
  THEN
    INSERT INTO public.notifications (
      id,
      type,
      title,
      message,
      time,
      is_read,
      student_id,
      recipient_id,
      is_global
    )
    VALUES (
      gen_random_uuid()::text,
      'new_student',
      'Nova inscrição',
      COALESCE(NULLIF(trim(NEW.name), ''), 'Novo aluno') || ' enviou cadastro e aguarda aprovação.',
      'agora',
      false,
      NEW.id,
      NULL,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.wt_notify_staff_new_pending_student IS
  'Após INSERT de aluno pending (exceto demo_*), cria notificação visível para staff via RLS staff_all.';

DROP TRIGGER IF EXISTS students_notify_pending_after_insert ON public.students;

CREATE TRIGGER students_notify_pending_after_insert
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE PROCEDURE public.wt_notify_staff_new_pending_student();



-- ─────────────────────────────────────────────────────
-- [13/20] 20260501140000_app_settings_enrollment_invite.sql
-- ─────────────────────────────────────────────────────

-- Configuração singleton por projeto (convite de matrícula). Staff R/W; sem leitura anon.

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'singleton'::text,
  enrollment_invite_code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton_ck CHECK (id = 'singleton')
);

INSERT INTO public.app_settings (id, enrollment_invite_code)
VALUES ('singleton', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_staff_all" ON public.app_settings;

CREATE POLICY "app_settings_staff_all"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (public.wt_is_staff())
  WITH CHECK (public.wt_is_staff());

COMMENT ON TABLE public.app_settings IS 'Chaves operacionais singleton (ex.: código público de convite em /cadastro?invite=).';



-- ─────────────────────────────────────────────────────
-- [14/20] 20260502100000_wt_is_staff_staff_access.sql
-- ─────────────────────────────────────────────────────

-- RLS: OAuth/Google often ships JWT without user_metadata.role — UI dev toggle cannot change Postgres.
-- Extend wt_is_staff() so an active staff_access row for the signed-in e-mail grants the same powers as JWT staff claims.
-- After migrate: INSERT INTO staff_access (id, email, role, is_active) VALUES (gen_random_uuid()::text, 'seu@email.com', 'admin', true);

CREATE OR REPLACE FUNCTION public.wt_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    lower(
      COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        ''
      )
    ) IN ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher')
  )
  OR EXISTS (
    SELECT 1
    FROM public.staff_access sa
    WHERE COALESCE(sa.is_active, true)
      AND lower(btrim(COALESCE(sa.email, ''))) = lower(btrim(COALESCE(auth.jwt() ->> 'email', '')))
      AND lower(btrim(COALESCE(sa.role, ''))) IN ('admin', 'coach')
  );
$$;

COMMENT ON FUNCTION public.wt_is_staff IS
  'True when JWT role claims denote staff, or when an active staff_access row matches auth.jwt() email (OAuth-safe).';



-- ─────────────────────────────────────────────────────
-- [15/20] 20260502120000_push_subscriptions.sql
-- ─────────────────────────────────────────────────────

-- Push subscriptions para Web Push Notifications (VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint    text        NOT NULL UNIQUE,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('admin', 'professor', 'aluno')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuário gerencia apenas suas próprias subscriptions
CREATE POLICY "push_subscriptions_own"
  ON push_subscriptions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Staff (admin/professor) pode SELECT em todas (necessário para envio server-side via service_role)
-- O envio real usa service_role key na API route, então esta policy é para queries autenticadas de staff
CREATE POLICY "push_subscriptions_staff_read"
  ON push_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_access
      WHERE staff_access.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND staff_access.is_active = true
    )
  );

-- Índices para queries de envio por role
CREATE INDEX IF NOT EXISTS push_subscriptions_role_idx ON push_subscriptions (role);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();



-- ─────────────────────────────────────────────────────
-- [16/20] 20260503150000_dev_events.sql
-- ─────────────────────────────────────────────────────

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



-- ─────────────────────────────────────────────────────
-- [17/20] 20260503200000_student_role_column.sql
-- ─────────────────────────────────────────────────────

-- Fase 1: Add role column to students + visitor RLS

-- 1. Add role column (diferencia aluno/professor/visitor)
ALTER TABLE students ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'aluno'
  CHECK (role IN ('admin', 'professor', 'aluno', 'visitor'));

-- 2. Create visitor helper function
CREATE OR REPLACE FUNCTION wt_is_visitor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE auth_user_id = auth.uid()
      AND role = 'visitor'
      AND status = 'active'
  );
$$;

-- 3. Update payments RLS: visitors cannot access payments
ALTER POLICY "payments_student_own_select_update" ON payments
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.auth_user_id = auth.uid()
        AND s.id = student_id
        AND s.role != 'visitor'
    )
  );

-- 4. Update lessons RLS: visitors cannot access lessons
ALTER POLICY "lessons_student_group_select" ON lessons
  USING (
    wt_is_staff()
    OR (
      enrolled_students ? (
        SELECT s.id FROM students s
        WHERE s.auth_user_id = auth.uid()
          AND s.role != 'visitor'
      )
    )
  );

-- 5. Update notifications RLS: visitors can only see global notifications
ALTER POLICY "notifications_recipient_or_global_select" ON notifications
  USING (
    is_global = true
    OR (
      NOT wt_is_visitor()
      AND recipient_id IN (
        SELECT s.id FROM students s
        WHERE s.auth_user_id = auth.uid()
      )
    )
  );

-- 6. Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id_role ON students(auth_user_id, role);



-- ─────────────────────────────────────────────────────
-- [18/20] 20260504000000_rls_check_constraints.sql
-- ─────────────────────────────────────────────────────

-- RLS Hardening Phase 2: CHECK constraints para impedir auto-promotion
-- Impedir que aluno consegua mudar próprio status ou role via UPDATE

-- ============================================================================
-- PROBLEMA: Aluno consegue fazer UPDATE students SET status = 'active'
-- SOLUÇÃO: Adicionar CHECK constraint + trigger
-- ============================================================================

-- CREATE: Trigger para bloquear UPDATE de campos críticos por não-staff
CREATE OR REPLACE FUNCTION public.students_check_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não é staff (admin/coach):
  IF NOT public.wt_is_staff() THEN
    -- Aluno não consegue mudar status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu próprio status';
    END IF;

    -- Aluno não consegue mudar role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Aluno não pode alterar sua própria role';
    END IF;

    -- Aluno não consegue mudar email
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Aluno não pode alterar seu email (entre em contato com a equipe)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- DROP trigger if exists
DROP TRIGGER IF EXISTS students_check_sensitive_fields_trigger ON public.students;

-- CREATE trigger
CREATE TRIGGER students_check_sensitive_fields_trigger
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.students_check_sensitive_fields();

COMMENT ON TRIGGER students_check_sensitive_fields_trigger ON public.students IS
'Bloqueia aluno de fazer UPDATE em campos sensíveis (status, role, email). Apenas staff consegue.';

-- ============================================================================
-- PROBLEMA: Aluno consegue fazer DELETE em próprios payments comprovantes
-- SOLUÇÃO: Bloquear DELETE para aluno (apenas soft-delete flag)
-- ============================================================================

-- DROP old policy
DROP POLICY IF EXISTS "payments_student_own_delete" ON public.payments;

-- CREATE new: Aluno NÃO consegue fazer DELETE, apenas UPDATE proof
-- (DELETE fica para staff/admin only)
CREATE POLICY "payments_student_own_delete"
  ON public.payments
  FOR DELETE
  TO authenticated
  USING (false);  -- NUNCA consegue deletar (nem staff deve deletes aqui)

COMMENT ON POLICY "payments_student_own_delete" ON public.payments IS
'Bloqueia DELETE para todos. Use soft-delete (is_deleted flag) em vez de DELETE direto.';

-- ============================================================================
-- AUDIT: Detectar tentativas de UPDATE sensível
-- ============================================================================

-- CREATE: Tabela de audit log (se não existir)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action text NOT NULL,  -- 'UPDATE', 'DELETE', 'INSERT'
  table_name text NOT NULL,  -- 'students', 'payments'
  record_id text NOT NULL,
  user_id uuid,
  attempted_changes jsonb,
  blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- DROP policy if exists
DROP POLICY IF EXISTS "audit_log_staff_read" ON public.audit_log;

-- CREATE policy: Staff consegue ler audit log
CREATE POLICY "audit_log_staff_read"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.wt_is_staff());

-- ============================================================================
-- TRIGGER: Log UPDATE attempts em students (sensível)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_students_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes jsonb := jsonb_object_aggs(key, (row_to_json(new)->key))
             FROM (SELECT key FROM jsonb_object_keys(row_to_json(new) - row_to_json(old)) key) x;
BEGIN
  INSERT INTO public.audit_log (action, table_name, record_id, user_id, attempted_changes, blocked)
  VALUES ('UPDATE', 'students', NEW.id, auth.uid(), changes, false);
  RETURN NEW;
END;
$$;

-- DROP trigger if exists
DROP TRIGGER IF EXISTS audit_students_update_trigger ON public.students;

-- CREATE trigger
CREATE TRIGGER audit_students_update_trigger
AFTER UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.audit_students_update();

COMMENT ON TRIGGER audit_students_update_trigger ON public.students IS
'Registra todos UPDATE em students na tabela audit_log para rastreamento.';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Teste: Aluno tenta mudar status próprio (deve falhar)
-- SELECT * FROM students WHERE auth_user_id = auth.uid();
-- UPDATE students SET status = 'active' WHERE auth_user_id = auth.uid();
-- → Expected: ERROR "Aluno não pode alterar seu próprio status"

-- Teste: Admin consegue mudar status
-- (Admin consegue porque wt_is_staff() = true)



-- ─────────────────────────────────────────────────────
-- [19/20] 20260504110000_dev_events_realtime.sql
-- ─────────────────────────────────────────────────────

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



-- ─────────────────────────────────────────────────────
-- [20/20] 20260505130000_verify_enrollment_invite_rpc.sql
-- ─────────────────────────────────────────────────────

-- Validação pública do código de matrícula sem expor SELECT em app_settings para anon.

create or replace function public.verify_enrollment_invite(p_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_expected text;
begin
  select nullif(trim(lower(enrollment_invite_code)), '')
  into v_expected
  from app_settings
  where id = 'singleton';

  if v_expected is null then
    return false;
  end if;

  return nullif(trim(lower(coalesce(p_code, ''))), '') = v_expected;
end;
$$;

revoke all on function public.verify_enrollment_invite(text) from public;
grant execute on function public.verify_enrollment_invite(text) to anon, authenticated;

comment on function public.verify_enrollment_invite(text) is
  'True quando p_code coincide com app_settings.enrollment_invite_code (singleton). Código vazio no servidor ⇒ false.';


