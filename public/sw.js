// Service Worker pour PWA + Push Notifications

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  event.waitUntil(clients.claim());
});

// Écouter les push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification reçue');
  
  const data = event.data ? event.data.json() : {
    title: 'Notification',
    body: 'Vous avez une nouvelle notification'
  };

  const options = {
    body: data.body || data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification cliquée');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('https://app.top14pronos.org')
  );
});