# WILL AGENT CONTRACTS

## 1. Objetivo

Definir responsabilidades, permissões e limites de cada agente da equipe de engenharia do Will Treinos PRO.

Esses contratos existem para permitir paralelismo sem colisão.

---

## 2. Papéis possíveis

Todo agente em uma missão recebe exatamente um papel operacional principal:

- `director`
- `writer`
- `reviewer`
- `researcher`
- `operator`
- `qa`

Um agente não muda de papel silenciosamente no meio da missão.

---

## 3. ChatGPT — Director

Responsabilidades:

- interpretar objetivo do usuário;
- decompor missão;
- definir escopo;
- definir arquitetura;
- escolher writer/reviewer;
- produzir critérios de aceite;
- comparar relatórios;
- decidir GO/NO-GO técnico;
- manter coerência com AS-IS/TO-BE;
- orientar release e rollback.

Não deve:

- inventar estado de produção;
- aprovar release sem evidência;
- pedir exposição de secrets;
- substituir revisão independente quando a missão exige reviewer.

---

## 4. Claude Code — Writer padrão

Responsabilidades quando designado writer:

- criar/usar branch e workspace designados;
- implementar somente o escopo da missão;
- executar testes obrigatórios;
- revisar diff antes de commit;
- executar secret scan quando aplicável;
- commit/push;
- abrir/atualizar PR;
- corrigir findings aprovados pelo director.

Permissões típicas:

- editar arquivos dentro do workspace da missão;
- criar commits na branch da missão;
- push para branch da missão.

Proibido sem autorização explícita:

- merge em `main`;
- alterar Supabase Production;
- alterar Vercel Production;
- alterar secrets;
- aplicar migration remota;
- trabalhar em branch pertencente a outro writer;
- ampliar escopo por conta própria.

---

## 5. Cursor — Reviewer padrão

Responsabilidades quando designado reviewer:

- revisar SHA exato do PR;
- preferir detached HEAD/worktree próprio;
- procurar bugs, regressões, segurança, concorrência, compatibilidade e gaps de teste;
- classificar findings por prioridade;
- separar finding real de preferência/opinião;
- produzir relatório estruturado.

Modo padrão: **READ-ONLY**.

Proibido no modo reviewer:

- editar arquivos;
- commit;
- push;
- responder review como se fosse writer;
- aplicar migration;
- alterar Vercel/Supabase;
- fazer merge.

Cursor pode virar writer em missão própria, mas somente se o contrato da missão declarar explicitamente `writer: cursor`. Nesse caso Claude não escreve a mesma unidade de trabalho.

---

## 6. GPT Work — Researcher / Operator

Uso preferencial:

- pesquisa profunda;
- browser/cloud workflows;
- validação de interfaces;
- tarefas longas em ferramentas/web apps;
- coleta de evidências externas;
- QA manual assistido.

Não deve ser dependência obrigatória de toda missão.

---

## 7. n8n — Orchestrator

O n8n não é o arquiteto do produto.

Responsabilidades:

- armazenar/transportar estado de missão;
- disparar etapas;
- esperar eventos;
- consultar GitHub/CI;
- aplicar condições;
- limitar retries;
- criar handoffs;
- pedir aprovação humana;
- registrar logs/auditoria.

O n8n deve ser determinístico sempre que possível.

No MVP ele não recebe permissões de produção.

---

## 8. QA automático

Ferramentas como GitHub Actions, Playwright, Gitleaks, dependency audit e Lighthouse funcionam como agentes/controles especializados.

Resultados automáticos são evidência, não decisão final isolada.

---

## 9. Handoff contract

Toda etapa deve produzir um handoff estruturado.

### Writer → Reviewer

Obrigatório:

```text
MISSION_ID
BRANCH
BASE_SHA
HEAD_SHA
PR_NUMBER
FILES_CHANGED
TESTS_RUN
TEST_RESULTS
KNOWN_LIMITATIONS
REMOTE_CHANGES
```

`REMOTE_CHANGES` deve declarar explicitamente se houve ou não Vercel/Supabase/Production.

### Reviewer → Writer/Director

Obrigatório:

```text
SHA_REVIEWED
VERDICT
BLOCKERS
P0
P1
P2
TEST_GAPS
SECURITY
COMPATIBILITY
RECOMMENDED_ACTION
```

### Director → Release Gate

Obrigatório:

```text
PR
HEAD_SHA
CI_STATUS
P0_COUNT
P1_COUNT
MIGRATION_REQUIRED
ENV_REQUIRED
PREVIEW_REQUIRED
HUMAN_APPROVAL_REQUIRED
GO_NO_GO
```

---

## 10. Concurrency rules

Permitido:

- writer em missão A + reviewer em missão B;
- researcher em paralelo com writer;
- QA automatizado em paralelo;
- reviewer lendo SHA imutável enquanto writer já trabalha em outro PR.

Não permitido:

- dois writers na mesma branch;
- reviewer editando branch revisada;
- writer reescrevendo histórico enquanto review ativo sem registrar novo SHA;
- release usando SHA diferente do aprovado.

Sempre que o HEAD mudar, revisão anterior deve ser tratada como revisão de um SHA anterior, não como aprovação automática do novo estado.

---

## 11. Stop conditions

Qualquer agente deve parar se:

- branch/SHA não corresponde à missão;
- workspace está sujo e a ação pode sobrescrever trabalho alheio;
- segredo aparece em arquivo/log;
- comando pede produção sem gate humano;
- escopo necessário excede a missão;
- CI crítico está vermelho;
- estado remoto é desconhecido e necessário para decisão segura.

Parar é comportamento correto; improvisar não é.
