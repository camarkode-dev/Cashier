"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEngine = void 0;
const db_1 = require("./db");
const api_1 = require("./api");
class SyncEngine {
    syncing = false;
    interval = null;
    currentBranchId = null;
    currentTenantId = null;
    start(branchId, tenantId) {
        this.currentBranchId = branchId;
        this.currentTenantId = tenantId;
        this.sync(branchId, tenantId);
        this.interval = setInterval(() => this.sync(branchId, tenantId), 30_000);
        window.addEventListener('online', () => this.sync(branchId, tenantId));
    }
    syncNow() {
        if (this.currentBranchId && this.currentTenantId) {
            return this.sync(this.currentBranchId, this.currentTenantId);
        }
    }
    stop() {
        if (this.interval)
            clearInterval(this.interval);
    }
    async sync(branchId, tenantId) {
        if (this.syncing || !navigator.onLine)
            return;
        this.syncing = true;
        try {
            await Promise.all([
                this.syncProducts(branchId),
                this.syncCustomers(),
                this.syncPendingSales(tenantId),
            ]);
        }
        catch {
            // Sync errors are non-fatal; retry next interval
        }
        finally {
            this.syncing = false;
        }
    }
    async syncProducts(branchId) {
        try {
            const res = await api_1.productsApi.list({ limit: 1000, branchId });
            const products = res?.data || res || [];
            await db_1.db.transaction('rw', db_1.db.products, async () => {
                await db_1.db.products.clear();
                await db_1.db.products.bulkPut(products.map((p) => ({
                    id: p.id,
                    categoryId: p.categoryId,
                    name: p.name,
                    nameAr: p.nameAr,
                    barcode: p.barcode,
                    price: p.price,
                    costPrice: p.costPrice,
                    taxRate: p.taxRate,
                    unit: p.unit,
                    image: p.image,
                    category: p.category,
                    stock: p.inventory?.[0]?.quantity ?? 0,
                    updatedAt: p.updatedAt,
                })));
            });
        }
        catch {
            // Retain stale cached products if network fails
        }
    }
    async syncCustomers() {
        try {
            const res = await api_1.customersApi.list({ limit: 2000 });
            const customers = res?.data || res || [];
            await db_1.db.transaction('rw', db_1.db.customers, async () => {
                await db_1.db.customers.clear();
                await db_1.db.customers.bulkPut(customers.map((c) => ({
                    id: c.id,
                    name: c.name,
                    nameAr: c.nameAr,
                    phone: c.phone,
                    email: c.email,
                    loyaltyPoints: c.loyaltyPoints,
                })));
            });
        }
        catch {
            // Retain stale cached customers if network fails
        }
    }
    async syncPendingSales(tenantId) {
        const pending = await db_1.db.getPendingSales(tenantId);
        if (!pending.length)
            return;
        try {
            const results = await api_1.salesApi.syncOffline(pending.map((s) => ({
                branchId: s.branchId,
                customerId: s.customerId,
                items: s.items,
                discountAmount: s.discountAmount,
                paidAmount: s.paidAmount,
                paymentMethod: s.paymentMethod,
                notes: s.notes,
                offlineId: s.offlineId,
            })));
            for (const result of results?.data || results || []) {
                if (result.status === 'synced' || result.status === 'already_synced') {
                    await db_1.db.sales
                        .where('offlineId')
                        .equals(result.offlineId)
                        .modify({ status: 'synced', syncedAt: new Date().toISOString() });
                }
            }
        }
        catch {
            // Sales will be retried on next sync cycle
        }
    }
    get isSyncing() { return this.syncing; }
}
exports.syncEngine = new SyncEngine();
//# sourceMappingURL=sync.js.map