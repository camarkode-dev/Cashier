"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewport = exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const next_themes_1 = require("next-themes");
const react_hot_toast_1 = require("react-hot-toast");
const ServiceWorkerRegistrar_1 = require("@/components/common/ServiceWorkerRegistrar");
const InstallPrompt_1 = require("@/components/common/InstallPrompt");
require("./globals.css");
exports.metadata = {
    title: 'أولاد أيمن للأدوات المنزلية | نظام نقطة البيع',
    description: 'تطبيق نقطة بيع متكامل لأولاد أيمن للأدوات المنزلية',
    applicationName: 'أولاد أيمن',
    keywords: ['نقطة بيع', 'POS', 'أدوات منزلية', 'مخزون', 'فواتير'],
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
            { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
        ],
        apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
        shortcut: ['/favicon.ico'],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'أولاد أيمن',
    },
};
exports.viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#1d2026' },
        { media: '(prefers-color-scheme: dark)', color: '#1d2026' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};
function RootLayout({ children }) {
    return ((0, jsx_runtime_1.jsxs)("html", { lang: "ar", dir: "rtl", suppressHydrationWarning: true, children: [(0, jsx_runtime_1.jsxs)("head", { children: [(0, jsx_runtime_1.jsx)("meta", { name: "mobile-web-app-capable", content: "yes" }), (0, jsx_runtime_1.jsx)("meta", { name: "apple-mobile-web-app-capable", content: "yes" }), (0, jsx_runtime_1.jsx)("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }), (0, jsx_runtime_1.jsx)("meta", { name: "apple-mobile-web-app-title", content: "\u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646" }), (0, jsx_runtime_1.jsx)("meta", { name: "application-name", content: "\u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646" }), (0, jsx_runtime_1.jsx)("meta", { name: "msapplication-TileColor", content: "#1d2026" }), (0, jsx_runtime_1.jsx)("link", { rel: "icon", href: "/favicon.ico", sizes: "any" }), (0, jsx_runtime_1.jsx)("link", { rel: "apple-touch-icon", href: "/apple-icon.png" })] }), (0, jsx_runtime_1.jsx)("body", { children: (0, jsx_runtime_1.jsxs)(next_themes_1.ThemeProvider, { attribute: "class", defaultTheme: "light", enableSystem: true, children: [(0, jsx_runtime_1.jsx)(ServiceWorkerRegistrar_1.ServiceWorkerRegistrar, {}), (0, jsx_runtime_1.jsx)(InstallPrompt_1.InstallPrompt, {}), children, (0, jsx_runtime_1.jsx)(react_hot_toast_1.Toaster, { position: "top-center", toastOptions: {
                                duration: 3000,
                                style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
                                success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
                            } })] }) })] }));
}
//# sourceMappingURL=layout.js.map