-- WILLPRO — Seed demo (students, payments, agenda, notifications)
-- Apply AFTER migration `20260428210000_willpro_live_schema.sql`.
-- Run in Supabase SQL Editor. Safe to re-run (ON CONFLICT DO NOTHING).

BEGIN;

-- ─── STUDENTS (IDs estáveis para demos / QA) ────────────────────────────────
INSERT INTO public.students (id, name, phone, email, avatar, instagram, status, plan, monthly_value, payment_day, categories, joined_at, frequency, total_classes, notes, professor_notes, attendance_history)
VALUES
  ('demo_stu_ricardo', 'Ricardo Alves', '(21) 99876-5432', 'ricardo.demo@willtreinos.com.br', 'Ricardo', '@ricardo', 'active', 'Performance Mensal', 200, 10, '["performance","vip"]'::jsonb, '2025-08-15', 92, 48, 'Atleta estadual — foco em ataque.', 'Controle de carga em saltos — priorizar técnica de pouso.', '[{"date":"2026-04-20","status":"present"},{"date":"2026-04-21","status":"present"},{"date":"2026-04-22","status":"present"}]'::jsonb),
  ('demo_stu_camila', 'Camila Santos', '(21) 99765-4321', 'camila.demo@willtreinos.com.br', 'Camila', '@camila', 'active', 'Grupo Mensal', 80, 5, '["grupo"]'::jsonb, '2025-10-01', 88, 35, 'Turma Elite — bloqueio em evolução.', '', '[{"date":"2026-04-22","status":"present"}]'::jsonb),
  ('demo_stu_pedro', 'Pedro Souza', '(21) 99109-8765', 'pedro.demo@willtreinos.com.br', 'Pedro', '@pedro', 'pending', 'Trial', 0, 1, '[]'::jsonb, '2026-04-21', 0, 0, 'Aguardando aprovação — indicação.', '', '[]'::jsonb),
  ('demo_stu_julia', 'Juliana Mendes', '(21) 99543-2109', 'julia.demo@willtreinos.com.br', 'Juliana', '@julia', 'active', 'Dupla', 120, 10, '["dupla"]'::jsonb, '2025-11-10', 78, 22, 'Dupla com Carla — ritmo técnico alto.', '', '[]'::jsonb),
  ('demo_stu_bruno', 'Bruno Torres', '(21) 99654-3210', 'bruno.demo@willtreinos.com.br', 'Bruno', '@bruno', 'active', 'Performance', 200, 15, '["performance","grupo"]'::jsonb, '2025-06-20', 95, 60, 'Capitão — liderança de quadra.', '', '[]'::jsonb),
  ('demo_stu_marina', 'Marina Costa', '(21) 98998-7654', 'marina.demo@willtreinos.com.br', 'Marina', '@marina', 'active', 'Individual', 150, 8, '["individual"]'::jsonb, '2025-09-01', 85, 40, 'Recepção e defesa.', '', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────
INSERT INTO public.payments (id, student_id, amount, due_date, paid_date, status, method, reference)
VALUES
  ('demo_pay_ric_abr', 'demo_stu_ricardo', 200, '2026-04-10', '2026-04-09', 'paid', 'pix', 'ABR/26'),
  ('demo_pay_ric_mai', 'demo_stu_ricardo', 200, '2026-05-10', NULL, 'pending', NULL, 'MAI/26'),
  ('demo_pay_cam_abr', 'demo_stu_camila', 80, '2026-04-05', '2026-04-05', 'paid', 'pix', 'ABR/26'),
  ('demo_pay_jul_abr', 'demo_stu_julia', 120, '2026-04-10', NULL, 'late', NULL, 'ABR/26'),
  ('demo_pay_bruno_abr', 'demo_stu_bruno', 200, '2026-04-15', NULL, 'pending', NULL, 'ABR/26'),
  ('demo_pay_marina_abr', 'demo_stu_marina', 150, '2026-04-08', '2026-04-07', 'paid', 'pix', 'ABR/26')
ON CONFLICT (id) DO NOTHING;

-- ─── AGENDA (lessons) — inclui aula “hoje” para validar dashboard ────────────
INSERT INTO public.lessons (
  id, category_id, title, date, start_time, end_time, max_students,
  enrolled_students, present_students, absent_students, waitlist,
  status, venue_id, notes, is_trial, check_in_requests
)
VALUES
  (
    'demo_lesson_hoje_perf',
    'performance',
    'Performance Elite — Manhã',
    CURRENT_DATE,
    '07:00',
    '08:30',
    8,
    '["demo_stu_ricardo","demo_stu_bruno"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'scheduled',
    'v1',
    'Bloco transição + finalização. Ritmo alto.',
    false,
    '[]'::jsonb
  ),
  (
    'demo_lesson_hoje_grupo',
    'grupo',
    'Turma Elite A',
    CURRENT_DATE,
    '08:30',
    '10:00',
    15,
    '["demo_stu_camila"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'scheduled',
    'v1',
    'Fundamental coletivo — bloqueio e defesa.',
    false,
    '[]'::jsonb
  ),
  (
    'demo_lesson_amanha_dupla',
    'dupla',
    'Dupla — Juliana & Carla (slot)',
    CURRENT_DATE + 1,
    '18:30',
    '19:30',
    2,
    '["demo_stu_julia"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'scheduled',
    'v2',
    'Agende parceira para completar vaga.',
    false,
    '[]'::jsonb
  ),
  (
    'demo_lesson_hist_perf',
    'performance',
    'Performance — sessão concluída',
    CURRENT_DATE - 2,
    '07:00',
    '08:30',
    8,
    '["demo_stu_ricardo","demo_stu_bruno"]'::jsonb,
    '["demo_stu_ricardo","demo_stu_bruno"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'completed',
    'v1',
    'Volume alto — métricas positivas.',
    false,
    '[]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ─── NOTIFICATIONS — recipient_id = CRM students.id for in-app aluno (igual financeiro) ───
-- student_id: contexto operacional (staff); recipient_id: quem vê no papel aluno (NULL + não global = só staff)
INSERT INTO public.notifications (id, type, title, message, time, is_read, student_id, recipient_id, is_global)
VALUES
  ('demo_nf_pedro', 'new_student', 'Nova inscrição', 'Pedro Souza aguarda aprovação na fila.', '2h', false, 'demo_stu_pedro', 'demo_stu_pedro', false),
  ('demo_nf_atraso', 'payment_late', 'Inadimplência', 'Juliana Mendes — mensalidade em atraso (referência ABR/26).', '1d', false, 'demo_stu_julia', 'demo_stu_julia', false),
  ('demo_nf_broadcast', 'broadcast', 'Torneio Carioca', 'Will Treinos confirma participação no torneio — reforço de horários na agenda.', '3h', false, NULL, NULL, true),
  ('demo_nf_aula', 'lesson_soon', 'Lembrete de quadra', 'Performance Elite começa em 60min — ativação e mobilidade.', '45min', false, NULL, NULL, true),
  ('demo_nf_feedback', 'performance', 'Feedback técnico', 'Última sessão Performance — médias de intensidade acima da média do grupo.', '12h', true, 'demo_stu_ricardo', 'demo_stu_ricardo', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
