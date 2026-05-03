# 🚀 Deployment Guide — Real-Time Monitoring

**Status:** ✅ Código em produção (`origin/main`). Migration pronta para aplicar.

---

## Phase 1: Apply Migration to Supabase

### Option A: CLI (Recomendado)
```bash
cd /path/to/will-treinos-pro
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase migration up
```

### Option B: SQL Editor (Dashboard)
1. Abra [Supabase Dashboard](https://app.supabase.com)
2. Selecione o projeto
3. Vá para **SQL Editor**
4. Crie uma nova query e copie o conteúdo de:
   ```
   supabase/migrations/20260503150000_dev_events.sql
   ```
5. Execute

### Option C: Manual (sem CLI)
1. Copie o SQL de `supabase/migrations/20260503150000_dev_events.sql`
2. Passe para o seu DBA / dev que tem acesso ao Supabase
3. Execute na tabela `public`

---

## Phase 2: Test Locally

1. **Inicie o dev server:**
   ```bash
   pnpm run dev
   ```
   Aguarde até: `ready - started server on 0.0.0.0:3000`

2. **Faça login como admin:**
   - URL: `http://localhost:3000/login`
   - Mock login (sem Supabase): clique "Admin"
   - Ou com Supabase: email + password

3. **Acesse o monitor:**
   - URL: `http://localhost:3000/dev/monitor`
   - Deve mostrar:
     - ✅ KPIs: "Alunos Ativos 0", "Pendentes 0", etc
     - ✅ "Nenhum evento registrado ainda" (ou eventos existentes se migration rodou)
     - ✅ Botão "Recarregar" e "Auto-refresh 3s" checkbox

4. **Trigger um evento:**
   - Vá para `/alunos` (Alunos page)
   - Crie um novo aluno (fill form → submit)
   - Volte a `/dev/monitor`
   - Deve aparecer evento `student_created` no feed

---

## Phase 3: Deploy to Production

1. **Vercel automatic:**
   ```bash
   git push origin main
   # → Vercel detects, builds, deploys automaticamente
   # → Aguarde até status ✅ no dashboard Vercel
   ```

2. **Acesse em produção:**
   - URL: `https://seu-app.com/dev/monitor`
   - Faça login como admin
   - Mesmo comportamento que local

3. **Monitore:**
   - Crie alunos, aulas, marque pagamentos
   - Observe logs em tempo real em `/dev/monitor`

---

## Troubleshooting

### "Acesso restrito a admin"
- Certifique-se de que está logado como admin (`user.role === "admin"`)
- Se usar Supabase, garanta que a linha `students` tem `role = 'admin'`

### "Nenhum evento registrado ainda"
- Esperado no primeiro acesso
- Crie um aluno, aula, ou outro recurso para trigger um log
- Clique "Recarregar" para ver o evento aparecer

### "Erro ao carregar eventos"
- Verifique se a migration foi executada: `SELECT * FROM dev_events LIMIT 1;` no Supabase SQL Editor
- Se tabela não existe, execute a migration manualmente
- Verifique RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'dev_events';`

### Auto-refresh não atualiza
- Normal em modo offline (sem Supabase)
- Com Supabase, deve recarregar a cada 3s
- Se não atualiza, verifique console do browser (F12 → Console)

---

## Next: Phase 3 (Opcional)

Implementar **Supabase Realtime** para push updates sem polling:

```typescript
// src/app/dev/monitor/page.tsx — adicionar no useEffect:
supabase
  .channel('dev_events')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dev_events' }, (payload) => {
    setEvents(prev => [payload.new as DevEvent, ...prev].slice(0, 50));
  })
  .subscribe();
```

Resultado: latência de ~50ms ao invés de 3s polling.

---

## Checklist Final

- [ ] Migration executada no Supabase
- [ ] Teste local: `/dev/monitor` mostra KPIs
- [ ] Evento trigger: Crie aluno → aparece em monitor
- [ ] Deploy em produção
- [ ] Acesso em produção com admin
- [ ] Monitorar alguns eventos de verdade (alunos, pagamentos)

**Tempo estimado:** 5-10 minutos (incluindo testes).

**Pronto!** 🎉 App com visibilidade 100% em tempo real.
