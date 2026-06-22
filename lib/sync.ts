import { db } from './db';
import { salesApi, productsApi, customersApi } from './api';

class SyncEngine {
  private syncing = false;
  private interval: NodeJS.Timeout | null = null;
  private currentBranchId: string | null = null;
  private currentTenantId: string | null = null;

  start(branchId: string, tenantId: string) {
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
    if (this.interval) clearInterval(this.interval);
  }

  async sync(branchId: string, tenantId: string) {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;

    try {
      await Promise.all([
        this.syncProducts(branchId),
        this.syncCustomers(),
        this.syncPendingSales(tenantId),
      ]);
    } catch {
      // Sync errors are non-fatal; retry next interval
    } finally {
      this.syncing = false;
    }
  }

  private async syncProducts(branchId: string) {
    try {
      const res: any = await productsApi.list({ limit: 1000, branchId });
      const products = res?.data || res || [];

      await db.transaction('rw', db.products, async () => {
        await db.products.clear();
        await db.products.bulkPut(
          products.map((p: any) => ({
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
          })),
        );
      });
    } catch {
      // Retain stale cached products if network fails
    }
  }

  private async syncCustomers() {
    try {
      const res: any = await customersApi.list({ limit: 2000 });
      const customers = res?.data || res || [];
      await db.transaction('rw', db.customers, async () => {
        await db.customers.clear();
        await db.customers.bulkPut(
          customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            nameAr: c.nameAr,
            phone: c.phone,
            email: c.email,
            loyaltyPoints: c.loyaltyPoints,
          })),
        );
      });
    } catch {
      // Retain stale cached customers if network fails
    }
  }

  private async syncPendingSales(tenantId: string) {
    const pending = await db.getPendingSales(tenantId);
    if (!pending.length) return;

    try {
      const results: any = await salesApi.syncOffline(
        pending.map((s) => ({
          branchId: s.branchId,
          customerId: s.customerId,
          items: s.items,
          discountAmount: s.discountAmount,
          paidAmount: s.paidAmount,
          paymentMethod: s.paymentMethod,
          payments: s.payments,
          notes: s.notes,
          offlineId: s.offlineId,
        })),
      );

      for (const result of results?.data || results || []) {
        if (result.status === 'synced' || result.status === 'already_synced') {
          await db.sales
            .where('offlineId')
            .equals(result.offlineId)
            .modify({ status: 'synced', syncedAt: new Date().toISOString() });
        }
      }
    } catch {
      // Sales will be retried on next sync cycle
    }
  }

  get isSyncing() { return this.syncing; }
}

export const syncEngine = new SyncEngine();
