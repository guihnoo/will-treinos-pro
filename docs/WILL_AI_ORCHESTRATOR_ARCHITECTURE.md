# WILL AI ENGINEERING ORCHESTRATOR — ARCHITECTURE v1

## 1. Objetivo

Criar uma camada de orquestração para coordenar múltiplos agentes de IA no desenvolvimento do Will Treinos PRO sem permitir que eles se atropelarem, alterem produção sem aprovação ou dependam de transporte manual de mensagens pelo usuário.

O n8n será o **control plane** do pipeline. Ele não substitui GitHub, Claude Code, Cursor, ChatGPT, Vercel ou Supabase.

---

## 2. Princípio central

> **UMA IA ESCREVE CÓDIGO POR VEZ POR UNIDADE DE TRABALHO.**

Paralelismo é permitido quando as responsabilidades são diferentes ou os workspaces são isolados.

Exemplos permitidos:

- Claude implementa PR A enquanto Cursor revisa PR B.
- Claude implementa enquanto um agente de pesquisa levanta documentação.
- Cursor faz review read-only do SHA produzido por Claude.
- CI, security scans e testes rodam enquanto o executor espera.

Exemplos proibidos:

- Claude e Cursor editando a mesma branch simultaneamente.
- dois agentes fazendo push para o mesmo PR sem coordenação explícita.
- agente de review alterando código durante a revisão.

---

## 3. Arquitetura

```text
HUMANO / PRODUCT OWNER
        |
        v
CHATGPT / CONTROL CENTER
        |
        v
n8n ORCHESTRATOR
        |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
  EXECUTOR AGENT        REVIEW AGENT        RESEARCH/QA
  Claude Code           Cursor              Work/others
        |                    |                    |
        +--------------------+--------------------+
                             |
                             v
                           GitHub
                             |
                             v
                      GitHub Actions / CI
                             |
                             v
                        RELEASE GATE
                             |
                      HUMAN APPROVAL
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
               Vercel                 Supabase
```

GitHub continua como **Source of Truth**.

---

## 4. Unidade de trabalho: Mission

Toda automação opera sobre uma `Mission` com estado explícito.

Exemplo conceitual:

```json
{
  "mission_id": "will-2026-09-sprint-2a2",
  "title": "XP Integration Hardening",
  "repo": "guihnoo/will-treinos-pro",
  "base_branch": "main",
  "base_sha": "<sha>",
  "work_branch": "fix/sprint2a2-xp-hardening",
  "writer": "claude-code",
  "reviewer": "cursor",
  "status": "implementation",
  "head_sha": null,
  "pr_number": null,
  "ci_status": null,
  "p0": 0,
  "p1": 0,
  "human_approval": false,
  "production_allowed": false
}
```

Nenhum secret entra no objeto de missão.

---

## 5. Máquina de estados

Estados mínimos:

```text
DRAFT
  -> READY
  -> IMPLEMENTING
  -> PR_OPEN
  -> CI_RUNNING
  -> CI_FAILED | REVIEW_READY
  -> REVIEWING
  -> CHANGES_REQUESTED | RELEASE_CANDIDATE
  -> HUMAN_APPROVAL_REQUIRED
  -> APPROVED
  -> RELEASING
  -> SMOKE_TEST
  -> DONE | ROLLBACK_REQUIRED
```

Estados de erro nunca avançam automaticamente para produção.

---

## 6. Workspaces isolados

O MVP local usará worktrees Git ou diretórios de trabalho isolados.

Exemplo:

```text
C:\will-agent-workspaces\
  mission-021-claude\
  mission-021-cursor-review\
  mission-022-claude\
```

Contrato mínimo de cada workspace:

- mission id;
- repo;
- base SHA;
- branch/SHA alvo;
- agente;
- modo `writer` ou `read-only`;
- paths permitidos/proibidos quando aplicável.

Review deve preferir detached HEAD no SHA exato do PR.

---

## 7. Fases de implantação

### Fase 0 — Local Zero Cost

Stack:

- Windows host do usuário;
- Docker Desktop;
- n8n Community Edition local;
- Git já instalado;
- Claude Code CLI;
- Cursor CLI/Agent quando disponível no plano atual;
- GitHub remoto.

n8n ficará inicialmente acessível apenas em `localhost`.

### Fase 1 — PR Control Center

Objetivo: observabilidade sem escrita no projeto.

Workflow:

```text
Manual Trigger
 -> receber repo + PR
 -> consultar PR
 -> identificar HEAD SHA
 -> consultar CI
 -> classificar estado
 -> gerar relatório
```

Sem:

- merge;
- deploy;
- Supabase write;
- Vercel Production;
- shell destrutivo.

### Fase 2 — Implementation Loop

```text
Mission
 -> create isolated workspace
 -> writer agent
 -> tests
 -> commit/push
 -> PR
 -> CI
 -> reviewer read-only
 -> findings
 -> writer correction
 -> repeat
```

Limites de retry serão explícitos para impedir loops infinitos.

### Fase 3 — Preview QA

- Vercel Preview;
- Playwright;
- Lighthouse;
- security scans;
- smoke tests em ambiente não produtivo.

### Fase 4 — Controlled Release

Somente após gate humano:

- migrations aditivas na ordem planejada;
- env vars;
- merge;
- Production deploy;
- smoke;
- rollback quando necessário.

---

## 8. Eventos de entrada

O sistema deve evoluir por etapas.

MVP:

- Manual Trigger dentro do n8n.

Depois:

- GitHub polling;
- GitHub webhook;
- Chat/Control Center;
- API/webhook para criação de missão;
- eventualmente UI própria.

A ausência de webhook público no MVP é intencional: reduz risco e permite rodar apenas em localhost.

---

## 9. Persistência

No início, o estado pode ficar em:

- dados internos do n8n;
- workflow execution data;
- GitHub como fonte de branch/PR/SHA;
- `docs/WILL_PROJECT_CONTROL_CENTER.md` para estado humano/agente.

Quando necessário, migrar para Postgres dedicado sem mudar o contrato de `Mission`.

---

## 10. Segurança

### Nunca automatizar sem aprovação humana

- merge em `main`;
- migration em Production;
- RLS;
- secrets;
- env Production;
- deploy Production;
- SQL destrutivo;
- rollback;
- VAPID rotation.

### Secrets

- não entram em prompts;
- não entram em Git;
- não entram em relatórios;
- não são ecoados em logs;
- preferir credential store do n8n/ambiente;
- futuramente usar secret store externo se necessário.

### Fail closed

Se qualquer estado essencial for desconhecido — SHA, CI, reviewer, migration status, approval — o pipeline para.

---

## 11. Custo

MVP local:

- n8n Community: sem custo adicional de licença para o uso interno planejado;
- infraestrutura: PC local já existente;
- consumo de IA: conforme os planos/limites já contratados;
- GitHub/Vercel/Supabase: conforme planos atuais.

Futuro:

- migrar o mesmo desenho para VPS/Hostinger KVM quando for necessário funcionamento 24/7.

---

## 12. Critério de sucesso do MVP

O MVP está aprovado quando conseguimos, sem tocar produção:

1. abrir o n8n local;
2. informar repo + PR;
3. obter HEAD SHA do PR;
4. consultar o CI desse SHA;
5. produzir um relatório determinístico;
6. não depender de copiar informações manualmente do GitHub;
7. provar que nenhum passo tem permissão de merge/deploy.

Só depois conectaremos os agentes executores.
