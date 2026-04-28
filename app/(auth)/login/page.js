'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const Logo_1 = require("@/components/common/Logo");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const lucide_react_1 = require("lucide-react");
function LoginPage() {
    const router = (0, navigation_1.useRouter)();
    const { login, isLoading } = (0, auth_store_1.useAuthStore)();
    const { isOnline } = (0, settings_store_1.useSettingsStore)();
    const [form, setForm] = (0, react_1.useState)({ email: '', password: '' });
    const [showPass, setShowPass] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            react_hot_toast_1.default.error('يرجى ملء جميع الحقول');
            return;
        }
        try {
            await login(form.email, form.password);
            react_hot_toast_1.default.success('تم تسجيل الدخول بنجاح');
            router.replace('/dashboard');
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-5", style: {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                } }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md relative", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-center mb-8", children: (0, jsx_runtime_1.jsx)(Logo_1.Logo, { size: "lg", variant: "full" }) }), !isOnline && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.WifiOff, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: "\u0623\u0646\u062A \u063A\u064A\u0631 \u0645\u062A\u0635\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A. \u0628\u0639\u0636 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0642\u062F \u062A\u0643\u0648\u0646 \u0645\u062D\u062F\u0648\u062F\u0629." })] })), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-black text-gray-900 dark:text-white text-center mb-1", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-center text-sm mb-8", children: "\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0633\u0627\u0628\u0643 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("input", { type: "email", className: "input", placeholder: "example@store.com", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), autoComplete: "email", dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPass ? 'text' : 'password', className: "input pe-12", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })), autoComplete: "current-password", dir: "ltr" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPass((v) => !v), className: "absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600", children: showPass ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 18 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 18 }) })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full btn-brand py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2", children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogIn, { size: 20 }), "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"] })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 16, className: "text-gray-400 mt-0.5 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 dark:text-gray-400 leading-relaxed", children: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u0643\u0648\u0646 \u0628\u0645\u0648\u062C\u0628 \u062D\u0633\u0627\u0628 \u0635\u0627\u062F\u0631 \u0645\u0646 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0641\u0642\u0637. \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0645\u062E\u062A\u0635." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400", children: [isOnline ? (0, jsx_runtime_1.jsx)(lucide_react_1.Wifi, { size: 12, className: "text-green-500" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.WifiOff, { size: 12, className: "text-red-500" }), isOnline ? 'متصل' : 'غير متصل'] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-center text-gray-500 text-xs mt-4", children: "\u0646\u0638\u0627\u0645 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064A\u0639 v1.0 \u00B7 \u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646 \u0644\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629" })] })] }));
}
//# sourceMappingURL=page.js.map