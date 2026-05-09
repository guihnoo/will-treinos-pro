# 🎨 COMO USAR — DESIGN REVOLUTION PROMPT

> Esse prompt dá liberdade criativa TOTAL ao Claude para reinventar
> o visual do app do zero — sem preservar nada do design atual.

---

## ⚡ PASSO A PASSO

### 1. Abra o terminal no Cursor
```
Ctrl + `
```

### 2. Inicie o Claude Code
```powershell
claude
```

### 3. Cole o conteúdo do arquivo
```
.agent-arsenal/PROMPT_DESIGN_REVOLUTION.md
```
Abra o arquivo → Ctrl+A → Ctrl+C → cole no terminal

---

## 🎯 O QUE VAI ACONTECER

O Claude vai:

**Fase 0 — Leitura (5 min)**
→ Lê o MASTER_MEMORY e entende o projeto
→ Apresenta a visão criativa em português antes de tocar no código

**Fase 1 — Design System (30 min)**
→ Cria tokens de cores, tipografia, sombras
→ Adiciona Google Fonts (Bebas Neue + Inter + JetBrains Mono)
→ Cria componentes primitivos: WillCard, WillButton, WillBadge

**Fase 2 — Redesign Página por Página**
| Página | Tempo | O que muda |
|--------|-------|-----------|
| `/login` | 1h | Experiência imersiva tipo arena esportiva |
| `/dashboard` | 1.5h | Cockpit do atleta, HUD estilo F1 |
| `/will cockpit` | 1.5h | Centro de comando estilo NASA |
| `/court/live` | 1h | Operações em tempo real |
| `/cadastro` | 1h | Onboarding de elite em steps |
| `/aguardando` | 30min | Sala de espera premium |

---

## 🔑 PONTOS CHAVE DO PROMPT

### O que o Claude PODE fazer:
- ✅ Reinventar completamente o visual de cada página
- ✅ Propor paletas, tipografia, animações novas
- ✅ Criar componentes UI novos do zero
- ✅ Usar glassmorphism, partículas, gradientes
- ✅ Ser ousado e inovador sem pedir permissão

### O que o Claude NÃO pode fazer:
- ❌ Mudar hooks, contexts, API calls
- ❌ Remover funcionalidades existentes
- ❌ Quebrar a lógica de negócio
- ❌ Usar `bg-white` (quebra dark theme)
- ❌ Criar páginas estáticas sem animação

---

## 💡 DICAS PARA EXTRAIR O MÁXIMO

### Para mais criatividade:
```
"Seja mais ousado. Pensa no app como se fosse um produto da Apple 
para atletas profissionais. Nada de genérico."
```

### Para aprovar e continuar:
```
"Aprovado. Implemente e continue para a próxima página."
```

### Se quiser focar em uma página específica:
```
"Pula direto para o redesign do /dashboard. 
Quero ver a visão antes de implementar."
```

### Para ver a proposta antes do código:
```
"Antes de implementar, me descreve visualmente como 
vai ficar o /login. Quero ver a visão completa."
```

### Se quiser mais animações:
```
"Adiciona mais vida. Cada elemento deve ter 
uma micro-animação de entrada ou interação."
```

---

## 🎨 A IDENTIDADE VISUAL DEFINIDA NO PROMPT

| Elemento | Definição |
|----------|-----------|
| **Fundo base** | `#020202` (quase preto, não puro) |
| **Cards** | `#0A0A0A` com glassmorphism |
| **Gold principal** | `#EAB308` com glow ao redor |
| **Tipografia display** | Bebas Neue (headers esportivos) |
| **Tipografia corpo** | Inter (leitura) |
| **Números/dados** | JetBrains Mono (XP, scores, stats) |
| **Animações** | Framer Motion com spring physics |
| **Bordas** | `rgba(255,255,255,0.06)` (ultra sutil) |

---

## ⚠️ IMPORTANTE

O Claude vai **PEDIR APROVAÇÃO** antes de implementar cada página.

Isso é intencional — você vê a visão criativa dele, aprova ou ajusta, 
e só então ele codifica. Assim você tem controle total do resultado.

Se quiser que ele execute sem pedir, diga:
```
"Pode implementar sem precisar de aprovação prévia. 
Confio na sua visão criativa."
```

---

> 🚀 **Resultado esperado:** Um app que ninguém vai reconhecer 
> visualmente comparado ao que existia antes — mas com 
> toda a mesma funcionalidade intacta.
