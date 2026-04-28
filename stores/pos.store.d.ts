export interface CartItem {
    productId: string;
    name: string;
    nameAr?: string;
    barcode?: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    stock: number;
}
interface POSState {
    cart: CartItem[];
    customerId: string | null;
    customerName: string | null;
    invoiceDiscount: number;
    invoiceDiscountType: 'amount' | 'percent';
    paymentMethod: string;
    splitPayments: {
        method: string;
        amount: number;
    }[];
    notes: string;
    isProcessing: boolean;
    lastSale: any | null;
    addItem: (product: any) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, qty: number) => void;
    setItemDiscount: (productId: string, discount: number, type: 'amount' | 'percent') => void;
    setInvoiceDiscount: (amount: number, type: 'amount' | 'percent') => void;
    setCustomer: (id: string | null, name: string | null) => void;
    setPaymentMethod: (method: string) => void;
    addSplitPayment: (method: string, amount: number) => void;
    removeSplitPayment: (index: number) => void;
    setNotes: (notes: string) => void;
    clearCart: () => void;
    subtotal: () => number;
    totalTax: () => number;
    totalDiscount: () => number;
    total: () => number;
    checkout: (paidAmount: number, tenantId: string, branchId: string, userId: string) => Promise<any>;
}
export declare const usePOSStore: import("zustand").UseBoundStore<import("zustand").StoreApi<POSState>>;
export {};
//# sourceMappingURL=pos.store.d.ts.map