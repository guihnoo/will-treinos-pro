# 🔐 Runbook de Rotação de Segredos — Will Treinos PRO

**Sprint:** 0D-C — Sanitização de segredos + plano de rotação
**Status:** Plano documentado. **Nenhuma rotação foi executada nesta sprint.**
**Idioma:** Português do Brasil (todo o conteúdo do produto e da documentação segue esse padrão).

> ⚠️ Este documento **não contém e nunca deve conter** valores reais de
> segredo. Toda referência a chaves usa apenas nome da variável, tipo,
> tamanho aproximado ou origem — nunca o valor em si.

---

## 0. Por que este runbook existe

Durante o Sprint 0D-C, dois artefatos com segredos versionados foram
encontrados na HEAD do repositório:

| Arquivo | O que continha | Ação tomada nesta sprint |
|---|---|---|
| `check_second_admin.js` | `SUPABASE_SERVICE_ROLE_KEY` hardcoded (JWT role `service_role`) + URL do projeto Supabase | **Removido** do repositório (script de debug legado, sem uso no produto) |
| `VERCEL_ENV_CHECKLIST.md` | Trechos de `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e exemplos de chaves VAPID | **Sanitizado** — valores substituídos por placeholders |

Sanitizar a HEAD **não invalida** os valores que já circularam. Até que a
rotação abaixo seja executada, os seguintes segredos devem ser tratados como
**comprometidos**:

- **`SUPABASE_SERVICE_ROLE_KEY`** — comprometida. Dá acesso total ao banco,
  ignorando RLS.
- **`VAPID_PRIVATE_KEY`** — comprometida. Permite forjar remetente de Web
  Push para as subscriptions existentes.

Não são segredos (públicos por definição, não precisam de rotação por causa
deste incidente):

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — pública por definição. É enviada ao
  browser em todo carregamento de página; a segurança dos dados depende do
  RLS do Postgres, não do sigilo dessa chave.
- **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** — pública por definição. É o
  `applicationServerKey` usado pelo browser em
  `PushManager.subscribe()` — ver `src/lib/pushClient.ts`.

---

## 1. Rotação de `SUPABASE_SERVICE_ROLE_KEY`

### 1.1 Onde rotacionar no Supabase

1. Painel do Supabase → projeto → **Settings → API**.
2. Seção **Project API keys** → `service_role` → **Reset/Regenerate**
   (o nome exato do botão varia por versão do painel; procure por
   "regenerate"/"reset" ao lado da chave `service_role`).
3. O Supabase invalida a chave antiga imediatamente e emite uma nova.

### 1.2 Impacto esperado

- **Imediato, no instante da regeneração:** toda chamada server-side que
  ainda usa a chave antiga passa a falhar com erro de autenticação
  (401/403 do lado do Supabase) até o deploy com a chave nova ser concluído.
- A chave antiga (comprometida) para de funcionar — esse é o objetivo.
- Nenhuma tabela, RLS ou dado é alterado pela rotação em si.

### 1.3 Quais ambientes Vercel precisam da nova chave

`SUPABASE_SERVICE_ROLE_KEY` está configurada como variável de ambiente do
projeto Vercel (não é `NEXT_PUBLIC_`, então nunca chega ao browser). Deve ser
atualizada em **todos** os ambientes que a usam:

| Ambiente Vercel | Precisa da nova chave? | Observação |
|---|---|---|
| **Production** | ✅ Sim | Prioridade máxima — é o que serve `will-treinos-pro.vercel.app` |
| **Preview** | ✅ Sim | PRs abertos (como o desta sprint) rodam build/E2E contra Preview; sem a chave nova, o job "Build"/E2E de PRs que dependem dela volta a falhar |
| **Development** (`vercel dev` / local via `vercel env pull`) | ⚠️ Se usado | Só necessário se alguém usa `vercel env pull` para popular `.env.local` local. Ambientes locais que mantêm `.env.local` manual também precisam ser atualizados manualmente por quem os mantém |

Depois de salvar a nova chave em cada ambiente, é necessário um **novo
deploy** (redeploy ou novo commit/push) — a Vercel não aplica mudanças de
env var em deploys já existentes.

### 1.4 Como validar após a troca

Validar nesta ordem, sempre em **Preview** primeiro, depois **Production**:

1. **Login** — fazer login (e-mail/senha ou Google) e confirmar que chega
   no dashboard correto (admin/professor/aluno) sem erro 500.
2. **APIs server-side genéricas** — abrir `/api/health` e confirmar `200`.
3. **Leaderboard** — `GET /api/leaderboard?period=week` deve responder
   `< 500` (ver `e2e/server-integration.spec.ts`, que documenta esse
   contrato; essa suíte pode ser rodada manualmente contra Preview/staging
   com a chave nova já configurada).
4. **Matrícula** — completar um fluxo de `/cadastro` ou `/signup` de teste
   (conta descartável) e confirmar que o registro é criado sem erro.
5. **Avaliações** — como staff, abrir a tela de avaliações
   (`/will/evaluations` ou equivalente) e confirmar que lista/salva sem
   erro; testar também `GET` de `/api/student/submit-rating` (rota corrigida
   no Sprint 0A) com um usuário staff real.
6. **Push** — disparar uma notificação de teste
   (`/api/push/test`, se disponível, ou um fluxo real de aviso) e confirmar
   entrega.
7. Checar **Vercel → Deployments → Logs** do deploy novo por qualquer
   `Error: Missing` ou erro de autenticação do Supabase.

### 1.5 Rollback sem reusar a chave comprometida

Se algo quebrar após a rotação:

- **Nunca** reverter para a chave antiga (comprometida) para "resolver
  rápido" — ela deve permanecer revogada.
- Se o Supabase permitir manter a chave anterior ainda ativa por uma janela
  antes de expirar de vez, use essa janela apenas para finalizar o rollout
  da chave nova em todos os ambientes — não para voltar a depender dela.
- Se o problema for na aplicação (não na chave em si), reverter o **deploy**
  (voltar para o commit/deploy anterior na Vercel) mantendo a chave nova já
  configurada nas env vars — a chave nova é compatível com qualquer versão
  do código que espere `SUPABASE_SERVICE_ROLE_KEY`, pois o nome da variável
  não muda.
- Se o Supabase não oferecer uma chave "anterior" temporária (regeneração
  costuma ser imediata e definitiva), o rollback correto é: gerar **outra**
  chave nova (nunca a antiga) e repetir a validação.

---

## 2. Rotação de VAPID (Web Push)

### 2.1 Gerar novo par de chaves

```bash
npx web-push generate-vapid-keys
```

Isso imprime um par `Public Key` / `Private Key` novo no terminal —
**nunca colar esse par em documentação, commit ou log persistente.**

### 2.2 Regras de onde cada chave pode ir

- **`VAPID_PRIVATE_KEY`** — nunca vai para o Git, nunca vai para o client
  (browser). Fica só em variável de ambiente server-side (Vercel).
- **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** — pode e deve ir para o client; é uma
  variável `NEXT_PUBLIC_`, embutida no bundle no momento do build.

### 2.3 Atualizar na Vercel

Mesma lógica da Seção 1.3: atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e
`VAPID_PRIVATE_KEY` em **Production** e **Preview** (e `.env.local`
manualmente para quem desenvolve localmente), seguido de novo deploy.

Como `NEXT_PUBLIC_VAPID_PUBLIC_KEY` é embutida no bundle **no momento do
build**, o redeploy é obrigatório — só trocar a env var na Vercel sem
rebuildar não muda o valor que o browser recebe.

### 2.4 Impacto sobre subscriptions existentes

Uma `PushSubscription` do browser é criptograficamente amarrada ao par de
chaves VAPID usado no momento do `pushManager.subscribe()` (ver
`src/lib/pushClient.ts`). Depois da rotação:

- Toda subscription salva em `push_subscriptions` (tabela do Supabase,
  migration `20260502120000_push_subscriptions.sql`) que foi criada com o
  par **antigo** passa a ser inválida para o par **novo**.
- Tentativas de `webpush.sendNotification()` contra essas subscriptions
  antigas vão falhar (tipicamente `410 Gone` ou erro de chave inválida do
  próprio `web-push`), não vão "vazar" nem funcionar parcialmente.
- Isso afeta todas as rotas que enviam push:
  `api/push/send`, `api/push/test`, `api/coach/send-confirmation`,
  `api/coach/weekly-highlight`, `api/messages/broadcast`,
  `api/messages/coach`, `api/student/*` (referral, report-absence,
  request-reposition, submit-rating) e os `api/cron/*-reminder`.

### 2.5 Estratégia de re-subscribe / re-registro

`subscribeToPush()` já implementa o padrão correto — desinscreve a
subscription existente e cria uma nova com a chave pública atual — mas só
roda quando **chamado de novo** pelo usuário. Rotacionar VAPID não dispara
isso sozinho. Recomendação:

1. Após o deploy com as novas chaves, considerar um mecanismo simples de
   "versão de VAPID" (ex.: guardar no client, junto da subscription salva,
   um identificador da chave pública usada, e comparar com
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` atual no carregamento do app) para
   disparar `subscribeToPush()` automaticamente quando divergir. **Isso é
   apenas uma recomendação de implementação futura — não foi feito nesta
   sprint.**
2. Sem esse mecanismo automático, o caminho manual é: pedir para os
   usuários desativarem e reativarem as notificações push nas
   configurações do app (o toggle existente já chama
   `unsubscribeFromPush()` / `subscribeToPush()`).
3. Comunicar a janela de "notificações push podem não chegar" durante a
   transição (ver Seção 3).

### 2.6 Android vs. iOS PWA instalado

- **Android (Chrome/Edge/similares):** o Service Worker já registrado
  continua ativo; a subscription antiga fica órfã (a chave privada nova não
  corresponde a ela) até o usuário reabrir o app e disparar um novo
  `subscribeToPush()`. Não é necessário reinstalar o PWA.
- **iOS PWA instalado (Add to Home Screen):** Web Push em iOS só funciona
  com o PWA instalado na tela de início (não em aba do Safari) e exige que
  o usuário tenha concedido permissão de notificação para esse PWA
  especificamente. Depois da rotação, o comportamento é o mesmo do Android
  (subscription antiga inválida, precisa de novo `subscribe()`), mas a
  taxa de re-engajamento tende a ser menor nesse canal — vale considerar um
  aviso in-app pedindo para reativar notificações, já que push mudo em iOS
  é mais difícil do usuário perceber sozinho.

---

## 3. Ordem segura de rotação (minimizando indisponibilidade)

Sequência recomendada — **não executar ainda**, apenas o plano:

1. **Gerar a nova `SUPABASE_SERVICE_ROLE_KEY`** no painel do Supabase.
2. **Atualizar a env var em Preview primeiro** (Vercel → projeto → Settings
   → Environment Variables → ambiente Preview) e abrir um deploy de Preview
   (ex.: um push trivial numa branch) para validar a Seção 1.4 **antes** de
   tocar em Production.
3. Só depois de validado em Preview, **atualizar em Production** e disparar
   redeploy de Production.
4. Rodar a checklist de validação (Seção 1.4) contra Production.
5. **Gerar o novo par VAPID** (`npx web-push generate-vapid-keys`).
6. **Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` em
   Preview**, redeploy de Preview, validar um envio de push de teste ali.
7. **Atualizar em Production**, redeploy de Production.
8. Comunicar aos usuários (in-app ou canal de suporte) que notificações
   push podem exigir reativação manual nos próximos dias (Seção 2.5).
9. Atualizar `.env.local` de todos os ambientes de desenvolvimento humano
   (manual, fora do Git) com os dois novos segredos.
10. Confirmar que a chave antiga do Supabase está de fato revogada (não
    apenas substituída) e que não há mais nenhum lugar (scripts, CI,
    integrações externas) apontando para o par VAPID antigo.

**Por que Service Role antes de VAPID:** a Service Role afeta login,
matrícula, avaliações e leaderboard — funcionalidades centrais usadas o
tempo todo. VAPID afeta só push, que é assíncrono e tolera uma janela maior
de degradação (notificação atrasada/perdida é menos crítico que login
quebrado). Fazer a rotação mais urgente primeiro, e validar bem em Preview
antes de cada etapa em Production, minimiza o tempo de qualquer
indisponibilidade real.

---

## 4. Histórico Git

**Importante:** remover os segredos da HEAD (feito neste Sprint 0D-C) **não
remove os valores dos commits anteriores**. Qualquer pessoa com acesso de
leitura ao repositório (incluindo forks já clonados, se houver) ainda
consegue recuperar os valores antigos navegando o histórico
(`git log -p -- check_second_admin.js`, por exemplo), mesmo depois deste PR
ser mesclado.

Isso é exatamente por isso que a Seção 0 trata
`SUPABASE_SERVICE_ROLE_KEY` e `VAPID_PRIVATE_KEY` como **comprometidas até
rotação** — sanitizar a HEAD é higiene necessária, mas não é, por si só, uma
mitigação de segurança para esses dois segredos. A rotação (Seções 1 e 2) é
o que efetivamente neutraliza a exposição.

### Opção A — Manter o histórico como está + rotacionar os segredos

- **O que é:** não reescrever nada; aceitar que o histórico do Git
  permanentemente contém os valores antigos, e confiar inteiramente na
  rotação (Seções 1–3) para neutralizá-los.
- **Prós:** zero risco operacional. Não afeta nenhuma branch, worktree, PR
  aberto, clone existente ou integração com a Vercel. É a opção mais simples
  e mais rápida de fechar esta sprint.
- **Contras:** os valores comprometidos ficam visíveis para sempre a quem
  tiver acesso de leitura ao repositório (incluindo clones/forks já feitos
  antes desta sanitização) — mas, uma vez rotacionados, esses valores não
  servem mais para nada.
- **Quando faz sentido:** sempre que a rotação (Seções 1–3) for concluída
  em tempo hábil. Na prática, é a opção recomendada por padrão.

### Opção B — Rewrite futuro do histórico com `git filter-repo`

- **O que é:** reescrever o histórico do repositório para remover os
  blobs/commits que contêm os valores antigos (ex.: `check_second_admin.js`
  em todo commit onde existiu).
- **Prós:** os valores deixam de existir em qualquer clone **novo** feito
  depois do rewrite.
- **Contras — impacto real e não trivial:**
  - **Branches:** toda branch local ou remota baseada no histórico antigo
    precisa ser recriada ou rebaseada sobre o histórico novo; SHAs de commit
    mudam.
  - **Worktrees:** cada worktree ativo (como este mesmo diretório,
    `will-treinos-pro-claude`, e qualquer outro worktree paralelo do
    projeto) fica referenciando SHAs que deixam de existir — precisa ser
    recriado do zero.
  - **PRs:** PRs abertos contra o histórico antigo (SHAs antigos) ficam
    inconsistentes; PRs já mesclados no `main` reescrito exigem que o
    GitHub reconcilie referências, o que pode confundir o histórico de
    revisão e comentários já feitos.
  - **Clones existentes:** qualquer clone feito antes do rewrite continua
    com o histórico antigo (secrets incluídos) até ser descartado e
    re-clonado — o rewrite não "alcança" cópias já feitas.
  - **Vercel:** deploys anteriores ficam referenciando commits que não
    existem mais no histórico reescrito; pode ser necessário reconectar o
    projeto Vercel ao repositório após o rewrite.
  - **Colaboradores:** todos precisam ser avisados para descartar seus
    clones/branches locais e re-clonar — um `git pull` comum não resolve
    depois de um rewrite de histórico, e um `push --force` malfeito pode
    apagar trabalho em andamento de outra pessoa.
- **Quando faz sentido:** só se houver um requisito explícito (ex.:
  compliance, auditoria externa, ou confirmação de que o repositório teve
  acesso não autorizado) que exija eliminar os valores do histórico, e não
  apenas neutralizá-los via rotação.

### Recomendação

**Opção A** (manter o histórico, focar 100% em rotacionar os dois segredos
comprometidos o quanto antes). O rewrite de histórico (Opção B) é uma
operação de alto risco e alto custo de coordenação para um ganho marginal
depois que a rotação já neutralizou o valor prático dos segredos expostos —
não deve ser feito como reação automática, e certamente não nesta sprint.
`git filter-repo`, BFG, `push --force` ou rebase destrutivo **não foram
usados nem devem ser usados** até uma decisão explícita e informada, em um
momento dedicado a isso, com todos os colaboradores avisados com
antecedência.

---

## 5. Checklist resumido (nada disto foi executado nesta sprint)

- [ ] Regenerar `SUPABASE_SERVICE_ROLE_KEY` no Supabase
- [ ] Atualizar em Preview (Vercel) → validar (Seção 1.4)
- [ ] Atualizar em Production (Vercel) → validar (Seção 1.4)
- [ ] Gerar novo par VAPID (`npx web-push generate-vapid-keys`)
- [ ] Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` em Preview → validar envio de push
- [ ] Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` em Production → validar envio de push
- [ ] Atualizar `.env.local` de todos os ambientes de dev humano
- [ ] Comunicar usuários sobre possível necessidade de reativar push
- [ ] Confirmar revogação efetiva da chave antiga no Supabase
- [ ] Decidir (separadamente, com calma) sobre rewrite de histórico — ver Seção 4
