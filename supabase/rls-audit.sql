-- RLS AUDIT SCRIPT
-- Execute este script no Supabase SQL Editor para validar se as políticas estão funcionando.
-- Nota: Requer 2 contas de teste: admin e aluno

-- ==============================================================================
-- SETUP: Criar usuários de teste (execute como admin/service role)
-- ==============================================================================

-- 1. Criar usuário ADMIN de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'admin-test-rls-' || gen_random_uuid()::text,
  'admin-rls-test@will.local',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- 2. Criar usuário ALUNO de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'student-test-rls-' || gen_random_uuid()::text,
  'student-rls-test@will.local',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- 3. Registrar admin em staff_access
INSERT INTO public.staff_access (id, email, role, is_active)
VALUES (gen_random_uuid()::text, 'admin-rls-test@will.local', 'admin', true)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- VALIDAÇÕES RLS (execute como cada role)
-- ==============================================================================

-- TEST 1: Aluno NÃO consegue ler dados de outro aluno
-- Esperado: SELECT vazio (0 linhas)
SELECT 'TEST 1: Aluno cannot read other students' AS test_name;
SELECT COUNT(*) FROM public.students WHERE id NOT IN (
  SELECT id FROM public.students WHERE auth_user_id = auth.uid()
);
-- ✅ Esperado: 0
-- ❌ Se > 0: RLS FALHOU — aluno consegue ler estudantes de outros

-- TEST 2: Aluno NÃO consegue ler pagamentos de outro aluno
-- Esperado: SELECT vazio (0 linhas)
SELECT 'TEST 2: Aluno cannot read other payments' AS test_name;
SELECT COUNT(*) FROM public.payments WHERE student_id NOT IN (
  SELECT id FROM public.students WHERE auth_user_id = auth.uid()
);
-- ✅ Esperado: 0
-- ❌ Se > 0: RLS FALHOU — aluno consegue ler pagamentos de outros

-- TEST 3: Aluno NÃO consegue ler push_subscriptions de outros
-- Esperado: SELECT vazio (0 linhas)
SELECT 'TEST 3: Aluno cannot read other push subscriptions' AS test_name;
SELECT COUNT(*) FROM public.push_subscriptions WHERE user_id != auth.uid();
-- ✅ Esperado: 0
-- ❌ Se > 0: RLS FALHOU

-- TEST 4: Admin consegue ler TODOS os students
-- Esperado: SELECT retorna todas as linhas
SELECT 'TEST 4: Admin can read all students' AS test_name;
SELECT COUNT(*) AS total_students FROM public.students;
-- ✅ Esperado: > 0 (ao menos um admin test user existe)
-- ❌ Se 0: RLS muito restritiva ou nenhum aluno cadastrado

-- TEST 5: Admin consegue ler TODOS os payments
-- Esperado: SELECT retorna > 0 linhas
SELECT 'TEST 5: Admin can read all payments' AS test_name;
SELECT COUNT(*) FROM public.payments;
-- ✅ Esperado: >= 0 (pode não haver pagamentos ainda)

-- TEST 6: Aluno NÃO consegue fazer DELETE
-- Esperado: Erro de permissão ou 0 linhas deletadas
SELECT 'TEST 6: Aluno cannot delete student records' AS test_name;
-- NOTA: Não execute DELETE real aqui. Verificar via app ou teste isolado.

-- TEST 7: Aluno consegue ler notificações globais ou suas
-- Esperado: Notificações com is_global=true OU recipient_id do seu student_id
SELECT 'TEST 7: Aluno can read own/global notifications' AS test_name;
SELECT COUNT(*) FROM public.notifications WHERE
  is_global = true
  OR recipient_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid());
-- ✅ Esperado: >= 0

-- TEST 8: Aluno NÃO consegue ler notificações destinadas a outro aluno
-- Esperado: 0
SELECT 'TEST 8: Aluno cannot read other notifications' AS test_name;
WITH my_student_ids AS (
  SELECT id FROM public.students WHERE auth_user_id = auth.uid()
)
SELECT COUNT(*) FROM public.notifications
WHERE is_global = false
AND recipient_id NOT IN (SELECT id FROM my_student_ids);
-- ✅ Esperado: 0

-- ==============================================================================
-- VALIDAÇÃO: Função wt_is_staff() funciona?
-- ==============================================================================

SELECT 'TEST 9: wt_is_staff() function' AS test_name;
SELECT public.wt_is_staff() AS is_staff_result;
-- ✅ Se admin: true
-- ✅ Se aluno (sem staff_access): false

-- ==============================================================================
-- VALIDAÇÃO: Usuário pode modificar próprio status?
-- ==============================================================================

-- TEST 10: Aluno NÃO consegue mudar seu próprio status para "active" (ou outros)
-- Hint: Verificar na app — UPDATE students SET status = 'active' WHERE id = <seu_id>
SELECT 'TEST 10: Aluno cannot UPDATE own status' AS test_name;
SELECT 'Execute em app: UPDATE students SET status = active WHERE auth_user_id = auth.uid()';
-- ✅ Esperado: Erro ou UPDATE bloqueado

-- ==============================================================================
-- LIMPEZA (opcional — run como admin/service role)
-- ==============================================================================

-- DELETE FROM public.staff_access WHERE email ILIKE '%rls-test%';
-- DELETE FROM auth.users WHERE email ILIKE '%rls-test%';

-- ==============================================================================
-- RESUMO DE CHECKLIST
-- ==============================================================================
/*
Checklist de Validação:
  ✅ [ ] TEST 1: Aluno não consegue ler outros students
  ✅ [ ] TEST 2: Aluno não consegue ler outros payments
  ✅ [ ] TEST 3: Aluno não consegue ler outras push_subscriptions
  ✅ [ ] TEST 4: Admin consegue ler todos students
  ✅ [ ] TEST 5: Admin consegue ler todos payments
  ✅ [ ] TEST 6: Aluno não consegue deletar
  ✅ [ ] TEST 7: Aluno consegue ler notificações próprias/globais
  ✅ [ ] TEST 8: Aluno não consegue ler notificações de outros
  ✅ [ ] TEST 9: wt_is_staff() retorna true para admin, false para aluno
  ✅ [ ] TEST 10: Aluno não consegue mudar próprio status

Se todos passarem: RLS está funcionando ✅
Se algum falhar: Investigar política específica e corrigir
*/
