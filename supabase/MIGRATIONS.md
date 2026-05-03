# 🚀 Aplicar Migrations Supabase

**Status:** 20 migrations versionadas (abril-maio 2026)  
**Last Update:** 2026-05-03

---

## ⚡ Quick Start (First Time Setup)

Se está começando do zero, as migrações são **críticas para RLS, auth e data integrity**.

### Via CLI (Recomendado)

```bash
# 1. Instalar CLI Supabase (se não tiver)
npm install -g supabase

# 2. Link seu projeto remoto
supabase link --project-id YOUR_PROJECT_ID

# 3. Aplicar TODAS as migrations
supabase migration up

# 4. Confirmar
supabase migration list  # deve mostrar ✓ para todas
```

### Via Supabase Dashboard (Manual — sem CLI)

1. **Abra** https://app.supabase.com → seu projeto → **SQL Editor**
2. **Copie & execute** cada arquivo em `supabase/migrations/` (em ordem alfabética):
   - `20260428210000_willpro_live_schema.sql`
   - `20260428220000_students_auth_user_id.sql`
   - ... até `20260505130000_verify_enrollment_invite_rpc.sql`

3. **Verifique:** Na aba **Database** → **Policies**, deve ver ~15 policies criadas

---

## 🔐 Critical Migrations (Aplicar Agora)

### 1. **Staff Access + RLS (BLOQUEANTE)**

```sql
-- supabase/migrations/20260502100000_wt_is_staff_staff_access.sql
-- Permite que admin/coach OAuth sem JWT role acessem dados via staff_access table

-- DEPOIS de aplicar, INSIRA VOCÊ MESMO:
INSERT INTO staff_access (id, email, role, is_active)
VALUES (
  gen_random_uuid()::text,
  'guihmonteiro.2014@gmail.com',  -- SEU EMAIL
  'admin',
  true
);
```

**Por quê?** A função `wt_is_staff()` verifica JWT role + `staff_access` table. Sem essa migração + linha, você não consegue ver alunos (RLS bloqueia SELECT).

### 2. **Students Self-Insert + Notifications (ALUNO CADASTRO)**

```sql
-- supabase/migrations/20260501030100_pending_student_self_insert_and_notify.sql
-- Permite aluno fazer INSERT com auth.uid(), dispara trigger de notificação para staff
```

### 3. **Enrollment Invite Validation (OPTIONAL se usar gate)**

```sql
-- supabase/migrations/20260505130000_verify_enrollment_invite_rpc.sql
-- Server-side RPC para validar invite code (se NEXT_PUBLIC_REQUIRE_ENROLLMENT_INVITE=true)
```

---

## 📋 Checklist: Tudo Aplicado?

```bash
# No Supabase Dashboard, SQL Editor, rode:

-- (1) Verificar staff_access
SELECT * FROM staff_access;
-- ✓ Deve ter sua linha (email + role='admin' + is_active=true)

-- (2) Verificar RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
-- ✓ Deve ter ~15 policies (students_staff_all, notifications_staff_all, etc)

-- (3) Testar wt_is_staff() — seu email de dev
SELECT wt_is_staff();  -- ✓ Deve retornar TRUE

-- (4) Verificar novo aluno (pending)
SELECT * FROM students WHERE status = 'pending' ORDER BY joined_at DESC LIMIT 1;
-- ✓ Deve mostrar o aluno que se cadastrou com Google

-- (5) Verificar notificação
SELECT * FROM notifications WHERE type = 'new_student' ORDER BY "time" DESC LIMIT 1;
-- ✓ Deve mostrar notificação do novo aluno
```

---

## 🔄 Troubleshooting

### Problema: "Operação bloqueada por RLS"
**Causa:** Migração `wt_is_staff_staff_access` não aplicada ou `staff_access` sem sua linha.

**Solução:**
```sql
-- Aplicar migração
-- (copie conteúdo de supabase/migrations/20260502100000_*.sql)

-- Inserir você
INSERT INTO staff_access (id, email, role, is_active)
VALUES (gen_random_uuid()::text, 'seu@email.com', 'admin', true);

-- Testar
SELECT wt_is_staff();  -- deve ser TRUE
```

### Problema: Aluno se cadastra mas não aparece na lista
**Causa:** Seu JWT não tem `user_metadata.role` (OAuth sem role) E você não está em `staff_access`.

**Solução:** Ver acima.

### Problema: Notificação não aparece
**Causa:** Trigger `wt_notify_staff_new_pending_student` não foi criada (migração old RLS antes de 01/05).

**Solução:** Aplicar `20260501030100_pending_student_self_insert_and_notify.sql`.

---

## 📚 Ordem Recomendada (Se Aplicar Manual)

```
1. 20260428210000_willpro_live_schema.sql         (schema base)
2. 20260428220000_students_auth_user_id.sql       (auth_user_id column)
3. 20260429183000_align_notification_recipients.sql
4. 20260429233000_staff_access.sql                (tabela staff_access)
5. 20260429233100_staff_access_rls_select_own.sql
6. 20260430001000_core_rls_hardening.sql          (RLS policies)
7. 20260430012000_feed_real_tables.sql
8. 20260430013000_students_public_signup_policy.sql
9. 20260430021000_lessons_rls.sql
10. 20260430032000_storage_buckets.sql
11. 20260430040000_feed_moderation.sql
12. 20260501030100_pending_student_self_insert_and_notify.sql (CRITICAL)
13. 20260501140000_app_settings_enrollment_invite.sql
14. 20260502100000_wt_is_staff_staff_access.sql   (CRITICAL UPDATE)
15. 20260502120000_push_subscriptions.sql
16. 20260503150000_dev_events.sql
17. 20260503200000_student_role_column.sql
18. 20260504000000_rls_check_constraints.sql
19. 20260504110000_dev_events_realtime.sql
20. 20260505130000_verify_enrollment_invite_rpc.sql
```

---

## ✅ Validação Pós-Migração

Após aplicar tudo, rode esse script no seu app:

```bash
# Terminal do projeto
pnpm dev

# Abra http://localhost:3000/login → logar com Google
# → Deve redirecionar para /cadastro (não /signup)
# → Complete cadastro como aluno
# → Deve ver notificação "Nova inscrição" no cockpit
# → Aluno deve aparecer em /alunos com status "pending"
```

---

## 🎯 Next: Notificações Profissionais

Depois que migrations rodar, as notificações vão aparecer. Próximo passo: **torná-las clicáveis + com detalhe + ações** (ver `src/components/NotificationDetailModal.tsx`).

---

**Questions?** Cheque `CLAUDE.md` ou `WILLPRO_MASTER_MEMORY.md` para mais contexto sobre RLS, auth, e fluxo de matrícula.
