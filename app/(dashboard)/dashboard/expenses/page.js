'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExpensesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const auth_store_1 = require("@/stores/auth.store");
const CATEGORIES = ['إيجار', 'كهرباء', 'مياه', 'رواتب', 'نقل', 'صيانة', 'تسويق', 'أخرى'];
function ExpensesPage() {
    const { tenant } = (0, auth_store_1.useAuthStore)();
    const [expenses, setExpenses] = (0, react_1.useState)([]);
    const [summary, setSummary] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [form, setForm] = (0, react_1.useState)({ title: '', amount: '', category: 'أخرى', notes: '', paymentMethod: 'CASH' });
    const cur = tenant?.currency || 'EGP';
    const load = async () => {
        setLoading(true);
        try {
            const [exp, sum] = await Promise.all([api_1.expensesApi.list({ limit: 50 }), api_1.expensesApi.summary()]);
            setExpenses(exp?.data?.data || exp?.data || []);
            setSummary(sum?.data || sum);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api_1.expensesApi.create({ ...form, amount: parseFloat(form.amount) });
            react_hot_toast_1.default.success('تم إضافة المصروف');
            setShowForm(false);
            setForm({ title: '', amount: '', category: 'أخرى', notes: '', paymentMethod: 'CASH' });
            load();
        }
        catch { }
    };
    const handleDelete = async (id) => {
        if (!confirm('حذف هذا المصروف؟'))
            return;
        try {
            await api_1.expensesApi.delete(id);
            react_hot_toast_1.default.success('تم الحذف');
            load();
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowForm(true), className: "btn-brand flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 18 }), " \u0625\u0636\u0627\u0641\u0629 \u0645\u0635\u0631\u0648\u0641"] })] }), summary && ((0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold text-gray-900 dark:text-white text-sm", children: "\u0645\u0644\u062E\u0635 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xl font-black text-red-500", children: (0, utils_1.formatCurrency)(summary.totalAmount, cur) })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: (summary.byCategory || []).map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-gray-400 text-xs", children: c.category }), (0, jsx_runtime_1.jsx)("p", { className: "font-bold text-gray-900 dark:text-white", children: (0, utils_1.formatCurrency)(c._sum.amount, cur) })] }, c.category))) })] })), (0, jsx_runtime_1.jsx)("div", { className: "card overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400", children: "\u0627\u0644\u0628\u064A\u0627\u0646" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400", children: "\u0627\u0644\u0641\u0626\u0629" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400", children: "\u0627\u0644\u0645\u0628\u0644\u063A" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell", children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E" }), (0, jsx_runtime_1.jsx)("th", {})] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: loading ? Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)("tr", { children: Array.from({ length: 4 }).map((_, j) => (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" }) }, j)) }, i))) : expenses.map((e) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800/50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 font-semibold text-gray-900 dark:text-white", children: e.titleAr || e.title }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400", children: e.category }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 font-bold text-red-500", children: (0, utils_1.formatCurrency)(e.amount, cur) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 hidden md:table-cell text-xs text-gray-400", children: (0, utils_1.formatDate)(e.date) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDelete(e.id), className: "p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 15 }) }) })] }, e.id))) })] }) }) }), showForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold", children: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0635\u0631\u0648\u0641" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowForm(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "p-5 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u064A\u0627\u0646 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.title, onChange: (e) => setForm((f) => ({ ...f, title: e.target.value })), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0645\u0628\u0644\u063A *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "number", step: "0.01", value: form.amount, onChange: (e) => setForm((f) => ({ ...f, amount: e.target.value })), required: true, dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0641\u0626\u0629" }), (0, jsx_runtime_1.jsx)("select", { className: "input", value: form.category, onChange: (e) => setForm((f) => ({ ...f, category: e.target.value })), children: CATEGORIES.map((c) => (0, jsx_runtime_1.jsx)("option", { value: c, children: c }, c)) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: form.paymentMethod, onChange: (e) => setForm((f) => ({ ...f, paymentMethod: e.target.value })), children: [(0, jsx_runtime_1.jsx)("option", { value: "CASH", children: "\u0646\u0642\u062F\u064A" }), (0, jsx_runtime_1.jsx)("option", { value: "CARD", children: "\u0628\u0637\u0627\u0642\u0629" }), (0, jsx_runtime_1.jsx)("option", { value: "TRANSFER", children: "\u062A\u062D\u0648\u064A\u0644" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.notes, onChange: (e) => setForm((f) => ({ ...f, notes: e.target.value })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 btn-brand py-3", children: "\u0625\u0636\u0627\u0641\u0629" })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map