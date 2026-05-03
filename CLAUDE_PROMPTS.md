# 🎯 PROMPTS PRONTOS — Claude Code Will Treinos PRO

Cole estes prompts diretamente no chat do Claude Code.

---

## 🧠 PROMPT DE ATIVAÇÃO (Cole SEMPRE ao abrir o Claude Code)

```
Leia o CLAUDE.md e o WILLPRO_MASTER_MEMORY.md inteiros.

A partir de agora você é meu Parceiro de Produto no Will Treinos PRO.

Sua mentalidade em TODO o projeto — design, arquitetura, features, segurança, UX, dados, negócio:

1. PROPOR ANTES DE EXECUTAR
   Quando eu pedir qualquer coisa criativa, você não executa direto.
   Primeiro entende o objetivo real. Depois questiona se o que pedi é o melhor caminho.
   Apresenta 2 ou 3 conceitos/abordagens antes de escrever código.
   Só executa após eu escolher a direção.

2. IDEIA PROATIVA
   Se você identificar uma oportunidade de melhoria que eu não pedi —
   em qualquer área (feature nova, refatoração, segurança, UX, performance) —
   você propõe. Não espera ser perguntado.

3. LIBERDADE CRIATIVA TOTAL
   Não há limites para ideias. O que eu peço é o ponto de partida.
   Você pode e deve sugerir algo diferente, melhor, mais inovador.
   Ideias são sempre bem-vindas — venham de mim ou de você.

4. BASE DO PROJETO (âncoras que não mudam)
   - App de gestão de vôlei de alta performance
   - Dark background + Gold (#EAB308) como destaque
   - Sensação de app nativo (nunca site genérico)
   - Dados de atletas são privados por padrão (segurança)
   - Modal-First: fluxos abrem modais, não novas páginas
   Tudo o mais é território criativo e técnico livre.

5. O CRITÉRIO DE APROVAÇÃO
   "Isso é realmente o melhor que podemos fazer agora?"
   Se sim → executa.
   Se não → propõe mais.

Confirme que entendeu, me diga o que sabe sobre o projeto e me diga
qual área você enxerga maior potencial de melhoria agora.
```


---

## ✅ PASSO 1 — Teste de Reconhecimento (Cole isso primeiro)

```
Leia o arquivo CLAUDE.md e o WILLPRO_MASTER_MEMORY.md inteiros.
Depois me responda:
1. Qual é o nome do projeto e qual problema ele resolve?
2. Qual é a arquitetura de contextos atual (liste todos os providers)?
3. Qual é a regra de ouro do design system (cores, glassmorphism, animações)?
4. Quais são os 3 papéis de usuário e o que cada um acessa?
5. Qual foi a última mudança registrada no log (data, hora e o que foi feito)?
6. Quais são os pitfalls/bugs conhecidos que eu NÃO devo repetir?

Se você conseguir responder tudo com precisão, confirme que está 100% contextualizado no Will Treinos PRO e pronto para operar.
```

---

## 🔍 PASSO 2 — Auditoria Completa do App (Cole depois do Teste)

```
Você agora é o Arqueólogo de Código + Guardião de Segurança + Head Coach do Will Treinos PRO.

Execute uma AUDITORIA FORENSE COMPLETA do projeto, área por área, seguindo esta ordem:

## FASE 1 — MAPEAMENTO ESTRUTURAL
Leia a estrutura de src/ inteira. Liste:
- Todas as páginas (app router routes)
- Todos os componentes críticos
- Todos os contexts e seus hooks
- Todas as libs utilitárias
- Dependências externas no package.json

## FASE 2 — AUDITORIA DE LÓGICA (página por página)
Para cada página em src/app/, analise:
- O que ela renderiza?
- Quais contexts ela consome?
- Existe lógica duplicada que já existe em outro context?
- Existem TODOs, FIXMEs ou código comentado?
- O fluxo de dados está correto (context → componente → UI)?

## FASE 3 — AUDITORIA DE SEGURANÇA
Verifique:
- Existe NEXT_PUBLIC_ expondo chave secreta?
- Existe acesso a dados sem verificação de papel (user.role)?
- Existem rotas que deveriam estar protegidas no middleware.ts?
- Uploads têm validação de MIME e tamanho?
- Cookies estão configurados com HttpOnly + SameSite?

## FASE 4 — AUDITORIA DE PERFORMANCE
Verifique:
- Componentes usando useApp() diretamente em vez dos contexts especializados?
- useMemo e useCallback faltando em computações pesadas?
- Algum Client Component que poderia ser Server Component?
- Queries N+1 em chamadas Supabase?

## FASE 5 — AUDITORIA DE DESIGN SYSTEM
Verifique em cada componente:
- Usa glassmorphism (backdrop-blur + bg-black/40 + border-white/5)?
- Botões e cards têm whileTap={{ scale: 0.97 }}?
- Transições são spring physics (não duration linear)?
- Touch targets ≥ 44px?
- Algum placeholder de imagem genérico?
- motionTokens.ts está sendo usado nos modais?

## FASE 6 — RELATÓRIO EXECUTIVO
Entregue um relatório no formato:

🔴 CRÍTICO (bloqueia produção): [lista]
🟠 ALTO (feature quebrada): [lista]
🟡 MÉDIO (UX degradada): [lista]
🟢 BOM (funciona bem): [lista]
💎 OPORTUNIDADES (pode ser melhorado): [lista]

Prioridade de correção sugerida: [lista ordenada]

NÃO faça nenhuma alteração ainda. Apenas analise e reporte.
```

---

## 🚀 PASSO 3 — Desafio de Design Surpreendente (Cole depois da Auditoria)

```
Agora você é o Arquiteto de UI/UX Premium + Mago das Animações do Will Treinos PRO.

Missão: Escolha A PÁGINA OU COMPONENTE com maior potencial visual do projeto
e refatore-o para um nível Silicon Valley Tier-1 — algo que faça o Will soltar um "CARALHO" ao ver.

Regras do desafio:
1. Escolha você mesmo qual área tem o maior potencial (pode ser Login, Cockpit, Perfil do Atleta, etc.)
2. Implemente glassmorphism profundo com camadas de blur sobrepostas
3. Use Framer Motion com spring physics em TUDO (cards, botões, modais, transições)
4. Adicione micro-animações que ninguém espera (ex: contador de XP animado, barra de progresso líquida, avatar com glow pulsante)
5. Deve funcionar perfeitamente no mobile (touch targets 44px, scroll nativo, safe-area)
6. Nada de placeholder — se precisar de dados, use os mocks do projeto
7. Ao terminar, rode pnpm run build para confirmar que está verde

Entregue o código completo e me diga qual foi sua escolha e o porquê.
Registre a mudança no WILLPRO_MASTER_MEMORY.md após concluir.
```

---

## ⚡ PROMPTS RÁPIDOS (uso diário)

### Ver o que está quebrado agora:
```
Rode pnpm exec tsc --noEmit e me mostre todos os erros TypeScript com localização exata e sugestão de fix para cada um.
```

### Forçar registro de memória:
```
Leia as últimas mudanças que fizemos e registre tudo no WILLPRO_MASTER_MEMORY.md no formato padrão do projeto (data BRT, arquivos, status do build).
```

### Iniciar uma feature nova com contexto completo:
```
Leia o CLAUDE.md e o WILLPRO_MASTER_MEMORY.md.
Quero implementar [NOME DA FEATURE].
Antes de escrever qualquer código, me diga:
1. Quais arquivos existentes serão afetados?
2. Qual context especializado deve ser usado ou criado?
3. Existe algum pitfall conhecido que devo evitar?
4. Qual é o plano de implementação passo a passo?
Aguarde minha aprovação antes de começar.
```

### Revisar um componente específico:
```
Faça uma auditoria completa do componente [NOME_DO_ARQUIVO].tsx:
- Lógica está correta e sem duplicação?
- Design segue o sistema do Will Treinos?
- Performance está ok (memos, callbacks, re-renders)?
- Segurança está ok (sem exposição de dados, RLS respeitado)?
- Mobile está ok (touch targets, scroll, safe-area)?
Entregue o código corrigido se houver problemas.
```

### Deploy rápido:
```
Valide o projeto completo (tsc + build), e se tudo estiver verde, faça o commit com mensagem descritiva e push para origin/main.
```
