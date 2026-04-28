import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const productSchema: z.ZodObject<{
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    costPrice: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    minStock: z.ZodDefault<z.ZodNumber>;
    initialStock: z.ZodDefault<z.ZodNumber>;
    branchId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    costPrice: number;
    taxRate: number;
    initialStock: number;
    minStock: number;
    isActive: boolean;
    description?: string | undefined;
    image?: string | undefined;
    nameAr?: string | undefined;
    barcode?: string | undefined;
    sku?: string | undefined;
    categoryId?: string | undefined;
    branchId?: string | undefined;
}, {
    name: string;
    price: number;
    description?: string | undefined;
    image?: string | undefined;
    nameAr?: string | undefined;
    costPrice?: number | undefined;
    barcode?: string | undefined;
    sku?: string | undefined;
    categoryId?: string | undefined;
    taxRate?: number | undefined;
    initialStock?: number | undefined;
    branchId?: string | undefined;
    minStock?: number | undefined;
    isActive?: boolean | undefined;
}>;
export declare const productUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    nameAr: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    barcode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    costPrice: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    taxRate: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    minStock: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    initialStock: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    branchId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    nameAr?: string | undefined;
    price?: number | undefined;
    costPrice?: number | undefined;
    barcode?: string | undefined;
    sku?: string | undefined;
    categoryId?: string | undefined;
    taxRate?: number | undefined;
    initialStock?: number | undefined;
    branchId?: string | undefined;
    minStock?: number | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    nameAr?: string | undefined;
    price?: number | undefined;
    costPrice?: number | undefined;
    barcode?: string | undefined;
    sku?: string | undefined;
    categoryId?: string | undefined;
    taxRate?: number | undefined;
    initialStock?: number | undefined;
    branchId?: string | undefined;
    minStock?: number | undefined;
    isActive?: boolean | undefined;
}>;
export declare const saleItemSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    costPrice: z.ZodDefault<z.ZodNumber>;
    discountAmount: z.ZodDefault<z.ZodNumber>;
    discountPercent: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    productId: string;
    quantity: number;
    costPrice: number;
    taxRate: number;
    unitPrice: number;
    discountAmount: number;
    discountPercent: number;
    nameAr?: string | undefined;
    barcode?: string | undefined;
}, {
    name: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    nameAr?: string | undefined;
    costPrice?: number | undefined;
    barcode?: string | undefined;
    taxRate?: number | undefined;
    discountAmount?: number | undefined;
    discountPercent?: number | undefined;
}>;
export declare const saleSchema: z.ZodObject<{
    branchId: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        nameAr: z.ZodOptional<z.ZodString>;
        barcode: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        costPrice: z.ZodDefault<z.ZodNumber>;
        discountAmount: z.ZodDefault<z.ZodNumber>;
        discountPercent: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        productId: string;
        quantity: number;
        costPrice: number;
        taxRate: number;
        unitPrice: number;
        discountAmount: number;
        discountPercent: number;
        nameAr?: string | undefined;
        barcode?: string | undefined;
    }, {
        name: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        nameAr?: string | undefined;
        costPrice?: number | undefined;
        barcode?: string | undefined;
        taxRate?: number | undefined;
        discountAmount?: number | undefined;
        discountPercent?: number | undefined;
    }>, "many">;
    discountAmount: z.ZodDefault<z.ZodNumber>;
    discountPercent: z.ZodDefault<z.ZodNumber>;
    paymentMethod: z.ZodDefault<z.ZodEnum<["CASH", "CARD", "MOBILE", "QR", "SPLIT"]>>;
    paidAmount: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    offlineId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paymentMethod: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT";
    branchId: string;
    discountAmount: number;
    discountPercent: number;
    items: {
        name: string;
        productId: string;
        quantity: number;
        costPrice: number;
        taxRate: number;
        unitPrice: number;
        discountAmount: number;
        discountPercent: number;
        nameAr?: string | undefined;
        barcode?: string | undefined;
    }[];
    paidAmount: number;
    notes?: string | undefined;
    offlineId?: string | undefined;
    customerId?: string | undefined;
}, {
    branchId: string;
    items: {
        name: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        nameAr?: string | undefined;
        costPrice?: number | undefined;
        barcode?: string | undefined;
        taxRate?: number | undefined;
        discountAmount?: number | undefined;
        discountPercent?: number | undefined;
    }[];
    paidAmount: number;
    notes?: string | undefined;
    paymentMethod?: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT" | undefined;
    offlineId?: string | undefined;
    customerId?: string | undefined;
    discountAmount?: number | undefined;
    discountPercent?: number | undefined;
}>;
export declare const offlineSyncSchema: z.ZodObject<{
    sales: z.ZodArray<z.ZodObject<{
        branchId: z.ZodString;
        customerId: z.ZodOptional<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            name: z.ZodString;
            nameAr: z.ZodOptional<z.ZodString>;
            barcode: z.ZodOptional<z.ZodString>;
            quantity: z.ZodNumber;
            unitPrice: z.ZodNumber;
            costPrice: z.ZodDefault<z.ZodNumber>;
            discountAmount: z.ZodDefault<z.ZodNumber>;
            discountPercent: z.ZodDefault<z.ZodNumber>;
            taxRate: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            productId: string;
            quantity: number;
            costPrice: number;
            taxRate: number;
            unitPrice: number;
            discountAmount: number;
            discountPercent: number;
            nameAr?: string | undefined;
            barcode?: string | undefined;
        }, {
            name: string;
            productId: string;
            quantity: number;
            unitPrice: number;
            nameAr?: string | undefined;
            costPrice?: number | undefined;
            barcode?: string | undefined;
            taxRate?: number | undefined;
            discountAmount?: number | undefined;
            discountPercent?: number | undefined;
        }>, "many">;
        discountAmount: z.ZodDefault<z.ZodNumber>;
        discountPercent: z.ZodDefault<z.ZodNumber>;
        paymentMethod: z.ZodDefault<z.ZodEnum<["CASH", "CARD", "MOBILE", "QR", "SPLIT"]>>;
        paidAmount: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    } & {
        offlineId: z.ZodString;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        paymentMethod: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT";
        branchId: string;
        offlineId: string;
        discountAmount: number;
        discountPercent: number;
        items: {
            name: string;
            productId: string;
            quantity: number;
            costPrice: number;
            taxRate: number;
            unitPrice: number;
            discountAmount: number;
            discountPercent: number;
            nameAr?: string | undefined;
            barcode?: string | undefined;
        }[];
        paidAmount: number;
        notes?: string | undefined;
        customerId?: string | undefined;
        createdAt?: string | undefined;
    }, {
        branchId: string;
        offlineId: string;
        items: {
            name: string;
            productId: string;
            quantity: number;
            unitPrice: number;
            nameAr?: string | undefined;
            costPrice?: number | undefined;
            barcode?: string | undefined;
            taxRate?: number | undefined;
            discountAmount?: number | undefined;
            discountPercent?: number | undefined;
        }[];
        paidAmount: number;
        notes?: string | undefined;
        paymentMethod?: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT" | undefined;
        customerId?: string | undefined;
        createdAt?: string | undefined;
        discountAmount?: number | undefined;
        discountPercent?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sales: {
        paymentMethod: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT";
        branchId: string;
        offlineId: string;
        discountAmount: number;
        discountPercent: number;
        items: {
            name: string;
            productId: string;
            quantity: number;
            costPrice: number;
            taxRate: number;
            unitPrice: number;
            discountAmount: number;
            discountPercent: number;
            nameAr?: string | undefined;
            barcode?: string | undefined;
        }[];
        paidAmount: number;
        notes?: string | undefined;
        customerId?: string | undefined;
        createdAt?: string | undefined;
    }[];
}, {
    sales: {
        branchId: string;
        offlineId: string;
        items: {
            name: string;
            productId: string;
            quantity: number;
            unitPrice: number;
            nameAr?: string | undefined;
            costPrice?: number | undefined;
            barcode?: string | undefined;
            taxRate?: number | undefined;
            discountAmount?: number | undefined;
            discountPercent?: number | undefined;
        }[];
        paidAmount: number;
        notes?: string | undefined;
        paymentMethod?: "CASH" | "CARD" | "MOBILE" | "QR" | "SPLIT" | undefined;
        customerId?: string | undefined;
        createdAt?: string | undefined;
        discountAmount?: number | undefined;
        discountPercent?: number | undefined;
    }[];
}>;
export declare const stockTransferSchema: z.ZodObject<{
    productId: z.ZodString;
    fromBranchId: z.ZodString;
    toBranchId: z.ZodString;
    quantity: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes?: string | undefined;
}, {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes?: string | undefined;
}>;
export declare const categorySchema: z.ZodObject<{
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    nameAr?: string | undefined;
}, {
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    nameAr?: string | undefined;
}>;
export declare const customerSchema: z.ZodObject<{
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
}>;
export declare const branchSchema: z.ZodObject<{
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    isMain: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isMain: boolean;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
}, {
    name: string;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
    isMain?: boolean | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["OWNER", "ADMIN", "CASHIER"]>>;
    branchId: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    role: "CASHIER" | "OWNER" | "ADMIN";
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    branchId?: string | undefined;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: "CASHIER" | "OWNER" | "ADMIN" | undefined;
    phone?: string | undefined;
    branchId?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["OWNER", "ADMIN", "CASHIER"]>>>;
    branchId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "password" | "email">, "strip", z.ZodTypeAny, {
    role?: "CASHIER" | "OWNER" | "ADMIN" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    branchId?: string | undefined;
}, {
    role?: "CASHIER" | "OWNER" | "ADMIN" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    branchId?: string | undefined;
}>;
export declare const expenseSchema: z.ZodObject<{
    title: z.ZodString;
    titleAr: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    category: z.ZodString;
    paymentMethod: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    date?: string | undefined;
    notes?: string | undefined;
    branchId?: string | undefined;
    titleAr?: string | undefined;
}, {
    title: string;
    category: string;
    amount: number;
    date?: string | undefined;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    branchId?: string | undefined;
    titleAr?: string | undefined;
}>;
export declare const supplierSchema: z.ZodObject<{
    name: z.ZodString;
    nameAr: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
    notes?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    nameAr?: string | undefined;
    address?: string | undefined;
    notes?: string | undefined;
}>;
//# sourceMappingURL=validations.d.ts.map