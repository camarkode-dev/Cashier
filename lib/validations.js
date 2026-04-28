"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierSchema = exports.expenseSchema = exports.updateUserSchema = exports.createUserSchema = exports.branchSchema = exports.customerSchema = exports.categorySchema = exports.stockTransferSchema = exports.offlineSyncSchema = exports.saleSchema = exports.saleItemSchema = exports.productUpdateSchema = exports.productSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// ─── Auth ────────────────────────────────────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
// ─── Products ────────────────────────────────────────────────────────────────
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameAr: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative(),
    costPrice: zod_1.z.number().nonnegative().default(0),
    taxRate: zod_1.z.number().min(0).max(100).default(0),
    categoryId: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
    minStock: zod_1.z.number().int().nonnegative().default(5),
    initialStock: zod_1.z.number().int().nonnegative().default(0),
    branchId: zod_1.z.string().optional(),
});
exports.productUpdateSchema = exports.productSchema.partial();
// ─── Sales ───────────────────────────────────────────────────────────────────
exports.saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    name: zod_1.z.string(),
    nameAr: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    costPrice: zod_1.z.number().nonnegative().default(0),
    discountAmount: zod_1.z.number().nonnegative().default(0),
    discountPercent: zod_1.z.number().min(0).max(100).default(0),
    taxRate: zod_1.z.number().min(0).max(100).default(0),
});
exports.saleSchema = zod_1.z.object({
    branchId: zod_1.z.string(),
    customerId: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.saleItemSchema).min(1),
    discountAmount: zod_1.z.number().nonnegative().default(0),
    discountPercent: zod_1.z.number().min(0).max(100).default(0),
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'MOBILE', 'QR', 'SPLIT']).default('CASH'),
    paidAmount: zod_1.z.number().nonnegative(),
    notes: zod_1.z.string().optional(),
    offlineId: zod_1.z.string().optional(),
});
exports.offlineSyncSchema = zod_1.z.object({
    sales: zod_1.z.array(exports.saleSchema.extend({
        offlineId: zod_1.z.string(),
        createdAt: zod_1.z.string().optional(),
    })),
});
// ─── Stock Transfer ──────────────────────────────────────────────────────────
exports.stockTransferSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    fromBranchId: zod_1.z.string(),
    toBranchId: zod_1.z.string(),
    quantity: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().optional(),
});
// ─── Categories ──────────────────────────────────────────────────────────────
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameAr: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
// ─── Customers ───────────────────────────────────────────────────────────────
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameAr: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
// ─── Branches ────────────────────────────────────────────────────────────────
exports.branchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameAr: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    isMain: zod_1.z.boolean().default(false),
});
// ─── Users ───────────────────────────────────────────────────────────────────
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['OWNER', 'ADMIN', 'CASHIER']).default('CASHIER'),
    branchId: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial().omit({ password: true, email: true });
// ─── Expenses ────────────────────────────────────────────────────────────────
exports.expenseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    titleAr: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive(),
    category: zod_1.z.string(),
    paymentMethod: zod_1.z.string().default('CASH'),
    notes: zod_1.z.string().optional(),
    branchId: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
});
// ─── Suppliers ───────────────────────────────────────────────────────────────
exports.supplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameAr: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=validations.js.map