# Piloto — primeiro aluno real

**URL de produção:** https://will-treinos-pro.vercel.app  
**Objetivo:** validar o fluxo completo **cadastro → aprovação → área do aluno → check-in → XP** com uma pessoa real (não conta de teste do Will).

**Tempo estimado:** 45–60 min (Will + aluno) · **Pré-requisito:** infra Lote A ✅ (Auth, CI, SQL segurança).

---

## 0. Antes de chamar o aluno (5 min — Will)

```powershell
cd c:\Users\monte\Desktop\will-treinos-pro
.\scripts\smoke-production.ps1
```

| Check | Como validar |
|-------|----------------|
| Produção no ar | Smoke acima sem falhas 5xx |
| Você é admin | Login Google → `/dashboard` (Cockpit), não `/cadastro` |
| CI verde | GitHub Actions → último run `main` ✅ |
| PWA no celular | Abrir URL no Chrome → menu **Instalar app** (opcional mas recomendado) |

**SQL rápido** (Supabase → SQL Editor):

```sql
SELECT email, role, is_active FROM staff_access WHERE is_active = true;
SELECT COUNT(*) AS pendentes FROM students WHERE status = 'pending';
```

---

## 1. Escolher o piloto

Ideal para a primeira rodada:

- 1 atleta da quadra, smartphone Android ou iPhone
- Conta Google **ou** e-mail que consiga receber link de senha
- Combinação de horário: você cria **1 aula** no mesmo dia (ou dia seguinte) para testar check-in

Anote:

| Campo | Valor |
|-------|--------|
| Nome | |
| E-mail / Google | |
| Telefone | |
| Data/hora da aula piloto | |

---

## 2. Will prepara o Cockpit (10 min)

### 2.1 Login admin

1. Abra https://will-treinos-pro.vercel.app/login  
2. **Entrar com Google** (conta em `staff_access`)  
3. Deve ir para **`/dashboard`** (Cockpit)

Se cair em `/cadastro` ou loop de login → revisar `staff_access` e Supabase Auth URLs (`docs/RUNBOOK_LANCAMENTO_INFRA.md` §2).

### 2.2 Criar aula piloto

1. Menu **Agenda** → nova aula  
2. Tipo: grupo ou individual (como na rotina real)  
3. Data/hora alinhada com o piloto  
4. Salvar e confirmar que aparece na agenda

### 2.3 (Opcional) Mensagem de boas-vindas

1. Cockpit → enviar recado / broadcast curto: *"Bem-vindo ao Will Treinos PRO — complete seu cadastro pelo link."*  
2. Será validado depois que o aluno estiver aprovado (passo 5.4).

---

## 3. Aluno se cadastra (15 min — no celular dele)

Envie o link direto:

```
https://will-treinos-pro.vercel.app/login
```

### 3.1 Fluxo esperado

| Passo | Tela | O que fazer |
|-------|------|-------------|
| 1 | `/login` | **Criar conta** ou Google |
| 2 | OAuth / e-mail | Concluir auth Supabase |
| 3 | `/signup` | Escolher **Atleta** → nome + telefone (+ Instagram opcional) |
| 4 | Turnstile | Completar CAPTCHA se aparecer |
| 5 | `/aguardando` | Tela *"Analisando..."* com polling automático |

**Não** deve ir direto para `/dashboard` antes da aprovação.

### 3.2 Se travar

| Sintoma | Ação |
|---------|------|
| "Convite inválido" | Ignorar link antigo com `?invite=` — matrícula aberta; usar `/login` limpo |
| Loop login/signup | Limpar cookies do site ou aba anônima |
| Erro CAPTCHA | Tentar outra rede (4G vs Wi‑Fi) ou avisar Will (Turnstile na Vercel) |
| Fica em branco após Google | Conferir redirect `https://will-treinos-pro.vercel.app/auth/callback` no Supabase |

---

## 4. Will aprova (5 min)

### 4.1 Pelo sino (recomendado)

1. No Cockpit, clique no **sino** (Pulse Inbox)  
2. Deve aparecer **Nova inscrição** com nome do piloto  
3. Ação **Aprovar** (ou abrir **Turma → Alunos** com badge de pendentes)

### 4.2 Pelo menu Alunos

1. **Turma → Alunos** (`/alunos`)  
2. Aba / filtro **Pendentes**  
3. Abrir ficha → **Aprovar** (definir plano/mensalidade se o modal pedir)

### 4.3 Validar no banco (opcional)

```sql
SELECT id, name, email, status, auth_user_id
FROM students
WHERE email = '<email-do-piloto>'
ORDER BY joined_at DESC
LIMIT 1;
-- status deve ser 'active' (ou equivalente pós-aprovação)
```

### 4.4 Lado do aluno

- Tela `/aguardando` deve **redirecionar sozinha** para **`/dashboard`** (Início) em até ~30s  
- Se não redirecionar: aluno dá F5 ou reabre o app

---

## 5. Primeira sessão do aluno (15 min)

Checklist **com o piloto na mão**:

| # | Teste | ✅ |
|---|--------|---|
| P1 | Início (`/dashboard`) carrega sem erro | |
| P2 | Card **Próxima aula** mostra a aula que você criou | |
| P3 | **Missão do dia** visível (perfil / check-in / foto) | |
| P4 | **Check-in** — manual ou geo na quadra (se no local) | |
| P5 | Após check-in: feedback visual (+50 XP ou mensagem) | |
| P6 | **Ranking** (`/ranking`) abre sem crash | |
| P7 | **Perfil** — editar foto ou dado básico | |
| P8 | **Sino** → abas Avisos / Recados | |

### 5.1 Check-in

- **Na quadra:** botão de check-in geo no card da aula (se GPS permitido)  
- **Remoto:** check-in manual → fica **pendente** até Will aprovar na aula (`/will/court` ou fluxo da agenda)

Will aprova check-in pendente se testarem fora da quadra.

### 5.2 XP

- Check-in aprovado na quadra: **+50 XP** (regra atual)  
- Avaliação do professor (depois): XP por fundamento  
- Conferir barra de XP / nível no Início subiu

---

## 6. Will valida admin pós-piloto (5 min)

| # | Teste | ✅ |
|---|--------|---|
| W1 | Aluno aparece em **Alunos** como ativo | |
| W2 | Aula mostra aluno presente / check-in | |
| W3 | Recado enviado → aluno vê no **sino** (sem duplicata) | |
| W4 | Financeiro: cobrança `pending` gerada se configurou mensalidade na aprovação | |

Preencha também `docs/QA_LANCAMENTO_MANUAL.md` (colunas ✅/❌).

---

## 7. Troubleshooting rápido

| Problema | Causa provável | Fix |
|----------|----------------|-----|
| Admin não vê alunos | `staff_access` / `wt_is_staff()` | SQL runbook §6 |
| Notificação não chega | Realtime / RLS | F5 no sino; SQL `students` pending |
| Aluno preso em `/aguardando` | Status ainda `pending` | Reaprovar; aluno refresh |
| Check-in não soma XP | Check-in não aprovado | Aprovar na quadra / court live |
| Push não chega | VAPID / permissão browser | Opcional no piloto — validar in-app primeiro |

Logs úteis: Supabase → Logs → Auth / Postgres · Vercel → Deployments → Functions.

---

## 8. Critério de sucesso do piloto

Consideramos **piloto OK** quando:

1. Cadastro + `/aguardando` + aprovação automática ou manual  
2. Aluno entra em **`/dashboard`** estável  
3. Pelo menos **1 check-in** registrado (aprovado)  
4. **XP** refletido na UI  
5. Will consegue **aprovar + agendar + comunicar** sem workaround manual no banco  

Depois disso: segundo aluno, turma pequena (3–5), depois financeiro PIX em produção.

---

## 9. Links úteis

| Recurso | Onde |
|---------|------|
| QA completo | `docs/QA_LANCAMENTO_MANUAL.md` |
| Checklist lançamento | `docs/LANCAMENTO_CHECKLIST.md` |
| Infra / Auth | `docs/RUNBOOK_LANCAMENTO_INFRA.md` |
| Smoke produção | `scripts/smoke-production.ps1` |
| Apresentação cliente | `docs/product-guide/WILL-TREINOS-PRO-APRESENTACAO-CLIENTE.html` |

---

**Última atualização:** 05/06/2026 · Lote D — piloto freemium
