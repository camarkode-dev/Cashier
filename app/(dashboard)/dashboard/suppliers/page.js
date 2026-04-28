'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SuppliersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
function SuppliersPage() {
    const [suppliers, setSuppliers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [editing, setEditing] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({ name: '', phone: '', email: '', address: '', taxNumber: '', notes: '' });
    const load = async () => {
        setLoading(true);
        try {
            const res = await api_1.suppliersApi.list({ limit: 100 });
            setSuppliers(res?.data?.data || res?.data || []);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api_1.suppliersApi.update(editing.id, form);
                react_hot_toast_1.default.success('تم التحديث');
            }
            else {
                await api_1.suppliersApi.create(form);
                react_hot_toast_1.default.success('تم الإضافة');
            }
            setShowForm(false);
            setEditing(null);
            setForm({ name: '', phone: '', email: '', address: '', taxNumber: '', notes: '' });
            load();
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0627\u0644\u0645\u0648\u0631\u062F\u0648\u0646" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => { setEditing(null); setShowForm(true); }, className: "btn-brand flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 18 }), " \u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0631\u062F"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: [loading ? Array.from({ length: 6 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "card p-4 animate-pulse h-28" }, i)) :
                        suppliers.map((s) => ((0, jsx_runtime_1.jsx)("div", { className: "card p-4 hover:shadow-md transition-shadow", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Truck, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold text-gray-900 dark:text-white", children: s.name }), s.phone && (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400 flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { size: 10 }), s.phone] }), s.email && (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400 flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { size: 10 }), s.email] })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', taxNumber: s.taxNumber || '', notes: s.notes || '' }); setShowForm(true); }, className: "p-1.5 text-gray-400 hover:text-brand-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 15 }) })] }) }, s.id))), !loading && suppliers.length === 0 && (0, jsx_runtime_1.jsxs)("div", { className: "col-span-full text-center py-16 text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Truck, { size: 48, className: "mx-auto mb-3 opacity-30" }), (0, jsx_runtime_1.jsx)("p", { children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0648\u0631\u062F\u0648\u0646" })] })] }), showForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold", children: editing ? 'تعديل مورد' : 'إضافة مورد' }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowForm(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "p-5 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0647\u0627\u062A\u0641" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "tel", value: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "email", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.address, onChange: (e) => setForm((f) => ({ ...f, address: e.target.value })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 btn-brand py-3", children: editing ? 'حفظ' : 'إضافة' })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map