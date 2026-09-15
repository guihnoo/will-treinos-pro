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

> ⚠️ **Correção de revisão (pós-primeira versão deste runbook):** a
> orientação anterior de simplesmente "Reset/Regenerate" a `service_role`
> legada está **desatualizada** para o Supabase atual. O Supabase está
> descontinuando as chaves legadas `anon` / `service_role` (formato JWT) em
> favor de um novo par: **Publishable Key** (substitui `anon`) e **Secret
> Key** (substitui `service_role`). Os dois sistemas podem **coexistir**
> durante a migração — isso é o que permite rotacionar **sem downtime
> obrigatório**, em vez de invalidar a chave antiga na hora. A sequência
> abaixo substitui a anterior.

### 1.1 Onde criar as novas chaves no Supabase

1. Painel do Supabase → projeto → **Settings → API Keys**.
2. Criar/ativar a **Secret Key** (substituta moderna da `service_role`
   legada) e, se ainda não existir, a **Publishable Key** (substituta
   moderna da `anon` legada) — ambas ficam disponíveis lado a lado com as
   chaves legadas, sem desativar nada ainda.

### 1.2 Migração zero-downtime — nova sequência recomendada

A ideia central: **criar as chaves novas, migrar os consumidores para elas,
validar, e só então desativar as legadas** — nunca o inverso.

1. Criar/ativar Publishable Key + Secret Key no painel (Seção 1.1), se
   ainda não existirem.
2. **Backend:** substituir o valor usado pela aplicação server-side pela
   nova **Secret Key**. O nome da variável de ambiente pode continuar
   temporariamente `SUPABASE_SERVICE_ROLE_KEY` se o código ainda lê esse
   nome — o que muda é o **valor** (passa a ser uma Secret Key moderna,
   formato `sb_secret_...`, não mais o JWT legado de `service_role`), não
   necessariamente o nome da env var.
3. **Frontend:** substituir a `anon` legada pela **Publishable Key**. Se o
   código ainda lê `NEXT_PUBLIC_SUPABASE_ANON_KEY`, o valor pode ser
   migrado temporariamente para a Publishable Key nessa mesma variável, ou
   registrar como etapa futura renomear a variável para algo
   semanticamente correto (ex.: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, já
   citado como alternativa em `.env.example`).
4. Atualizar as env vars em **Preview** primeiro (Vercel → projeto →
   Settings → Environment Variables → ambiente Preview).
5. Redeploy de Preview.
6. Validar em Preview (checklist completo na Seção 1.5): login, auth,
   leaderboard, matrícula, avaliações, APIs server-side, e Realtime se
   estiver em uso em alguma tela.
7. Só depois de validado em Preview, atualizar as mesmas env vars em
   **Production**.
8. Redeploy de Production.
9. Validar em Production (mesmo checklist da Seção 1.5).
10. **Antes de desativar qualquer coisa:** confirmar pelo painel do
    Supabase (indicadores/logs de uso por chave, quando disponíveis) que
    nenhuma chamada relevante ainda está usando as chaves legadas `anon`/
    `service_role`.
11. Só então **desativar as legacy keys** — atenção: desativar afeta
    `anon` **e** `service_role` **juntas** (não é possível desativar uma
    sem a outra), então essa etapa só é segura depois que **ambos** os
    lados (frontend e backend) já migraram.
12. Validar novamente Production após a desativação.
13. Se algo quebrar após desativar as legadas: reativar as legacy keys
    temporariamente **apenas como rollback controlado**, identificar e
    corrigir o consumidor esquecido que ainda dependia delas, e então
    repetir a tentativa de desativação — nunca usar esse rollback como
    desculpa para deixar a legada ativa indefinidamente, e nunca voltar a
    versionar ou distribuir a chave comprometida original.

### 1.3 Impacto esperado

- **Durante a migração (chaves legadas + novas coexistindo):** nenhum
  impacto — é o ponto principal de usar Publishable/Secret Keys em vez de
  regenerar a legada diretamente. A aplicação pode ser migrada
  gradualmente (backend primeiro, depois frontend, ou em paralelo) sem
  janela de indisponibilidade forçada.
- **Somente no momento de desativar as legacy keys** (passo 11 acima):
  qualquer consumidor que ainda não tiver migrado passa a falhar com erro
  de autenticação (401/403 do lado do Supabase). Por isso o passo 10
  (confirmar ausência de uso das legadas) é obrigatório antes de desativar.
- Nenhuma tabela, RLS ou dado é alterado por essa migração.

### 1.4 Quais ambientes Vercel precisam das novas chaves

Tanto o valor de `SUPABASE_SERVICE_ROLE_KEY` (Secret Key nova) quanto o de
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (Publishable Key nova, se migrada) precisam
ser atualizados em **todos** os ambientes que os usam:

| Ambiente Vercel | Precisa das chaves novas? | Observação |
|---|---|---|
| **Production** | ✅ Sim | Prioridade máxima — é o que serve `will-treinos-pro.vercel.app` |
| **Preview** | ✅ Sim | PRs abertos rodam build/E2E contra Preview; sem as chaves novas, jobs que dependem delas voltam a falhar |
| **Development** (`vercel dev` / local via `vercel env pull`) | ⚠️ Se usado | Só necessário se alguém usa `vercel env pull` para popular `.env.local` local. Ambientes locais que mantêm `.env.local` manual também precisam ser atualizados manualmente por quem os mantém |

Depois de salvar as chaves novas em cada ambiente, é necessário um **novo
deploy** (redeploy ou novo commit/push) — a Vercel não aplica mudanças de
env var em deploys já existentes.

### 1.5 Como validar após a troca

Validar nesta ordem, sempre em **Preview** primeiro, depois **Production**
(repetir de novo após a desativação das legadas, passo 12 da Seção 1.2):

1. **Login** — fazer login (e-mail/senha ou Google) e confirmar que chega
   no dashboard correto (admin/professor/aluno) sem erro 500.
2. **Auth / sessão** — confirmar que `supabase.auth.getSession()` /
   `getUser()` no client continuam funcionando com a Publishable Key nova
   (se já migrada).
3. **APIs server-side genéricas** — abrir `/api/health` e confirmar `200`.
4. **Leaderboard** — `GET /api/leaderboard?period=week` deve responder
   `< 500` (ver `e2e/server-integration.spec.ts`, que documenta esse
   contrato; essa suíte pode ser rodada manualmente contra Preview/staging
   com a chave nova já configurada).
5. **Matrícula** — completar um fluxo de `/cadastro` ou `/signup` de teste
   (conta descartável) e confirmar que o registro é criado sem erro.
6. **Avaliações** — como staff, abrir a tela de avaliações
   (`/will/evaluations` ou equivalente) e confirmar que lista/salva sem
   erro; testar também `GET` de `/api/student/submit-rating` (rota corrigida
   no Sprint 0A) com um usuário staff real.
7. **Push** — disparar uma notificação de teste
   (`/api/push/test`, se disponível, ou um fluxo real de aviso) e confirmar
   entrega.
8. **Realtime**, se alguma tela do produto usar subscriptions Realtime do
   Supabase — confirmar que a conexão abre e recebe eventos normalmente
   com as chaves novas.
9. Checar **Vercel → Deployments → Logs** do deploy novo por qualquer
   `Error: Missing` ou erro de autenticação do Supabase.

### 1.6 Rollback sem reusar a chave comprometida

Se algo quebrar durante ou depois da migração:

- **Nunca** reverter para a chave legada **comprometida** (a que vazou) —
  ela deve permanecer tratada como inválida para uso, mesmo que o Supabase
  ainda a aceite tecnicamente até a desativação formal das legadas.
- Se o problema aparecer **antes** da desativação das legacy keys (passo
  11 da Seção 1.2): como as duas gerações de chave coexistem, o rollback
  mais simples é reverter o **deploy** (voltar ao commit/deploy anterior na
  Vercel) sem precisar mexer em nada no Supabase — a legada ainda está
  ativa e a aplicação volta a funcionar com o comportamento anterior.
- Se o problema aparecer **depois** de desativar as legacy keys (passo 13
  da Seção 1.2): reativar as legacy keys temporariamente só como rollback
  controlado, identificar o consumidor que ainda dependia delas, corrigi-lo
  para usar Publishable/Secret Key, e então repetir a tentativa de
  desativação.
- Em nenhum cenário a chave legada comprometida original deve voltar a ser
  versionada, distribuída ou usada como valor definitivo — reativá-la é
  sempre uma ponte temporária para destravar o rollback, nunca a solução
  final.

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

Mesma lógica da Seção 1.4: atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e
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

> A migração do Supabase para Publishable/Secret Keys permite coexistência
> temporária com as legacy keys e deve ser usada para minimizar downtime —
> por isso ela vem antes da desativação de qualquer coisa, e a desativação
> das legadas só acontece depois de tudo validado (passos 3–7 abaixo detalham
> a Seção 1.2).

1. Criar Publishable Key + Secret Key no painel do Supabase (Seção 1.1).
2. Migrar backend (`SUPABASE_SERVICE_ROLE_KEY` → valor passa a ser a Secret
   Key nova) e frontend (`NEXT_PUBLIC_SUPABASE_ANON_KEY` → valor passa a
   ser a Publishable Key nova, se aplicável) nas env vars da Vercel —
   **Preview primeiro** (Seção 1.2, passos 4–6).
3. Validar em Preview: login, auth, leaderboard, matrícula, avaliações,
   APIs server-side, Realtime se usado (Seção 1.5).
4. Atualizar as mesmas env vars em **Production** e fazer redeploy
   (Seção 1.2, passos 7–8).
5. Validar em Production com o mesmo checklist (Seção 1.5).
6. Confirmar pelo painel/indicadores de uso do Supabase que nenhuma chamada
   ainda depende das legacy keys — só então **desativar** `anon`/
   `service_role` legadas (afeta as duas juntas; Seção 1.2, passos 10–11).
7. Validar Production novamente após a desativação (Seção 1.5). Se algo
   quebrar, reativar as legacy keys temporariamente só como rollback
   controlado, corrigir o consumidor esquecido, e repetir a desativação
   (Seção 1.6) — nunca voltar a versionar ou distribuir a chave
   comprometida original.
8. **Gerar o novo par VAPID** (`npx web-push generate-vapid-keys`).
9. **Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` em
   Preview**, redeploy de Preview, validar um envio de push de teste ali.
10. **Atualizar em Production**, redeploy de Production.
11. Comunicar aos usuários (in-app ou canal de suporte) que notificações
    push podem exigir reativação manual nos próximos dias (Seção 2.5).
12. Atualizar `.env.local` de todos os ambientes de desenvolvimento humano
    (manual, fora do Git) com os segredos novos (Secret Key, Publishable
    Key se migrada, e o par VAPID).
13. Confirmar que o par VAPID antigo não está mais referenciado em nenhum
    lugar (scripts, CI, integrações externas).

**Por que Supabase antes de VAPID:** as chaves do Supabase afetam login,
matrícula, avaliações e leaderboard — funcionalidades centrais usadas o
tempo todo. VAPID afeta só push, que é assíncrono e tolera uma janela maior
de degradação (notificação atrasada/perdida é menos crítico que login
quebrado). A migração para Publishable/Secret Keys já elimina a
necessidade de downtime forçado nessa etapa; ainda assim, fazer a rotação
mais crítica primeiro, e validar bem em Preview antes de cada etapa em
Production, minimiza qualquer risco residual.

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

- [ ] Criar Publishable Key + Secret Key no painel do Supabase (Seção 1.1)
- [ ] Migrar backend/frontend para as chaves novas em Preview (Vercel) → validar (Seção 1.5)
- [ ] Migrar backend/frontend para as chaves novas em Production (Vercel) → validar (Seção 1.5)
- [ ] Confirmar (painel/uso) que nenhuma chamada ainda depende das legacy keys
- [ ] Desativar legacy `anon`/`service_role` no Supabase → validar Production de novo (Seção 1.5)
- [ ] Gerar novo par VAPID (`npx web-push generate-vapid-keys`)
- [ ] Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` em Preview → validar envio de push
- [ ] Atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` em Production → validar envio de push
- [ ] Atualizar `.env.local` de todos os ambientes de dev humano
- [ ] Comunicar usuários sobre possível necessidade de reativar push
- [ ] Confirmar que as legacy keys do Supabase estão de fato desativadas
- [ ] Decidir (separadamente, com calma) sobre rewrite de histórico — ver Seção 4
