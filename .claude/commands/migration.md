# /migration — Scaffold de Migration Supabase com RLS

## Uso
`/migration [nome-descritivo] [tabela] [operacoes-rls]`

## Exemplo
`/migration add_xp_ledger xp_ledger "staff:all, aluno:select-own"`

## O que faz
Cria uma migration SQL seguindo o padrão do Will Treinos PRO:
- Nome com timestamp (`20YYMMDDHHMMSS_nome.sql`)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Políticas RLS por papel (admin/staff, professor, aluno)
- Usa `wt_is_staff()` para verificar acesso staff

## Conhecimento de RLS do Projeto

### Função helper de staff (já existe no banco):
```sql
-- wt_is_staff() retorna TRUE se:
-- 1. user_metadata.role = 'admin' ou 'professor' no JWT
-- 2. OU email ativo em staff_access
```

### Padrões de RLS existentes:
```sql
-- Staff vê tudo, aluno vê próprio:
CREATE POLICY "staff_all_aluno_own" ON public.[tabela]
  FOR SELECT USING (
    wt_is_staff() OR auth_user_id = auth.uid()
  );

-- Apenas staff escreve:
CREATE POLICY "staff_only_write" ON public.[tabela]
  FOR ALL USING (wt_is_staff());

-- Aluno insere apenas próprio (pendente):
CREATE POLICY "aluno_self_insert" ON public.[tabela]
  FOR INSERT WITH CHECK (
    auth_user_id = auth.uid() AND status = 'pending'
  );
```

## Template Gerado

```sql
-- Migration: [nome-descritivo]
-- Criado: [data]
-- Propósito: [descrição]

-- ==========================================
-- TABELA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.[tabela] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- campos aqui
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE public.[tabela] ENABLE ROW LEVEL SECURITY;

-- [Políticas geradas conforme as operações solicitadas]

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_[tabela]_[campo] ON public.[tabela]([campo]);

-- ==========================================
-- TRIGGER: updated_at automático
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER [tabela]_updated_at
  BEFORE UPDATE ON public.[tabela]
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Local de criação
`supabase/migrations/[timestamp]_[nome].sql`

## Após criar
1. Aplicar: `supabase db push` ou SQL Editor no Supabase Dashboard
2. Registrar no `WILLPRO_MASTER_MEMORY.md`: **"Aplicar migração no Supabase"**
3. Rodar `/log` para documentar
