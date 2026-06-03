/**
 * URL pública do app — tier gratuito usa Vercel (.vercel.app).
 * Defina NEXT_PUBLIC_APP_URL em produção (ex.: https://will-treinos-pro.vercel.app).
 */
const PRODUCTION_DEFAULT = "https://will-treinos-pro.vercel.app";

export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, "")}`;

  if (process.env.NODE_ENV === "production") return PRODUCTION_DEFAULT;
  return "http://localhost:3000";
}

export function publicAppPath(path: string): string {
  const base = getPublicAppUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
