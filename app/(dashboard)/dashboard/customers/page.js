'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CustomersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const auth_store_1 = require("@/stores/auth.store");
function CustomersPage() {
    const { tenant } = (0, auth_store_1.useAuthStore)();
    const [customers, setCustomers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [editing, setEditing] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({ name: '', phone: '', email: '', address: '', notes: '' });
    const cur = tenant?.currency || 'EGP';
    const load = async () => {
        setLoading(true);
        try {
            const res = await api_1.customersApi.list({ search, limit: 100 });
            setCustomers(res?.data?.data || res?.data || []);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, [search]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api_1.customersApi.update(editing.id, form);
                react_hot_toast_1.default.success('تم التحديث');
            }
            else {
                await api_1.customersApi.create(form);
                react_hot_toast_1.default.success('تم الإضافة');
            }
            setShowForm(false);
            setEditing(null);
            setForm({ name: '', phone: '', email: '', address: '', notes: '' });
            load();
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => { setEditing(null); setShowForm(true); }, className: "btn-brand flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 18 }), " \u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064A\u0644"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, className: "absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { className: "input ps-9 max-w-xs", placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0647\u0627\u062A\u0641...", value: search, onChange: (e) => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: [loading ? Array.from({ length: 6 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "card p-4 animate-pulse h-28" }, i)) :
                        customers.map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: "card p-4 hover:shadow-md transition-shadow", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500 font-bold text-lg", children: c.name[0] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold text-gray-900 dark:text-white", children: c.name }), c.phone && (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500 flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { size: 12 }), c.phone] })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setShowForm(true); }, className: "p-1.5 text-gray-400 hover:text-brand-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 15 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1 text-amber-500 font-semibold", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Star, { size: 13 }), " ", c.loyaltyPoints, " \u0646\u0642\u0637\u0629"] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-gray-500", children: [(0, utils_1.formatCurrency)(c.totalPurchases, cur), " \u0625\u062C\u0645\u0627\u0644\u064A"] })] })] }, c.id))), !loading && customers.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "col-span-full text-center py-16 text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 48, className: "mx-auto mb-3 opacity-30" }), (0, jsx_runtime_1.jsx)("p", { children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0645\u0644\u0627\u0621" })] }))] }), showForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold", children: editing ? 'تعديل عميل' : 'إضافة عميل' }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowForm(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "p-5 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0647\u0627\u062A\u0641" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "tel", value: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "email", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.address, onChange: (e) => setForm((f) => ({ ...f, address: e.target.value })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 btn-brand py-3", children: editing ? 'حفظ' : 'إضافة' })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map