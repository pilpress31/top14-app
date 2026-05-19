// ============================================
// SERVICE WORKER — Top14 Pronos
// Cache agressif multi-stratégie
// ============================================

const APP_VERSION = 'v4';
const CACHE_STATIC = `top14-static-${APP_VERSION}`;
const CACHE_API    = `top14-api-${APP_VERSION}`;
const CACHE_IMAGES = `top14-images-${APP_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

const API_HOSTS = ['top14-api-production.up.railway.app'];
const AUTH_HOSTS = ['supabase.co', 'supabase.com'];

// ── INSTALL ─────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] Install ${APP_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activate ${APP_VERSION}`);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !k.endsWith(APP_VERSION))
          .map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// ── FETCH ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Auth → Network Only
  if (AUTH_HOSTS.some(h => url.hostname.includes(h))) return;

  // API Railway → Stale While Revalidate
  if (API_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(staleWhileRevalidate(request, CACHE_API));
    return;
  }

  // Images / logos → Cache First longue durée
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)
  ) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  // Assets statiques JS/CSS/fonts → Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf)$/i)
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Navigation HTML → Network First + fallback SPA
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Reste → Network First
  event.respondWith(networkFirst(request, CACHE_STATIC));
});

// ── STRATÉGIES ───────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Ressource non disponible offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        // Notifier les clients qu'une donnée fraîche est disponible
        // → useRealtimeSync écoute ce message et recharge les données
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
          .then(clients => clients.forEach(client =>
            client.postMessage({ type: 'SW_DATA_UPDATED', url: request.url })
          ));
      }
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise || offlineApiResponse();
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Non disponible offline', { status: 503 });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;
    return new Response(OFFLINE_PAGE, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

function offlineApiResponse() {
  return new Response(
    JSON.stringify({ offline: true, message: 'Données non disponibles hors connexion' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

// ── PAGE OFFLINE ─────────────────────────────
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Top14 Pronos — Hors connexion</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;align-items:center;
         justify-content:center;min-height:100vh;margin:0;
         background:#f5f5dc;color:#333;text-align:center;padding:2rem}
    .card{background:white;border-radius:1rem;padding:2rem;
          box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:360px}
    .icon{font-size:3rem;margin-bottom:1rem}
    h1{color:#D4AF37;font-size:1.4rem;margin-bottom:.5rem}
    p{color:#666;font-size:.9rem;line-height:1.5}
    button{margin-top:1.5rem;background:#D4AF37;color:white;border:none;
           padding:.75rem 2rem;border-radius:.5rem;font-size:1rem;cursor:pointer}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🏉</div>
    <h1>Hors connexion</h1>
    <p>Vous n'êtes pas connecté à internet.<br>
       Certaines données peuvent être disponibles depuis le cache.</p>
    <button onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`;

// ── PUSH NOTIFICATIONS ───────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'Notification',
    body: 'Vous avez une nouvelle notification'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || data.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://app.top14pronos.fr';
  event.waitUntil(clients.openWindow(url));
});
