/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Push event: recebe e exibe a notificação
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string; icon?: string; badge?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Will Treinos PRO", body: event.data.text() };
  }

  const title = payload.title ?? "Will Treinos PRO";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/badge-72.svg",
    data: { url: payload.url ?? "/dashboard" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notificationclick: abre a URL associada à notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string })?.url ?? "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
