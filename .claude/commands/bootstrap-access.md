# /bootstrap-access — Diagnóstico e bootstrap de acesso (admin + aluno OAuth)

## Quando usar
- Dono vê **0 alunos** no cockpit mas há linhas em `students`.
- Cadastro `/signup` ou `/cadastro` falha com **RLS** ou **duplicidade** `auth_user_id`.
- OAuth sem `user_metadata.role`: precisa alinhar **`staff_access`** + **`students_insert_pending_self`**.

## Superprompt (copiar para Claude Code)

```
CONTEXTO — Will Treinos PRO (Next.js 15 + Supabase RLS)

PROBLEMA OPERACIONAL
O desenvolvedor/dono precisa de fluxo autónomo: (1) ter admin real no Postgres sem repetir SQL manual a cada cadastro de teste; (2) poder testar conta de aluno sem confundir com conta de staff.

CAUSA RAIZ CONHECIDA
1) Lista vazia no cockpit com dados no DB: políticas `students_staff_all` etc. usam `wt_is_staff()`. Google OAuth costuma vir SEM role no JWT — só conta quem está em `staff_access` (email ativo) OU JWT com role admin/coach. Ver migração `supabase/migrations/20260502100000_wt_is_staff_staff_access.sql`.

2) INSERT de aluno logado bloqueado: falta política `students_insert_pending_self` — migração `supabase/migrations/20260501030100_pending_student_self_insert_and_notify.sql`.

3) “Conta já vinculada”: índice único `students_auth_user_id_uidx` — um Google account = uma linha `students`. Retestar mesmo email exige apagar linha em dev ou usar OUTRA conta Google.

TAREFAS (executar nesta ordem)
A) Ler `supabase/bootstrap_willpro_once.sql`, `.env.example` (secção staff_access), `src/lib/authPostLogin.ts` (`isDevRootEmail`), `src/lib/resolveEffectiveSupabaseRole.ts`, `src/lib/supabasePersistence.ts` (`fetchStaffAccessRole`, `createStudentRemote`), `src/components/AuthWrapper.tsx` (gate matrícula).

B) Confirmar no repo que o pack de migrações inclui `20260502100000_wt_is_staff_staff_access.sql` e `20260501030100_pending_student_self_insert_and_notify.sql`. Se o projeto remoto não tiver sido migrado, documentar “rodar SQL Editor uma vez” — não automatizar INSERT staff pelo browser (RLS de staff_access só SELECT para authenticated).

C) Verificar se `NEXT_PUBLIC_DEV_ROOT_EMAILS` na Vercel está documentado apenas como UX/toggle (não substitui RLS). Lista clara: staff_access = verdade para dados; DEV_ROOT = papel dev na UI.

D) Propor melhorias opcionais (sem scope creep): mensagens de erro já existem em `studentSignupErrors.ts`; eventual README curto ou link no cockpit para `bootstrap_willpro_once.sql`.

ACEITAÇÃO
- Documentação única “bootstrap por ambiente” encontrável.
- Desenvolvedor entende: uma vez staff_access + migração pending_self → cadastros de alunos são autónomos; testes de aluno com segunda conta Google ou apagar linha em dev.
```

## Verificação rápida (humano)
1. SQL Editor: `SELECT * FROM staff_access WHERE is_active = true;`
2. SQL Editor: políticas em `students` contêm `students_insert_pending_self`.
3. Vercel Production: `NEXT_PUBLIC_SUPABASE_*` apontam ao mesmo projeto onde correu o SQL.
