'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = POSPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const pos_store_1 = require("@/stores/pos.store");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const api_1 = require("@/lib/api");
const db_1 = require("@/lib/db");
const utils_1 = require("@/lib/utils");
const printing_1 = require("@/lib/printing");
const BarcodeScanner_1 = require("@/components/pos/BarcodeScanner");
const CartPanel_1 = require("@/components/pos/CartPanel");
const PaymentModal_1 = require("@/components/pos/PaymentModal");
const ReceiptModal_1 = require("@/components/pos/ReceiptModal");
const Logo_1 = require("@/components/common/Logo");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const lucide_react_1 = require("lucide-react");
const utils_2 = require("@/lib/utils");
function POSPage() {
    const router = (0, navigation_1.useRouter)();
    const { user, tenant } = (0, auth_store_1.useAuthStore)();
    const { activeBranchId, isOnline, autoPrint, printerType, printerIp, paperSize } = (0, settings_store_1.useSettingsStore)();
    const posStore = (0, pos_store_1.usePOSStore)();
    const { addItem, cart } = posStore;
    const [products, setProducts] = (0, react_1.useState)([]);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [activeCategory, setActiveCategory] = (0, react_1.useState)('all');
    const [search, setSearch] = (0, react_1.useState)('');
    const [scanning, setScanning] = (0, react_1.useState)(false);
    const [showPayment, setShowPayment] = (0, react_1.useState)(false);
    const [showReceipt, setShowReceipt] = (0, react_1.useState)(false);
    const [lastSale, setLastSale] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const searchRef = (0, react_1.useRef)(null);
    const branchId = activeBranchId || user?.branchId || '';
    // Load products (online or offline)
    const loadProducts = (0, react_1.useCallback)(async () => {
        try {
            if (isOnline) {
                const res = await api_1.productsApi.list({ limit: 500, branchId });
                const data = res?.data || [];
                setProducts(data);
                // Extract categories
                const cats = Array.from(new Map(data.filter((p) => p.category).map((p) => [p.categoryId, p.category])).values());
                setCategories(cats);
            }
            else {
                const offline = await db_1.db.products.where('tenantId').equals(user?.tenantId || '').toArray();
                setProducts(offline.map((p) => ({ ...p, inventory: [{ quantity: p.stock }] })));
            }
        }
        catch { }
        setLoading(false);
    }, [isOnline, branchId, user?.tenantId]);
    (0, react_1.useEffect)(() => {
        loadProducts();
        // Auto-focus search
        setTimeout(() => searchRef.current?.focus(), 300);
    }, [loadProducts]);
    // Keyboard shortcut: F2 = barcode scanner, Escape = clear
    (0, react_1.useEffect)(() => {
        const onKey = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                setScanning(true);
            }
            if (e.key === 'Escape') {
                setScanning(false);
                setSearch('');
                searchRef.current?.focus();
            }
            if (e.key === 'F10') {
                e.preventDefault();
                if (cart.length)
                    setShowPayment(true);
            }
            if (e.key === 'F5') {
                e.preventDefault();
                loadProducts();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cart.length, loadProducts]);
    const handleBarcodeScanned = async (barcode) => {
        setScanning(false);
        try {
            let product;
            if (isOnline) {
                const res = await api_1.productsApi.byBarcode(barcode, branchId);
                product = res?.data || res;
            }
            else {
                product = await db_1.db.getProductByBarcode(user?.tenantId || '', barcode);
            }
            if (product) {
                addItem(product);
                react_hot_toast_1.default.success(`تمت الإضافة: ${product.nameAr || product.name}`, { duration: 1500 });
            }
            else {
                react_hot_toast_1.default.error('المنتج غير موجود', { duration: 2000 });
            }
        }
        catch {
            react_hot_toast_1.default.error('خطأ في قراءة الباركود');
        }
    };
    const handleSearch = (0, utils_1.debounce)(async (q) => {
        if (!q.trim()) {
            loadProducts();
            return;
        }
        try {
            if (isOnline) {
                const res = await api_1.productsApi.list({ search: q, branchId, limit: 50 });
                setProducts(res?.data || []);
            }
            else {
                const results = await db_1.db.searchProducts(user?.tenantId || '', q);
                setProducts(results.map((p) => ({ ...p, inventory: [{ quantity: p.stock }] })));
            }
        }
        catch { }
    }, 200);
    const filteredProducts = products.filter((p) => activeCategory === 'all' || p.categoryId === activeCategory);
    const handleCheckout = async (paidAmount) => {
        try {
            const sale = await posStore.checkout(paidAmount, user?.tenantId || '', branchId, user.id);
            setLastSale(sale);
            setShowPayment(false);
            if (autoPrint && sale) {
                await printing_1.thermalPrinter.printReceipt({
                    storeName: tenant?.name || '',
                    storeNameAr: tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية',
                    invoiceNumber: sale.invoiceNumber || sale.offlineId || '',
                    date: new Date().toLocaleString('ar-EG'),
                    cashierName: `${user?.firstName} ${user?.lastName}`,
                    items: (sale.items || []).map((i) => ({
                        name: i.name, nameAr: i.nameAr, quantity: i.quantity,
                        unitPrice: i.unitPrice, total: i.total, discountAmount: i.discountAmount,
                    })),
                    subtotal: sale.subtotal,
                    discountAmount: sale.discountAmount || 0,
                    taxAmount: sale.taxAmount || 0,
                    total: sale.total,
                    paidAmount,
                    changeAmount: sale.changeAmount || 0,
                    paymentMethod: sale.paymentMethod || 'CASH',
                    currency: tenant?.currency || 'EGP',
                    paperSize,
                });
            }
            else {
                setShowReceipt(true);
            }
        }
        catch (err) {
            react_hot_toast_1.default.error(err?.message || 'فشل في إتمام عملية البيع');
        }
    };
    const cur = tenant?.currency || 'EGP';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "h-screen flex flex-col lg:flex-row overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)(Logo_1.Logo, { size: "xs", variant: "horizontal" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { ref: searchRef, type: "text", placeholder: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u0646\u062A\u062C \u0623\u0648 \u0627\u0633\u0645... (F2 \u0644\u0644\u0628\u0627\u0631\u0643\u0648\u062F)", className: "w-full ps-9 pe-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 border-0", value: search, onChange: (e) => { setSearch(e.target.value); handleSearch(e.target.value); } })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setScanning(true), className: "p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500 hover:bg-brand-100 transition-colors", title: "\u0645\u0633\u062D \u0628\u0627\u0631\u0643\u0648\u062F (F2)", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ScanLine, { size: 20 }) }), (0, jsx_runtime_1.jsx)("button", { onClick: loadProducts, className: "p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors", title: "\u062A\u062D\u062F\u064A\u062B (F5)", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 18 }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => router.push('/dashboard'), className: "p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors", title: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LayoutDashboard, { size: 18 }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1 text-xs", children: isOnline ? (0, jsx_runtime_1.jsx)(lucide_react_1.Wifi, { size: 14, className: "text-green-500" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.WifiOff, { size: 14, className: "text-amber-500" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-50 dark:border-gray-800 scrollbar-hide", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveCategory('all'), className: (0, utils_2.cn)('flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all', activeCategory === 'all' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'), children: ["\u0627\u0644\u0643\u0644 (", products.length, ")"] }), categories.map((cat) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveCategory(cat.id), className: (0, utils_2.cn)('flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5', activeCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'), children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full", style: { background: cat.color } }), cat.nameAr || cat.name] }, cat.id)))] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-3", children: loading ? ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2", children: Array.from({ length: 18 }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: "aspect-square rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" }, i))) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2", children: [filteredProducts.map((product) => {
                                    const stock = product.inventory?.[0]?.quantity ?? product.stock ?? 0;
                                    const inCart = cart.find((i) => i.productId === product.id);
                                    return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                            if (stock <= 0) {
                                                react_hot_toast_1.default.error('نفذ المخزون');
                                                return;
                                            }
                                            addItem({ ...product, stock });
                                            react_hot_toast_1.default.success(`+1 ${product.nameAr || product.name}`, { duration: 800, icon: '✓' });
                                        }, className: (0, utils_2.cn)('group relative flex flex-col items-center justify-between p-2.5 rounded-2xl border-2 transition-all duration-150 active:scale-95 text-center min-h-[100px]', stock <= 0 ? 'opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900' :
                                            inCart ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 shadow-md' :
                                                'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-300 hover:shadow-md'), children: [inCart && ((0, jsx_runtime_1.jsx)("span", { className: "absolute top-1.5 start-1.5 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center", children: inCart.quantity })), product.image ? ((0, jsx_runtime_1.jsx)("img", { src: product.image, alt: product.name, className: "w-12 h-12 object-contain rounded-xl" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 rounded-xl flex items-center justify-center text-2xl", style: { background: product.category?.color + '20' || '#f9731620' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 22, style: { color: product.category?.color || '#f97316' } }) })), (0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2", children: product.nameAr || product.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-brand-500 mt-0.5", children: (0, utils_1.formatCurrency)(product.price, cur) }), stock <= 5 && stock > 0 && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-amber-500 font-medium", children: ["\u0628\u0627\u0642\u064A ", stock] }))] })] }, product.id));
                                }), filteredProducts.length === 0 && !loading && ((0, jsx_runtime_1.jsxs)("div", { className: "col-span-full flex flex-col items-center justify-center py-16 text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 48, className: "mb-3 opacity-40" }), (0, jsx_runtime_1.jsx)("p", { className: "font-medium", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u062A\u062C\u0627\u062A" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm mt-1", children: search ? 'جرب كلمة بحث مختلفة' : 'أضف منتجاتك من لوحة التحكم' })] }))] })) }), (0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 text-xs text-gray-400 overflow-x-auto", children: [(0, jsx_runtime_1.jsx)("span", { children: "F2 = \u0628\u0627\u0631\u0643\u0648\u062F" }), (0, jsx_runtime_1.jsx)("span", { children: "F5 = \u062A\u062D\u062F\u064A\u062B" }), (0, jsx_runtime_1.jsx)("span", { children: "F10 = \u062F\u0641\u0639" }), (0, jsx_runtime_1.jsx)("span", { children: "Esc = \u0625\u0644\u063A\u0627\u0621" })] })] }), (0, jsx_runtime_1.jsx)(CartPanel_1.CartPanel, { currency: cur, onCheckout: () => setShowPayment(true), branchId: branchId, tenantId: user?.tenantId || '' }), scanning && ((0, jsx_runtime_1.jsx)(BarcodeScanner_1.BarcodeScanner, { onScan: handleBarcodeScanned, onClose: () => setScanning(false) })), showPayment && ((0, jsx_runtime_1.jsx)(PaymentModal_1.PaymentModal, { total: posStore.total(), currency: cur, onConfirm: handleCheckout, onClose: () => setShowPayment(false), isProcessing: posStore.isProcessing })), showReceipt && lastSale && ((0, jsx_runtime_1.jsx)(ReceiptModal_1.ReceiptModal, { sale: lastSale, tenant: tenant, cashierName: `${user?.firstName} ${user?.lastName}`, currency: cur, onClose: () => { setShowReceipt(false); setLastSale(null); }, onPrint: () => {
                    printing_1.thermalPrinter.printReceipt({
                        storeName: tenant?.name || '',
                        storeNameAr: tenant?.nameAr || 'أولاد أيمن للأدوات المنزلية',
                        invoiceNumber: lastSale.invoiceNumber || '',
                        date: new Date(lastSale.createdAt).toLocaleString('ar-EG'),
                        cashierName: `${user?.firstName} ${user?.lastName}`,
                        items: lastSale.items || [],
                        subtotal: lastSale.subtotal,
                        discountAmount: lastSale.discountAmount,
                        taxAmount: lastSale.taxAmount,
                        total: lastSale.total,
                        paidAmount: lastSale.paidAmount,
                        changeAmount: lastSale.changeAmount,
                        paymentMethod: lastSale.paymentMethod,
                        currency: cur,
                        paperSize,
                    });
                } }))] }));
}
//# sourceMappingURL=page.js.map