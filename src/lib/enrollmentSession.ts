/** Canal de matrícula: setado ao abrir `/cadastro` com convite válido (link do dono). */
export const WT_MATRICULA_CHANNEL = "wt_matricula_channel";

/** Token do query `?invite=` — mesma aba; usado para UX e futura validação server-side. */
export const WT_INVITE_TOKEN = "wt_invite_token";

/** Valor = epoch ms da confirmação «Sou equipe» (TTL abaixo). */
export const WT_STAFF_OAUTH_OK = "wt_staff_oauth_ok";

/** Janela para iniciar Google/Facebook após confirmar equipe (mesma aba). */
export const STAFF_OAUTH_GATE_TTL_MS = 45 * 60 * 1000;

export function setMatriculaChannelActive(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WT_MATRICULA_CHANNEL, "1");
}

/** Persiste `?invite=` na sessão e devolve token atual (URL ou já guardado). */
export function persistInviteTokenFromSearch(searchParamsString: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const inv = new URLSearchParams(searchParamsString || "").get("invite")?.trim();
    if (inv) {
      sessionStorage.setItem(WT_INVITE_TOKEN, inv);
      return inv;
    }
  } catch {
    /* ignore */
  }
  const stored = sessionStorage.getItem(WT_INVITE_TOKEN)?.trim();
  return stored || null;
}

export function hasStoredInviteToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(WT_INVITE_TOKEN)?.trim());
}

/** Produção: `NEXT_PUBLIC_REQUIRE_CADASTRO_INVITE=true` — só cadastro com `?invite=` (ou token já guardado na sessão). */
export function cadastroInviteRequired(): boolean {
  return process.env.NEXT_PUBLIC_REQUIRE_CADASTRO_INVITE === "true";
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

/** Ambientes dev/staging: OAuth liberado sem gate «equipe» / canal matrícula (defina só em build não público). */
export function isLoginOperatorMode(): boolean {
  return process.env.NEXT_PUBLIC_LOGIN_OPERATOR_MODE === "true";
}

export function canUseSocialOAuthFromLogin(): boolean {
  if (typeof window === "undefined") return true;
  if (isLoginOperatorMode()) return true;
  if (sessionStorage.getItem(WT_MATRICULA_CHANNEL) === "1") return true;
  return isStaffOAuthGateValid();
}
