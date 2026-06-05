/**
 * Avatar URLs: uploaded (data), Supabase/public URLs (http/https), or app-relative paths (/…).
 * Anything else is treated as a Dicebear seed string.
 */
export function isDirectUserAvatar(avatar: string | null | undefined): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith("data:") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("/")
  );
}

/** Foto real enviada (Storage/data/URL) — ignora seeds Dicebear usados só na UI. */
export function studentHasRealAvatar(
  ...sources: (string | null | undefined)[]
): boolean {
  return sources.some((s) => isDirectUserAvatar(s));
}

export function avatarSrc(
  avatar: string | undefined | null,
  fallbackSeed: string = "default"
): string {
  if (!avatar) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed)}`;
  }
  if (isDirectUserAvatar(avatar)) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatar)}`;
}
