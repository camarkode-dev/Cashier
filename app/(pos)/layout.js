'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = POSLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_store_1 = require("@/stores/auth.store");
function POSLayout({ children }) {
    const router = (0, navigation_1.useRouter)();
    const { isAuthenticated, isInitialized, needsSetup, initialize } = (0, auth_store_1.useAuthStore)();
    (0, react_1.useEffect)(() => {
        initialize();
    }, []);
    (0, react_1.useEffect)(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace(needsSetup ? '/register' : '/login');
        }
    }, [isInitialized, isAuthenticated, needsSetup]);
    if (!isInitialized) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950", children: (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (!isAuthenticated)
        return null;
    return (0, jsx_runtime_1.jsx)("div", { className: "h-screen overflow-hidden bg-gray-100 dark:bg-gray-950", children: children });
}
//# sourceMappingURL=layout.js.map