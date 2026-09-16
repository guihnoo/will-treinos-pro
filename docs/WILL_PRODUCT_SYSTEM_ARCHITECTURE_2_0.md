# 🏛️ Will Treinos 2.0 — Arquitetura de Sistema e Produto (TO-BE)

**Data:** 2026-09-15
**Sprint:** 1 — Arquitetura e Estruturação do Will Treinos 2.0
**Companion doc:** `docs/WILL_CURRENT_SYSTEM_MAP_2026_09.md` (AS-IS)

> Este documento é a arquitetura-**alvo**. Nada aqui foi implementado nesta sprint — é a bússola para as sprints seguintes. Nenhuma decisão aqui exige migration, mudança de RLS, mudança de auth ou refactor imediato; cada mudança estrutural tem seu próprio sprint dedicado no roadmap (Seção 12).

---

## 1. Visão do produto

Will Treinos PRO é hoje uma plataforma sólida, testada em produção com um piloto real, mas que cresceu por **acréscimo intenso** (dezenas de sprints nomeados individualmente, sem uma arquitetura de domínios definida a priori). O Will Treinos 2.0 não é uma reescrita — é uma **reorganização por domínios claros**, com fronteiras explícitas, para que:

1. Cada nova feature tenha um lugar óbvio para morar.
2. God Components como `WillCockpit.tsx` (3687 linhas) deixem de crescer e comecem a se decompor por domínio.
3. A experiência de cada papel (admin, professor, aluno) seja desenhada deliberadamente, não como reflexo acidental de "o que o Cockpit expõe".
4. Segurança, performance e observabilidade sejam propriedades do sistema, não checklists aplicados depois.
5. O produto tenha uma fronteira clara com o que **não é** ele — o futuro **Will Arena** (Seção 11).

---

## 2. Princípios

### 2.1 Fast before fancy

Regra de produto, não sugestão: **a experiência precisa ser rápida antes de ser bonita**. Toda decisão de UI que aumenta polish à custa de latência percebida (loading, tempo até interativo, tamanho de bundle) precisa justificar o trade-off explicitamente. Isso não contradiz o DNA visual Dark+Gold e a "sensação de app nativo" já estabelecidos em `CLAUDE.md` — reforça que a sensação de nativo vem de **velocidade e resposta**, não só de estética.

### 2.2 1 Hero, até 3 sinais, 1 ação principal

Para as telas principais de cada papel (a tela que a pessoa vê nos primeiros segundos após abrir o app):

- **1 Hero** — uma coisa central que comunica "o que importa agora" (não um dashboard de 10 KPIs simultâneos).
- **Até 3 sinais importantes** — no máximo 3 indicadores secundários visíveis sem scroll/interação.
- **1 ação principal** — um caminho óbvio de "o que fazer a seguir", não uma grade de botões de igual peso.

Isso é uma correção direta ao padrão hoje observado no `WillCockpit.tsx` (mapeado no AS-IS como concentrando dezenas de painéis e ações no mesmo lugar) — não como crítica ao trabalho feito, mas como critério explícito para o que vem a seguir.

### 2.3 Experiência diferente por papel

Admin, professor e aluno não são "o mesmo app com permissões diferentes" — são três experiências com propósitos diferentes (Seção 6). Compartilham design system e infraestrutura, não necessariamente a mesma estrutura de navegação ou densidade de informação.

### 2.4 Segurança e performance como intenção de design

Mantém o princípio já estabelecido em `CLAUDE.md`: RLS + validação server-side são a lei, frontend nunca decide autorização sozinho. O Will 2.0 formaliza isso adicionando **um único helper compartilhado** para criação de clients Supabase server-side (Seção 5.1) em vez do padrão duplicado 44x hoje.

---

## 3. Domínios

A base sugerida na missão (14 domínios) foi validada contra o código real (AS-IS) e **mantida quase integralmente** — o código já reflete boa parte dessa separação em nível de `context`/pasta, mesmo sem ela estar documentada como "domínio" formal. Ajustes feitos:

- **Presença** foi mantido como domínio próprio (QR + check-in + geolocalização), em vez de ser sub-item de Training, porque hoje já tem seu próprio `CheckInContext`, tabelas dedicadas (`lesson_presence`, `lesson_sessions`, `lesson_student_activity`) e um vetor de segurança específico (anti-fraude de QR, já sinalizado como pendência no roadmap de segurança do produto).
- **Matrícula/Convite** foi promovido a domínio explícito dentro de **Auth & Identity** (não estava na lista original) porque o AS-IS mostrou uma lógica de negócio própria e não-trivial (convite, aprovação ativa, "ninguém entra livre") que merece fronteira clara, não ficar implícita dentro de Auth genérico.
- **Financeiro** foi mantido dentro de **Admin/Operação** (não é domínio próprio na lista original) porque hoje é 100% uma responsabilidade do admin (middleware bloqueia professor); se o produto evoluir para dar visibilidade financeira ao professor, promove-se a domínio próprio nesse momento — não antes.

| # | Domínio | Contexts/tabelas hoje | Papéis que usam |
|---|---|---|---|
| 1 | **Auth & Identity** (inclui Matrícula/Convite) | `AuthProvider`, `students`, `staff_access`, `app_settings` | todos |
| 2 | **Admin / Operação** (inclui Financeiro) | `PaymentsContext`, `payments`, `AdminSettingsPanel` | admin |
| 3 | **Coach / Professor** | `CoachingContext`, `coach_messages` | professor |
| 4 | **Athlete / Aluno** | `StudentsContext` | aluno |
| 5 | **Training** (treinos, sessões, exercícios, modo quadra) | `TrainingContext`, `training_*` | professor, aluno |
| 6 | **Performance** (avaliações, evolução, métricas, scouting, fundamentos, posições) | `evaluations`, `evaluation_templates`, `lesson_ratings` | professor, aluno |
| 7 | **Feed & Comunidade** | `FeedContext`, `feed_*` | todos |
| 8 | **Gamificação** (XP, missões, conquistas, streaks, tiers) | `GamificationContext`, `xp_*`, `awards`, `student_achievements` | aluno (consumo), admin (moderação) |
| 9 | **Presença** (QR, check-in) | `CheckInContext`, `lesson_presence`, `lesson_sessions` | aluno, professor |
| 10 | **Notificações** (push, in-app) | `NotificationsContext`, `notifications`, `push_subscriptions` | todos |
| 11 | **Agenda / Eventos** | `LessonsContext`, `lessons` | admin, professor |
| 12 | **Media / Storage** | Supabase Storage buckets | todos (avatares, comprovantes) |
| 13 | **Analytics** | PostHog, `BusinessAnalyticsPanel` | admin |
| 14 | **Platform / Infra** | Supabase, Vercel, CI, PWA, Sentry | (transversal, sem UI própria) |

### Fronteiras entre módulos

- **Presença → Gamificação**: check-in gera XP, mas a regra de quanto XP é responsabilidade da Gamificação, não da Presença — Presença só emite o evento "check-in válido", Gamificação decide o valor.
- **Performance → Gamificação**: mesma lógica — avaliação gera XP, mas o cálculo do multiplicador por fundamento vive em Gamificação, não em Performance.
- **Training → Performance**: um plano de treino pode referenciar métricas de Performance (ex.: meta de evolução), mas Training não escreve diretamente em tabelas de Performance.
- **Admin/Operação nunca decide autorização de Coach/Athlete no frontend** — reforça o princípio de RLS como lei; Admin/Operação só tem visibilidade ampliada por política de banco, não por lógica de UI.
- **Platform/Infra não conhece domínios de produto** — CI, PWA, observabilidade são cross-cutting concerns; nenhum domínio de produto deveria importar diretamente de `worker/` ou de configuração de deploy.

---

## 4. Arquitetura-alvo (visão técnica)

```
src/
  app/
    (admin)/          ← rotas restritas a admin (hoje: /will/**, /financeiro)
    (coach)/          ← rotas restritas a professor (hoje: /agenda, /will/court)
    (student)/        ← rotas restritas a aluno (já existe como grupo de rotas hoje)
    (public)/         ← landing, auth, legal (público)
    api/
      <domínio>/      ← agrupado por domínio, não por "quem chamou primeiro"
  domains/            ← NOVO: um diretório por domínio (Seção 3), cada um com:
    <dominio>/
      context/        ← o Provider hoje em src/context/
      hooks/          ← os hooks hoje espalhados em src/hooks/
      components/     ← os componentes hoje espalhados em src/components/**
      lib/            ← utilitários hoje em src/lib/
  components/
    ui/               ← MANTÉM — átomos de design system, verdadeiramente transversais
  lib/
    supabase/
      server.ts       ← NOVO — helper único de criação de client server-side
      client.ts       ← hoje src/lib/supabaseClient.ts, mantido
```

**Isto é a direção, não um refactor de uma sprint só.** A estratégia de chegar lá está na Seção 8 (Estratégia de Refatoração) — é incremental, por domínio, nunca um "big bang".

### 4.1 Por que agrupar por domínio em vez de por tipo técnico

O AS-IS mostra hoje uma organização por **tipo técnico** (`components/`, `hooks/`, `lib/`, `context/` como pastas de topo, cada uma com dezenas de arquivos de domínios diferentes misturados). Isso funciona até um certo tamanho — o Will já passou desse tamanho: `WillCockpit.tsx` sozinho tem mais linhas que muitos módulos inteiros deveriam ter. Agrupar por domínio significa que abrir a pasta `domains/gamificacao/` mostra tudo sobre XP num lugar só, em vez de espalhado em 4 pastas de topo diferentes.

---

## 5. Responsabilidades e padrões técnicos

### 5.1 Supabase — um helper server-side, não 44

Hoje cada rota de API recria o padrão "client anon para validar JWT + client service role para consultar". O alvo é um único `src/lib/supabase/server.ts` exportando algo como `getAuthenticatedUser(req)` e `getServiceRoleClient()`, com a checagem de staff centralizada (o mesmo critério de `wt_is_staff()`, já formalizado no Sprint 0A). Isso não é uma mudança de segurança — é consolidar um padrão que já está correto em vários lugares, para que a próxima correção de segurança precise tocar 1 arquivo, não até 44.

### 5.2 Contexts — um por domínio, sem sobreposição

`TrainingProvider` e `GamificationProvider` já existem e já seguem esse padrão (mesmo sem estarem documentados em `CLAUDE.md` — corrigir isso é uma tarefa de documentação simples, não arquitetural). O alvo é garantir que todo novo domínio some no máximo 1 provider, evitando a fragmentação que já existe em XP (4 arquivos lib com nomes sobrepostos).

### 5.3 God Components — decomposição por domínio, não por tamanho

`WillCockpit.tsx` não deve ser quebrado "porque é grande" — deve ser quebrado **porque hoje mistura domínios diferentes num arquivo só** (Financeiro, Turma, Feed, Configurações, Analytics todos ali). O critério de corte é: cada painel que hoje vive dentro do Cockpit migra para dentro do domínio a que pertence (`domains/financeiro/components/`, `domains/analytics/components/`, etc.), e o Cockpit passa a ser um orquestrador fino que os compõe — não o dono da lógica de nenhum deles.

---

## 6. Experiência por papel

### Admin — "comando e visão"

Função principal: dar ao dono do negócio uma leitura rápida de saúde geral (financeiro, turma, alertas operacionais) e acesso rápido a decisões que só ele toma (aprovação de aluno, configuração de categorias/preços, moderação de XP). Hoje concentrado no `WillCockpit`; no 2.0, a mesma função existe, mas cada painel pertence ao seu domínio e o Cockpit os compõe sob o princípio Fast Before Fancy — 1 Hero (o que precisa de atenção agora), até 3 sinais (financeiro, turma, alertas), 1 ação principal por contexto.

### Professor/Coach — "execução na quadra"

Função principal: dar ao professor uma ferramenta rápida de uso **durante** a aula (Modo Quadra, avaliação em poucos toques) e uma visão pós-aula (o que avaliar, quem faltou, quem precisa de atenção). A prancheta de avaliação já segue esse espírito (5 sliders + feedback opcional escondido) — o 2.0 estende esse padrão para o resto da experiência do coach, priorizando velocidade de toque sobre densidade de dados.

> ⚠️ **Mudança de RBAC/rota necessária (não é comportamento atual):** o AS-IS (`WILL_CURRENT_SYSTEM_MAP_2026_09.md`, Seção 3) confirma que hoje `/will/court` e `/will/court/[lessonId]/live` — as telas que fisicamente implementam "Modo Quadra" — são acessíveis **somente a admin/owner** (`PREFIX_ROLE_GUARD["/will"] = ["will_owner"]` em `src/domain/v1/rbac.ts`; professor está mapeado só ao prefixo `/prof`). A visão de produto "Professor = execução na quadra" descrita aqui é **alvo do Will 2.0**, e exige que a Sprint 7 (Coach 2.0 + Modo Quadra, Seção 12) inclua explicitamente uma mudança de RBAC/rota (ex.: mover Modo Quadra para dentro de `/prof/*`, ou ampliar `PREFIX_ROLE_GUARD["/will"]` para incluir `professor` nas sub-rotas de quadra) — **nenhuma mudança de RBAC foi feita neste PR**, isso é trabalho futuro de uma sprint dedicada.

### Atleta/Aluno — "progresso e pertencimento"

Função principal: fazer o aluno **voltar todo dia** por progresso visível (XP, cards, streaks) e pertencimento social (feed, ranking de turma). A regra "zero facilidade" na gamificação (cards não destravam fácil) é uma escolha de produto deliberada — o 2.0 não a relaxa, apenas garante que a experiência em torno dela (onde estou, quanto falta, o que fiz essa semana) seja clara sem precisar abrir múltiplos modais para entender.

---

## 7. Navegação-alvo

Mantém o padrão **Modal-First** já estabelecido (não é uma mudança) — `router.push()` só para navegação de seção, fluxos de trabalho abrem sobre a tela atual. A mudança-alvo é de **quais seções existem por papel**, não do padrão de navegação em si:

- **Admin:** Hoje/Alertas · Turma · Financeiro · Feed · Configurações (já reorganizado em Cockpit por auditoria de UX de junho/2026 segundo o histórico do produto — o 2.0 formaliza essa divisão como fronteira de domínio, não só de aba visual).
- **Professor:** Quadra (Modo Quadra + avaliação) · Agenda · Turma · Feed. **Depende de mudança de RBAC/rota ainda não feita** — ver aviso na Seção 6.
- **Aluno:** Hoje (treino do dia, XP) · Treinos · Feed · Ranking · Perfil.

Nenhuma navegação nova precisa ser implementada nesta sprint — isso é input para a Sprint 5 (UX / Navegação / Information Architecture) do roadmap.

---

## 8. Estratégia de refatoração

**Regra geral: incremental, por domínio, nunca "big bang".** Mas "incremental por domínio" ainda deixa uma pergunta em aberto: **na ordem de qual coisa?** Este documento separa deliberadamente duas ordens diferentes, que **não precisam coincidir**:

### 8.1 Roadmap de produto (por papel) — Seção 12, Sprints 6–9

Ordem definida por **prioridade de negócio**: qual experiência de papel (Admin, Coach, Athlete, Feed) recebe atenção de UX/produto primeiro. Essa ordem já reflete decisões de produto tomadas antes desta sprint (ex.: Admin como Sprint 6 por ser a experiência mais usada no dia a dia operacional) e **não é alterada por este documento** — mexer nessa ordem só por conveniência técnica de pastas seria subordinar prioridade de negócio a conveniência de refactor, o que é o oposto do que faz sentido.

### 8.2 Roadmap técnico de extração (por menor risco) — esta seção

Ordem separada, definida por **menor risco de regressão ao mover código para `domains/<nome>/`**:
1. **Gamificação** — já é um domínio bem isolado (context próprio, tabelas próprias), bom primeiro caso de teste do padrão `domains/`.
2. **Presença/QR** — igualmente isolado, e tem um item de segurança pendente (QR falsificável) que se beneficia de estar num lugar único.
3. **Training** — médio acoplamento com Performance.
4. **Financeiro/Admin** e **WillCockpit** por último — maior risco, exige que os domínios que hoje vivem *dentro* do Cockpit (Financeiro, Analytics, etc.) já tenham sido extraídos individualmente antes de o Cockpit em si deixar de ser o dono da lógica deles.

### 8.3 Como as duas ordens se relacionam (a dependência explícita que faltava)

**A Sprint 6 (Admin 2.0, roadmap de produto) NÃO é o primeiro piloto de extração técnica de domínio** — isso seria inconsistente com a Seção 8.2, que coloca Financeiro/Admin/WillCockpit por último por serem o maior risco técnico. O que a Sprint 6 de fato entrega é **trabalho de produto/UX na experiência do Admin** (aplicar Fast Before Fancy, 1 Hero + 3 sinais, ao que o Cockpit já mostra hoje) — sem depender de o `WillCockpit.tsx` já estar fisicamente decomposto em `domains/`. A extração técnica de Admin/WillCockpit (Seção 8.2, item 4) só acontece depois que Gamificação, Presença/QR e Training (Sprints 8, 7 e parte da 7, respectivamente, no roadmap de produto) já tiverem servido de prova de conceito do padrão `domains/` em código de menor risco. Ou seja: **o roadmap de produto decide a ordem de valor entregue ao usuário; o roadmap técnico decide a ordem de extração de pastas — a segunda tende a terminar depois da primeira para os domínios de Admin/Financeiro, e isso é esperado, não uma inconsistência.**

Cada extração técnica deve manter os testes E2E existentes passando (Playwright) antes de ser considerada concluída, independentemente de qual sprint de produto estiver em andamento no momento.

---

## 9. Performance

Sem executar nenhuma mudança agora — a intenção documentada aqui vira a Sprint 3 (Performance e Capacity Audit):

- Auditar bundle size real por rota (o AS-IS não mediu isso — só contou linhas de componente, não peso de bundle).
- Confirmar se as otimizações de N+1 já feitas (mencionadas no histórico do produto — redução de 100→3 e 12→3 queries) continuam válidas com o schema atual.
- Medir Core Web Vitals reais em `/dashboard` (rota que carrega `WillCockpit`) — candidato mais provável a regressão de performance dado o tamanho do componente.
- Confirmar uso de Server Components onde já é possível, sem forçar onde não faz sentido (o princípio de `CLAUDE.md` — "Server Components quando faz sentido" — se mantém).

### PWA

Sprint 4 dedicada. Sem migrar para Serwist nesta sprint (decisão explícita da missão), mas o roadmap já reconhece essa migração como o único caminho real para zerar as 15 vulnerabilidades "high" da árvore `@ducanh2912/next-pwa` (documentado no AS-IS e em `security/dependency-audit-allowlist.json`). Além disso, Sprint 4 é onde a **rotação do par de chaves VAPID** (ainda pendente — diferente da migração de chaves Supabase, já concluída, ver Seção 10) deve ser efetivamente executada, junto do fluxo de re-subscribe de push já documentado em `docs/WILL_SECRET_ROTATION_RUNBOOK.md` (ainda não implementado no client). Também deve cobrir: preencher `screenshots` no `manifest.json` e confirmar estratégia de cache do worker customizado.

---

## 10. Segurança, Observabilidade, Testes, CI/CD

### Segurança

Mantém os princípios já em `CLAUDE.md` (RLS + servidor como lei, chaves nunca no browser, uploads validados, sessões com TTL). O Will 2.0 adiciona como propriedade arquitetural: **um único ponto de verdade para "isso é staff?"** (Seção 5.1), reduzindo o risco de rotas futuras divergirem no padrão hoje duplicado 44x (o caso investigado de `leaderboard` sem auth se confirmou intencional e documentado no código, não um esquecimento — ver AS-IS Seção 16, item 1 — mas o princípio de centralizar continua válido para reduzir esse tipo de dúvida no futuro).

**Estado da rotação de chaves (validado operacionalmente em 2026-09-15):** a migração das chaves Supabase para o formato moderno (Publishable Key + Secret Key) está **concluída** — Preview e Production, client-side e server-side, mais o secret do GitHub Actions, todos migrados; as legacy `anon`/`service_role` já foram desativadas no painel do Supabase sem indisponibilidade. **A rotação do par de chaves VAPID continua pendente** e fica sob a Sprint 4 (Seção 12), por ser uma mudança que afeta diretamente `push_subscriptions` existentes — não faz sentido tratá-la junto da segurança funcional genérica da Sprint 2. Pendências específicas de segurança funcional (QR falsificável, revisão staff/RLS tabela-a-tabela, privacidade/termos) continuam sendo o conteúdo da Sprint 2.

### Observabilidade

Sentry e PostHog já estão integrados (AS-IS). O alvo é usá-los de forma mais deliberada por domínio — cada domínio deveria poder responder "está saudável?" sem precisar abrir o código (dashboards ou alertas por domínio, não um `AppHealthPanel` genérico só para admin). Isso é conteúdo de Sprint 12.

### Testes

Playwright já cobre um smoke público sem credenciais (`e2e/student-journey.spec.ts`, `e2e/auth.spec.ts`) e uma suíte de integração server-side separada (`e2e/server-integration.spec.ts`, decisão do Sprint 0D-B.1). O alvo de longo prazo (Fase 1B do `docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md`) é ambiente de staging dedicado + contas de teste para rodar testes autenticados por domínio no CI.

### CI/CD

O plano já documentado em `docs/WILL_RELEASE_PIPELINE_PLAN_2026_09.md` (Fases 1A/1B/1C) permanece válido e não é reescrito aqui — este documento só referencia: **Fase 1A já implementada** (TypeScript, Build, E2E Smoke, Gitleaks por range, Dependency Audit baseline-aware, RLS Audit experimental); **Fase 1B pendente** (staging, testes autenticados required, RLS real, CodeQL); **Fase 1C futura** (nightly full Playwright, checklist manual iOS PWA).

---

## 11. Escala

Sem mudanças de infraestrutura previstas nesta sprint. Pontos a observar quando o produto crescer além de um piloto:

- Limite de 1 cron nativo do plano Vercel Hobby já forçou um workaround via GitHub Actions (AS-IS, Seção 14) — upgrade de plano Vercel deve ser avaliado antes de adicionar mais orquestradores agendados.
- `WillCockpit.tsx` como está hoje não escalaria bem para múltiplos admins simultâneos numa mesma conta (não confirmado se esse é um cenário de produto real ou hipotético) — decomposição por domínio (Seção 5.3) também ajuda aqui, ao reduzir o que cada sessão de admin precisa carregar de uma vez.

---

## 12. Roadmap por sprint

Cada sprint tem um dono único de execução (uma IA por vez, conforme regra operacional já em vigor no projeto) e produz um PR próprio, sem mesclar em `main` sem revisão humana.

> **Nota de leitura — Sprints 6–9:** esta tabela é o **roadmap de produto** (ordem de valor entregue por papel). A **ordem técnica de extração de código para `domains/`** é uma sequência separada, definida por menor risco (Seção 8.2: Gamificação → Presença/QR → Training → Financeiro/Admin/WillCockpit por último). As duas ordens não coincidem por design — ver Seção 8.3 para a explicação completa de como elas se relacionam.

| Sprint | Nome | Status | Conteúdo |
|---|---|---|---|
| **0** | Fundação / Segurança | ✅ **Concluído** | Sprints 0A–0D-C: JWT real em `lesson_ratings`, Permissions-Policy da câmera, dependências vulneráveis do `pnpm audit` (2 críticas → 0), gate de CI real para Dependency Audit + Gitleaks por range, remoção de credenciais versionadas (`check_second_admin.js`, `VERCEL_ENV_CHECKLIST.md`), runbook de rotação de chaves e **migração das chaves Supabase para Publishable/Secret Key moderna concluída** (legacy `anon`/`service_role` desativadas, produção validada) (PRs #2, #12, #13, #14, #15) |
| **1** | Arquitetura e Mapa do Sistema | ✅ **Este documento** | AS-IS (`WILL_CURRENT_SYSTEM_MAP_2026_09.md`) + TO-BE (este arquivo) |
| **2** | Segurança Funcional | ⏳ Pendente | QR falsificável (anti-fraude de check-in), revisão staff/RLS tabela-a-tabela, revisão de privacidade/termos, revisão de exposição de nome completo em `GET /api/leaderboard` (AS-IS Seção 16, item 1). Se houver uma etapa preparatória para a rotação VAPID nesta sprint, ela é só auditoria/plano — a execução da rotação em si fica na Sprint 4 |
| **3** | Performance e Capacity Audit | ⏳ Pendente | Bundle size real por rota, Core Web Vitals de `/dashboard`, revisão de N+1 já corrigidos, plano de capacity para crescimento de alunos/turmas |
| **4** | PWA / Service Worker / Push | ⏳ Pendente | **Execução da rotação do par de chaves VAPID** (gerar novo par, atualizar Vercel, desativar o antigo) + estratégia de re-subscribe de `push_subscriptions` existentes (Android e iOS PWA instalado), plano de migração para Serwist (não executar ainda), `screenshots` do manifest |
| **5** | UX / Navegação / Information Architecture | ⏳ Pendente | Navegação-alvo por papel (Seção 7) aplicada de fato, auditoria de telas contra o princípio "1 Hero + 3 sinais + 1 ação" |
| **6** | Admin 2.0 | ⏳ Pendente | Revisão de **produto/UX** do Cockpit sob Fast Before Fancy (1 Hero + 3 sinais + 1 ação) — sem depender da extração técnica de `WillCockpit.tsx`, que continua sendo o item de **maior risco** e **último** na ordem técnica da Seção 8.2 |
| **7** | Coach 2.0 + Modo Quadra | ⏳ Pendente | Revisão de produto/UX da experiência do professor + **mudança de RBAC/rota necessária** para liberar Modo Quadra (ver aviso na Seção 6). Candidata natural para a extração técnica de **Presença/QR** (2º item da ordem técnica, Seção 8.2), já que a sprint mexe diretamente nessa área |
| **8** | Athlete 2.0 | ⏳ Pendente | Revisão de produto/UX da experiência do aluno. Candidata natural para a extração técnica de **Gamificação** (1º item, menor risco) e possivelmente **Training** (3º item), Seção 8.2 |
| **9** | Feed 2.0 | ⏳ Pendente | Revisão de produto/UX + moderação do Feed & Comunidade |
| **10** | Performance System | ⏳ Pendente | Consolidação do domínio Performance (avaliações, scouting, fundamentos, posições) |
| **11** | Gamificação | ⏳ Pendente | Consolidação dos 4 arquivos lib de XP fragmentados (`xpAntiCheat`, `xpEventLogger`, `xpIntegration`, `xpLogger`) num módulo único do domínio |
| **12** | Escala / Observabilidade / Hardening | ⏳ Pendente | Dashboards de saúde por domínio, revisão de plano Vercel/cron, hardening final antes de abrir para mais clientes |

---

## 13. Will Arena — fronteira futura (NÃO implementar agora)

**Will Treinos / Will Performance** é o produto descrito neste documento: gestão de treino, avaliação, gamificação e operação de uma escola/clube de vôlei.

**Will Arena** é uma direção de produto **futura e separada**, mencionada no roadmap de longo prazo do projeto (Sprint 9.0 "Agentic AI" em `CLAUDE.md`: Oráculo do Admin, Copiloto do Coach, Gêmeo Digital do Atleta) como o espaço onde competição entre escolas/turmas, torneios, ou uma camada de jogo mais ampla poderia viver.

**Regra desta sprint e das seguintes até decisão explícita em contrário:** Will Arena **não tem código, não tem tabela, não tem rota**. A única razão de mencioná-lo aqui é registrar a fronteira — para que features de gamificação social (ranking de turma, streaks, referral) continuem sendo construídas dentro do domínio **Gamificação** do Will Treinos, e não comecem a acumular, sem intenção, responsabilidades que deveriam pertencer a um produto de competição mais amplo (matchmaking entre escolas, torneios inter-clubes, etc.). Quando (e se) o Will Arena for priorizado, ele deve nascer como um domínio novo e explicitamente separado, consumindo dados do Will Treinos via uma fronteira de API clara — não como uma extensão silenciosa do domínio Gamificação atual.

---

## 14. Como usar estes dois documentos

- `WILL_CURRENT_SYSTEM_MAP_2026_09.md` responde "o que existe hoje, e onde".
- Este documento responde "para onde vamos, e por quê".
- Toda sprint futura do roadmap (Seção 12) deve, ao começar, reler a seção correspondente aqui e confirmar no código se as premissas ainda são válidas antes de agir — arquitetura documentada é um mapa, não um contrato imutável; se o código mudar antes da sprint chegar lá, o mapa deve ser atualizado, não ignorado.
