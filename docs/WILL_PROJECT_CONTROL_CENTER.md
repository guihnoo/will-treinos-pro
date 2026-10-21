# WILL PROJECT CONTROL CENTER

**Projeto:** Will Treinos PRO  
**Objetivo deste arquivo:** ser a memória operacional oficial e legível por humanos e agentes.  
**Regra:** atualizar este documento em toda sprint relevante, mudança de arquitetura, release ou alteração de risco.

---

## 1. Estado do produto

Will Treinos PRO é uma PWA/SaaS de gestão e alta performance para vôlei, com experiências separadas para admin/dono, professor/coach e aluno/atleta.

Princípios de produto vigentes:

- **FAST BEFORE FANCY**.
- Primeira dobra: **1 HERO + até 3 sinais + 1 ação principal**.
- Feed é parte não negociável da experiência.
- Segurança, performance e observabilidade são propriedades do sistema, não correções tardias.
- Will Arena é uma fronteira futura separada do produto atual.

Documentos canônicos:

- `docs/WILL_CURRENT_SYSTEM_MAP_2026_09.md` — AS-IS.
- `docs/WILL_PRODUCT_SYSTEM_ARCHITECTURE_2_0.md` — TO-BE.
- `docs/WILL_AI_ORCHESTRATOR_ARCHITECTURE.md` — arquitetura da equipe de agentes.
- `docs/WILL_AGENT_CONTRACTS.md` — responsabilidades e permissões dos agentes.
- `docs/WILL_RELEASE_GATES.md` — gates de release e produção.

---

## 2. Infraestrutura canônica

- Repositório: `guihnoo/will-treinos-pro`
- Branch principal: `main`
- Produção Vercel: projeto `will-treinos-pro`
- Domínio: `willtreinospro.com.br`
- Supabase project ref: `armrortldtqxmgvvcbko`
- GitHub é a **Source of Truth** do código e das mudanças versionadas.

Segredos nunca devem ser gravados neste arquivo, em prompts, logs ou commits.

---

## 3. Estado de segurança / chaves

Concluído:

- migração Supabase legacy keys → Publishable Key + Secret Key modernas;
- Vercel Preview/Production atualizados para as novas chaves;
- GitHub Actions atualizado;
- legacy `anon`/`service_role` desativadas;
- login e produção validados após a migração.

Pendente:

- rotação VAPID — tratar em sprint própria, pois pode invalidar subscriptions existentes;
- hardening de `xp_log` — prioridade imediata de segurança/integridade.

---

## 4. Estado atual da engenharia

### Main

Última base arquitetural consolidada:

- PR #16 — documentação AS-IS / TO-BE — **MERGED**.

### PR ativo

**PR #17 — Sprint 2A: QR check-in seguro**

- branch: `fix/sprint2a-secure-qr-checkin`
- estado: aberto, não mergeado;
- último head conhecido: `85bd3a3bf8767fa6f37d11880696c40ce5046118`;
- CI do head: verde;
- produção: **não recebeu este código**;
- Supabase remoto: migration nova do PR ainda não aplicada;
- Vercel Production: nenhum deploy do PR foi liberado;
- `QR_CHECKIN_SECRET`: release operacional ainda não executado.

Implementado no PR #17:

- HMAC-SHA256 para token de QR com TTL;
- check-in autenticado server-side;
- student derivado do JWT, nunca escolhido pelo client;
- presença usa `students.id`;
- XP usa `auth user id`;
- RPC atômica com `FOR UPDATE`;
- `SECURITY INVOKER`;
- `SET search_path = public`;
- EXECUTE revogado de `PUBLIC`, `anon` e `authenticated`;
- EXECUTE concedido somente a `service_role`;
- endpoint legado inseguro removido;
- testes estruturais e de token adicionados.

Próxima ação do PR #17 antes de release:

1. revisão final read-only do delta `9fbea59..85bd3a3` pelo Cursor;
2. consolidar GO/NO-GO;
3. resolver Sprint 2A.2 de `xp_log` antes do release final;
4. planejar ordem operacional de migration + env + preview + merge + smoke.

---

## 5. Finding ativo — xp_log

Confirmado no banco remoto em leitura:

- existe policy ativa `xp_log_system_insert` com `WITH CHECK (true)`;
- `anon` e `authenticated` possuem privilégio de `INSERT` na tabela;
- coexistem policies mais restritivas de staff/student.

Classificação operacional:

- prioridade: **Sprint 2A.2 — XP Integration Hardening**;
- não misturar no PR #17;
- objetivo: remover a superfície permissiva sem quebrar fluxos legítimos de XP;
- validar schema/policies remotas antes de qualquer DDL.

---

## 6. Roadmap macro vigente

Sequência estratégica:

**SEGURANÇA → ESTABILIDADE → PERFORMANCE → UX → PRODUTO 2.0 → ESCALA**

Sequência técnica de extração definida na arquitetura:

1. Gamification
2. Presence / QR
3. Training
4. Finance/Admin/WillCockpit por último

O roadmap de produto e o roadmap técnico são relacionados, mas não são a mesma coisa.

---

## 7. Estado da automação de agentes

Objetivo: reduzir transporte manual de prompts e transformar o desenvolvimento em pipeline coordenado.

Arquitetura desejada:

`Humano → ChatGPT/Control Center → n8n → agentes → GitHub → CI → review → approval → release`

Plano de implantação:

### Fase 0 — fundação

- documentação do orquestrador;
- contratos de agentes;
- release gates;
- n8n Community local, sem custo adicional;
- nenhum poder de produção.

### Fase 1 — observer

- detectar/consultar PR;
- acompanhar SHA;
- aguardar CI;
- gerar relatório;
- sem merge, migration ou deploy.

### Fase 2 — agent pipeline

- missão → executor → PR → CI → reviewer → correção → novo CI;
- worktrees/ambientes isolados;
- apenas um writer por unidade de trabalho.

### Fase 3 — preview/QA

- Vercel Preview;
- Playwright;
- Lighthouse/performance;
- security checks;
- release candidate.

### Fase 4 — release controlado

- aprovação humana;
- migration/env em ordem segura;
- merge;
- produção;
- smoke test;
- rollback se necessário.

---

## 8. Papéis atuais

- **Humano / Product Owner:** define objetivos, aprova mudanças de risco e produto.
- **ChatGPT:** direção técnica/produto, arquitetura, decomposição de missão, GO/NO-GO, coordenação.
- **Claude Code:** executor principal de implementação quando designado writer.
- **Cursor:** reviewer/QA independente; pode ser writer somente quando explicitamente designado em missão separada.
- **GPT Work:** pesquisa, browser, validação externa, workflows longos e tarefas de interface quando útil.
- **n8n:** orquestrador determinístico de estados, eventos, retries, waits, gates e handoffs.

Regra central:

> **UMA IA ESCREVE CÓDIGO POR VEZ POR UNIDADE DE TRABALHO.**

Outros agentes podem analisar, revisar, pesquisar e testar em paralelo, desde que estejam isolados.

---

## 9. Gates humanos obrigatórios

Exigem aprovação humana explícita:

- merge em `main`;
- migration em Supabase Production;
- alteração de RLS;
- criação/rotação de secrets;
- mudança de env Production;
- deploy manual em Production;
- SQL destrutivo;
- rollback de produção;
- VAPID rotation.

No MVP do orquestrador, automação nunca ultrapassa esses gates.

---

## 10. Regra de continuidade

Antes de iniciar nova missão, qualquer agente deve:

1. ler este arquivo;
2. ler o AS-IS e TO-BE quando relevante;
3. identificar branch/PR/SHA alvo;
4. confirmar seu papel: writer, reviewer, researcher ou operator;
5. respeitar os gates;
6. registrar o resultado final e atualizar o estado oficial quando a missão for concluída.
