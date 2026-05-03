# 🔐 RLS & Segurança do Sistema

## O que é RLS?

**Row Level Security (RLS)** = Política de banco de dados que bloqueia leitura/escrita de linhas baseado no usuário autenticado.

Sem RLS: O app confia em código frontend. ❌ Aluno consegue ler `SELECT * FROM students;`
Com RLS: Database bloqueia na camada SQL. ✅ Aluno só consegue ler seu próprio student_id

---

## Política de Segurança por Tabela

### 1. **students**

```sql
-- Staff (admin/coach) pode fazer tudo
POLICY "students_staff_all"
  → auth.uid() com JWT role em ('admin', 'coach', 'professor')
  → SELECT, INSERT, UPDATE, DELETE todos os registros

-- Aluno (próprio record)
POLICY "students_self_select_update"
  → auth.uid() = auth_user_id
  → Só consegue ler/editar seu próprio student_id
```

**Validação:**
```sql
-- Aluno vê só seu registro:
SELECT COUNT(*) FROM students 
WHERE auth_user_id = auth.uid(); 
-- ✅ Esperado: 1 (o próprio)

-- Aluno NÃO vê outros:
SELECT COUNT(*) FROM students 
WHERE auth_user_id != auth.uid(); 
-- ✅ Esperado: 0 (RLS bloqueia)
```

**Risco identificado:** ⚠️ Aluno consegue UPDATE próprio registro (incluindo `status: active`). **Solução:** Adicionar CHECK em UPDATE para impedir mudança de `status`, `role`.

---

### 2. **payments**

```sql
-- Staff: tudo
POLICY "payments_staff_all"
  → wt_is_staff()
  → SELECT, INSERT, UPDATE, DELETE

-- Aluno: próprios pagamentos
POLICY "payments_student_own_select_update"
  → Deixa ver se student_id tem auth_user_id = auth.uid()
  → Pode UPDATE (ex: submeter comprovante)
```

**Validação:**
```sql
-- Aluno vê só seus pagamentos:
SELECT COUNT(*) FROM payments 
WHERE student_id IN (
  SELECT id FROM students WHERE auth_user_id = auth.uid()
);
-- ✅ Esperado: N pagamentos do aluno

-- Aluno NÃO vê pagamentos de outros:
SELECT COUNT(*) FROM payments 
WHERE student_id NOT IN (
  SELECT id FROM students WHERE auth_user_id = auth.uid()
);
-- ✅ Esperado: 0 (RLS bloqueia)
```

---

### 3. **notifications**

```sql
-- Staff: tudo
POLICY "notifications_staff_all"
  → wt_is_staff()

-- Aluno: apenas notificações suas (recipient_id) ou globais
POLICY "notifications_recipient_or_global_select"
  → is_global = true
  OR recipient_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
```

**Validação:**
```sql
-- Aluno vê suas notificações + globais:
SELECT COUNT(*) FROM notifications 
WHERE is_global 
   OR recipient_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid());
-- ✅ Esperado: M notificações

-- Aluno NÃO vê notificações de outro aluno:
SELECT COUNT(*) FROM notifications 
WHERE is_global = false 
  AND recipient_id NOT IN (SELECT id FROM students WHERE auth_user_id = auth.uid());
-- ✅ Esperado: 0
```

---

### 4. **push_subscriptions**

```sql
POLICY "push_subscriptions_own_select"
  → user_id = auth.uid()
  → Aluno vê só sua subscription

POLICY "push_subscriptions_own_delete"
  → user_id = auth.uid()
  → Aluno consegue unsubscribe (DELETE)

POLICY "push_subscriptions_staff_read"
  → wt_is_staff()
  → Admin consegue listar quantas subscriptions existem
```

---

### 5. **lessons**

```sql
POLICY "lessons_staff_all"
  → wt_is_staff()
  → Staff (admin/coach) controla tudo

POLICY "lessons_authenticated_select"
  → true (qualquer autenticado consegue ler)
  → Necessário para aluno ver horário de aula
```

**Risco:** ⚠️ Aluno consegue ler aulas de outras turmas (dados públicos). **Mitigação:** Aceitável — aulas são informações públicas.

---

### 6. **feed_posts**

```sql
POLICY "feed_posts_staff_moderate"
  → wt_is_staff()
  → Admin pode deletar/editar qualquer post

POLICY "feed_posts_owner_edit_delete"
  → auth_user_id = auth.uid()
  → Autor consegue editar/deletar próprio post

POLICY "feed_posts_authenticated_select"
  → true
  → Qualquer autenticado consegue ler
```

---

## Source of Truth de "Role"

### Problema
```
JWT role (do Supabase)  ←→  Cookie role (do localStorage)
     ↓                          ↓
     Autoridade                UI toggle
   (confiável)            (manipulável pelo usuário)
```

Se JWT role = 'admin' mas cookie role = 'aluno' → **mismatch**.

### Solução

1. **RLS sempre usa JWT** (não cookie)
   ```sql
   CREATE FUNCTION wt_is_staff()
   RETURNS boolean AS $$
     SELECT (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'coach')
     OR EXISTS (SELECT 1 FROM staff_access WHERE email = auth.jwt() ->> 'email')
   $$;
   ```

2. **Frontend usa cookie APENAS para UI** (display)
   ```typescript
   // browser
   const cookieRole = localStorage.getItem('wt_role');  // 'admin' ou 'aluno'
   // UI: mostra menu de admin se role = 'admin'
   
   // Quando usuário faz operação (POST), JWT é enviado no header
   // Server valida JWT, não cookie
   ```

3. **Never trust cookie para operação** 
   ```typescript
   // ❌ ERRADO
   if (localStorage.getItem('wt_role') === 'admin') {
     // Deletar aluno
   }
   
   // ✅ CORRETO
   // Backend usa JWT no POST /api/students/delete
   // Server decodifica JWT → valida role → executa ou bloqueia
   ```

---

## Consolidação de Usuários

### Problema: Mesma pessoa, 2 contas

```
Email A + OAuth Google     email@example.com
         ↓
        auth.users[1]
        
Email B + OAuth Facebook   email@example.com
         ↓
        auth.users[2]
        
→ Mesma pessoa, 2 auth.users, 2 student records, 2 XP pools
```

### Solução

1. **Validar email canônico**
   ```sql
   -- Migration: garantir email ÚNICO em auth.users
   ALTER TABLE auth.users ADD CONSTRAINT email_unique UNIQUE(email);
   ```

2. **Detectar duplicatas**
   ```sql
   -- Verificar se mesma pessoa tem 2+ auth.users
   SELECT email, COUNT(*) as num_accounts
   FROM auth.users
   GROUP BY email
   HAVING COUNT(*) > 1;
   ```

3. **Migração: Mergear contas**
   - Guardar OAuth account A
   - Relink student records B → account A
   - Deletar account B
   - Consolidar XP (sum)

4. **Prevenção futura**
   ```typescript
   // No signup
   if (!email) {
     // ❌ Rejeitar OAuth sem email
     return { error: 'OAuth provider deve incluir email' };
   }
   ```

---

## Checklist de Validação

Execute `supabase/rls-audit.sql` no SQL Editor:

```
✅ TEST 1: Aluno não consegue ler outros students → 0
✅ TEST 2: Aluno não consegue ler outros payments → 0
✅ TEST 3: Aluno não consegue ler outras push_subscriptions → 0
✅ TEST 4: Admin consegue ler todos students → > 0
✅ TEST 5: Admin consegue ler todos payments → >= 0
✅ TEST 6: Aluno não consegue deletar → Erro ou RLS block
✅ TEST 7: Aluno consegue ler notificações próprias → >= 0
✅ TEST 8: Aluno não consegue ler notificações de outros → 0
✅ TEST 9: wt_is_staff() correto → admin: true, aluno: false
✅ TEST 10: Aluno não consegue mudar status → RLS block
```

Se todos passarem: ✅ RLS funcionando

---

## Riscos Conhecidos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Aluno consegue UPDATE `status: pending → active` | Aluno se aprova sozinho | ✅ CHECK em RLS para bloquear UPDATE de `status` |
| Aluno consegue UPDATE `role: aluno → admin` | Aluno vira admin | ✅ CHECK em RLS para bloquear UPDATE de `role` |
| JWT expirado, app usa cookie antigo | Operação com role errado | ✅ App valida JWT a cada POST (não confia em cookie) |
| OAuth sem email (Google, Facebook falham) | Auth.users duplicado | ✅ Rejeitar OAuth sem email |
| Admin consegue deletar aluno por engano | Perda de dados | 🟡 Soft delete + trigger para audit log |

---

## Próximos Passos

- [ ] Adicionar CHECK constraints em UPDATE students (proteger `status`, `role`)
- [ ] Audit log: trigger em DELETE/UPDATE de críticos
- [ ] Validar oauth signup em `/cadastro` (rejeitar sem email)
- [ ] Dashboard admin: listar users com múltiplas contas (mergear)
- [ ] Script: validar integridade de foreign keys

