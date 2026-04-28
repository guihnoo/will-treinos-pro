/**
 * avatarSrc — returns the correct image source for a student/user avatar
 * - If the avatar value starts with "data:" it's a real uploaded photo → use directly
 * - Otherwise treat it as a seed for the dicebear generated avatar
 */
export function avatarSrc(avatar: string | undefined | null): string {
  if (!avatar) return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
  if (avatar.startsWith("data:")) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatar)}`;
}
