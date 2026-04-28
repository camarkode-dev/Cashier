import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ─── Products ────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(0),
  categoryId: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  minStock: z.number().int().nonnegative().default(5),
  initialStock: z.number().int().nonnegative().default(0),
  branchId: z.string().optional(),
});

export const productUpdateSchema = productSchema.partial();

// ─── Sales ───────────────────────────────────────────────────────────────────

export const saleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  nameAr: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const saleSchema = z.object({
  branchId: z.string(),
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE', 'QR', 'SPLIT']).default('CASH'),
  paidAmount: z.number().nonnegative(),
  notes: z.string().optional(),
  offlineId: z.string().optional(),
});

export const offlineSyncSchema = z.object({
  sales: z.array(
    saleSchema.extend({
      offlineId: z.string(),
      createdAt: z.string().optional(),
    }),
  ),
});

// ─── Stock Transfer ──────────────────────────────────────────────────────────

export const stockTransferSchema = z.object({
  productId: z.string(),
  fromBranchId: z.string(),
  toBranchId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// ─── Customers ───────────────────────────────────────────────────────────────

export const customerSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ─── Branches ────────────────────────────────────────────────────────────────

export const branchSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isMain: z.boolean().default(false),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'CASHIER']).default('CASHIER'),
  branchId: z.string().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true, email: true });

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  amount: z.number().positive(),
  category: z.string(),
  paymentMethod: z.string().default('CASH'),
  notes: z.string().optional(),
  branchId: z.string().optional(),
  date: z.string().optional(),
});

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const supplierSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});
