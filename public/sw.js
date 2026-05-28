self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title || "Агро известие", {
      body: payload.body || "Имате нови задачи.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: payload.url || "/tasks" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/tasks";
  event.waitUntil(clients.openWindow(targetUrl));
});
