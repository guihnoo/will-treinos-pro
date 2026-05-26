# Will Treinos PRO — Checklist de Lançamento

## PASSO 1 — Diagnóstico (rode primeiro)

No **SQL Editor do Supabase**, cole e rode o arquivo `check_migrations_status.sql`.

O resultado vai mostrar `true` ou `false` para cada item. Qualquer `false` = migration faltando.

---

## PASSO 2 — Aplicar migrations pendentes

Abra cada arquivo `.sql` da pasta `supabase/migrations/` **em ordem numérica** e rode no SQL Editor.
Se já está `true` no diagnóstico, pule.

### Ordem obrigatória:

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `20260428210000_willpro_live_schema.sql` | Schema base: students, lessons, payments, notifications |
| 2 | `20260428220000_students_auth_user_id.sql` | Vincula aluno ao auth.uid() |
| 3 | `20260429183000_align_notification_recipients.sql` | Destinatários de notificação |
| 4 | `20260429233000_staff_access.sql` | Tabela staff_access (OBRIGATÓRIO para cockpit) |
| 5 | `20260429233100_staff_access_rls_select_own.sql` | RLS da staff_access |
| 6 | `20260430001000_core_rls_hardening.sql` | RLS core (wt_is_staff, policies) |
| 7 | `20260430012000_feed_real_tables.sql` | Tabelas do feed |
| 8 | `20260430013000_students_public_signup_policy.sql` | Aluno pode se cadastrar |
| 9 | `20260430021000_lessons_rls.sql` | RLS de aulas |
| 10 | `20260430032000_storage_buckets.sql` | Storage para avatars/comprovantes |
| 11 | `20260430040000_feed_moderation.sql` | Moderação do feed |
| 12 | `20260501030100_pending_student_self_insert_and_notify.sql` | Cadastro OAuth funciona |
| 13 | `20260501140000_app_settings_enrollment_invite.sql` | Código de convite |
| 14 | `20260502100000_wt_is_staff_staff_access.sql` | wt_is_staff() reconhece staff_access |
| 15 | `20260502120000_push_subscriptions.sql` | Push notifications |
| 16 | `20260503150000_dev_events.sql` | Monitor de eventos (dev) |
| 17 | `20260503200000_student_role_column.sql` | Coluna role nos alunos |
| 18 | `20260504000000_rls_check_constraints.sql` | Check constraints RLS |
| 19 | `20260504_create_lesson_presence.sql` | Presença ao vivo |
| 20 | `20260504_training_plans.sql` | Planos de treino (v1) |
| 21 | `20260504110000_dev_events_realtime.sql` | Realtime no monitor |
| 22 | `20260505130000_verify_enrollment_invite_rpc.sql` | RPC validação de convite |
| 23 | `20260505140000_training_plans.sql` | Planos de treino (v2) |
| 24 | `20260505150000_xp_log.sql` | XP log + student_achievements |
| 25 | `20260505160000_lesson_coaching.sql` | Coaching nas aulas |
| 26 | `20260507000000_training_complete_crud.sql` | CRUD completo de treinos |
| 27 | `20260508000000_gamification_xp_log.sql` | xp_multipliers + awards |
| 28 | `20260509120000_notify_pending_student_time_iso.sql` | Fix notificação de aluno novo |
| 29 | `20260509150000_add_student_role.sql` | Coluna student_role (aluno/observador/professor) |

> **Dica:** a maioria usa `CREATE TABLE IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS` — rodar de novo não quebra.

---

## PASSO 3 — Bootstrap do admin (UMA VEZ por projeto)

**Obrigatório.** Sem isso o cockpit aparece vazio mesmo com dados no banco.

Edite e rode no SQL Editor:

```sql
INSERT INTO public.staff_access (id, email, role, is_active)
VALUES (gen_random_uuid()::text, 'SEU-EMAIL-GOOGLE@gmail.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;
```

Substitua `SEU-EMAIL-GOOGLE@gmail.com` pelo email exato que o Will usa no Google.

---

## PASSO 4 — Vercel: variáveis de ambiente de produção

No painel Vercel → Settings → Environment Variables, confirme que estão todas preenchidas:

| Variável | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Já configurada |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Já configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Já configurada |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Já configurada |
| `VAPID_PRIVATE_KEY` | ✅ Já configurada |
| `VAPID_SUBJECT` | ✅ Já configurada |
| `NEXT_PUBLIC_REQUIRE_ENROLLMENT_INVITE` | ⚠️ Adicionar: `true` |
| `ANTHROPIC_API_KEY` | Opcional (tem fallback estático) |
| `NEXT_PUBLIC_SENTRY_DSN` | Opcional (monitoramento pós-lançamento) |

> Após adicionar variáveis, faça um **Redeploy** na Vercel para o build pegar os novos valores.

---

## PASSO 5 — Configurações iniciais no app

1. Faça login com o email do Will (admin)
2. Vá em `/configuracoes` → aba **Recebimentos PIX**
3. Cadastre a chave PIX e o nome do destinatário
4. Gere o link de convite (botão "Gerar novo código") e salve para compartilhar com alunos

---

## PASSO 6 — Teste de fumaça (antes de abrir para alunos)

- [ ] Admin consegue logar e ver o cockpit com dados
- [ ] Gerar link de convite → abre `/cadastro?invite=...` em aba anônima
- [ ] Aluno se cadastra com Google OAuth
- [ ] Admin vê o aluno na fila de aprovação
- [ ] Admin aprova o aluno (modal com plano/mensalidade)
- [ ] Aluno acessa área gamificada e vê XP zerado
- [ ] Admin cria uma aula → aparece na agenda
- [ ] Aluno faz check-in → XP de 50 pts aparece
- [ ] Admin avalia aluno → XP aparece no dashboard do aluno
- [ ] Aluno envia comprovante de pagamento
- [ ] Admin confirma pagamento em `/financeiro`
