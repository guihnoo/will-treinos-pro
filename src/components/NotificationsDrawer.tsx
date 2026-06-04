"use client";

/**
 * @deprecated Use NotificationPulseSheet diretamente.
 * Mantido como wrapper fino para compatibilidade com código legado.
 */
import dynamic from "next/dynamic";

const NotificationPulseSheet = dynamic(
  () => import("@/components/notifications/NotificationPulseSheet"),
  { ssr: false },
);

interface Props { open: boolean; onClose: () => void; }

export default function NotificationsDrawer({ open, onClose }: Props) {
  return <NotificationPulseSheet open={open} onClose={onClose} />;
}
