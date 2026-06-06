const CACHE_NAME = 'Cashier-v3';

const STATIC_ASSETS = [
  '/',
  '/pos',
  '/dashboard',
  '/login',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon.png',
  '/apple-icon.png',
  '/badge-72.png',
];

const API_CACHE_URLS = [
  '/api/products',
  '/api/categories',
  '/api/branches',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (request.method !== 'GET') return;

  if (
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_URLS.some((path) => url.pathname.startsWith(path));
    if (!shouldCache) return;

    event.respondWith(
      fetch(request.clone())
        .then((response) => {
          if (response.ok) {
            const responseForCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseForCache)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(JSON.stringify({ success: false, error: 'Offline', data: [] }), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/') || new Response('Offline', { status: 503 });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const shouldCache =
            response.ok &&
            (
              request.url.includes('/icons/') ||
              request.url.includes('/icon-') ||
              request.url.includes('/apple-icon') ||
              request.url.includes('/_next/static/')
            );
          const responseForCache = shouldCache ? response.clone() : null;
          if (
            responseForCache
          ) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseForCache)).catch(() => {});
          }
          return response;
        }),
    ),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(syncOfflineSales());
  }
});

async function syncOfflineSales() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.postMessage({ type: 'SYNC_OFFLINE_SALES' }));
  } catch {}
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'أولاد أيمن', {
      body: data.message || '',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      dir: 'rtl',
      lang: 'ar',
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
