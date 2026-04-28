'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BranchesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const settings_store_1 = require("@/stores/settings.store");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
function BranchesPage() {
    const { activeBranchId, setActiveBranch } = (0, settings_store_1.useSettingsStore)();
    const [branches, setBranches] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [form, setForm] = (0, react_1.useState)({ name: '', nameAr: '', address: '', phone: '' });
    const load = async () => {
        setLoading(true);
        try {
            const res = await api_1.branchesApi.list();
            setBranches(res?.data || []);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api_1.branchesApi.create(form);
            react_hot_toast_1.default.success('تم إضافة الفرع');
            setShowForm(false);
            setForm({ name: '', nameAr: '', address: '', phone: '' });
            load();
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0627\u0644\u0641\u0631\u0648\u0639" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowForm(true), className: "btn-brand flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 18 }), " \u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", children: loading ? Array.from({ length: 3 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "card p-4 animate-pulse h-28" }, i)) :
                    branches.map((b) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => setActiveBranch(b.id), className: `card p-4 cursor-pointer transition-all hover:shadow-md border-2 ${activeBranchId === b.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-transparent'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.GitBranch, { size: 18 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold text-gray-900 dark:text-white", children: b.nameAr || b.name }), b.isMain && (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-brand-500 font-semibold", children: "\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A" })] })] }), activeBranchId === b.id && (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { size: 18, className: "text-brand-500" })] }), b.address && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: b.address }), b.phone && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: b.phone }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 text-xs text-gray-400 mt-2", children: [(0, jsx_runtime_1.jsxs)("span", { children: [b._count?.users || 0, " \u0645\u0633\u062A\u062E\u062F\u0645"] }), (0, jsx_runtime_1.jsxs)("span", { children: [b._count?.sales || 0, " \u0641\u0627\u062A\u0648\u0631\u0629"] })] })] }, b.id))) }), showForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold", children: "\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639 \u062C\u062F\u064A\u062F" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowForm(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "p-5 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u0639 (\u0639\u0631\u0628\u064A) *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.nameAr, onChange: (e) => setForm((f) => ({ ...f, nameAr: e.target.value })), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u0639 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.address, onChange: (e) => setForm((f) => ({ ...f, address: e.target.value })) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0647\u0627\u062A\u0641" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "tel", value: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 btn-brand py-3", children: "\u0625\u0636\u0627\u0641\u0629" })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map