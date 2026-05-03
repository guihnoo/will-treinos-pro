# 🚀 Setup Automático do Supabase — 3 Passos

**⏱️ Tempo total: ~5 minutos**

---

## ✨ O que vai acontecer

```
[Local]                          [Supabase Remoto]
node scripts/prepare-migrations.js    ┌─────────────────────────┐
        ↓                             │ 1. Criar arquivo SQL    │
[MIGRATIONS_COMBINED.sql]             └─────────────────────────┘
        ↓                                    ↓
        You → Copy & Paste Browser    [Supabase Dashboard]
        ↓                                    ↓
        node scripts/insert-admin.js   ┌─────────────────────────┐
                                       │ 2. Executar 20 SQLs     │
                                       │ 3. Criar tabelas & RLS  │
                                       └─────────────────────────┘
                                              ↓
                                       ┌─────────────────────────┐
                                       │ 4. Inserir admin        │
                                       │ (via SDK automático)    │
                                       └─────────────────────────┘
```

---

## 📋 Passo 1: Gerar arquivo SQL

Arquivo `supabase/MIGRATIONS_COMBINED.sql` já foi gerado! ✅

**Localização:** `supabase/MIGRATIONS_COMBINED.sql` (44 KB, 20 migrações)

---

## 🌐 Passo 2: Executar no Supabase Dashboard (Manual — 2 min)

### **A. Copiar o arquivo SQL**

1. **Abra** `supabase/MIGRATIONS_COMBINED.sql` no VS Code (ou seu editor)
2. **Selecione tudo** — `Ctrl+A`
3. **Copie** — `Ctrl+C`

### **B. Colar no Supabase**

1. **Abra** https://app.supabase.com
2. **Login** com sua conta Supabase
3. **Selecione** seu projeto (`armrortldtqxmgvvcbko`)
4. **Vá em:** SQL Editor (no menu da esquerda)
5. **Clique:** "+ New Query" (botão azul)
6. **Cole** — `Ctrl+V` (dentro do editor SQL)
7. **Execute** — Clique em `RUN` ou pressione `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

**Espere:** ~20-30 segundos enquanto as migrações são aplicadas

**Resultado esperado:**
```
✓ Success. Sent 20 SQLs and got back an empty result

-- (sem erro)
```

---

## 🔐 Passo 3: Inserir você em `staff_access` (Automático — 1 min)

Agora execute o script que insere você automaticamente:

```bash
node scripts/insert-admin.js
```

**Output esperado:**
```
🔐 Configurando staff_access...

📍 Supabase: https://armrortldtqxmgvvcbko.supabase.co
👥 Emails a inserir: guihmonteiro.2014@gmail.com

✅ Conexão OK!

📝 Inserindo admins...

✅ guihmonteiro.2014@gmail.com
   ID: abc123def456...
   Role: admin
   Active: true

✔️  Validando...

✅ Validação OK! 1 admin(s) inserido(s)

────────────────────────────────────
📧 guihmonteiro.2014@gmail.com (admin) ✓ ativo
────────────────────────────────────

🎉 Staff Access configurado!

📝 Próximos passos:
   1. Abra http://localhost:3000/login
   2. Faça login com Google (guihmonteiro.2014@gmail.com)
   3. Você deve ir para /dashboard (não /cadastro)
   4. Clique em 'Alunos' no menu
   5. ✓ Deve ver lista de alunos (antes estava vazia!)
   ...
```

---

## ✅ Validar que Funcionou

Após os 3 passos, rode os testes:

### **1. Admin consegue ver alunos**
```bash
pnpm dev          # Inicia o app
# Abra http://localhost:3000/login
# Login com Google → /dashboard → "Alunos"
# ✓ Deve ver lista (ou vazia se nenhum aluno cadastrado ainda)
```

### **2. Novo aluno se cadastra → Notificação chega**
```
1. Ainda no admin, clique no sino (notificações)
2. Abra OUTRA ABA (incógnito ou novo navegador)
3. http://localhost:3000 → "Não tenho conta" → Google OAuth
4. Complete cadastro como aluno (email diferente)
5. VOLTA PARA ABA DO ADMIN
6. Refresh (F5) ou clique no sino
7. ✓ Deve ver "Nova inscrição" na notificação
```

### **3. Clica notificação → Modal abre**
```
1. Click na notificação "Nova inscrição"
2. ✓ Modal abre com dados do aluno
3. Botão "Revisar Aluno" está lá
```

---

## 🐛 Troubleshooting

### ❌ "Error: relation 'staff_access' does not exist"
**Causa:** Migrações não foram executadas no Supabase Dashboard

**Solução:**
1. Volte ao **Passo 2**
2. Verifique que o SQL foi **executado** (check ✓ ao lado)
3. Se erro, copie-cole novamente e execute

### ❌ "Conexão recusada / Timeout"
**Causa:** `.env.local` não tem credenciais Supabase

**Solução:**
1. Verifique `.env.local`:
   ```bash
   cat .env.local | grep NEXT_PUBLIC_SUPABASE
   ```
2. Deve ter:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://armrortldtqxmgvvcbko.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
3. Se falta algo, edite `.env.local` manualmente

### ❌ "Validação falhou: esperava 1 admins, encontrou 0"
**Causa:** INSERT não funcionou

**Solução:**
1. No Supabase Dashboard → SQL Editor, rode:
   ```sql
   SELECT * FROM staff_access;
   ```
2. Se vazio, significa a migração que cria a tabela não rodou
3. Volte ao **Passo 2** e execute novamente

### ❌ "Admin vê alunos MAS notificação não chega"
**Causa:** Trigger de notificação pode não ter sido criada

**Solução:**
1. Cheque se migração `20260501030100_pending_student_self_insert_and_notify.sql` foi executada
2. No Supabase → SQL Editor, rode:
   ```sql
   SELECT * FROM information_schema.routines WHERE routine_name = 'wt_notify_staff_new_pending_student';
   ```
3. Se vazio, a função não existe — execute apenas essa migração manualmente

---

## 📚 Arquivos Relacionados

- **`supabase/MIGRATIONS.md`** — Guia detalhado (se quiser fazer manual)
- **`docs/NOTIFICACOES_PROFISSIONAIS.md`** — O que foi implementado
- **`docs/PROXIMO_PASSO.md`** — Testes E2E completos

---

## 🎬 Começar Agora!

```bash
# Terminal 1: Começar o servidor
pnpm dev

# Terminal 2: Executar setup (após Passo 2)
node scripts/insert-admin.js

# Depois: Testar em http://localhost:3000/login
```

**Dúvidas?** Cheque `.env.local` → rode `node scripts/insert-admin.js` de novo → veja qual erro aparece → siga a solução acima.

---

**Pronto!** 🚀 Quando o script disser "✅ Staff Access configurado!", você está 100% setup.

