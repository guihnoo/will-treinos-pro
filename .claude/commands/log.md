# /log — Registrar mudança no Master Memory

## Uso
`/log`

## O que faz
Abre o `WILLPRO_MASTER_MEMORY.md`, analisa as últimas mudanças feitas e insere um registro formatado no bloco **## 3. LOG DE ATUALIZAÇÕES**.

## Formato do Registro
```
- **[DATA/HORA BRT] (Claude):** **[Sprint/Feature]** — [Descrição técnica]. Build OK (exit 0). **Git:** push `origin/main`.
```

## Passos
1. Ler o `WILLPRO_MASTER_MEMORY.md`
2. Identificar as últimas mudanças do contexto atual
3. Formatar o registro com a timestamp atual (BRT = UTC-3)
4. Inserir no TOPO do bloco de log (linha após `## 3. LOG DE ATUALIZAÇÕES`)
5. Confirmar o registro inserido

## Regras
- NUNCA usar linguagem vaga ("ajustes", "melhorias")
- SEMPRE mencionar os arquivos alterados
- SEMPRE incluir status do build
- Data/hora deve ser real (não placeholder)
