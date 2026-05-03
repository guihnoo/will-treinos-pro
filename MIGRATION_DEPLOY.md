# 🚀 Como Aplicar a Migration — 3 Opções

## Migration File
- **Arquivo:** `supabase/migrations/20260503200000_student_role_column.sql`
- **O que faz:** Adiciona coluna `role` na tabela `students` + RLS para visitors

---

## **Opção 1: Supabase Dashboard (MAIS FÁCIL) ⭐**

1. Abra [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **+ New Query**
5. Copie TODO O CONTEÚDO de `supabase/migrations/20260503200000_student_role_column.sql`
6. Cole na query
7. Clique **Run** (botão azul no canto inferior direito)
8. Aguarde até ver ✅ "Success"

**Tempo:** 2-3 minutos

---

## **Opção 2: Supabase CLI (Profissional)**

### Pré-requisito:
```powershell
npm install -g @supabase/cli
```

### Executar:
```powershell
cd c:\Users\monte\Desktop\will-treinos-pro
supabase link --project-ref [seu-project-ref]  # ex: abcdefghijklmnop
supabase db push
```

**Onde achar `project-ref`:**
- Supabase Dashboard → Settings → General → Reference ID

**Tempo:** 5 minutos

---

## **Opção 3: Manual (sem CLI)**

1. Abra [Supabase Dashboard](https://app.supabase.com)
2. SQL Editor → New Query
3. Copie este SQL linha por linha:

```sql
-- 1. Add role column
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

-- 3. Update payments RLS
ALTER POLICY "payments_student_own_select_update" ON payments
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.auth_user_id = auth.uid()
        AND s.id = student_id
        AND s.role != 'visitor'
    )
  );

-- 4. Update lessons RLS
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

-- 5. Update notifications RLS
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

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id_role ON students(auth_user_id, role);
```

4. **Run** → ✅

---

## ✅ Verificação Após Deploy

```sql
-- Confirme que a coluna foi criada:
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'role';

-- Resultado esperado: "role | text"
```

---

## 🎯 Próximo Passo

Após a migration:

```bash
pnpm run dev
```

Teste o fluxo:
1. OAuth novo → `/signup` → preenche → `/aguardando`
2. Admin aprova com role selector
3. Visitor acessa `/feed` apenas

---

**Escolha a Opção 1 (Dashboard) para mais segurança e visibilidade.** ✅
