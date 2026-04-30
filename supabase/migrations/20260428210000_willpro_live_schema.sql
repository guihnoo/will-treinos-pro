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
