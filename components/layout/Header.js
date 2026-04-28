'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const next_themes_1 = require("next-themes");
const lucide_react_1 = require("lucide-react");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const api_1 = require("@/lib/api");
const utils_1 = require("@/lib/utils");
function Header({ onMenuClick, title }) {
    const { theme, setTheme } = (0, next_themes_1.useTheme)();
    const { user, tenant } = (0, auth_store_1.useAuthStore)();
    const { isOnline, pendingSyncCount } = (0, settings_store_1.useSettingsStore)();
    const [unread, setUnread] = (0, react_1.useState)(0);
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => { setMounted(true); }, []);
    (0, react_1.useEffect)(() => {
        api_1.notificationsApi.unreadCount()
            .then((res) => setUnread(res?.data?.count || res?.count || 0))
            .catch(() => { });
    }, []);
    return ((0, jsx_runtime_1.jsxs)("header", { className: "h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-20", children: [(0, jsx_runtime_1.jsx)("button", { onClick: onMenuClick, className: "lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { size: 20 }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1", children: title && (0, jsx_runtime_1.jsx)("h1", { className: "text-base font-bold text-gray-900 dark:text-white", children: title }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [!isOnline && pendingSyncCount > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-full text-xs font-medium", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 12, className: "animate-spin" }), pendingSyncCount, " \u0645\u0639\u0627\u0645\u0644\u0629"] })), (0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', isOnline ? 'text-green-600' : 'text-red-500'), children: [isOnline ? (0, jsx_runtime_1.jsx)(lucide_react_1.Wifi, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.WifiOff, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: isOnline ? 'متصل' : 'غير متصل' })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/pos", className: "flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingCart, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "\u0627\u0644\u0628\u064A\u0639" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/dashboard/notifications", className: "relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { size: 20 }), unread > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center", children: unread > 9 ? '9+' : unread }))] }), mounted && ((0, jsx_runtime_1.jsx)("button", { onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: theme === 'dark' ? (0, jsx_runtime_1.jsx)(lucide_react_1.Sun, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Moon, { size: 20 }) }))] })] }));
}
//# sourceMappingURL=Header.js.map