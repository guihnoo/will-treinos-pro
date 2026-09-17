# WILL RELEASE GATES

## 1. Objetivo

Definir o que a automação pode executar sozinha e o que exige aprovação humana explícita antes de atingir `main`, Supabase Production ou Vercel Production.

---

## 2. Princípio

> **AUTOMATIZAR PREPARAÇÃO E VERIFICAÇÃO; NÃO AUTOMATIZAR DECISÃO IRREVERSÍVEL SEM GATE.**

---

## 3. Ações automáticas permitidas no MVP

Permitido sem aprovação adicional, desde que dentro de workspace/branch de missão:

- ler GitHub;
- consultar PR/branch/SHA;
- consultar GitHub Actions;
- criar worktree isolado;
- rodar análise read-only;
- executar typecheck/build/testes;
- executar Gitleaks/dependency audit;
- gerar relatório;
- criar artefatos locais temporários;
- aguardar CI;
- classificar estado da missão.

Se um writer estiver explicitamente designado para a missão, também pode:

- editar branch da missão;
- commit;
- push;
- abrir/atualizar PR.

---

## 4. Ações bloqueadas por padrão

Precisam de aprovação humana explícita:

- merge em `main`;
- force push;
- alterar history de branch compartilhada;
- Vercel Production deploy manual;
- alteração de env Production;
- criação/rotação de secret;
- migration Supabase Production;
- alteração de RLS;
- `DROP`, `TRUNCATE`, delete em massa ou DDL destrutiva;
- alterações em auth production;
- rotação VAPID;
- rollback de produção.

---

## 5. Gate de merge

Merge só pode ser considerado se:

- HEAD SHA identificado;
- CI obrigatório verde nesse SHA;
- revisão independente concluída nesse SHA ou em delta explicitamente aceito;
- P0 = 0;
- P1 = 0 ou waiver humano explícito e documentado;
- dependências operacionais mapeadas;
- migration/env/deploy order conhecida;
- usuário aprovou o merge.

Se HEAD mudar, gate anterior fica inválido até nova validação.

---

## 6. Gate de migration

Antes de migration em Production:

- migration revisada;
- impacto classificado;
- verificar se é aditiva/destrutiva;
- confirmar compatibilidade com código atualmente em produção;
- confirmar ordem em relação ao deploy;
- rollback/forward-fix definido;
- approval humano explícito.

Preferência de rollout:

- quando migration é aditiva e retrocompatível, aplicar antes do código que depende dela;
- quando não é retrocompatível, usar estratégia expand/contract.

Nunca assumir que migration local já existe remotamente.

---

## 7. Gate de env/secrets

Antes de alterar Vercel/Supabase credentials:

- registrar apenas **nome** da variável, nunca valor;
- definir ambientes afetados: Preview/Production;
- confirmar dependências no código;
- evitar janela de indisponibilidade;
- approval humano;
- validar pós-alteração.

Segredos nunca devem ser ecoados em logs do n8n/agentes.

---

## 8. Gate de Production

Antes de considerar release concluído:

```text
PR MERGED
CI MAIN GREEN
MIGRATIONS REQUIRED = APPLIED
ENV REQUIRED = CONFIGURED
PRODUCTION DEPLOY = SUCCESS
SMOKE TEST = PASS
CRITICAL FLOWS = PASS
```

Para mudanças de auth/security/presença/pagamento, smoke específico é obrigatório.

---

## 9. Rollback

Rollback não é automático no MVP.

Se smoke falhar:

- marcar missão `ROLLBACK_REQUIRED`;
- bloquear novas releases relacionadas;
- coletar evidências;
- apresentar opções ao humano;
- executar rollback/forward-fix somente após aprovação.

Banco pode não ser reversível com simples rollback de código; migration sempre deve ter tratamento próprio.

---

## 10. Gate atual do PR #17

O PR #17 ainda não está liberado para produção.

Pendências registradas:

- revisão final do delta mais recente;
- Sprint 2A.2 de hardening de `xp_log`;
- migration RPC ainda não aplicada remotamente;
- `QR_CHECKIN_SECRET` ainda não preparado no release;
- ordem operacional de release ainda precisa ser executada;
- merge exige aprovação humana.

Até esses gates serem concluídos, `main` e Production permanecem intocados pelo PR #17.
