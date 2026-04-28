'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith('Cashier')) {
              caches.delete(key).catch(() => {});
            }
          });
        });
      }

      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Listen for messages from SW (e.g., trigger offline sync)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_OFFLINE_SALES') {
            import('@/lib/sync').then(({ syncEngine }) => syncEngine.syncNow());
          }
        });

        // Register background sync when online
        if ('sync' in reg) {
          window.addEventListener('online', () => {
            (reg as any).sync?.register('sync-offline-sales').catch(() => {});
          });
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
