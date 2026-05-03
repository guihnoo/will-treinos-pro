# /sprint — Status atual do projeto e próximas prioridades

## Uso
`/sprint`

## O que faz
Lê o `WILLPRO_MASTER_MEMORY.md` e o `CLAUDE.md`, analisa o estado atual do projeto e gera um relatório executivo com:

1. **Última sprint concluída** — o que foi feito
2. **Estado atual** — o que está funcional em produção
3. **Pontos frágeis** — TODO, issues conhecidos, código incompleto
4. **Próximas prioridades** — o que deve ser feito agora
5. **Saúde do projeto** — TypeScript errors, build status, débito técnico

## Passos
1. Ler `WILLPRO_MASTER_MEMORY.md` (últimas 10 entradas do log)
2. Ler `CLAUDE.md` (roadmap e arquitetura)
3. Fazer grep por `TODO`, `FIXME`, `HACK`, `TEMP` em `src/`
4. Verificar se há arquivos com `any` tipo explícito
5. Gerar relatório estruturado

## Formato do Relatório
```
🏐 WILL TREINOS PRO — Sprint Status

📅 Data: [hoje]
🔖 Última sprint: [nome]

✅ CONCLUÍDO RECENTEMENTE:
- [item 1]
- [item 2]

⚠️ PONTOS FRÁGEIS:
- [TODO encontrado em arquivo:linha]

🎯 PRÓXIMAS PRIORIDADES:
1. [Alta prioridade]
2. [Média prioridade]

🏥 SAÚDE DO CÓDIGO:
- TypeScript: [status]
- TODOs: [N encontrados]
- any types: [N encontrados]
- Dívida técnica: [descrição]
```
