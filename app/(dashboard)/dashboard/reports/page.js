'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReportsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const settings_store_1 = require("@/stores/settings.store");
const auth_store_1 = require("@/stores/auth.store");
const utils_1 = require("@/lib/utils");
const recharts_1 = require("recharts");
const lucide_react_1 = require("lucide-react");
const utils_2 = require("@/lib/utils");
const dayjs_1 = __importDefault(require("dayjs"));
function ReportsPage() {
    const { activeBranchId } = (0, settings_store_1.useSettingsStore)();
    const { user } = (0, auth_store_1.useAuthStore)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [period, setPeriod] = (0, react_1.useState)('30d');
    const [customFrom, setCustomFrom] = (0, react_1.useState)((0, dayjs_1.default)().startOf('month').format('YYYY-MM-DD'));
    const [customTo, setCustomTo] = (0, react_1.useState)((0, dayjs_1.default)().format('YYYY-MM-DD'));
    const [groupBy, setGroupBy] = (0, react_1.useState)('day');
    const [sortBy, setSortBy] = (0, react_1.useState)('revenue');
    const [profit, setProfit] = (0, react_1.useState)(null);
    const [topProducts, setTopProducts] = (0, react_1.useState)([]);
    const cur = 'EGP';
    const getDateRange = () => {
        const to = (0, dayjs_1.default)().format('YYYY-MM-DD');
        if (period === '7d')
            return { from: (0, dayjs_1.default)().subtract(7, 'day').format('YYYY-MM-DD'), to };
        if (period === '30d')
            return { from: (0, dayjs_1.default)().subtract(30, 'day').format('YYYY-MM-DD'), to };
        if (period === '90d')
            return { from: (0, dayjs_1.default)().subtract(90, 'day').format('YYYY-MM-DD'), to };
        return { from: customFrom, to: customTo };
    };
    const load = async () => {
        setLoading(true);
        try {
            const { from, to } = getDateRange();
            const branchId = activeBranchId || undefined;
            const [profitRes, topRes] = await Promise.all([
                api_1.reportsApi.profit({ from, to, branchId, groupBy }),
                api_1.reportsApi.topProducts({ from, to, branchId, sortBy, limit: 10 }),
            ]);
            setProfit(profitRes);
            setTopProducts(Array.isArray(topRes) ? topRes : []);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, [period, customFrom, customTo, groupBy, sortBy, activeBranchId]);
    if (user?.role === 'CASHIER') {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center h-64 text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 48, className: "mb-4 opacity-40" }), (0, jsx_runtime_1.jsx)("p", { className: "font-medium", children: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u062A\u0642\u0627\u0631\u064A\u0631" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0623\u0631\u0628\u0627\u062D" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [['7d', '30d', '90d', 'custom'].map((p) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setPeriod(p), className: (0, utils_2.cn)('px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors', period === p ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'), children: p === '7d' ? '7 أيام' : p === '30d' ? '30 يوم' : p === '90d' ? '3 أشهر' : 'مخصص' }, p))), (0, jsx_runtime_1.jsx)("button", { onClick: load, className: "p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: (0, utils_2.cn)('text-gray-500', loading && 'animate-spin') }) })] })] }), period === 'custom' && ((0, jsx_runtime_1.jsxs)("div", { className: "card p-4 flex flex-wrap gap-3 items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm text-gray-500", children: "\u0645\u0646" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: customFrom, onChange: (e) => setCustomFrom(e.target.value), className: "input py-2" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm text-gray-500", children: "\u0625\u0644\u0649" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: customTo, onChange: (e) => setCustomTo(e.target.value), className: "input py-2" })] }), (0, jsx_runtime_1.jsxs)("select", { value: groupBy, onChange: (e) => setGroupBy(e.target.value), className: "input py-2 w-32", children: [(0, jsx_runtime_1.jsx)("option", { value: "day", children: "\u064A\u0648\u0645\u064A" }), (0, jsx_runtime_1.jsx)("option", { value: "week", children: "\u0623\u0633\u0628\u0648\u0639\u064A" }), (0, jsx_runtime_1.jsx)("option", { value: "month", children: "\u0634\u0647\u0631\u064A" })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
                    { label: 'الإيرادات', value: profit?.summary?.revenue || 0, icon: lucide_react_1.DollarSign, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
                    { label: 'صافي الربح', value: profit?.summary?.profit || 0, icon: lucide_react_1.TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
                    { label: 'عدد الفواتير', value: profit?.summary?.salesCount || 0, icon: lucide_react_1.ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', raw: true },
                    { label: 'هامش الربح', value: profit?.summary?.profitMargin || 0, icon: lucide_react_1.Percent, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', isPercent: true },
                ].map((s) => {
                    const Icon = s.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "card p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-3", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_2.cn)('w-10 h-10 rounded-2xl flex items-center justify-center', s.bg), children: (0, jsx_runtime_1.jsx)(Icon, { size: 18, className: s.color }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-500", children: s.label })] }), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" })) : ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_2.cn)('text-2xl font-black', s.color), children: s.isPercent ? `${s.value.toFixed(1)}%` : s.raw ? s.value.toLocaleString('ar-EG') : (0, utils_1.formatCurrency)(s.value, cur) }))] }, s.label));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold text-gray-900 dark:text-white", children: "\u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u0631\u0628\u0627\u062D" }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-1.5", children: ['day', 'week', 'month'].map((g) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setGroupBy(g), className: (0, utils_2.cn)('px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors', groupBy === g ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'), children: g === 'day' ? 'يومي' : g === 'week' ? 'أسبوعي' : 'شهري' }, g))) })] }), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "h-64 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" })) : ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: 280, children: (0, jsx_runtime_1.jsxs)(recharts_1.AreaChart, { data: profit?.chart || [], children: [(0, jsx_runtime_1.jsxs)("defs", { children: [(0, jsx_runtime_1.jsxs)("linearGradient", { id: "revGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "5%", stopColor: "#f97316", stopOpacity: 0.15 }), (0, jsx_runtime_1.jsx)("stop", { offset: "95%", stopColor: "#f97316", stopOpacity: 0 })] }), (0, jsx_runtime_1.jsxs)("linearGradient", { id: "profGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.15 }), (0, jsx_runtime_1.jsx)("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 })] })] }), (0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "period", tick: { fontSize: 10 } }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { tickFormatter: (v) => `${(v / 1000).toFixed(0)}k`, tick: { fontSize: 10 } }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: (v, name) => [(0, utils_1.formatCurrency)(v, cur), name === 'revenue' ? 'الإيرادات' : 'الربح'] }), (0, jsx_runtime_1.jsx)(recharts_1.Legend, { formatter: (v) => (v === 'revenue' ? 'الإيرادات' : 'الربح') }), (0, jsx_runtime_1.jsx)(recharts_1.Area, { type: "monotone", dataKey: "revenue", stroke: "#f97316", strokeWidth: 2, fill: "url(#revGrad)", dot: false }), (0, jsx_runtime_1.jsx)(recharts_1.Area, { type: "monotone", dataKey: "profit", stroke: "#22c55e", strokeWidth: 2, fill: "url(#profGrad)", dot: false })] }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 18, className: "text-brand-500" }), "\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A"] }), (0, jsx_runtime_1.jsxs)("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "input py-1.5 text-sm w-36", children: [(0, jsx_runtime_1.jsx)("option", { value: "revenue", children: "\u062D\u0633\u0628 \u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A" }), (0, jsx_runtime_1.jsx)("option", { value: "profit", children: "\u062D\u0633\u0628 \u0627\u0644\u0631\u0628\u062D" }), (0, jsx_runtime_1.jsx)("option", { value: "quantity", children: "\u062D\u0633\u0628 \u0627\u0644\u0643\u0645\u064A\u0629" })] })] }), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: Array.from({ length: 5 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" }, i)) })) : topProducts.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-10 text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 36, className: "mx-auto mb-3 opacity-40" }), (0, jsx_runtime_1.jsx)("p", { children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A" })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: topProducts.map((p, idx) => {
                            const value = sortBy === 'quantity' ? p.quantity : sortBy === 'profit' ? p.profit : p.revenue;
                            const maxVal = sortBy === 'quantity' ? topProducts[0]?.quantity : sortBy === 'profit' ? topProducts[0]?.profit : topProducts[0]?.revenue;
                            const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-500 text-xs font-black flex items-center justify-center flex-shrink-0", children: idx + 1 }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: p.nameAr || p.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-brand-500 flex-shrink-0 ms-2", children: sortBy === 'quantity' ? `${p.quantity} وحدة` : (0, utils_1.formatCurrency)(value, cur) })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-brand-500 h-1.5 rounded-full", style: { width: `${pct}%` } }) })] })] }, p.productId));
                        }) }))] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
                    { label: 'إجمالي الخصومات', value: profit?.summary?.discount || 0, color: 'text-red-500' },
                    { label: 'إجمالي الضرائب', value: profit?.summary?.tax || 0, color: 'text-amber-500' },
                    { label: 'متوسط قيمة الفاتورة', value: profit?.summary?.salesCount > 0 ? (profit.summary.revenue / profit.summary.salesCount) : 0, color: 'text-blue-500' },
                ].map((s) => ((0, jsx_runtime_1.jsxs)("div", { className: "card p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400 mb-1", children: s.label }), loading ? (0, jsx_runtime_1.jsx)("div", { className: "h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24 mx-auto" }) : ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_2.cn)('text-xl font-black', s.color), children: (0, utils_1.formatCurrency)(s.value, cur) }))] }, s.label))) })] }));
}
//# sourceMappingURL=page.js.map