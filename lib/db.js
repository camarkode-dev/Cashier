"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.PosDatabase = void 0;
const dexie_1 = __importStar(require("dexie"));
class PosDatabase extends dexie_1.default {
    products;
    sales;
    customers;
    syncQueue;
    constructor() {
        super('AwladAymanPOS');
        this.version(1).stores({
            products: 'id, tenantId, barcode, categoryId',
            sales: 'id, offlineId, tenantId, branchId, status, createdAt',
            customers: 'id, tenantId, phone',
            syncQueue: '++id, type, status, createdAt',
        });
    }
    async getProductByBarcode(tenantId, barcode) {
        return this.products.where({ tenantId, barcode }).first();
    }
    async searchProducts(tenantId, query, limit = 20) {
        const q = query.toLowerCase();
        return this.products
            .where('tenantId')
            .equals(tenantId)
            .filter((p) => p.name.toLowerCase().includes(q) ||
            (p.nameAr || '').includes(q) ||
            (p.barcode || '').includes(q))
            .limit(limit)
            .toArray();
    }
    async getPendingSales(tenantId) {
        return this.sales.where({ tenantId, status: 'pending_sync' }).toArray();
    }
    async addToSyncQueue(type, payload) {
        return this.syncQueue.add({
            type,
            payload,
            createdAt: new Date().toISOString(),
            retries: 0,
            status: 'pending',
        });
    }
    async clearSyncedSales(tenantId) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        await this.sales
            .where('tenantId')
            .equals(tenantId)
            .filter((s) => s.status === 'synced' && new Date(s.createdAt) < cutoff)
            .delete();
    }
}
exports.PosDatabase = PosDatabase;
exports.db = new PosDatabase();
//# sourceMappingURL=db.js.map