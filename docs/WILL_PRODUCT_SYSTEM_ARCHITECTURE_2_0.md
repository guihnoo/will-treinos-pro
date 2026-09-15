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

### Atleta/Aluno — "progresso e pertencimento"

Função principal: fazer o aluno **voltar todo dia** por progresso visível (XP, cards, streaks) e pertencimento social (feed, ranking de turma). A regra "zero facilidade" na gamificação (cards não destravam fácil) é uma escolha de produto deliberada — o 2.0 não a relaxa, apenas garante que a experiência em torno dela (onde estou, quanto falta, o que fiz essa semana) seja clara sem precisar abrir múltiplos modais para entender.

---

## 7. Navegação-alvo

Mantém o padrão **Modal-First** já estabelecido (não é uma mudança) — `router.push()` só para navegação de seção, fluxos de trabalho abrem sobre a tela atual. A mudança-alvo é de **quais seções existem por papel**, não do padrão de navegação em si:

- **Admin:** Hoje/Alertas · Turma · Financeiro · Feed · Configurações (já reorganizado em Cockpit por auditoria de UX de junho/2026 segundo o histórico do produto — o 2.0 formaliza essa divisão como fronteira de domínio, não só de aba visual).
- **Professor:** Quadra (Modo Quadra + avaliação) · Agenda · Turma · Feed.
- **Aluno:** Hoje (treino do dia, XP) · Treinos · Feed · Ranking · Perfil.

Nenhuma navegação nova precisa ser implementada nesta sprint — isso é input para a Sprint 5 (UX / Navegação / Information Architecture) do roadmap.

---

## 8. Estratégia de refatoração

**Regra geral: incremental, por domínio, nunca "big bang".** Cada sprint do roadmap (Seção 12) que envolve refactor (6, 7, 8, 9) escolhe **um domínio por vez**, extrai seus arquivos de `components/`/`hooks/`/`lib/`/`context/` para `domains/<nome>/`, e só então remove o código antigo do lugar original — nunca as duas coisas em paralelo por muito tempo.

Ordem sugerida de extração (do menor risco para o maior):
1. **Gamificação** — já é um domínio bem isolado (context próprio, tabelas próprias), bom primeiro caso de teste do padrão `domains/`.
2. **Presença/QR** — igualmente isolado, e tem um item de segurança pendente (QR falsificável) que se beneficia de estar num lugar único.
3. **Training** — médio acoplamento com Performance.
4. **Financeiro/Admin** e **WillCockpit** por último — maior risco, exige o Cockpit já estar decomposto por domínio antes de tentar movê-lo.

Cada extração deve manter os testes E2E existentes passando (Playwright) antes de ser considerada concluída.

---

## 9. Performance

Sem executar nenhuma mudança agora — a intenção documentada aqui vira a Sprint 3 (Performance e Capacity Audit):

- Auditar bundle size real por rota (o AS-IS não mediu isso — só contou linhas de componente, não peso de bundle).
- Confirmar se as otimizações de N+1 já feitas (mencionadas no histórico do produto — redução de 100→3 e 12→3 queries) continuam válidas com o schema atual.
- Medir Core Web Vitals reais em `/dashboard` (rota que carrega `WillCockpit`) — candidato mais provável a regressão de performance dado o tamanho do componente.
- Confirmar uso de Server Components onde já é possível, sem forçar onde não faz sentido (o princípio de `CLAUDE.md` — "Server Components quando faz sentido" — se mantém).

### PWA

Sprint 4 dedicada. Sem migrar para Serwist nesta sprint (decisão explícita da missão), mas o roadmap já reconhece essa migração como o único caminho real para zerar as 15 vulnerabilidades "high" da árvore `@ducanh2912/next-pwa` (documentado no AS-IS e em `security/dependency-audit-allowlist.json`). Além disso, Sprint 4 deve cobrir: preencher `screenshots` no `manifest.json`, confirmar estratégia de cache do worker customizado, e formalizar o fluxo de re-subscribe de push após rotação de VAPID (já documentado em `docs/WILL_SECRET_ROTATION_RUNBOOK.md`, ainda não implementado no client).

---

## 10. Segurança, Observabilidade, Testes, CI/CD

### Segurança

Mantém os princípios já em `CLAUDE.md` (RLS + servidor como lei, chaves nunca no browser, uploads validados, sessões com TTL). O Will 2.0 adiciona como propriedade arquitetural: **um único ponto de verdade para "isso é staff?"** (Seção 5.1), eliminando o risco de duas rotas divergirem (como quase aconteceu com `leaderboard` sem auth, mapeado no AS-IS). Pendências específicas de segurança funcional (QR falsificável, rotação de chaves Supabase/VAPID ainda não executada) são o conteúdo da Sprint 2.

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

| Sprint | Nome | Status | Conteúdo |
|---|---|---|---|
| **0** | Fundação / Segurança | ✅ **Concluído** | Sprints 0A–0D-C: JWT real em `lesson_ratings`, Permissions-Policy da câmera, dependências vulneráveis do `pnpm audit` (2 críticas → 0), gate de CI real para Dependency Audit + Gitleaks por range, remoção de credenciais versionadas (`check_second_admin.js`, `VERCEL_ENV_CHECKLIST.md`), runbook de rotação de chaves (PRs #2, #12, #13, #14, #15) |
| **1** | Arquitetura e Mapa do Sistema | ✅ **Este documento** | AS-IS (`WILL_CURRENT_SYSTEM_MAP_2026_09.md`) + TO-BE (este arquivo) |
| **2** | Segurança Funcional | ⏳ Pendente | QR falsificável (anti-fraude de check-in), execução da rotação Supabase/VAPID já documentada no runbook, revisão staff/RLS tabela-a-tabela, revisão de privacidade/termos |
| **3** | Performance e Capacity Audit | ⏳ Pendente | Bundle size real por rota, Core Web Vitals de `/dashboard`, revisão de N+1 já corrigidos, plano de capacity para crescimento de alunos/turmas |
| **4** | PWA / Service Worker / Push | ⏳ Pendente | Plano de migração para Serwist (não executar ainda), `screenshots` do manifest, estratégia de re-subscribe de push pós-rotação VAPID |
| **5** | UX / Navegação / Information Architecture | ⏳ Pendente | Navegação-alvo por papel (Seção 7) aplicada de fato, auditoria de telas contra o princípio "1 Hero + 3 sinais + 1 ação" |
| **6** | Admin 2.0 | ⏳ Pendente | Início da decomposição do `WillCockpit.tsx` por domínio (Financeiro, Analytics primeiro — menor acoplamento) |
| **7** | Coach 2.0 + Modo Quadra | ⏳ Pendente | Extração do domínio Presença/Training para `domains/`, revisão da experiência "execução na quadra" |
| **8** | Athlete 2.0 | ⏳ Pendente | Extração do domínio Gamificação para `domains/`, revisão da experiência "progresso e pertencimento" |
| **9** | Feed 2.0 | ⏳ Pendente | Extração do domínio Feed & Comunidade, revisão de moderação |
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
