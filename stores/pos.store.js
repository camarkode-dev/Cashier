"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePOSStore = void 0;
const zustand_1 = require("zustand");
const db_1 = require("@/lib/db");
const api_1 = require("@/lib/api");
exports.usePOSStore = (0, zustand_1.create)((set, get) => ({
    cart: [],
    customerId: null,
    customerName: null,
    invoiceDiscount: 0,
    invoiceDiscountType: 'amount',
    paymentMethod: 'CASH',
    splitPayments: [],
    notes: '',
    isProcessing: false,
    lastSale: null,
    addItem: (product) => {
        set((state) => {
            const existing = state.cart.find((i) => i.productId === product.id);
            if (existing) {
                return {
                    cart: state.cart.map((i) => i.productId === product.id
                        ? {
                            ...i,
                            quantity: i.quantity + 1,
                            taxAmount: ((i.unitPrice * (i.quantity + 1) - i.discountAmount) * i.taxRate) / 100,
                            total: (i.unitPrice * (i.quantity + 1) - i.discountAmount) * (1 + i.taxRate / 100),
                        }
                        : i),
                };
            }
            const taxRate = product.taxRate || 0;
            const base = product.price;
            const taxAmount = (base * taxRate) / 100;
            const newItem = {
                productId: product.id,
                name: product.name,
                nameAr: product.nameAr,
                barcode: product.barcode,
                quantity: 1,
                unitPrice: base,
                discountPercent: 0,
                discountAmount: 0,
                taxRate,
                taxAmount,
                total: base + taxAmount,
                stock: product.stock ?? 999,
            };
            return { cart: [...state.cart, newItem] };
        });
    },
    removeItem: (productId) => set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) })),
    updateQuantity: (productId, qty) => {
        if (qty < 1) {
            get().removeItem(productId);
            return;
        }
        set((state) => ({
            cart: state.cart.map((i) => {
                if (i.productId !== productId)
                    return i;
                const base = i.unitPrice * qty;
                const disc = i.discountAmount;
                const afterDisc = base - disc;
                const taxAmt = (afterDisc * i.taxRate) / 100;
                return { ...i, quantity: qty, taxAmount: taxAmt, total: afterDisc + taxAmt };
            }),
        }));
    },
    setItemDiscount: (productId, discount, type) => {
        set((state) => ({
            cart: state.cart.map((i) => {
                if (i.productId !== productId)
                    return i;
                const base = i.unitPrice * i.quantity;
                const discAmt = type === 'percent' ? (base * discount) / 100 : discount;
                const afterDisc = base - discAmt;
                const taxAmt = (afterDisc * i.taxRate) / 100;
                return {
                    ...i,
                    discountPercent: type === 'percent' ? discount : 0,
                    discountAmount: discAmt,
                    taxAmount: taxAmt,
                    total: afterDisc + taxAmt,
                };
            }),
        }));
    },
    setInvoiceDiscount: (amount, type) => set({ invoiceDiscount: amount, invoiceDiscountType: type }),
    setCustomer: (id, name) => set({ customerId: id, customerName: name }),
    setPaymentMethod: (method) => set({ paymentMethod: method, splitPayments: [] }),
    addSplitPayment: (method, amount) => set((s) => ({ splitPayments: [...s.splitPayments, { method, amount }] })),
    removeSplitPayment: (idx) => set((s) => ({ splitPayments: s.splitPayments.filter((_, i) => i !== idx) })),
    setNotes: (notes) => set({ notes }),
    clearCart: () => set({ cart: [], customerId: null, customerName: null, invoiceDiscount: 0, invoiceDiscountType: 'amount', paymentMethod: 'CASH', splitPayments: [], notes: '' }),
    subtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    },
    totalTax: () => get().cart.reduce((sum, i) => sum + i.taxAmount, 0),
    totalDiscount: () => {
        const { cart, invoiceDiscount, invoiceDiscountType, subtotal } = get();
        const itemDiscs = cart.reduce((sum, i) => sum + i.discountAmount, 0);
        const invoiceDisc = invoiceDiscountType === 'percent' ? (subtotal() * invoiceDiscount) / 100 : invoiceDiscount;
        return itemDiscs + invoiceDisc;
    },
    total: () => {
        const { subtotal, totalTax, totalDiscount, invoiceDiscount, invoiceDiscountType } = get();
        const sub = subtotal();
        const invDisc = invoiceDiscountType === 'percent' ? (sub * invoiceDiscount) / 100 : invoiceDiscount;
        return sub - invDisc + totalTax();
    },
    checkout: async (paidAmount, tenantId, branchId, userId) => {
        const { cart, customerId, invoiceDiscount, invoiceDiscountType, paymentMethod, splitPayments, notes, total, clearCart } = get();
        if (!cart.length)
            throw new Error('السلة فارغة');
        set({ isProcessing: true });
        const offlineId = crypto.randomUUID();
        const invoiceTotal = total();
        const change = Math.max(0, paidAmount - invoiceTotal);
        const salePayload = {
            branchId,
            customerId: customerId || undefined,
            items: cart.map((i) => ({
                productId: i.productId,
                name: i.name,
                nameAr: i.nameAr,
                barcode: i.barcode,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discountAmount: i.discountAmount,
                discountPercent: i.discountPercent,
                taxRate: i.taxRate,
            })),
            discountAmount: invoiceDiscountType === 'amount' ? invoiceDiscount : undefined,
            discountPercent: invoiceDiscountType === 'percent' ? invoiceDiscount : undefined,
            paidAmount,
            paymentMethod: splitPayments.length > 0 ? 'SPLIT' : paymentMethod,
            payments: splitPayments.length > 0 ? splitPayments : undefined,
            notes: notes || undefined,
            offlineId,
        };
        try {
            let sale;
            if (navigator.onLine) {
                sale = await api_1.salesApi.create(salePayload);
                sale = sale.data || sale;
            }
            else {
                // Save offline
                const offlineSale = {
                    id: offlineId,
                    offlineId,
                    tenantId,
                    branchId,
                    userId,
                    customerId: customerId || undefined,
                    invoiceNumber: `OFFLINE-${Date.now()}`,
                    items: cart.map((i) => ({ ...i })),
                    subtotal: cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
                    discountAmount: invoiceDiscount,
                    taxAmount: cart.reduce((s, i) => s + i.taxAmount, 0),
                    total: invoiceTotal,
                    paidAmount,
                    changeAmount: change,
                    paymentMethod,
                    notes: notes || undefined,
                    status: 'pending_sync',
                    createdAt: new Date().toISOString(),
                };
                await db_1.db.sales.add(offlineSale);
                sale = { ...offlineSale, offline: true };
            }
            set({ lastSale: sale, isProcessing: false });
            clearCart();
            return sale;
        }
        catch (err) {
            set({ isProcessing: false });
            throw err;
        }
    },
}));
//# sourceMappingURL=pos.store.js.map