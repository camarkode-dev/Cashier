const CACHE_NAME = 'kasher-v1';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/pos',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const API_CACHE_URLS = [
  '/api/products',
  '/api/categories',
  '/api/branches',
];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }),
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Never intercept auth or Supabase traffic — session cookies must flow untouched
  if (
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase')
  ) return;

  // API routes: network-first with cache fallback for GET
  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') return;

    const shouldCache = API_CACHE_URLS.some((u) => url.pathname.startsWith(u));
    if (!shouldCache) return;

    event.respondWith(
      fetch(request.clone())
        .then((res) => {
          if (res.ok) {
            const cloned = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response(JSON.stringify({ success: false, error: 'Offline', data: [] }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
    );
    return;
  }

  // Navigation: network-first, offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/') || new Response('Offline', { status: 503 });
      }),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok && (request.url.includes('/icons/') || request.url.includes('/_next/static/'))) {
        caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
      }
      return res;
    })),
  );
});

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(syncOfflineSales());
  }
});

async function syncOfflineSales() {
  try {
    // Signal to the main thread to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.postMessage({ type: 'SYNC_OFFLINE_SALES' }));
  } catch {}
}

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'كاشر', {
      body: data.message || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
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
