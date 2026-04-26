import Dexie, { Table } from 'dexie';

export interface OfflineProduct {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  nameAr?: string;
  barcode?: string;
  price: number;
  taxRate?: number;
  unit: string;
  image?: string;
  category?: { name: string; nameAr?: string; color: string };
  stock?: number;
  updatedAt: string;
}

export interface OfflineSale {
  id: string;
  offlineId: string;
  tenantId: string;
  branchId: string;
  userId: string;
  customerId?: string;
  invoiceNumber: string;
  items: OfflineSaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  payments?: any;
  notes?: string;
  loyaltyPointsUsed?: number;
  status: 'pending_sync' | 'synced' | 'failed';
  createdAt: string;
  syncedAt?: string;
}

export interface OfflineSaleItem {
  productId: string;
  name: string;
  nameAr?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface OfflineCustomer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints: number;
}

export interface SyncQueue {
  id?: number;
  type: 'sale' | 'product_update';
  payload: any;
  createdAt: string;
  retries: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

export class PosDatabase extends Dexie {
  products!: Table<OfflineProduct, string>;
  sales!: Table<OfflineSale, string>;
  customers!: Table<OfflineCustomer, string>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('AwladAymanPOS');
    this.version(1).stores({
      products: 'id, tenantId, barcode, categoryId',
      sales: 'id, offlineId, tenantId, branchId, status, createdAt',
      customers: 'id, tenantId, phone',
      syncQueue: '++id, type, status, createdAt',
    });
  }

  async getProductByBarcode(tenantId: string, barcode: string) {
    return this.products.where({ tenantId, barcode }).first();
  }

  async searchProducts(tenantId: string, query: string, limit = 20) {
    const q = query.toLowerCase();
    return this.products
      .where('tenantId')
      .equals(tenantId)
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameAr || '').includes(q) ||
        (p.barcode || '').includes(q),
      )
      .limit(limit)
      .toArray();
  }

  async getPendingSales(tenantId: string) {
    return this.sales.where({ tenantId, status: 'pending_sync' }).toArray();
  }

  async addToSyncQueue(type: SyncQueue['type'], payload: any) {
    return this.syncQueue.add({
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    });
  }

  async clearSyncedSales(tenantId: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    await this.sales
      .where('tenantId')
      .equals(tenantId)
      .filter((s) => s.status === 'synced' && new Date(s.createdAt) < cutoff)
      .delete();
  }
}

export const db = new PosDatabase();
