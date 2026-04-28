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
    category?: {
        name: string;
        nameAr?: string;
        color: string;
    };
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
export declare class PosDatabase extends Dexie {
    products: Table<OfflineProduct, string>;
    sales: Table<OfflineSale, string>;
    customers: Table<OfflineCustomer, string>;
    syncQueue: Table<SyncQueue, number>;
    constructor();
    getProductByBarcode(tenantId: string, barcode: string): Promise<OfflineProduct | undefined>;
    searchProducts(tenantId: string, query: string, limit?: number): Promise<OfflineProduct[]>;
    getPendingSales(tenantId: string): Promise<OfflineSale[]>;
    addToSyncQueue(type: SyncQueue['type'], payload: any): Promise<number>;
    clearSyncedSales(tenantId: string): Promise<void>;
}
export declare const db: PosDatabase;
//# sourceMappingURL=db.d.ts.map