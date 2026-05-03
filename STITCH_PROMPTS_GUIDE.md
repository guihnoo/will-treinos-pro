# 🎨 STITCH PROMPTS — Guia de Uso

**Você tem 2 prompts diferentes. Qual usar?**

---

## 🎯 ESCOLHA SEU CAMINHO

### **OPÇÃO A: Refinamento de 1 Design (Original)**
**Arquivo:** `STITCH_MASTER_PROMPT.md`

```
Melhor se: Você quer refinar um único design em profundidade
Timeline: 2-3 horas (Stitch) + 3-4h (Claude Code)
Resultado: 1 design polido e pronto para código

Processo:
1. Copia prompt do STITCH_MASTER_PROMPT.md
2. Cola no Stitch
3. Refina: cores → tipografia → componentes → animações
4. Exporta design tokens JSON
5. Claude Code implementa direto (rápido)

✅ Pros:
  • Rápido ir para código
  • Menos confusão
  • Visão clara desde o início

❌ Contras:
  • Não explora alternativas criativas
  • Risco de "e se usássemos outra cor?"
```

---

### **OPÇÃO B: Exploração de 10 Visuais (NOVO)**
**Arquivo:** `STITCH_EXPLORATION_PROMPT.md`

```
Melhor se: Você quer testar múltiplas direções criativas
Timeline: 3-4 horas (Stitch geração) + 2h (decisão) + 3-4h (Claude Code)
Resultado: 10 temas para escolher melhor

Processo:
1. Copia prompt do STITCH_EXPLORATION_PROMPT.md
2. Cola no Stitch pedindo "Gere 10 temas"
3. Vê 10 visuais completamente diferentes
4. Escolhe seu favorito (ou combina elementos)
5. Avisa Claude Code
6. Claude Code implementa o vencedor

✅ Pros:
  • Explora criatividade ao máximo
  • Vê alternativas que não pensou
  • Votação = melhor decisão
  • Pode combinar elementos de vários

❌ Contras:
  • Mais tempo até código
  • Mais para decidir
  • Risco de "paralisia por opções"
```

---

## 📊 COMPARAÇÃO RÁPIDA

| Aspecto | Opção A (1 Design) | Opção B (10 Temas) |
|---------|---|---|
| **Tempo total** | 5-7h | 8-10h |
| **Criatividade** | Média | Muito alta |
| **Velocidade code** | Rápido | Normal |
| **Confiança** | Média | Alta (escolha informada) |
| **Best for** | Já sabe o caminho | Exploração + inovação |

---

## 🚀 MEU VOTO

**RECOMENDAÇÃO:** Comece com **OPÇÃO B (10 Temas)**

**Por quê?**
1. Você ainda não viu todas as possibilidades criativas
2. O projeto é novo = oportunidade de explorar
3. Escolher entre 10 é mais seguro que refinar 1
4. Pode combinar: cores de um + tipografia de outro
5. Ao final, tem confiança de que escolheu o melhor

**Timeline sugerido:**
```
Semana 1:
├─ Seg-Ter: Você envia EXPLORATION prompt → Stitch gera 10 temas
├─ Ter-Qua: Você vota top 3
└─ Qua-Qui: Combina elementos + envia descrição do vencedor

Semana 2:
├─ Seg: Stitch refina o vencedor em detalhes (design tokens, specs)
├─ Ter-Qua: Claude Code implementa em React
└─ Qui-Sex: Testes + deploy
```

---

## 📋 PASSO A PASSO (Opção B Recomendada)

### **Passo 1: Enviar ao Stitch**
```
1. Abra: STITCH_EXPLORATION_PROMPT.md
2. Copie todo o prompt (de ╔════ até 🚀)
3. Cole no Stitch/Figma
4. Instrução adicional:
   "Gere 10 design themes COMPLETAMENTE DIFERENTES
    para Will Treinos PRO Login + Cadastro.
    Organize em grid para comparação fácil.
    Cada tema deve ter: tipografia, cores, componentes funcionais,
    mobile (375px) e desktop (1440px) views."
```

### **Passo 2: Avaliar os 10 Temas**
```
Enquanto aguarda Stitch gerar, você pode:
• Ler a descrição de cada tema (já está no prompt)
• Já pensar qual faz mais sentido para Will
• Anotar 3 favoritos

Quando ver os mockups:
• Compare lado-a-lado
• Teste cada um em mobile (screenshot 375px)
• Vote: 1º lugar, 2º lugar, 3º lugar
```

### **Passo 3: Votação**
```
Crie um documento simples com:

🥇 1º LUGAR: [Tema] — Porque...
   • Ponto forte 1
   • Ponto forte 2
   • Alinhamento com brand

🥈 2º LUGAR: [Tema] — Porque...
   • ...

🥉 3º LUGAR: [Tema] — Porque...
   • ...

[OPCIONAL] Elementos para combinar:
   • Cores de Tema X
   • Tipografia de Tema Y
   • Animações de Tema Z
```

### **Passo 4: Informar Claude Code**
```
Envie mensagem:
"Aqui está a votação dos 10 temas:
- 1º lugar: [Tema]
- 2º lugar: [Tema]
- 3º lugar: [Tema]

Favorito é o [TEMA] porque [motivo].
Design tokens: [link Figma]
"

Claude Code vai:
• Criar Login.tsx + Cadastro.tsx
• Implementar design tokens
• Integrar OAuth
• Testar RLS
• Deploy Vercel
```

---

## 🎨 OS 10 TEMAS (Preview)

Se quiser já ter ideia, aqui está cada um:

| # | Nome | Vibe | Cores |
|---|------|------|-------|
| 1 | Dark Luxury Gold | Premium, ouro destaque | Gold (#EAB308) + Dark |
| 2 | Neon Athletic | Dinâmico, gym culture | Neon Green + Magenta |
| 3 | Minimal Blue | Clean, Apple-like | Bright Blue + White |
| 4 | Cyber Purple | Gaming, futurista | Purple + Cyan + Glow |
| 5 | Warm Orange | Brasileiro, quente | Warm Orange + Yellow |
| 6 | Dark Red Athlete | Atlético, poder | Bold Red + Amber |
| 7 | Gradient Sunset | Moderno, trending | Red → Yellow gradient |
| 8 | Retro 80s | Nostálgico, arcade | Hot Pink + Cyan + Yellow |
| 9 | Monochrome Black | Ultra-minimal | Black + White only |
| 10 | Glassmorphism Pro | Premium, layered | Purple + Cyan + Glass |

---

## ⚡ TOMAR DECISÃO RÁPIDO?

Se tiver pressa (não quer esperar 4 horas):

**Use OPÇÃO A (1 Design):**
```
1. Copia STITCH_MASTER_PROMPT.md
2. Cola no Stitch
3. Refina (2-3h)
4. Exporta
5. Claude Code implementa (3-4h)
= Pronto em ~7h total
```

---

## 🎯 MINHA SUGESTÃO FINAL

**Faça assim:**

```
HOJE (Agora):
  ☐ Escolha OPÇÃO A ou B (A = rápido, B = criativo)
  ☐ Copie o prompt correspondente
  ☐ Cole no Stitch
  ☐ Envie para geração

ENQUANTO STITCH TRABALHA:
  ☐ Eu posso começar preparativos (estrutura React, Tailwind, setup)
  ☐ Você avalia os 10 temas (ou o 1 refinado)
  ☐ Fazemos em paralelo (ganha tempo)

QUANDO TIVER O DESIGN PRONTO:
  ☐ Você compartilha link Figma + design tokens
  ☐ Eu implemento (2-3h)
  ☐ Testamos juntos (1h)
  ☐ Deploy (automático Vercel)

= Pronto para produção em ~3 dias
```

---

## 📞 QUAL QUER USAR?

**Responda:**
- [ ] **A** — Refinar 1 design (rápido para código)
- [ ] **B** — Explorar 10 temas (criativo, melhor decisão)
- [ ] **Começar agora** — Qual arquivo enviar ao Stitch?

---

**Ready? 🚀**

