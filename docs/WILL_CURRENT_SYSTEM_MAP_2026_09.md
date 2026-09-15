# 🗺️ Will Treinos PRO — Mapa do Sistema Atual (AS-IS)

**Data:** 2026-09-15
**Sprint:** 1 — Arquitetura e Estruturação do Will Treinos 2.0
**Escopo:** documentação e auditoria read-only. Nenhum código, banco, Supabase, Vercel, auth, RLS, API, UI ou PWA foi alterado para produzir este documento.

> Este documento descreve o sistema **como ele existe hoje**, extraído do código-fonte, migrations e documentação interna do repositório (`CLAUDE.md`, `WILLPRO_MASTER_MEMORY.md`, `docs/WILL_STACK_SSOT.md`, `docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md`, `docs/WILL_SECRET_ROTATION_RUNBOOK.md`, `.claude/skills/will-treinos-core/SKILL.md`). Onde uma afirmação não pôde ser confirmada diretamente pelo código, está marcada como **"não confirmado pelo código"** — nada foi inventado.
>
> **Nota — estado do Git vs. estado operacional:** algumas informações de infraestrutura (chaves ativas no painel do Supabase, secrets do GitHub Actions, env vars da Vercel, configurações de dashboard) **não são representadas pelo Git** e não podem ser confirmadas só lendo este repositório. Onde este documento descreve um desses estados, ele é marcado explicitamente como **"validado operacionalmente em 2026-09-15"** — para não induzir um agente futuro, que leia só o código, a concluir algo desatualizado (por exemplo, que chaves legadas do Supabase ainda estariam ativas depois de já terem sido desativadas no painel).

---

## 1. Visão geral

**Will Treinos PRO** é uma plataforma de gestão esportiva para **Vôlei de Alta Performance**, com três papéis de usuário — **admin** (dono), **professor/coach** e **aluno/atleta** — cobrindo controle tático da quadra, gamificação do atleta e gestão financeira do negócio. A UX segue um padrão **Modal-First** (fluxos internos abrem modais/gavetas sobre um "Cockpit", `router.push()` só para navegação de seção) e uma identidade visual **Dark + Gold** (`#EAB308`) com "sensação de app nativo" via PWA.

O produto nasceu de uma sequência muito intensa de sprints nomeados individualmente (o log em `WILLPRO_MASTER_MEMORY.md` chega a "Sprint 110"), entregues por agentes de IA (Claude Code + Cursor) em colaboração direta com o dono do produto, sem um processo formal de arquitetura prévia — o que explica boa parte da dívida técnica mapeada na Seção 12.

Em 2026-09-14/15, o projeto passou por uma sequência de sprints de segurança (0A a 0D-C, já mescladas em `main`) que corrigiram: autenticação real no endpoint de `lesson_ratings`, política de câmera do QR Scanner, dependências vulneráveis do `pnpm audit` (2 críticas → 0), um gate de CI real para auditoria de dependências, escaneamento de segredos por Gitleaks restrito a commits novos, remoção de credenciais versionadas (`check_second_admin.js`, `VERCEL_ENV_CHECKLIST.md`) e um runbook de rotação de chaves Supabase/VAPID. **Validado operacionalmente em 2026-09-15:** a migração das chaves Supabase para o formato moderno (Publishable Key + Secret Key) foi **concluída** — Preview e Production migrados nos dois lados (Vercel env vars server-side e client-side) e no GitHub Actions (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), as legacy `anon`/`service_role` foram desativadas no painel do Supabase, e produção (incluindo `/api/health` e login real) continuou funcionando normalmente após a desativação. **A rotação do par de chaves VAPID continua pendente** — não tem a mesma urgência de segurança (a chave pública é... pública por definição), mas precisa de um plano próprio porque invalida `push_subscriptions` existentes e exige re-subscribe dos usuários (ver `docs/WILL_SECRET_ROTATION_RUNBOOK.md`, Seção 2, e a Sprint 4 no roadmap do documento de arquitetura). Esta Sprint 1 é a primeira etapa **não relacionada a incidente de segurança** — é o ponto em que o produto para para se auto-mapear antes de continuar crescendo por acréscimo.

---

## 2. Stack

| Camada | Tecnologia | Versão (package.json) |
|---|---|---|
| Framework | Next.js (App Router) | `^15.5.25` |
| UI runtime | React / React DOM | `^19.0.0` |
| Linguagem | TypeScript | `6.0.3` |
| Estilo | Tailwind CSS | `3.4.1` |
| Animação | Framer Motion | `^12.38.0` |
| Backend/DB/Auth | Supabase (`@supabase/supabase-js`) | `^2.105.1` |
| PWA | `@ducanh2912/next-pwa` | `^10.2.9` |
| Push | `web-push` | `^3.6.7` |
| QR | `jsqr` (leitura) + `react-qr-code` (geração) | `^1.4.0` / `^2.0.21` |
| Captcha | `react-turnstile` (Cloudflare Turnstile) | `^1.1.5` |
| Observabilidade | `@sentry/nextjs` | `^10.74.0` |
| Analytics | `posthog-js` | `^1.372.6` |
| Busca fuzzy | `fuse.js` | `^7.4.2` |
| Command palette | `cmdk` | `^1.1.1` |
| Testes E2E | Playwright | `^1.59.1` |
| Deploy | Vercel, via `git push origin main` | — |
| Gerenciador de pacotes | pnpm | `10.33.2` |

CI: GitHub Actions (`ci.yml` — TypeScript, Build, E2E Smoke chromium, Gitleaks por range, Dependency Audit baseline-aware, RLS Audit experimental) + workflows auxiliares (`gitleaks-full-history.yml` manual, `e2e-auth-manual.yml`, `smoke-production.yml`, `cron-evening.yml`). Ver Seção 8 (Auth/CI) e `docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md` para o plano de evolução do pipeline.

---

## 3. Rotas de página

| Rota | Propósito | Público-alvo |
|---|---|---|
| `/` | Landing de marketing | público |
| `/login`, `/signup`, `/cadastro` (redirect legado), `/esqueci-senha`, `/nova-senha`, `/auth/callback` | Autenticação e recuperação de senha | público |
| `/aguardando` | Espera de aprovação de aluno pendente | aluno (pending) |
| `/privacidade`, `/termos` | Páginas legais estáticas | público |
| `/dashboard` | Hub central — renderiza `WillCockpit`, `CoachHome`, `StudentHome`/`StudentShell` conforme role | admin / professor / aluno |
| `/agenda` | Calendário e agendamento de aulas | admin / professor (leitura: aluno) |
| `/alunos` (784 linhas) | CRM de alunos — aprovação, tags, status | admin / professor |
| `/financeiro` (867 linhas) | Cobranças, comprovantes PIX, mensalidades | admin (bloqueado a professor pelo middleware) |
| `/feed` | Feed social — posts, curtidas, comentários, moderação | todos autenticados |
| `/ranking` | Leaderboard + Modo TV | todos / TV pública |
| `/atleta/[id]` | Perfil público de atleta (SSR via `/api/public/athlete/[id]`) | público |
| `/checkin/[lessonId]` | Check-in via QR code | aluno |
| `(student)/treinos` | Área de treinos do aluno, dentro do `StudentShell` | aluno |
| `/configuracoes` (630 linhas) | Configurações gerais (venues, categorias, PIX, notificações) | admin / professor / aluno (abas por role) |
| `/perfil` | Perfil do usuário logado | todos |
| `/preview`, `/will/push-debug`, `/dev/monitor` | **Código morto** — só fazem `redirect("/dashboard")` | n/a |
| `/will` | Índice admin — só faz `redirect("/will/court")` | admin |
| `/will/court` | Painel operacional da aula (quadra) | admin / professor |
| `/will/court/[lessonId]/live` | Coaching ao vivo (`LiveLessonCoachPanel`) | professor |
| `/will/evaluations/templates` | Editor de templates de avaliação | admin |
| `/will/status` | Healthcheck (crons, DB, push, bot) | admin |

`/dashboard` é a rota de maior complexidade: carrega condicionalmente o `WillCockpit.tsx` — **3687 linhas**, o maior arquivo do projeto (ver Seção 12).

---

## 4. Módulos e domínios funcionais (arquivos-chave)

| Domínio | Página/Rota | Context | Hooks | Componentes principais | Tabelas |
|---|---|---|---|---|---|
| **Feed** | `/feed` | `FeedContext` | `useFeedMutations` | `AchievementFeedPanel`, `FeedbackModal` | `feed_posts`, `feed_post_likes`, `feed_post_comments` |
| **Treinos** | `(student)/treinos` | `TrainingContext` | `useTrainingPlanMutations` | `TrainingPlanEditor`, `StudentTrainingPlanPanel` | `training_plans`, `training_exercises`, `training_logs`, `training_sessions` |
| **Avaliações** | `/will/evaluations/templates` | — | `useEvaluations` | `EvaluationTemplateManager`, `EvaluationHistoryPanel`, `BulkEvaluationModal`, `PerformanceEvalModal` | `evaluations`, `evaluation_templates` |
| **XP / Gamificação** | (transversal) | `GamificationContext` | `useXPMutations`, `useRealtimeXP` | `XPModerationPanel`, `XPAnalyticsPanel`, `XPHistoryPanel`, `StudentGamificationDashboard`, `XPFloatNotification` | `xp_log`, `xp_multipliers`, `awards`, `student_achievements` |
| **Presença / QR / Check-in** | `/checkin/[lessonId]` | `CheckInContext` | `useCheckInActions`, `usePresenceChannel`, `useRealtimePresence` | `QRScannerSheet`, `GeoCheckInButton`, `PresenceTracker`, `QRCheckInModal` | `lesson_presence`, `lesson_sessions`, `lesson_student_activity` |
| **Financeiro** | `/financeiro` | `PaymentsContext` | `usePaymentMutations` | — | `payments` |
| **Notificações** | (transversal) | `NotificationsContext` | `useNotificationMutations` | `PushPermissionBanner`, `PushSettingsPanel` | `notifications`, `notification_preferences`, `push_subscriptions` |
| **Matrícula/Convite** | `/signup`, `/cadastro` | — | `useEnrollmentInviteGate`, `useEnrollmentInviteSideEffects` | (pasta `src/components/enrollment/`) | `app_settings` |

---

## 5. Componentes principais

Diretórios sob `src/components/`: `will/` (painel admin), `student/` (UI do aluno), `ui/` (átomos de design system), `gamification/`, `leaderboard/`, `notifications/`, `enrollment/`, mais arquivos soltos na raiz.

**Total: ~45.195 linhas** em `src/components/**/*.tsx|ts`.

### Maiores arquivos (God Components candidatos)

| # | Arquivo | Linhas |
|---|---|---|
| 1 | `src/components/will/WillCockpit.tsx` | **3687** |
| 2 | `src/components/student/StudentHomePrimaryModals.tsx` | 2130 |
| 3 | `src/components/StudentHome.tsx` | 1841 |
| 4 | `src/components/will/BusinessAnalyticsPanel.tsx` | 683 |
| 5 | `src/components/will/CoachCopilotPanel.tsx` | 637 |
| 6 | `src/components/TrainingPlanEditor.tsx` | 589 |
| 7 | `src/components/will/AdminSettingsPanel.tsx` | 558 |
| 8 | `src/components/will/AthleteTwinPanel.tsx` | 538 |
| 9 | `src/components/will/ScoutModePanel.tsx` | 511 |
| 10 | `src/components/CreateLessonModal.tsx` | 508 |
| 11 | `src/components/will/AppHealthPanel.tsx` | 507 |
| 12 | `src/components/will/TemporalComparisonPanel.tsx` | 488 |
| 13 | `src/components/PerformanceEvalModal.tsx` | 478 |
| 14 | `src/components/AdminHome.tsx` | 475 |
| 15 | `src/components/will/CategoryManagerPanel.tsx` | 472 |
| 16 | `src/components/CoachHome.tsx` | 467 |
| 17 | `src/components/will/ImportStudentsModal.tsx` | 460 |
| 18 | `src/components/LessonDetailModal.tsx` | 458 |
| 19 | `src/components/gamification/DailyChallengesPanel.tsx` | 457 |
| 20 | `src/components/student/StudentTrainingPlanPanel.tsx` | 446 |
| 21 | `src/components/LiveLessonCoachPanel.tsx` | 443 |

Mais ~15 arquivos entre 350–420 linhas (`ShareProgressCard`, `StudentPaymentSheet`, `ReferralPanel`, `StudentReportSheet`, `KPIDetailModal`, `WeeklyChallengeEditor`, `ExportDataPanel`, `GlobalSearchModal`, `NotificationPulseSheet`, `OnboardingWidget`, `XPModerationPanel`, `Navigation`, `AttendanceHeatmapPanel`, `StudentSchedulePanel`, `FinancialForecastPanel`, `ChurnPreventionPanel`).

`WillCockpit.tsx` — segundo auditoria interna prévia (memória de sessão) — concentra na ordem de **35 subcomponentes**, **78 hooks de estado/contexto** e **8 dependências de context**, confirmando o status de God Component central do produto.

---

## 6. Hooks (`src/hooks/**`, 27 arquivos)

`useAnalytics`, `useCheckInActions`, `useCoachMessagesUnread`, `useDevEventsRealtime`, `useEnrollmentInviteGate`, `useEnrollmentInviteSideEffects`, `useEvaluations`, `useFeedMutations`, `useLeaderboard`, `useLessonMutations`, `useLoadSupabaseCriticalData`, `useLocalTransactionalPersistence`, `useNotificationMutations`, `useOfflineSync`, `usePaymentMutations`, `usePresenceChannel`, `useRealtimePresence`, `useRealtimeXP`, `useRepositionActions`, `useSessionRecovery`, `useStudentMutations`, `useStudentRole`, `useSupabaseAuthBridge`, `useSupabaseLoginActions`, `useSupabaseRealtimeRefresh`, `useSyncQueue`, `useToast`, `useTrainingPlanMutations`, `useTurnstile`, `useXPMutations`.

---

## 7. Libs (`src/lib/**`, ~55 arquivos)

Utilitários puros cobrindo: sessão/role (`appSessionHelpers`, `authPostLogin`, `buildSessionUser`, `resolveEffectiveSupabaseRole`, `resolveStudentCrmId`), data (`dateUtils` — ver pitfall de `localDateISO` vs `toISOString`), CSV (`csvExport.ts` **e** `exportCsv.ts` — duplicação, ver Seção 12), geolocalização, compressão de imagem, PIX (`pixUtils`), push (`pushClient`, `pushRoleBroadcast`), matrícula/convite (`enrollmentInviteCode`, `enrollmentInviteSync`, `enrollmentSession`, `verifyEnrollmentInvite`), XP (`xpAntiCheat`, `xpEventLogger`, `xpIntegration`, `xpLogger` — 4 arquivos, ver Seção 12), Supabase (`supabaseClient` — singleton client-side, `supabasePersistence`), sincronização offline (`offlineCache`, `syncQueue`), Sentry (`withSentryErrorHandler`), checagem de ambiente (`envCheck`).

Dois arquivos com nome de hook estão em `src/lib/` em vez de `src/hooks/`: `useAbsenceStreak.ts`, `useBodyScrollLock.ts` — inconsistência de localização, não confirmado se intencional.

---

## 8. Contextos (`src/context/**`)

Hierarquia real confirmada em `src/app/layout.tsx` (de fora para dentro):

```
MotionProvider
  └─ AppProvider
      └─ AuthProvider
          └─ CriticalDataProvider
              └─ CalendarTickProvider
                  └─ StudentsProvider
                      └─ LessonsProvider
                          └─ PaymentsProvider
                              └─ NotificationsProvider
                                  └─ AppConfigProvider
                                      └─ CatalogProvider
                                          └─ CoachingProvider
                                              └─ FeedProvider
                                                  └─ CheckInProvider
                                                      └─ TrainingProvider
                                                          └─ GamificationProvider
                                                              └─ LessonRatingsProvider
                                                                  └─ ToastProvider
                                                                      └─ RichToastProvider
```

Os 13 providers listados em `CLAUDE.md` existem de fato. **A lista do `CLAUDE.md` está incompleta**: faltam `TrainingProvider` e `GamificationProvider`, ambos existentes e em uso real no `layout.tsx`. `AppProvider` é a raiz que compõe boa parte da lógica de auth/CRUD local e também não está listada.

---

## 9. Middleware

`middleware.ts` (raiz):

- Lê o cookie `wt_role`, normaliza via `normalizeRole` (`@/domain/v1/rbac`).
- Prefixos guardados por role: `/will`, `/prof`, `/aluno`, `/lead`, validados por `canAccessPrefix(role, prefix)`.
- Paths privados (exigem sessão): `/dashboard`, `/agenda`, `/alunos`, `/financeiro`, `/feed`, `/configuracoes`, `/perfil`, `/treinos`.
- Sem cookie de role em rota privada → `/login?next=`. Prefixo sem permissão → `/dashboard?denied=`. Role `pending_student` → `/cadastro?matricula=1`.
- Regras específicas: `lead` não acessa `/configuracoes`; `student` não acessa `/alunos`; `professor` não acessa `/financeiro`.

**Ponto crítico:** a proteção do middleware é baseada inteiramente num cookie (`wt_role`) definido client-side (`syncWtRoleCookie`) — **não confirmado pelo código** se há verificação criptográfica do cookie no próprio middleware. A validação forte (JWT + `staff_access`) acontece nas rotas de API e nas policies RLS, não no middleware em si — ou seja, o middleware é uma camada de UX de roteamento, não a fronteira de segurança real (que é RLS + validação server-side, conforme já é princípio documentado em `CLAUDE.md`).

---

## 10. Auth

- Provedor: **Supabase Auth**, client singleton em `src/lib/supabaseClient.ts` (`flowType: "pkce"`).
- Métodos: email/senha (`signInWithPassword`) e Google OAuth (`signInWithOAuth`), ambos em `src/hooks/useSupabaseLoginActions.ts`.
- Resolução de role: `src/lib/resolveEffectiveSupabaseRole.ts` combina `staff_access` (tabela, por e-mail), `app_metadata`/`user_metadata` do JWT e `student_role` (coluna em `students`).
- Fluxo: login/OAuth → `AppContext.applySupabaseSession` resolve role → `buildSessionUser` monta o `User` de sessão → `syncWtRoleCookie` grava o cookie que o middleware lê → `link-student` (fire-and-forget) vincula `auth_user_id` quando o role é aluno.
- Callback OAuth: `src/app/auth/callback/page.tsx`.
- Sprint 0A (setembro/2026) corrigiu o padrão de validação server-side: `GET /api/student/submit-rating` passou a validar o JWT de verdade via `auth.getUser()` antes de qualquer consulta com `SERVICE_ROLE_KEY`, e a autorizar staff via `app_metadata.role` (`admin`/`will_owner`/`owner`/`coach`/`professor`/`teacher`) + `staff_access` — esse é hoje o padrão de referência mais alinhado à função SQL `wt_is_staff()`.

---

## 11. Papéis (Roles)

| Papel | Entrada | Navegação principal | Rotas restritas | Dados acessados |
|---|---|---|---|---|
| **Admin** (`admin`) | `/dashboard` → `WillCockpit` | Cockpit único com abas/painéis (Hoje, Alertas, Turma, Feed — reorganizado em auditoria de UX de junho/2026) | Todas | Tudo (via `SERVICE_ROLE_KEY` nas API routes, após checagem de `staff_access`) |
| **Professor/Coach** (`professor`) | `/dashboard` → `CoachHome` | Prancheta da quadra, avaliações, check-in, `/will/court/[lessonId]/live` | **Sem** `/financeiro` (middleware) | Alunos da própria turma, avaliações, presença |
| **Aluno/Atleta** (`student` / `pending_student`) | `/dashboard` → `StudentHome`/`StudentShell` | Área gamificada (XP, cards, feed, treinos) | **Sem** `/alunos`, `/configuracoes` restrito | Só os próprios dados (RLS) |
| **Lead** (`lead`) | fluxo de matrícula | — | **Sem** `/configuracoes` | Nenhum (pré-cadastro) |

A regra "nenhum usuário livre" é deliberada: cadastro exclusivamente via **link de convite** (Sprint 7.0 — Identity First), com "Aprovação Ativa" — o admin completa a ficha do aluno (limitações físicas, plano financeiro) no momento da aprovação.

---

## 12. PWA e Push

- `next.config.mjs` usa `@ducanh2912/next-pwa`: `dest: "public"`, `register: true`, `skipWaiting: true`, desabilitado em dev, `customWorkerSrc: "worker"` (aponta para `worker/index.ts`), fallback offline `/offline.html`.
- Worker customizado (`worker/index.ts`): handlers `push` (exibe notificação a partir do payload JSON) e `notificationclick` (foca janela existente ou abre nova).
- `public/manifest.json`: `id: "/"`, `name: "Will Treinos PRO"`, `short_name: "WillPRO"`, `display: standalone`, `start_url: "/dashboard"`, ícones 192/512 (incl. maskable), **sem screenshots preenchidos**.
- Push: `src/lib/pushClient.ts` (subscribe/unsubscribe), `src/lib/pushRoleBroadcast.ts` (broadcast por role), API `push/subscribe` (grava/remove em `push_subscriptions`, deriva role no servidor), `push/send`, `push/test`.
- `/will/push-debug` é hoje só um `redirect("/dashboard")` — página de debug desativada (código morto).

**Dívida técnica conhecida (Sprint 0D-B, `pnpm audit`):** a árvore de dependências do `@ducanh2912/next-pwa` (workbox-build, webpack/schema-utils/ajv) concentra **15 vulnerabilidades "high"** que só serão resolvidas com uma futura migração para **Serwist** — documentado e tolerado como dívida temporária em `security/dependency-audit-allowlist.json`, com gate de CI que impede qualquer vulnerabilidade nova fora dessa árvore.

---

## 13. Banco de dados

52 migrations (`20260428210000` a `20260605020000`). Principais tabelas identificadas:

| Domínio | Tabelas |
|---|---|
| Identidade/CRM | `students`, `staff_access`, `app_settings` |
| Aulas/Agenda | `lessons` |
| Financeiro | `payments` |
| Notificações | `notifications`, `notification_preferences`, `push_subscriptions` |
| Avaliações | `evaluations`, `evaluation_templates`, `lesson_ratings` |
| Mensageria staff | `coach_messages`, `lesson_coach_messages` |
| Ausência/Reposição | `absence_requests`, `reposition_requests` |
| Gamificação semanal | `weekly_challenges`, `weekly_highlights`, `student_goals` |
| Referral | `referrals` |
| Auditoria/Dev | `audit_log`, `dev_events` (com Realtime habilitado) |
| Feed | `feed_posts`, `feed_post_likes`, `feed_post_comments` |
| Presença | `lesson_presence`, `lesson_sessions`, `lesson_student_activity` |
| Treino | `training_plans`, `training_exercises`, `training_logs`, `training_sessions` |
| XP/Gamificação | `xp_log`, `xp_multipliers`, `awards`, `student_achievements` |

**RLS:** `ENABLE ROW LEVEL SECURITY` aparece em 15 arquivos de migration — uso extensivo, mas **não confirmado pelo código** (nesta auditoria) se 100% das tabelas acima têm RLS habilitado individualmente; seria necessário um mapeamento tabela-a-tabela dedicado (proposto como Sprint 2 — ver Seção 15).

**Funções/RPC:** `public.wt_is_staff()` (função central de autorização, corrigida em 2026-06-02 para não confiar em `user_metadata` editável pelo usuário), `wt_is_visitor`, `public.wt_notify_staff_new_pending_student`, `public.enroll_student_in_lesson`, `public.students_check_sensitive_fields`, `public.audit_students_update`, `update_push_subscriptions_updated_at`.

**Storage:** bucket(s) configurados em `supabase/migrations/20260430032000_storage_buckets.sql` (provável uso para comprovantes de pagamento e avatares — não detalhado nesta passada).

**Realtime:** confirmado em uso (`dev_events`, presença ao vivo via `usePresenceChannel`/`useRealtimePresence`, XP via `useRealtimeXP`).

**Edge Functions:** `supabase/functions/` **não existe** — projeto não usa Edge Functions do Supabase.

**pg_cron:** busca por `cron.schedule` nas migrations não retornou resultado — **não confirmado** uso de `pg_cron`; agendamento é feito via Vercel Cron + GitHub Actions (Seção 14).

---

## 14. Cron / Jobs agendados

11 rotas em `src/app/api/cron/*` (`absence-reminder`, `birthday-reminder`, `daily-reminder`, `fomo-reminder`, `monthly-report`, `onboarding-reminder`, `orchestrator-evening`, `orchestrator-morning`, `payment-reminder`, `post-lesson-feedback`, `weekly-report`).

- `vercel.json` só declara **um** cron nativo: `orchestrator-morning` às `0 11 * * *` (11h UTC = 8h BRT) — limite do plano Vercel Hobby (1 cron).
- O slot da noite é coberto por **workaround via GitHub Actions**: `.github/workflows/cron-evening.yml` dispara `POST /api/cron/orchestrator-evening` às 21h UTC (18h BRT), autenticado com `Authorization: Bearer ${{ secrets.CRON_SECRET }}`.
- **Confirmado pelo código** (correção desta revisão — a versão anterior deste documento continha uma afirmação não verificada): as outras 9 rotas de cron são de fato chamadas internamente pelos dois orquestradores. `orchestrator-morning` despacha (com `fetch` + `Authorization: Bearer ${CRON_SECRET}`) para `birthday-reminder`, `daily-reminder`, `onboarding-reminder` (diários), `payment-reminder` (dias 5 e 20) e `monthly-report` (dia 1). `orchestrator-evening` despacha para `absence-reminder`, `fomo-reminder`, `post-lesson-feedback` (diários) e `weekly-report` (condicional).
- **Confirmado pelo código:** todas as 11 rotas de `cron/*` (incluindo os dois orquestradores) validam `req.headers.get("authorization") === \`Bearer ${CRON_SECRET}\`` (ou `Authorization`, variando a capitalização entre arquivos) no início do handler, retornando `401` se o header não bater — cada rota faz a checagem inline (não há um helper compartilhado, mas a proteção existe e está presente em 100% das rotas inspecionadas). Não há rota de `cron/*` sem essa checagem.

---

## 15. Fluxos de navegação

- **Login → role → dashboard:** login/OAuth resolve role efetivo → grava cookie `wt_role` → `/dashboard` decide qual shell renderizar (`WillCockpit`/`CoachHome`/`StudentHome`) — não há uma rota fixa por papel, é uma única rota condicional.
- **Matrícula:** convite (link/código) → `/signup` ou `/cadastro` → aprovação ativa pelo admin (completa ficha) → aluno sai de "pending" → primeiro acesso a `/dashboard`.
- **Aula → avaliação → XP:** aula criada em `/agenda` → check-in via QR (`/checkin/[lessonId]`) → aula rodada em `/will/court` ou coaching ao vivo (`/will/court/[lessonId]/live`) → avaliação lançada (prancheta) → XP calculado e registrado em `xp_log` → aparece no Feed/Ranking/Cards do aluno.
- **Financeiro:** cobrança criada → comprovante PIX enviado pelo aluno → validação (`paymentProofValidator.ts`) → status atualizado, refletido no Cockpit admin.

---

## 16. Problemas e dívida técnica (P0–P3)

Classificação (revisada nesta correção, com critério mais estrito para P0):

- **P0** — risco crítico **confirmado**: vazamento de dados real, autorização contornável com impacto real, risco de perda/corrupção de dados, produção indisponível, credencial privada ativa exposta, ou vulnerabilidade explorável confirmada.
- **P1** — alto risco/alto impacto, mas sem incidente crítico confirmado (inclui itens que exigem "revisão de segurança necessária" quando a evidência não confirma exposição real).
- **P2** — dívida técnica importante / manutenibilidade / arquitetura.
- **P3** — melhoria.

Nada foi corrigido nesta auditoria — apenas identificado. Dois itens desta lista foram **investigados a fundo e corrigidos/reclassificados** nesta revisão (ver notas em cada um).

### P0 — Risco crítico

Nenhum item confirmado nesta auditoria atende ao critério de P0 (vazamento de dados real, autorização contornável com impacto real, ou vulnerabilidade explorável confirmada). Os dois candidatos investigados nesta correção (`WillCockpit.tsx` e a ausência de helper Supabase compartilhado) foram reclassificados para P2 abaixo — são riscos de arquitetura/manutenibilidade, não vulnerabilidades ativas por si só.

### P1 — Alto impacto / revisão de segurança necessária

1. **`GET /api/leaderboard` e `GET /api/leaderboard/tv` usam `SERVICE_ROLE_KEY` sem `auth.getUser()`** — **investigado nesta correção, com leitura do código de ambas as rotas**. Achados objetivos:
   - Ambas são **intencionalmente públicas**: o código de `leaderboard/route.ts` tem o comentário explícito `// Use service role to bypass RLS for leaderboard (public data)`, e `leaderboard/tv/route.ts` tem o cabeçalho `// Endpoint público (sem auth) para o Modo TV da academia`.
   - Dados retornados por `leaderboard/tv`: posição, **nome abreviado** (`formatDisplayName` reduz para "Primeiro Nome + Inicial do Sobrenome", ex. "Maria S."), XP da semana, tier — sem `auth_user_id`, sem e-mail.
   - Dados retornados por `leaderboard`: posição, **nome completo** (`name`, sem abreviação), `studentId` (que é o `auth_user_id`, um UUID — não um segredo), XP total/por período, tier. O campo `email` é consultado do banco (`select("auth_user_id, name, email")`) mas **não é incluído na resposta** (só `name` é mapeado para o objeto retornado).
   - Parâmetros do cliente (`page`, `limit` até 50, `period`/`timeframe`) só afetam paginação e janela de tempo — não ampliam o escopo de dados além do que a rota já expõe por design (ranking público).
   - **Não há exposição de dado privado confirmada** (sem e-mail, telefone, dado financeiro ou de saúde na resposta). Existe, sim, um ponto de atenção de produto/privacidade legítimo: `leaderboard` (diferente de `leaderboard/tv`) expõe **nome completo** de aluno de forma pública e paginável sem autenticação, o que pode ser sensível tratando-se de menores de idade — isso é uma decisão de produto que merece revisão explícita (ex.: aplicar o mesmo `formatDisplayName` abreviado também em `leaderboard`), não um bug de segurança confirmado.
   - **Classificação final: P1 — revisão de segurança/privacidade necessária**, não P0. O padrão de usar `SERVICE_ROLE_KEY` sem autenticação é deliberado e documentado em comentário no próprio código; o item que precisa de decisão de produto é especificamente a exposição de nome completo (não abreviado) em `GET /api/leaderboard`.
2. **Middleware baseado em cookie não-verificado criptograficamente** (`wt_role`) — funciona como roteamento de UX, mas pode confundir desenvolvedores futuros sobre onde está a "fronteira de segurança real" (RLS + API) se não for documentado explicitamente (este documento faz essa marcação). Sem evidência de que esse cookie seja hoje explorado para bypass de autorização real (a autorização de dados continua sendo decidida por RLS + checagem server-side nas rotas de API, não pelo middleware).
3. **`docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md` Fase 1B ainda pendente** — sem staging Supabase dedicado, sem contas de teste, RLS audit no CI é "experimental" contra schema vazio (`continue-on-error`), branch protection ainda depende de ação humana.

### P2 — Dívida técnica importante

4. **`WillCockpit.tsx` como God Component (3687 linhas)** — **reclassificado nesta correção** (estava listado como P0). Justificativa: concentra a maior parte da lógica/UI do painel admin, o que aumenta o risco de regressão cruzada e dificulta revisão/teste isolado — mas isso é um risco de **manutenibilidade e velocidade de desenvolvimento futuro**, não uma vulnerabilidade ativa, vazamento de dado ou indisponibilidade hoje. Não há evidência de que o tamanho do arquivo, por si só, cause um incidente em produção.
5. **Ausência de helper Supabase server-side compartilhado** — **reclassificado nesta correção** (estava listado como P0). 44 rotas de API recriam inline o padrão "client anon para validar JWT + client service role para consultar", com pequenas variações entre elas. Isso é dívida arquitetural real — qualquer correção de segurança nesse padrão (como a feita no Sprint 0A) precisa ser replicada rota a rota, aumentando o risco de uma futura inconsistência — mas hoje não há evidência de que exista de fato uma rota inconsistente/vulnerável por causa dessa duplicação (o item 1 desta lista, investigado a fundo, mostrou que o padrão observado em `leaderboard` é intencional, não um esquecimento).
6. **~40 arquivos `.md` legados na raiz do repositório** (auditorias, resumos de fase, prompts de outras ferramentas — `ANALISE_COMPLETA_PROJETO.md`, `PHASE7_VALIDATION_REPORT.md`, `STITCH_*`, etc.) sem curadoria — dificulta saber qual documentação é a fonte de verdade atual (`CLAUDE.md` e `WILLPRO_MASTER_MEMORY.md` são, mas isso não é óbvio para quem chega agora).
7. **`fix.js` na raiz** — script de patch avulso com caminho absoluto hardcoded para `C:\Users\monte\Desktop\will-treinos-pro\...` (repositório-irmão, fora deste worktree) — código morto, mas mostra o padrão de "scripts de debug soltos no repo" que já gerou o incidente de segurança do Sprint 0D-C.
8. **Duplicação de nome/responsabilidade:** `LiveLessonCoachPanel.tsx` existe em dois locais (`src/components/` e `src/components/will/`, 443 e 378 linhas); `csvExport.ts` e `exportCsv.ts` como libs paralelas; subsistema de XP fragmentado em 4 arquivos lib (`xpAntiCheat`, `xpEventLogger`, `xpIntegration`, `xpLogger`) com sobreposição de nome — todos candidatos a consolidação, não confirmado o grau real de sobreposição sem leitura de conteúdo linha a linha.
9. **`CLAUDE.md` desatualizado em relação ao código real** — lista de contexts incompleta (faltam `TrainingProvider` e `GamificationProvider`); é o tipo de deriva que se acumula quando a documentação não é atualizada no mesmo commit que o código.
10. **`@ducanh2912/next-pwa` com 15 vulnerabilidades "high" conhecidas** (dependência transitiva de workbox/webpack) — dívida já documentada e com gate de CI, mas ainda pendente de resolução via migração para Serwist.
11. **`docs/product-guide/` contém material comercial (apresentação para cliente), não documentação técnica de produto** — pode confundir quem procura "guia do produto" esperando specs técnicas.

### P3 — Melhoria

12. **Dois arquivos com nome de hook em `src/lib/`** (`useAbsenceStreak.ts`, `useBodyScrollLock.ts`) em vez de `src/hooks/` — inconsistência de convenção, baixo risco mas confunde navegação do repo.
13. **`AGENTS.md` e `CLAUDE.md` têm o mesmo conteúdo (428 linhas cada)** — não confirmado se é intencional (compatibilidade com uma ferramenta que só lê `AGENTS.md`) ou duplicação acidental a ser consolidada.
14. **Nenhum `screenshots` preenchido no `manifest.json` da PWA** — afeta a qualidade do prompt de instalação em alguns navegadores (melhoria de polish, não bloqueador).

---

## 17. Dependências e pontos críticos de acoplamento

- **`WillCockpit.tsx` → praticamente todos os contexts** (8+ dependências de context confirmadas em auditoria anterior) — qualquer mudança na forma de um context expor dados tem que considerar esse arquivo.
- **Toda rota de API → padrão duplicado de Supabase client** — mudança de política de autorização precisa tocar até 44 arquivos se não for centralizada primeiro.
- **Middleware ↔ `AppContext`/`syncWtRoleCookie`** — o cookie que o middleware lê é escrito pelo client após resolver a sessão; qualquer mudança na lógica de resolução de role em `resolveEffectiveSupabaseRole.ts` precisa ser espelhada no entendimento do middleware sobre valores válidos de `wt_role`.
- **PWA/Service Worker ↔ Push** — o worker customizado (`worker/index.ts`) e o `next-pwa` geram o `sw.js` final; mudanças em um exigem rebuild completo e nova validação de cache/push (não há testes automatizados desse fluxo confirmados).
- **CI (`ci.yml`) ↔ `scripts/set-github-ci-secrets.mjs` ↔ GitHub Secrets** — **validado operacionalmente em 2026-09-15:** o secret `NEXT_PUBLIC_SUPABASE_ANON_KEY` no GitHub Actions foi atualizado para a Publishable Key moderna (ver `docs/WILL_SECRET_ROTATION_RUNBOOK.md` e o histórico de PRs #13–#15). `scripts/set-github-ci-secrets.mjs` (PR #15) já valida explicitamente o formato moderno e rejeita JWT legacy caso o script precise ser rodado de novo no futuro.

---

## 18. O que este documento NÃO cobre

- Mapeamento RLS tabela-a-tabela (proposto como parte da Sprint 2 — Segurança Funcional).
- Leitura de conteúdo linha a linha para confirmar duplicações suspeitas (Seção 16, itens 8 e 10) — apenas apontadas por nome/tamanho.
- Auditoria de performance/capacity (Sprint 3 no roadmap de `docs/WILL_PRODUCT_SYSTEM_ARCHITECTURE_2_0.md`).
- Auditoria de UX/navegação detalhada por tela (Sprint 5 no mesmo roadmap) — aqui só o esqueleto de rotas/fluxos foi mapeado.
