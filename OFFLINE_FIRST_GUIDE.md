# 📱 Offline-First: App Funciona 100% Sem Internet

## Visão Geral

O app deve funcionar **completamente offline**. Quando aluno está em modo avião ou sem sinal:

1. ✅ Consegue solicitar check-in (ação entra em fila local)
2. ✅ Consegue criar posts (ação entra em fila local)
3. ✅ Consegue dar like em posts (ação entra em fila local)
4. ✅ Badge "Sincronizando 3 ações..." aparece no app
5. ⏸️ Quando volta online → sincroniza automaticamente
6. 🔔 Admin recebe notificação retroativa ("João solicitou check-in 5 minutos atrás")

---

## Arquitetura

```
Frontend (App)
  ↓
[Ação] (ex: requestCheckIn)
  ↓
[Online?]
  ├─ SIM  → POST /api/... (sucesso imediato)
  └─ NÃO  → localStorage (fila)
            ↓
            [Service Worker detecta volta]
            ↓
            [Retry automático com backoff]
            ↓
            POST /api/sync/process
            ↓
            Sucesso → Remover da fila
            Erro   → Retry em 5s, 15s, 1min, 5min
```

---

## Implementação

### 1. Estrutura de SyncQueue

```typescript
interface QueuedAction {
  id: string;  // 'checkin_123'
  action: 'requestCheckIn' | 'addPost' | 'togglePostLike' | 'addPaymentProof';
  payload: { lessonId, studentId, ... };
  createdAt: number;  // timestamp
  retries: number;    // tentativas
  lastError?: string;
}
```

**Armazenamento:** localStorage key = `"wt_sync_queue"` → JSON array

**Retry backoff:**
```
Tentativa 1: imediato
Tentativa 2: +1s
Tentativa 3: +5s
Tentativa 4: +15s
Tentativa 5: +1min
Tentativa 6: +5min
Após 5 retries: alerta para admin ("ação pendente há 10 min")
```

---

### 2. Adicionar Ação à Fila

No `useCheckInActions.ts`, quando aluno solicita check-in **offline**:

```typescript
import SyncQueue from "@/lib/syncQueue";

const requestCheckIn = useCallback(
  (lessonId: string, studentId: string) => {
    const arrivedAt = new Date().toISOString();
    
    // 1. Atualizar UI imediatamente (optimistic)
    setLessons(p => p.map(l => l.id === lessonId 
      ? { ...l, checkInRequests: [...(l.checkInRequests || []), { 
          studentId, arrivedAt, status: 'pending' 
        }]} 
      : l
    ));

    // 2. Se online → POST direto
    if (navigator.onLine && usingSupabaseSession) {
      updateLessonRemote(supabase, lessonId, { checkInRequests: updated })
        .then(() => logDevEvent('check_in_requested', ...))
        .catch(error => {
          // POST falhou → ir para fila
          SyncQueue.add({
            id: `checkin_${willUid()}`,
            action: 'requestCheckIn',
            payload: { lessonId, studentId },
            createdAt: Date.now(),
            retries: 0,
          });
        });
    } else {
      // 3. Offline → direto para fila
      SyncQueue.add({
        id: `checkin_${willUid()}`,
        action: 'requestCheckIn',
        payload: { lessonId, studentId },
        createdAt: Date.now(),
        retries: 0,
      });
    }

    // 4. Notificar UI que foi enfileirado
    addNotification({
      type: 'message',
      title: '📤 Aguardando sincronização',
      message: 'Seu check-in será enviado quando a conexão voltar.',
      ...
    });
  },
  [...]
);
```

---

### 3. Integrar Hook de Sync em Layout

No `src/app/layout.tsx`:

```typescript
'use client';

import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useAuth } from '@/context/AuthContext';
import { SyncQueueStatus } from '@/components/SyncQueueStatus';

export default function RootLayout({ children }) {
  const { user } = useAuth();
  const { processPending } = useSyncQueue({
    jwt: user?.accessToken,  // Necessário para fazer POST
    onSyncComplete: () => console.log('✅ Fila sincronizada'),
    onSyncError: (error) => console.error('❌ Erro sync:', error),
  });

  return (
    <html>
      <body>
        {children}
        <SyncQueueStatus />  {/* Badge de status */}
      </body>
    </html>
  );
}
```

---

### 4. Teste Offline

#### Cenário A: Teste em DevTools

1. Abrir app em `http://localhost:3000`
2. Abrir DevTools → Aplicação → Service Workers
3. Marcar "Offline"
4. Tentar solicitar check-in
5. Verificar: localStorage `wt_sync_queue` tem a ação ✅
6. Desmarcar "Offline"
7. Badge "Sincronizando..." aparece e desaparece ✅

#### Cenário B: Teste em Celular Real

1. Abrir app no celular
2. Ativar **modo avião**
3. Solicitar check-in (deve funcionar)
4. Voltar ao modo normal (wifi/rede)
5. Badge "Sincronizando" → depois "✓"
6. No admin, conferir que check-in apareceu

#### Cenário C: Teste de Falha de Rede

1. Abrir DevTools → Aba Network
2. Throttle para 3G lento
3. Clicar "Sincronizar" (manual)
4. Simular falha: desabilitar rede por 10s
5. Reconectar
6. Retry automático deve acontecer

---

## Componentes

### SyncQueueStatus Component

```tsx
<SyncQueueStatus />

// Exibe um badge no canto inferior direito:
// ✅ "Sincronizado ✓"          (fila vazia, online)
// 🔄 "Sincronizando 3..."      (processando)
// ⚠️ "2 falhou(ram)"           (erros, precisa retry)
// 📴 "Offline · 1 ação(ão)"    (sem rede)
```

---

## Operações Suportadas na Fila

### 1. **requestCheckIn**

```typescript
SyncQueue.add({
  action: 'requestCheckIn',
  payload: { lessonId: 'l_123', studentId: 'st_456' },
  ...
});
```

Sincronizado em: `POST /api/sync/process`

### 2. **addPost**

```typescript
SyncQueue.add({
  action: 'addPost',
  payload: { 
    title: 'Novo treino!',
    body: 'Consegui fazer 10 ataques seguidos',
    authorId: 'st_456'
  },
  ...
});
```

### 3. **togglePostLike**

```typescript
SyncQueue.add({
  action: 'togglePostLike',
  payload: { postId: 'p_789' },
  ...
});
```

### 4. **addPaymentProof**

```typescript
SyncQueue.add({
  action: 'addPaymentProof',
  payload: { 
    paymentId: 'pay_999',
    note: 'Transferência realizada'
  },
  ...
});
```

---

## Admin Dashboard: Monitor de Fila

Criar rota `/will/sync-monitor` (admin-only):

```tsx
export default function SyncMonitor() {
  const queue = SyncQueue.getAll();
  
  return (
    <div>
      <h1>Fila de Sincronização</h1>
      <p>Total: {queue.length}</p>
      <p>Aguardando: {SyncQueue.getStatus().pending}</p>
      <p>Falhado: {SyncQueue.getStatus().failed}</p>
      
      <table>
        <thead><tr><th>ID</th><th>Ação</th><th>Criado</th><th>Retries</th><th>Erro</th></tr></thead>
        <tbody>
          {queue.map(q => (
            <tr key={q.id}>
              <td>{q.id}</td>
              <td>{q.action}</td>
              <td>{new Date(q.createdAt).toLocaleString()}</td>
              <td>{q.retries}/5</td>
              <td className="text-red-400">{q.lastError}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Próximos Passos

- [ ] Integrar `useSyncQueue` em layout.tsx
- [ ] Adicionar ações à fila em `useCheckInActions.ts`, `useFeedMutations.ts`
- [ ] Implementar `/api/sync/process` completamente
- [ ] Criar `/will/sync-monitor` dashboard
- [ ] Testar offline → online em DevTools
- [ ] Testar em celular real (modo avião)
- [ ] Monitorar taxa de sucesso via analytics

