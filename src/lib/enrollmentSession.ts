/** Canal de matrícula: setado ao abrir `/cadastro` (link do dono). */
export const WT_MATRICULA_CHANNEL = "wt_matricula_channel";

/** Valor = epoch ms da confirmação «Sou equipe» (TTL abaixo). */
export const WT_STAFF_OAUTH_OK = "wt_staff_oauth_ok";

/** Janela para iniciar Google/Facebook após confirmar equipe (mesma aba). */
export const STAFF_OAUTH_GATE_TTL_MS = 45 * 60 * 1000;

export function setMatriculaChannelActive(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WT_MATRICULA_CHANNEL, "1");
}

function staffOAuthGateExpiresAt(raw: string | null): number | null {
  if (!raw) return null;
  const at = Number(raw);
  if (!Number.isFinite(at) || at <= 0) return null;
  return at + STAFF_OAUTH_GATE_TTL_MS;
}

export function setStaffOAuthGateOk(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WT_STAFF_OAUTH_OK, String(Date.now()));
}

/** Remove bypass de equipe (ex.: após OAuth concluído). */
export function clearStaffOAuthGate(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WT_STAFF_OAUTH_OK);
}

function isStaffOAuthGateValid(): boolean {
  if (typeof window === "undefined") return false;
  const expires = staffOAuthGateExpiresAt(sessionStorage.getItem(WT_STAFF_OAUTH_OK));
  if (expires == null) return false;
  if (Date.now() > expires) {
    sessionStorage.removeItem(WT_STAFF_OAUTH_OK);
    return false;
  }
  return true;
}

export function canUseSocialOAuthFromLogin(): boolean {
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem(WT_MATRICULA_CHANNEL) === "1") return true;
  return isStaffOAuthGateValid();
}
