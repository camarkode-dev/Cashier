'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotificationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const TYPE_CONFIG = {
    LOW_STOCK: { icon: lucide_react_1.AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
    SALE: { icon: lucide_react_1.CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    SYSTEM: { icon: lucide_react_1.Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    INFO: { icon: lucide_react_1.Bell, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
};
function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)
        return `منذ ${d} ${d === 1 ? 'يوم' : 'أيام'}`;
    if (h > 0)
        return `منذ ${h} ${h === 1 ? 'ساعة' : 'ساعات'}`;
    if (m > 0)
        return `منذ ${m} دقيقة`;
    return 'الآن';
}
function NotificationsPage() {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [filter, setFilter] = (0, react_1.useState)('all');
    const load = async () => {
        setLoading(true);
        try {
            const res = await api_1.apiClient.get('/notifications');
            setNotifications(res?.data || []);
        }
        catch {
            react_hot_toast_1.default.error('فشل تحميل الإشعارات');
        }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const markRead = async (id) => {
        try {
            await api_1.apiClient.patch(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
        }
        catch { }
    };
    const markAllRead = async () => {
        try {
            await api_1.apiClient.patch('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            react_hot_toast_1.default.success('تم تحديد الكل كمقروء');
        }
        catch {
            react_hot_toast_1.default.error('فشل');
        }
    };
    const deleteNotification = async (id) => {
        try {
            await api_1.apiClient.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }
        catch {
            react_hot_toast_1.default.error('فشل الحذف');
        }
    };
    const clearAll = async () => {
        try {
            await api_1.apiClient.delete('/notifications');
            setNotifications([]);
            react_hot_toast_1.default.success('تم حذف جميع الإشعارات');
        }
        catch {
            react_hot_toast_1.default.error('فشل');
        }
    };
    const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5 max-w-3xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" }), unreadCount > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full", children: unreadCount }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [unreadCount > 0 && ((0, jsx_runtime_1.jsx)("button", { onClick: markAllRead, className: "text-sm text-brand-500 hover:text-brand-600 font-semibold px-3 py-1.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors", children: "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0643\u0644 \u0643\u0645\u0642\u0631\u0648\u0621" })), notifications.length > 0 && ((0, jsx_runtime_1.jsxs)("button", { onClick: clearAll, className: "text-sm text-red-400 hover:text-red-500 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 14 }), "\u0645\u0633\u062D \u0627\u0644\u0643\u0644"] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setFilter('all'), className: (0, utils_1.cn)('pb-2.5 px-1 text-sm font-semibold border-b-2 transition-colors', filter === 'all' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600'), children: ["\u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A (", notifications.length, ")"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setFilter('unread'), className: (0, utils_1.cn)('pb-2.5 px-1 text-sm font-semibold border-b-2 transition-colors', filter === 'unread' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 hover:text-gray-600'), children: ["\u063A\u064A\u0631 \u0645\u0642\u0631\u0648\u0621 (", unreadCount, ")"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: loading ? (Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: "card p-4 animate-pulse", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded w-48" }), (0, jsx_runtime_1.jsx)("div", { className: "h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" })] })] }) }, i)))) : filtered.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "card py-20 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BellOff, { size: 52, className: "mb-4 opacity-50" }), (0, jsx_runtime_1.jsx)("p", { className: "font-medium text-gray-400", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A" }), filter === 'unread' && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-300 mt-1", children: "\u0643\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0645\u0642\u0631\u0648\u0621\u0629" })] })) : (filtered.map((n) => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                    const Icon = config.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => { if (!n.isRead)
                            markRead(n.id); }, className: (0, utils_1.cn)('card p-4 flex items-start gap-4 transition-all cursor-pointer group', !n.isRead ? 'border-brand-100 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'), children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', config.bg), children: (0, jsx_runtime_1.jsx)(Icon, { size: 18, className: config.color }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)('text-sm font-semibold', !n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'), children: n.titleAr || n.title }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [!n.isRead && (0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("button", { onClick: (e) => { e.stopPropagation(); deleteNotification(n.id); }, className: "opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-300 hover:text-red-400 transition-all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 13 }) })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 mt-0.5 leading-relaxed", children: n.messageAr || n.message }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-300 dark:text-gray-600 mt-1.5", children: timeAgo(n.createdAt) })] })] }, n.id));
                })) })] }));
}
//# sourceMappingURL=page.js.map