'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_store_1 = require("@/stores/auth.store");
function RootPage() {
    const router = (0, navigation_1.useRouter)();
    const { isAuthenticated } = (0, auth_store_1.useAuthStore)();
    (0, react_1.useEffect)(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
        else {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 font-medium", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." })] }) }));
}
//# sourceMappingURL=page.js.map