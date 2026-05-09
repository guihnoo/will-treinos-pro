# 🚀 COMO USAR — LIVE AUDIT & INNOVATION PROMPT

> Esse prompt faz o Claude Code auditar o app inteiro, área por área, página por página,
> E ainda propõe inovações criativas para elevar o produto.

---

## 📋 PASSO A PASSO

### 1️⃣ Abra o terminal integrado do Cursor
```
Ctrl + ` (backtick) ou Terminal → New Terminal
```

### 2️⃣ Vá para a pasta do projeto (se ainda não estiver lá)
```powershell
cd C:\Users\monte\Desktop\will-treinos-pro
```

### 3️⃣ Inicie o Claude Code
```powershell
claude
```

### 4️⃣ Cole o prompt completo
```
Cole o conteúdo do arquivo:
.agent-arsenal/PROMPT_LIVE_AUDIT_AND_INNOVATION.md
```

**Como copiar o conteúdo:**
- Abra o arquivo no Cursor
- Ctrl+A (selecionar tudo)
- Ctrl+C (copiar)
- Cole no terminal do Claude Code

---

## 🎯 O QUE VAI ACONTECER

O Claude Code vai:

### Fase 1 — Mapa do App (~5 min)
→ Lista TODAS as páginas e rotas existentes
→ Mostra o status de cada uma (✅ OK | ⚠️ Incompleto | ❌ Quebrado)

### Fase 2 — Auditoria Página por Página (~15-20 min)
Para CADA página, ele analisa:
- O que está funcionando bem
- O que está incompleto
- O que está quebrado
- 💡 Inovações criativas que ele PROPÕE

### Fase 3 — Score de Lançamento (~5 min)
→ Gera um score de 0-100 pontos
→ Mostra o que bloqueia o lançamento
→ Mostra o que é nice-to-have

### Fase 4 — Explosão Criativa (~10 min)
Propostas detalhadas em 5 categorias:
- Gamificação 2.0 (streaks, torneios, skill trees)
- Superpoderes do Coach (IA, algoritmos, clips de vídeo)
- Experiência Premium do Aluno
- Features de IA (Vercel AI SDK)
- Inteligência de Negócio (financeiro, previsão, churn)

### Fase 5 — Plano de Sprints (~5 min)
→ Sprint crítico (lançamento)
→ Sprint de alto valor
→ Sprint de inovação
→ Data estimada de lançamento

### Fase 6 — Decisão
→ Claude pergunta o que você quer atacar primeiro
→ Você escolhe → Ele executa

---

## ⚙️ CONFIGURAÇÃO RECOMENDADA

Para melhor resultado, no início da sessão diga ao Claude:

```
"Antes de começar, ative o Context7 para ter documentação
atualizada do Next.js 15 e Supabase. Use o subagente
@volleyball-coach para validar lógica de domínio esportivo."
```

---

## 💡 DICAS PARA EXTRAIR O MÁXIMO

### Se quiser mais criatividade:
```
"Seja mais ousado nas inovações. Pensa como o Duolingo pensa
em gamificação — o que tornaria esse app viciante?"
```

### Se quiser focar em um problema específico:
```
"Pula direto para a Fase 2, seção 2.3 (Área do Aluno).
Quero ver só os problemas e inovações dessa área."
```

### Se quiser executar imediatamente:
```
"Identifiquei o problema X. Pode implementar agora?
Siga o protocolo: proposta → aprovação → código."
```

### Se quiser validar o banco de dados:
```
"Use o MCP do Supabase para verificar se as RLS policies
estão corretas nas tabelas xp_log, students e lessons."
```

---

## 📁 ARQUIVOS RELACIONADOS

| Arquivo | Descrição |
|---------|-----------|
| `PROMPT_LIVE_AUDIT_AND_INNOVATION.md` | **← O PROMPT PRINCIPAL** (use este) |
| `PROMPT_MASTER_CLAUDE_CODE.md` | Prompt de setup inicial do ecossistema |
| `COMO_USAR_PROMPT_MASTER.md` | Como usar o prompt de setup |
| `mcp-config.json` | Configuração dos MCPs |

---

## 🔴 PROBLEMAS COMUNS

### "Claude não está respondendo em português"
→ Diga: `"Responda em Português (pt-BR) a partir de agora. Obrigado."`

### "Claude ficou preso em uma fase"
→ Diga: `"Continue para a próxima fase."`

### "Claude propôs algo e quer implementar sem perguntar"
→ Diga: `"Espera. Primeiro me explica a abordagem, depois eu aprovo."`

### "Quero que ele seja ainda mais criativo"
→ Diga: `"Você tem liberdade total. O que você faria se não houvesse limite de tempo ou recursos?"`

---

> **Lembre:** O Claude Code tem acesso total aos arquivos do projeto.
> Ele vai LER o código real, não apenas sugerir coisas genéricas.
> O resultado é uma auditoria baseada no que REALMENTE existe no codebase.
