# Migrations Pendentes de Aplicar no Supabase

Execute no SQL Editor do Supabase (supabase.com -> projeto -> SQL Editor).

## Obrigatórias (bloqueiam features)

1. `20260531030000_weekly_challenge.sql` — Desafio Semanal
2. `20260601000000_evaluation_templates.sql` — Templates de Avaliação
3. `20260601010000_students_birthdate.sql` — Data de Nascimento
4. `20260601020000_student_tags.sql` — Tags dos Alunos

## Ordem de execução

Execute na ordem numérica dos timestamps.
Todas usam `IF NOT EXISTS` e `DROP POLICY IF EXISTS` — sao idempotentes.

## Como aplicar

1. Acesse https://supabase.com -> seu projeto -> SQL Editor
2. Cole o conteudo de cada arquivo na ordem acima
3. Clique em "Run" para executar
4. Confirme que nao ha erros antes de prosseguir para o proximo

## Verificacao pos-aplicacao

Execute `supabase/check_migrations_status.sql` para confirmar o status de todas as tabelas.
