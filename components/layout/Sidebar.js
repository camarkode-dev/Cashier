'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const Logo_1 = require("@/components/common/Logo");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const navItems = [
    { label: 'لوحة التحكم', href: '/dashboard', icon: lucide_react_1.LayoutDashboard },
    { label: 'نقطة البيع', href: '/pos', icon: lucide_react_1.ShoppingCart },
    { label: 'المنتجات', href: '/dashboard/products', icon: lucide_react_1.Package },
    { label: 'العملاء', href: '/dashboard/customers', icon: lucide_react_1.Users },
    { label: 'المبيعات', href: '/dashboard/sales', icon: lucide_react_1.BarChart3 },
    { label: 'المخزون', href: '/dashboard/inventory', icon: lucide_react_1.ArrowLeftRight, roles: ['OWNER', 'MANAGER'] },
    { label: 'الموردون', href: '/dashboard/suppliers', icon: lucide_react_1.Truck, roles: ['OWNER', 'MANAGER'] },
    { label: 'المصروفات', href: '/dashboard/expenses', icon: lucide_react_1.DollarSign, roles: ['OWNER', 'MANAGER'] },
    { label: 'الفروع', href: '/dashboard/branches', icon: lucide_react_1.GitBranch, roles: ['OWNER'] },
    { label: 'المستخدمون', href: '/dashboard/users', icon: lucide_react_1.ShieldCheck, roles: ['OWNER'] },
    { label: 'التقارير', href: '/dashboard/reports', icon: lucide_react_1.BarChart3, roles: ['OWNER', 'MANAGER'] },
    { label: 'الإشعارات', href: '/dashboard/notifications', icon: lucide_react_1.Bell },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: lucide_react_1.Settings, roles: ['OWNER', 'MANAGER'] },
];
function Sidebar({ isOpen, onClose }) {
    const pathname = (0, navigation_1.usePathname)();
    const { user, logout } = (0, auth_store_1.useAuthStore)();
    const { pendingSyncCount, isOnline } = (0, settings_store_1.useSettingsStore)();
    const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || ''));
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [isOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/50 z-30 lg:hidden", onClick: onClose })), (0, jsx_runtime_1.jsxs)("aside", { className: (0, utils_1.cn)('fixed top-0 start-0 h-full w-64 bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-transform duration-300', 'lg:translate-x-0 lg:static lg:z-auto', isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'), children: [(0, jsx_runtime_1.jsx)("div", { className: "p-5 border-b border-gray-100 dark:border-gray-800", children: (0, jsx_runtime_1.jsx)(Logo_1.Logo, { size: "sm", variant: "horizontal" }) }), !isOnline && ((0, jsx_runtime_1.jsxs)("div", { className: "mx-3 mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium text-center", children: ["\u0648\u0636\u0639 \u0639\u062F\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644", pendingSyncCount > 0 && ` · ${pendingSyncCount} في الانتظار`] })), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 overflow-y-auto py-3 px-3 space-y-0.5", children: filteredNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, onClick: onClose, className: (0, utils_1.cn)('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group', isActive
                                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'), children: [(0, jsx_runtime_1.jsx)(Icon, { size: 18, className: (0, utils_1.cn)('flex-shrink-0', isActive ? 'text-brand-500' : '') }), (0, jsx_runtime_1.jsx)("span", { className: "flex-1", children: item.label }), isActive && (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 14, className: "opacity-50 rotate-180" }), item.badge ? ((0, jsx_runtime_1.jsx)("span", { className: "bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center", children: item.badge })) : null] }, item.href));
                        }) }), (0, jsx_runtime_1.jsxs)("div", { className: "border-t border-gray-100 dark:border-gray-800 p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm", children: [user?.firstName?.[0], user?.lastName?.[0]] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: [user?.firstName, " ", user?.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 truncate", children: user?.email })] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => logout(), className: "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all font-medium", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { size: 16 }), "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C"] })] })] })] }));
}
//# sourceMappingURL=Sidebar.js.map