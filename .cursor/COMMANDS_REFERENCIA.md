# CURSOR COMMANDS — Referência de Criação
## Como usar: Cursor Settings → Rules, Skills, Subagents → Commands → New Command

---

## COMMAND 1: `/log`

**Name (campo Name):**
```
log
```

**Description (campo Description):**
```
Registra a interação atual no Master Memory com data e hora
```

**Prompt (campo Prompt — cole tudo isso):**
```
Acesse o arquivo WILLPRO_MASTER_MEMORY.md e registre no bloco "3. LOG DE ATUALIZAÇÕES E ESTADO ATUAL" o que foi implementado agora. O registro DEVE ter: data atual, hora atual (BRT), autor (Cursor) e descrição técnica resumida da mudança. Formato obrigatório: - **[DD/MM/AAAA HH:MM BRT] (Cursor):** [descrição técnica da mudança, arquivos alterados e resultado]
```

---

## COMMAND 2: `/build`

**Name:**
```
build
```

**Description:**
```
Roda o build de produção e analisa erros automaticamente
```

**Prompt:**
```
Execute `pnpm run build` no terminal e capture o output completo. Se houver erros: ative a Persona Caçador de Bugs, classifique a severidade de cada erro (CRÍTICO/ALTO/MÉDIO/BAIXO) e apresente o diagnóstico e a correção cirúrgica para cada um, com o arquivo exato e a linha do problema. Se o build passar (exit 0): confirme com "✅ Build limpo — pronto para deploy" e pergunte se deve registrar no WILLPRO_MASTER_MEMORY.md.
```

---

## COMMAND 3: `/seguranca`

**Name:**
```
seguranca
```

**Description:**
```
Auditoria rápida de segurança nos arquivos recentes
```

**Prompt:**
```
Ative a Persona Guardião de Segurança. Faça uma varredura nos arquivos modificados recentemente (use @Git para ver os últimos commits). Verifique obrigatoriamente: (1) alguma chave secreta exposta com prefixo NEXT_PUBLIC_? (2) alguma tabela nova no Supabase sem RLS habilitado? (3) algum input de usuário sendo interpolado diretamente em query SQL? (4) algum cookie de sessão sem HttpOnly? (5) algum upload de arquivo sem validação de tipo MIME? Retorne um relatório com achados classificados por severidade e a correção recomendada para cada um.
```

---

## COMMAND 4: `/auditoria`

**Name:**
```
auditoria
```

**Description:**
```
Pente Fino completo com todas as 9 personas especialistas
```

**Prompt:**
```
@Codebase Ative simultaneamente as 9 Personas do .cursorrules (UX/UI, Performance, Head Coach, Supabase Ninja, PWA, Animações, Caçador de Bugs, Arqueólogo de Código e Guardião de Segurança). Faça um escaneamento profundo em todo o projeto. Para cada área entregue: 🟢 O que está ótimo e deve ser mantido, 🔴 O que é tech debt ou código inútil, ⚠️ O que está quebrado ou incompleto, 🚀 O que falta para o próximo nível. Finalize com um Plano de 3 Ações Prioritárias imediatas. Responda em pt-BR.
```

---

## COMMAND 5: `/missao`

**Name:**
```
missao
```

**Description:**
```
Executa a próxima missão do Plano de Batalha
```

**Prompt:**
```
Leia o arquivo WILLPRO_MASTER_MEMORY.md e o arquivo de Plano de Batalha mais recente. Identifique qual é a próxima missão com status "PRÓXIMA" no painel de execução. Apresente o briefing completo desta missão (o que será feito, quais arquivos serão tocados, qual é o risco). Aguarde minha confirmação antes de iniciar a implementação. Após confirmação, execute a missão completa, rode pnpm run build e registre o resultado no WILLPRO_MASTER_MEMORY.md.
```

---

## PASSO A PASSO PARA CRIAR (faça para cada Command acima):

1. No Cursor: **Ctrl+Shift+J** → aba **"Rules, Skills, Subagents"**
2. Role até a seção **"Commands"**
3. Clique em **"New Command"** (botão azul)
4. Cole o **Name**, a **Description** e o **Prompt** de um dos comandos acima
5. Salve
6. Repita para os outros 4 Commands

**Tempo total: ~5 minutos para os 5 commands**

Após criar, use no chat assim:
- Digite `/` no chat do Cursor
- Os seus comandos vão aparecer na lista
- Clique no desejado e ele executa automaticamente
