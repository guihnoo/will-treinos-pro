/**
 * Offline-First Sync Queue
 *
 * Permite que o app funcione 100% offline. Ações são enfileiradas localmente
 * e sincronizadas automaticamente quando volta internet.
 *
 * Exemplo:
 *   await syncQueue.add({
 *     id: 'checkin_123',
 *     action: 'requestCheckIn',
 *     payload: { lessonId, studentId },
 *     createdAt: Date.now(),
 *     retries: 0,
 *   });
 *
 * Service Worker detecta conectividade e processa fila em background.
 */

export interface QueuedAction {
  id: string;
  action:
    | "requestCheckIn"
    | "approveCheckIn"
    | "addPost"
    | "togglePostLike"
    | "addPaymentProof"
    | "custom";
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
  lastError?: string;
  lastRetryAt?: number;
}

const LS_KEY = "wt_sync_queue";
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1min, 5min

class SyncQueue {
  /**
   * Adiciona ação à fila
   */
  static add(action: QueuedAction): void {
    const queue = this.getAll();
    queue.push(action);
    this.persist(queue);
  }

  /**
   * Remove ação da fila (sucesso)
   */
  static remove(id: string): void {
    const queue = this.getAll().filter((a) => a.id !== id);
    this.persist(queue);
  }

  /**
   * Marca como retry failed (incrementa contador)
   */
  static markRetried(id: string, error?: string): void {
    const queue = this.getAll();
    const action = queue.find((a) => a.id === id);
    if (action) {
      action.retries += 1;
      action.lastError = error;
      action.lastRetryAt = Date.now();
      if (action.retries >= MAX_RETRIES) {
        // Deixa na fila com flag de "deu erro depois de 5 tentativas"
        // Admin vai ver no dashboard
      }
    }
    this.persist(queue);
  }

  /**
   * Retorna toda a fila
   */
  static getAll(): QueuedAction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Retorna ações que precisam ser retentadas
   */
  static getPending(): QueuedAction[] {
    const queue = this.getAll();
    const now = Date.now();
    return queue.filter((action) => {
      if (action.retries >= MAX_RETRIES) {
        // Pula ações que já foram retentadas 5 vezes (espera manual)
        return false;
      }
      if (!action.lastRetryAt) {
        // Nunca foi tentada, vai
        return true;
      }
      const delay = RETRY_DELAYS[Math.min(action.retries, RETRY_DELAYS.length - 1)];
      const shouldRetry = now - action.lastRetryAt >= delay;
      return shouldRetry;
    });
  }

  /**
   * Retorna status agregado para UI
   */
  static getStatus() {
    const queue = this.getAll();
    const pending = this.getPending();
    return {
      total: queue.length,
      pending: pending.length,
      failed: queue.filter((a) => a.retries >= MAX_RETRIES).length,
      isEmpty: queue.length === 0,
    };
  }

  /**
   * Limpa toda a fila (útil após sync bem-sucedido ou reset)
   */
  static clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LS_KEY);
  }

  // ===== PRIVATE =====

  private static persist(queue: QueuedAction[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEY, JSON.stringify(queue));
  }
}

export default SyncQueue;

/**
 * Processador de fila (roda no Service Worker ou background)
 *
 * Exemplo:
 *   const processor = new SyncQueueProcessor({
 *     onSuccess: (action) => console.log('✅ Synced:', action.id),
 *     onFailure: (action, error) => console.log('❌ Failed:', error),
 *   });
 *   await processor.processAll();
 */
export class SyncQueueProcessor {
  constructor(
    private options: {
      onSuccess?: (action: QueuedAction) => void;
      onFailure?: (action: QueuedAction, error: string) => void;
      onProgress?: (processed: number, total: number) => void;
    } = {},
  ) {}

  async processAll(jwt?: string): Promise<void> {
    const pending = SyncQueue.getPending();
    if (pending.length === 0) return;

    for (let i = 0; i < pending.length; i++) {
      const action = pending[i];
      try {
        await this.processOne(action, jwt);
        SyncQueue.remove(action.id);
        this.options.onSuccess?.(action);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        SyncQueue.markRetried(action.id, errorMsg);
        this.options.onFailure?.(action, errorMsg);
      }
      this.options.onProgress?.(i + 1, pending.length);
    }
  }

  private async processOne(action: QueuedAction, jwt?: string): Promise<void> {
    // Validar JWT antes de enviar
    if (!jwt) {
      throw new Error("JWT não disponível para sincronização");
    }

    const response = await fetch("/api/sync/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  }
}
