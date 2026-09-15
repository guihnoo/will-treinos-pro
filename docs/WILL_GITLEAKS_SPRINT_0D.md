# WILL GITLEAKS — SPRINT 0D-A

**Data:** 14/09/2026  
**Branch:** `fix/ci-gitleaks-historico`  
**Escopo:** separar leaks históricos do gate de novos segredos  
**Regra:** este documento **nunca** contém valores de secrets.

## Problema

O job `Gitleaks` da Fase 1A fazia `gitleaks detect` em **todo o histórico**.  
6 findings legados derrubavam todo PR eternamente, mesmo sem secret novo.

## Estratégia do gate (obrigatório)

| Evento | Escopo do scan | Workflow / job |
|---|---|---|
| `pull_request` | `base.sha..head.sha` | `ci.yml` → `Gitleaks` |
| `push` (main) | `before..sha` (ou commit único se `before` zero) | `ci.yml` → `Gitleaks` |
| Manual | full-history | `gitleaks-full-history.yml` (**não** required) |

Sempre com `--redact`.  
Self-test no CI: fixture sintética com JWT de exemplo público (jwt.io) — **não** é credencial do Will — deve falhar o detect.

## Findings classificados (valores omitidos)

Reproduzido localmente com Gitleaks 8.21.2 + `--redact` → **6 findings**.

| # | RuleID | Arquivo | Linha | Fingerprint (metadado) | Classificação | No HEAD atual? |
|---|---|---|---|---|---|---|
| 1 | `jwt` | `check_second_admin.js` | 5 | `f2fffb79…:check_second_admin.js:jwt:5` | **Token histórico/expirável** (JWT) | **Sim** (ainda no tree) |
| 2 | `generic-api-key` | `VERCEL_ENV_CHECKLIST.md` | 47 | `bcff1ae1…:VERCEL_ENV_CHECKLIST.md:generic-api-key:47` | **Público por definição** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) | **Sim** |
| 3 | `generic-api-key` | `VERCEL_ENV_CHECKLIST.md` | 48 | `bcff1ae1…:…:48` | **Segredo real** (`SUPABASE_SERVICE_ROLE_KEY`) | **Sim** |
| 4 | `generic-api-key` | `VERCEL_ENV_CHECKLIST.md` | 91 | `bcff1ae1…:…:91` | **Público por definição** (VAPID Public Key) | **Sim** |
| 5 | `generic-api-key` | `VERCEL_ENV_CHECKLIST.md` | 92 | `bcff1ae1…:…:92` | **Segredo real** (VAPID Private Key) | **Sim** |
| 6 | `generic-api-key` | `VERCEL_ENV_CHECKLIST.md` | 99 | `bcff1ae1…:…:99` | **Segredo real** (`VAPID_PRIVATE_KEY`) | **Sim** |

> Nota: o briefing inicial dizia que esses arquivos não estavam na árvore da main.  
> Em `origin/main` pós-merge da Fase 1A (`32bf956`), **ambos ainda existem no HEAD** com os mesmos findings (confirmado via `git cat-file` + scan `--no-git`).  
> Remoção/sanitização dos arquivos = missão separada (fora do escopo 0D-A).

### Política por tipo

| Tipo | Tratamento |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` histórico | **TRATAR COMO COMPROMETIDO ATÉ ROTAÇÃO** |
| `VAPID_PRIVATE_KEY` / Private Key histórica | **TRATAR COMO COMPROMETIDO ATÉ ROTAÇÃO** |
| JWT histórico | Token expirável — considerar comprometido até expirar/revogar sessão; remover do repo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave **pública**; não é segredo (ainda assim: não versionar em docs desnecessariamente) |
| VAPID Public Key | **Pública**; não é segredo |

## O que esta missão NÃO faz

- Não reescreve histórico Git  
- Não altera valores na Vercel  
- Não altera valores no Supabase  
- Não solicita secrets ao usuário  
- Não cria allowlist ampla / `.gitleaksignore` genérico  
- Não remove os arquivos com leak (escopo só CI/docs)

## Ações humanas ainda necessárias

1. **Rotacionar** `SUPABASE_SERVICE_ROLE_KEY` no projeto Supabase (e atualizar só nos secret stores — não no Git).  
2. **Rotacionar** par VAPID (gerar novo; atualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + private nos stores).  
3. Em PR separado: **remover/sanitizar** `check_second_admin.js` e `VERCEL_ENV_CHECKLIST.md` (substituir valores por placeholders).  
4. Manter `Gitleaks` (range) como required; **não** marcar `Gitleaks Full History (legado)` como required.  
5. Rodar periodicamente o workflow manual full-history para acompanhamento.

## Validação feita (0D-A)

- YAML dos workflows parseado  
- Full-history: 6 findings (redacted)  
- Range de commit limpo (ex.: merge CI): **0 leaks** (exit 0)  
- `--no-git` no working tree atual: ainda 6 (arquivos no HEAD)  
- Fixture fake no job CI: deve falhar o detect (secret novo)
