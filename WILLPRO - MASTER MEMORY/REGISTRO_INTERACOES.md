# Registro de interações e atividades — Will Treinos PRO

**Status:** arquivo legado de histórico. A partir de 30/04/2026, o registro oficial único passa a ser feito em `WILLPRO_MASTER_MEMORY.md` (seção "3. LOG DE ATUALIZAÇÕES E ESTADO ATUAL").

**Protocolo:** após trabalho relevante, adicionar entrada **no topo** deste arquivo com **data e hora completas** e resumo objetivo.

---

### 2026-04-30 17:05:00 -03:00 — P1-B fase 5: PaymentsContext + migração de consumidores
- **Pedido:** continuar desmontagem do God Context (usuário: «continue»).
- **Arquivos tocados:** `src/context/PaymentsContext.tsx` (novo), `src/app/layout.tsx`, `src/app/financeiro/page.tsx`, `src/app/alunos/page.tsx`, `src/components/Navigation.tsx`, `src/components/AdminHome.tsx`, `src/components/will/WillCockpit.tsx`, `src/components/KPIDetailModal.tsx`.
- **Resultado:** contexto dedicado a pagamentos + badge `latePayments`; financeiro/alunos/cockpit/navegação/KPI passam a usar `usePayments()` onde aplicável; `AppContext` permanece fonte única de estado. Lint OK; `pnpm run build` exit 0.

### 2026-04-30 16:25:00 -03:00 — Hotfix Vercel: dashboard preso em loading + perfil duplicado + Config visível
- **Observações do usuário:** dashboard só carregando no link da Vercel; dois ícones de perfil no menu do aluno; perfil sem atalho para configurações (rota escondida pelo guard).
- **Causa técnica principal:** cada `TOKEN_REFRESHED` chamava `loadSupabaseCriticalData` com `criticalDataLoading=true`, e o `AuthWrapper` bloqueia o app inteiro enquanto isso — sensação de loading infinito em mobile/produção.
- **Arquivos tocados:** `src/context/AppContext.tsx` (bootstrap + single-flight + retry com `forceBlocking`), `src/components/Navigation.tsx` (mobile sem `/perfil` duplicado + `aluno` pode `/configuracoes`), `src/app/perfil/page.tsx` (card Configurações).
- **Resultado:** sincronizações após o 1º bootstrap não prendem mais o shell; menu inferior sem duplicidade; aluno acessa Configurações pela rota e pelo perfil; build OK (exit 0).

### 2026-04-30 16:09:00 -03:00 — P1-B fase 4 (financeiro + criação de aula desacoplados)
- **Pedido:** continuar a missão de desmontar o God Context sem regressão funcional.
- **Arquivos tocados:** `src/components/CreateLessonModal.tsx`, `src/app/financeiro/page.tsx`.
- **Resultado:** `CreateLessonModal` passou a consumir `students` via `useStudents` e `lessons/addLesson` via `useLessons`; `Financeiro` passou a consumir `user` via `useAuth`, `lessons` via `useLessons` e `students` via `useStudents`, mantendo `useApp` apenas para estados/ações ainda transversais (payments, appConfig, sync e marcação); lint dos arquivos sem erros; build de produção OK (exit 0).

### 2026-04-30 15:37:00 -03:00 — P1-B fase 3 (agenda/alunos migrados para contextos especializados)
- **Pedido:** continuar a missão P1-B reduzindo acoplamento ao `AppContext` sem quebrar fluxo real.
- **Arquivos tocados:** `src/app/agenda/page.tsx`, `src/app/alunos/page.tsx`.
- **Resultado:** `Agenda` passou a consumir `user` via `useAuth()` e `lessons` via `useLessons()`; `Alunos` passou a consumir `user` via `useAuth()` e `students/approveStudent/suspendStudent/updateStudent` via `useStudents()`; `useApp()` ficou apenas para estado/transversal (`feedbacks`, `requestCheckIn`, `categories`, `payments`, `quickMessages`, `criticalData*` etc.); lint dos arquivos sem erro; build de produção OK (exit 0).

### 2026-04-30 05:07:10 -03:00 — Hotfix login: sessão Supabase não bloqueia por feed
- **Problema:** login exibindo “Falha na sessão Supabase” após deploy, com suspeita de incompatibilidade de schema do feed em produção.
- **Arquivos tocados:** `src/lib/supabasePersistence.ts`, `src/context/AppContext.tsx`.
- **Resultado:** `fetchFeedPostsRemote` ganhou fallback para query legacy quando colunas de moderação ainda não existem; bootstrap crítico passou a tratar feed como não-crítico (carrega `students/payments/lessons/notifications` mesmo se feed falhar), evitando bloqueio total da sessão; build OK (exit 0).

### 2026-04-30 04:28:42 -03:00 — Missão P0-C concluída (Feed do Dono + moderação)
- **Pedido:** reintegrar “A Rede” na área do dono/admin com superpoderes de moderação e migration de banco.
- **Arquivos tocados:** `src/app/feed/page.tsx`, `src/context/AppContext.tsx`, `src/context/types.ts`, `src/lib/supabasePersistence.ts`, `src/components/will/WillShell.tsx`, `src/components/will/WillCockpit.tsx`, `supabase/migrations/20260430040000_feed_moderation.sql`.
- **Resultado:** feed reintegrado na navegação/atalhos do dono; camada admin com menu `MoreVertical` (fixar/desfixar, marcar oficial, alertar usuário, soft-delete com modal glass); composer oficial para admin com `Comunicado Oficial`, fixar anúncio e alvo por papel; render premium para post fixado/oficial; persistência Supabase de moderação (`updateFeedPostModerationRemote`, `softDeleteFeedPostRemote`) e extensão de modelo (`pinned`, `isOfficial`, `targetRole`, `deletedAt`); migration adiciona colunas e policy update staff-only no `feed_posts`; build OK (exit 0).

### 2026-04-30 03:31:20 -03:00 — Missão P0-B parcial concluída (Storage de mídia)
- **Pedido:** continuar plano executivo e remover dependência de base64 para mídia crítica.
- **Arquivos tocados:** `supabase/migrations/20260430032000_storage_buckets.sql`, `src/lib/supabasePersistence.ts`, `src/context/AppContext.tsx`, `src/app/financeiro/page.tsx`, `src/app/perfil/page.tsx`, `src/components/ui/UserAvatar.tsx`, `src/context/types.ts`.
- **Resultado:** criados buckets `avatars` (público) e `payment-proofs` (privado) com políticas por `auth.uid()`; implementados `uploadAvatarToStorage` e `uploadPaymentProofToStorage`; fluxo de comprovante no AppContext agora envia arquivo para Storage e persiste URL assinada no campo existente de comprovante; perfil envia avatar para Storage quando sessão Supabase ativa; `UserAvatar` agora aceita apenas URL/http(s)/path (sem `data:image`); lint/build OK (exit 0).

### 2026-04-30 03:10:58 -03:00 — Missão P0-A concluída (persistência de aulas no Supabase)
- **Pedido:** executar P0-A do plano executivo (agenda real sem perda ao refresh).
- **Arquivos tocados:** `src/lib/supabasePersistence.ts`, `src/context/AppContext.tsx`, `supabase/migrations/20260430021000_lessons_rls.sql`.
- **Resultado:** implementadas `createLessonRemote`, `updateLessonRemote`, `deleteLessonRemote`; `addLesson`/`updateLesson`/`deleteLesson` agora usam Supabase quando `usingSupabaseSession=true` com tratamento de erro em `criticalDataError`; migration dedicada de RLS para `lessons` (staff full + aluno leitura apenas das aulas em que está inscrito); build de produção OK (exit 0).

### 2026-04-30 02:03:44 -03:00 — Auditoria executiva «Pente fino» global (6 personas)
- **Pedido:** relatório crítico por visões UX/UI, Performance, Head Coach (produto), Supabase Ninja, PWA Offline e Animações; plano de 3 passos prioritários.
- **Entrega:** diagnóstico consolidado na conversa Cursor (sem alteração de código neste comando).

### 2026-04-30 01:49:54 -03:00 — Validação build + regra Cursor + safe-area no Feed
- **Continuação:** fechar ciclo de QA local e reforçar protocolo Master Memory.
- **Ações:** `pnpm run build` concluído com sucesso (Next 15.5.15); criada `.cursor/rules/willpro-master-memory.mdc` (`alwaysApply`) para lembrar de atualizar `REGISTRO_INTERACOES.md` após trabalho relevante; `src/app/feed/page.tsx` — `padding-top` com `env(safe-area-inset-top)` nos estados loading/erro e no header fixo.

### 2026-04-30 01:46:17 -03:00 — Pasta oficial «Master Memory»
- **Pedido:** centralizar o log em pasta dedicada «WILLPRO - MASTER MEMORY».
- **Ações:** criados `WILLPRO - MASTER MEMORY/README.md` e este `REGISTRO_INTERACOES.md`; em `CURSOR_PROMPT_WILLPRO.md` o log duplicado foi trocado por ponteiro para esta pasta.

### 2026-04-30 01:42:47 -03:00 — Registro formal + robustez de mídia (feed e cadastro)
- **Pedido:** manter registro datado das interações; não esquecer após cada sessão.
- **Ações:** `src/lib/imageCompress.ts` — compressão JPEG antes de data URL; `src/app/feed/page.tsx` — `PostComposer` comprime imagem; stories com `resolveStoryAvatarSrc` (data URL / URL real); `src/app/cadastro/page.tsx` — compressão na foto + safe-area + foco no «Voltar»; `src/components/CreateLessonModal.tsx` — botão fechar com tokens de interação e safe-area inferior.

### Histórico consolidado (sessões anteriores — resumo)
- Feed real Supabase (`feed_posts`, likes, comments); stories sem mock; seed transacional vazio por padrão (`willLocalDataPolicy`, bump `LS_VERSION`); cadastro público (`createPublicLeadRemote` + migration RLS `students_insert_public_signup`); CTAs dono `/cadastro` e `/agenda?newLesson=1`; `CreateLessonModal` com busca e status dos alunos; lapidação de modais/scroll e tokens de UI em páginas críticas.
