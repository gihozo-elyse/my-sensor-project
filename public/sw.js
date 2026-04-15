self.addEventListener("push", function (event) {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logg.jpeg",
      badge: "/logg.jpeg",
      tag: data.tag || "mine-safe",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});
