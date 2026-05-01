/** Canal de matrícula: setado ao abrir `/cadastro` (link do dono). */
export const WT_MATRICULA_CHANNEL = "wt_matricula_channel";

/** Dono/professor/staff confirma que pode usar OAuth na tela de login sem passar por cadastro. */
export const WT_STAFF_OAUTH_OK = "wt_staff_oauth_ok";

export function setMatriculaChannelActive(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WT_MATRICULA_CHANNEL, "1");
}

export function setStaffOAuthGateOk(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WT_STAFF_OAUTH_OK, "1");
}

export function canUseSocialOAuthFromLogin(): boolean {
  if (typeof window === "undefined") return true;
  return (
    sessionStorage.getItem(WT_MATRICULA_CHANNEL) === "1" || sessionStorage.getItem(WT_STAFF_OAUTH_OK) === "1"
  );
}
