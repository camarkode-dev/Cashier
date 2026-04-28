'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InventoryPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const settings_store_1 = require("@/stores/settings.store");
const auth_store_1 = require("@/stores/auth.store");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const utils_2 = require("@/lib/utils");
function InventoryPage() {
    const { activeBranchId } = (0, settings_store_1.useSettingsStore)();
    const { tenant } = (0, auth_store_1.useAuthStore)();
    const [products, setProducts] = (0, react_1.useState)([]);
    const [branches, setBranches] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedBranch, setSelectedBranch] = (0, react_1.useState)(activeBranchId || 'all');
    const [search, setSearch] = (0, react_1.useState)('');
    const [showTransfer, setShowTransfer] = (0, react_1.useState)(false);
    const [transfer, setTransfer] = (0, react_1.useState)({ productId: '', fromBranchId: '', toBranchId: '', quantity: 1, notes: '' });
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [view, setView] = (0, react_1.useState)('inventory');
    const cur = tenant?.currency || 'EGP';
    const load = async () => {
        setLoading(true);
        try {
            const [prodRes, branchRes] = await Promise.all([
                api_1.productsApi.list({ limit: 500, withInventory: true }),
                api_1.branchesApi.list(),
            ]);
            setProducts(prodRes?.data || []);
            setBranches(branchRes?.data || []);
        }
        catch {
            react_hot_toast_1.default.error('فشل تحميل البيانات');
        }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const getStock = (product, branchId) => {
        if (!branchId || branchId === 'all') {
            return product.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        }
        return product.inventory?.find((i) => i.branchId === branchId)?.quantity ?? 0;
    };
    const getMinStock = (product, branchId) => {
        if (!branchId || branchId === 'all')
            return product.inventory?.[0]?.minStock ?? 5;
        return product.inventory?.find((i) => i.branchId === branchId)?.minStock ?? 5;
    };
    const filtered = products.filter((p) => {
        const matchSearch = !search || (p.nameAr || p.name).toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search);
        const stock = getStock(p, selectedBranch);
        const min = getMinStock(p, selectedBranch);
        const matchView = view === 'inventory' || stock <= min;
        return matchSearch && matchView;
    });
    const lowStockCount = products.filter((p) => getStock(p, selectedBranch) <= getMinStock(p, selectedBranch)).length;
    const handleTransfer = async (e) => {
        e.preventDefault();
        if (transfer.fromBranchId === transfer.toBranchId) {
            react_hot_toast_1.default.error('الفرعان متطابقان');
            return;
        }
        setSubmitting(true);
        try {
            await api_1.productsApi.transferStock(transfer);
            react_hot_toast_1.default.success('تم نقل المخزون بنجاح');
            setShowTransfer(false);
            setTransfer({ productId: '', fromBranchId: '', toBranchId: '', quantity: 1, notes: '' });
            load();
        }
        catch (err) {
            react_hot_toast_1.default.error(err?.message || 'فشل نقل المخزون');
        }
        setSubmitting(false);
    };
    const stockColor = (qty, min) => {
        if (qty <= 0)
            return 'text-red-500 bg-red-50 dark:bg-red-950';
        if (qty <= min)
            return 'text-amber-500 bg-amber-50 dark:bg-amber-950';
        return 'text-green-600 bg-green-50 dark:bg-green-950';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: load, className: "p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 16, className: "text-gray-500" }) }), branches.length > 1 && ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowTransfer(true), className: "btn-brand flex items-center gap-2 py-2.5 px-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { size: 16 }), "\u0646\u0642\u0644 \u0645\u062E\u0632\u0648\u0646"] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card p-4 flex flex-wrap gap-3 items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u0646\u062A\u062C \u0623\u0648 \u0628\u0627\u0631\u0643\u0648\u062F...", value: search, onChange: (e) => setSearch(e.target.value), className: "input flex-1 min-w-48 py-2" }), (0, jsx_runtime_1.jsxs)("select", { value: selectedBranch, onChange: (e) => setSelectedBranch(e.target.value), className: "input py-2 w-44", children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "\u0643\u0644 \u0627\u0644\u0641\u0631\u0648\u0639" }), branches.map((b) => ((0, jsx_runtime_1.jsx)("option", { value: b.id, children: b.nameAr || b.name }, b.id)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setView('inventory'), className: (0, utils_2.cn)('px-4 py-2 text-sm font-semibold transition-colors', view === 'inventory' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'), children: "\u0627\u0644\u0643\u0644" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setView('lowstock'), className: (0, utils_2.cn)('px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5', view === 'lowstock' ? 'bg-amber-500 text-white' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 14 }), "\u0645\u062E\u0632\u0648\u0646 \u0645\u0646\u062E\u0641\u0636 (", lowStockCount, ")"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "card overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase", children: [(0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0645\u0646\u062A\u062C" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0633\u0639\u0631" }), selectedBranch === 'all' ? (branches.map((b) => ((0, jsx_runtime_1.jsx)("th", { className: "text-center p-4 font-semibold", children: b.nameAr || b.name }, b.id)))) : ((0, jsx_runtime_1.jsx)("th", { className: "text-center p-4 font-semibold", children: "\u0627\u0644\u0643\u0645\u064A\u0629" })), (0, jsx_runtime_1.jsx)("th", { className: "text-center p-4 font-semibold", children: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: loading ? (Array.from({ length: 8 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-40" }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-28" }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-16 mx-auto" }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-16 mx-auto" }) })] }, i)))) : filtered.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsxs)("td", { colSpan: 10, className: "py-16 text-center text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 40, className: "mx-auto mb-3 opacity-40" }), (0, jsx_runtime_1.jsx)("p", { children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u062A\u062C\u0627\u062A" })] }) })) : (filtered.map((p) => {
                                    const totalStock = getStock(p, selectedBranch);
                                    const minStock = getMinStock(p, selectedBranch);
                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center", style: { background: (p.category?.color || '#f97316') + '20' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 14, style: { color: p.category?.color || '#f97316' } }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-gray-900 dark:text-white text-sm", children: p.nameAr || p.name }), p.category && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: p.category.nameAr || p.category.name })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4 font-mono text-sm text-gray-500", children: p.barcode || '—' }), (0, jsx_runtime_1.jsx)("td", { className: "p-4 font-bold text-brand-500 text-sm", children: (0, utils_1.formatCurrency)(p.price, cur) }), selectedBranch === 'all' ? (branches.map((b) => {
                                                const inv = p.inventory?.find((i) => i.branchId === b.id);
                                                const qty = inv?.quantity ?? 0;
                                                const min = inv?.minStock ?? 5;
                                                return ((0, jsx_runtime_1.jsx)("td", { className: "p-4 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: (0, utils_2.cn)('inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold', stockColor(qty, min)), children: qty }) }, b.id));
                                            })) : ((0, jsx_runtime_1.jsx)("td", { className: "p-4 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: (0, utils_2.cn)('inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold', stockColor(totalStock, minStock)), children: totalStock }) })), (0, jsx_runtime_1.jsx)("td", { className: "p-4 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: (0, utils_2.cn)('inline-flex items-center justify-center px-3 h-7 rounded-lg text-xs font-bold', stockColor(totalStock, minStock)), children: selectedBranch === 'all' ? getStock(p, 'all') : totalStock }) })] }, p.id));
                                })) })] }) }) }), showTransfer && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { size: 18, className: "text-brand-500" }), " \u0646\u0642\u0644 \u0645\u062E\u0632\u0648\u0646 \u0628\u064A\u0646 \u0627\u0644\u0641\u0631\u0648\u0639"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowTransfer(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleTransfer, className: "p-5 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0645\u0646\u062A\u062C *" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: transfer.productId, onChange: (e) => setTransfer((t) => ({ ...t, productId: e.target.value })), required: true, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\u0627\u062E\u062A\u0631 \u0645\u0646\u062A\u062C\u0627\u064B..." }), products.map((p) => ((0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.nameAr || p.name }, p.id)))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0645\u0646 \u0641\u0631\u0639 *" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: transfer.fromBranchId, onChange: (e) => setTransfer((t) => ({ ...t, fromBranchId: e.target.value })), required: true, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\u0627\u062E\u062A\u0631..." }), branches.map((b) => (0, jsx_runtime_1.jsx)("option", { value: b.id, children: b.nameAr || b.name }, b.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0625\u0644\u0649 \u0641\u0631\u0639 *" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: transfer.toBranchId, onChange: (e) => setTransfer((t) => ({ ...t, toBranchId: e.target.value })), required: true, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\u0627\u062E\u062A\u0631..." }), branches.filter((b) => b.id !== transfer.fromBranchId).map((b) => ((0, jsx_runtime_1.jsx)("option", { value: b.id, children: b.nameAr || b.name }, b.id)))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0643\u0645\u064A\u0629 *" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setTransfer((t) => ({ ...t, quantity: Math.max(1, t.quantity - 1) })), className: "w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-brand-100", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Minus, { size: 16 }) }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: 1, className: "input text-center flex-1", value: transfer.quantity, onChange: (e) => setTransfer((t) => ({ ...t, quantity: parseInt(e.target.value) || 1 })), required: true }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setTransfer((t) => ({ ...t, quantity: t.quantity + 1 })), className: "w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-brand-100", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: transfer.notes, onChange: (e) => setTransfer((t) => ({ ...t, notes: e.target.value })), placeholder: "\u0633\u0628\u0628 \u0627\u0644\u0646\u0642\u0644..." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-1", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowTransfer(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: submitting, className: "flex-1 btn-brand py-3 disabled:opacity-60", children: submitting ? 'جاري النقل...' : 'تأكيد النقل' })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map