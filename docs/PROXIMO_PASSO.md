# 🎯 Próximas Ações — Debugar & Testar

**Status:** ✅ Código pronto. Notificações profissionais implementadas. RLS debugado.  
**Falta:** Aplicar migrations + testar fluxo completo.

---

## 📋 Passo-a-Passo Imediato

### **PASSO 1: Aplicar Migrações no Supabase Remoto** (⏱️ 10 min)

O **problema raiz** é que `wt_is_staff_staff_access.sql` (e outras) **não foram aplicadas** no seu projeto Supabase remoto.

**Escolha UMA das opções:**

#### Opção A: Via Supabase CLI (Recomendado)
```bash
# No terminal do projeto
supabase link --project-id YOUR_PROJECT_ID  # link seu projeto remoto
supabase migration up                       # aplica TODAS as 20 migrations
```

#### Opção B: Via Supabase Dashboard (Manual)
1. Abra https://app.supabase.com → seu projeto
2. Vá em **SQL Editor**
3. Copie & execute cada arquivo em `supabase/migrations/` em ordem:
   - Comece com `20260428210000_willpro_live_schema.sql`
   - Termine com `20260505130000_verify_enrollment_invite_rpc.sql`
4. [Ver guia detalhado](../supabase/MIGRATIONS.md)

---

### **PASSO 2: Inserir você em `staff_access`** (⏱️ 2 min)

No **Supabase Dashboard → SQL Editor**, rode:

```sql
INSERT INTO staff_access (id, email, role, is_active)
VALUES (
  gen_random_uuid()::text,
  'guihmonteiro.2014@gmail.com',  -- ← SEU EMAIL DO GOOGLE
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET is_active = true;
```

**Por quê?** A função `wt_is_staff()` agora verifica:
1. JWT role (seu Google OAuth não tem) OU
2. Linha ativa em `staff_access` com seu email (isso!)

---

### **PASSO 3: Validar Migrações** (⏱️ 2 min)

No **SQL Editor**, rode esses queries:

```sql
-- (1) Você está em staff_access?
SELECT * FROM staff_access WHERE email = 'guihmonteiro.2014@gmail.com';
-- ✓ Deve retornar 1 linha com role='admin', is_active=true

-- (2) Função wt_is_staff() funciona?
SELECT wt_is_staff();  
-- ✓ Deve retornar TRUE

-- (3) RLS policies foram criadas?
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
-- ✓ Deve retornar ~15-20 policies

-- (4) Há alunos pending (do cadastro anterior)?
SELECT id, name, email, status FROM students WHERE status = 'pending' ORDER BY joined_at DESC LIMIT 5;
-- ✓ Deve mostrar alunos que se cadastraram
```

---

## 🧪 Teste Completo (E2E Manual)

Após os 3 passos acima, faça esse fluxo:

### **Teste 1: Admin vê alunos**
```
1. pnpm dev          (inicia o app)
2. http://localhost:3000
3. Login com sua conta Google (developer)
4. Deve ir para /dashboard (não para /cadastro)
5. Clique em "Alunos" no menu
6. ✓ Deve ver lista de alunos (antes estava vazia!)
```

### **Teste 2: Novo aluno se cadastra → Admin vê notificação**
```
1. Ainda no admin, clique no sino (bell) no header
2. Deve estar vazio (nenhuma notificação nova)
3. Abra uma ABA PRIVADA ou OUTRO NAVEGADOR
4. Acesse http://localhost:3000 (incógnito)
5. Clique "Não tenho conta" → Google OAuth
6. Complete cadastro como aluno (coloque email novo, ex: teste+aluno@gmail.com)
7. Vai para /dashboard (aluno)
8. VOLTE PARA ABA DO ADMIN
9. Refresh (F5) ou clique no sino
10. ✓ Notificação "Nova inscrição" deve aparecer!
```

### **Teste 3: Clicar notificação → Modal profissional**
```
1. No drawer de notificações (sino aberto)
2. Você vê: ícone azul (UserPlus) + "Nova inscrição" + preview
3. Clique na notificação
4. ✓ Modal abre com:
   - Ícone grande + cor
   - Título + timestamp
   - Card com dados do aluno (nome, email, telefone, status, data inscrição)
   - Botão "Revisar Aluno" (laranja-ouro)
   - Botão "Depois"
5. Clique "Revisar Aluno"
6. ✓ Deve fechar modal (próxima integração: abrir ApprovalModal)
```

### **Teste 4: Aluno vê só suas notificações (RLS)**
```
1. Ainda na aba do aluno
2. Clique no sino (notificações)
3. ✓ Deve estar vazio (aluno não vê "Nova inscrição" de admin!)
4. Texto: "Você vê apenas suas notificações e avisos gerais"
5. RLS está funcionando corretamente ✓
```

---

## ✅ Checklist (Copie & Cole)

```
[ ] Migrações aplicadas (via CLI ou Dashboard)
[ ] Você inserido em staff_access (INSERT validado)
[ ] wt_is_staff() retorna TRUE (SQL query OK)
[ ] Admin vê alunos em /alunos (antes era vazio)
[ ] Novo aluno se cadastra (Google OAuth)
[ ] Notificação "Nova inscrição" aparece no sino
[ ] Clica notificação → Modal abre (contexto visual completo)
[ ] Admin vê dados do aluno no modal
[ ] Botão "Revisar Aluno" funciona (fecha modal)
[ ] Aluno NÃO vê notificação de novo aluno (RLS OK)
```

---

## 🚨 Se algo NÃO funcionar

### "Notificação não aparece"
**Checklist:**
- Migração `20260501030100_pending_student_self_insert_and_notify.sql` foi aplicada?
- Você está em staff_access?
- No SQL Editor: `SELECT wt_is_staff();` retorna TRUE?

### "Admin vê notificação, mas aluno novo não aparece em /alunos"
**Checklist:**
- Migração `20260502100000_wt_is_staff_staff_access.sql` foi aplicada?
- `INSERT INTO staff_access` rodou corretamente?
- Teste: `SELECT COUNT(*) FROM students WHERE status = 'pending';`

### "Modal não abre ao clicar notificação"
**Checklist:**
- Build rodou? `pnpm run build` (exit 0)
- TypeScript OK? `pnpm exec tsc --noEmit` (sem erros)
- Refresh browser (F5)
- Checar console (F12 → Console) para errors

---

## 📚 Documentação Completa

- **[supabase/MIGRATIONS.md](../supabase/MIGRATIONS.md)** — Guia detalhado de migrações (CLI, manual, troubleshooting)
- **[docs/NOTIFICACOES_PROFISSIONAIS.md](./NOTIFICACOES_PROFISSIONAIS.md)** — O que foi implementado em notificações
- **[CLAUDE.md](../CLAUDE.md)** — Arquitectura do projeto

---

## 🎬 Depois que tudo funcionar

1. **Integrar "Revisar Aluno"** com `ApprovalModal` (abrir fluxo de aprovação)
2. **Adicionar ações** na notificação (snooze, marcar resolvido, deletar)
3. **Web Push real-time** (notificação chega em tempo real via Supabase Realtime)
4. **Sound + Badge** (som quando notificação chega, badge de contador)

---

**Pronto?** 🚀 Comece pelo PASSO 1: aplicar migrações.

Qualquer dúvida: Cheque os `.md` files ou rode os SQL queries de validação.

