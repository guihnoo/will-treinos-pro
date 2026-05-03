# CURSOR PLUGINS — Will Treinos PRO

> Instalar em: Cursor Settings → Plugins (Marketplace Oficial)

---

## ⭐ PRIORIDADE ALTA — Instalar agora

### 🟦 Vercel Plugin
**Link:** https://cursor.com/cn/marketplace/vercel
**Skills incluídas:** `ai-architect`, `deployment-expert`, `performance-optimizer` + 25 mais

**Por que instalar:**
O projeto usa Vercel como deploy. Este plugin dá ao Cursor acesso a:
- Status dos deployments em tempo real
- Logs de produção
- Métricas de performance por rota
- `ai-architect` → analisa a arquitetura e sugere melhorias Next.js 15
- `performance-optimizer` → audita bundle e Core Web Vitals automaticamente

**Como usar:**
```
@deployment-expert por que o último deploy falhou?
@performance-optimizer qual rota tem maior bundle size?
@ai-architect analise a arquitetura do projeto e sugira melhorias
```

---

### 🟧 Sentry Plugin
**Link:** https://cursor.com/cn/marketplace/sentry
**Skills incluídas:** `sentry-code-review`, `sentry-browser-sdk`, `sentry-find-bugs`, `sentry-security-review` + 26 mais

**Por que instalar:**
- `sentry-find-bugs` → escaneia mudanças locais procurando bugs antes do push
- `sentry-security-review` → auditoria de segurança especializada (injection, XSS, auth bypass, IDOR)
- `sentry-code-review` → review seguindo práticas de engenharia Sentry (das melhores do mundo)
- Monitora erros de produção — quando o Will reportar um bug, o Cursor já sabe o stack trace

**Como usar:**
```
@sentry-find-bugs analise as mudanças desta sessão
@sentry-security-review verifique o sistema de autenticação
```

---

### 🟦 Vercel + Supabase (via skill manual)
> Supabase não tem plugin oficial ainda, mas a skill de segurança cobre.

---

## ✅ PRIORIDADE MÉDIA — Instalar quando necessário

### 🟪 Parallel Plugin
**Link:** https://cursor.com/cn/marketplace/parallel
**Skills:** `parallel-web-search`, `parallel-deep-research`

**Por que instalar:**
Quando precisar pesquisar múltiplas coisas ao mesmo tempo:
- Buscar documentação de 3 libs simultaneamente
- Pesquisar soluções para um problema complexo de múltiplos ângulos

**Caso de uso:**
```
@parallel-deep-research Como implementar push notifications PWA com Next.js 15 + Supabase?
```

---

### 🟫 Postman Plugin
**Link:** https://cursor.com/cn/marketplace/postman
**Skills:** `api-readiness-analyzer`, `postman-routing`

**Por que instalar:**
Quando a Sprint 9.0 (Oráculo AI) exigir APIs externas e webhooks.
`api-readiness-analyzer` → verifica se as API Routes do Next.js estão prontas para produção.

---

### 📊 Pendo Plugin
**Link:** https://cursor.com/cn/marketplace/pendo
**Skills:** `account-health`, `feature-adoption`

**Por que instalar (futuro):**
Quando tiver usuários reais → entender quais features estão sendo usadas, quais estão sendo ignoradas.
`account-health` → saúde por conta (Will vai saber quais alunos estão desengajando antes de cancelar).

---

## 🔮 FUTURO — Quando o projeto escalar

### Linear Plugin
**Link:** https://cursor.com/cn/marketplace/linear
Para gestão de issues e sprints quando tiver time.

### Figma Plugin
**Link:** https://cursor.com/cn/marketplace/figma
Para quando tiver designer trabalhando em paralelo.
`generate-design` → Figma → código direto.

### Slack Plugin
**Link:** https://cursor.com/cn/marketplace/slack
Para notificações automáticas de deploy no canal da equipe.

---

## 📋 Como instalar plugins no Cursor

1. Abrir Cursor
2. `Cmd/Ctrl + Shift + P` → `Open Settings`
3. Aba **Plugins**
4. Buscar pelo nome
5. Clicar em **Install**
6. As skills ficam disponíveis automaticamente com `@nome-da-skill`

---

## 🧩 Skills do repositório NÃO instaladas (e por quê)

| Skill | Motivo para não instalar agora |
|---|---|
| `adding-analytics` (PostHog) | Sprint 9.0 — prioridade futura |
| `adding-e2e-tests` (Playwright) | Ainda sem cobertura de testes |
| `adding-docker` | Deploy via Vercel, não Docker |
| `setting-up-ci` | Vercel já faz CI automaticamente |
| `kubernetes-deploying` | Escala futura, não agora |
| `react-native-patterns` | PWA, não React Native |
| `adding-stripe` | Pagamentos via PIX/manual |
| `python-tdd-with-uv` | Stack TypeScript |
| `anthropic-pdf/docx/pptx` | Sem necessidade atual |

> Estas skills foram avaliadas e descartadas conscientemente. Reavalie quando o contexto mudar.
