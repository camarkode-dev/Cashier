'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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
    }
  }, []);

  return null;
}
