/** Sufixo único curto para ids otimistas (local-first antes do Supabase). */
export function willUid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
