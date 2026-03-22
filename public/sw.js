// Service Worker pour PWA + Push Notifications
const CACHE_NAME = 'top14-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installé');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Stratégie Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes API Railway/Supabase
  if (
    event.request.url.includes('railway.app') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('supabase.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache les ressources statiques
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications
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
  const url = event.notification.data?.url || 'https://app.top14pronos.org';
  event.waitUntil(clients.openWindow(url));
});
