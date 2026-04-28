'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceWorkerRegistrar = ServiceWorkerRegistrar;
const react_1 = require("react");
function ServiceWorkerRegistrar() {
    (0, react_1.useEffect)(() => {
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
                        reg.sync?.register('sync-offline-sales').catch(() => { });
                    });
                }
            })
                .catch(() => { });
        }
    }, []);
    return null;
}
//# sourceMappingURL=ServiceWorkerRegistrar.js.map