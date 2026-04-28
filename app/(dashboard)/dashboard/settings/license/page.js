'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LicensePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("@/lib/api");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const utils_2 = require("@/lib/utils");
function LicensePage() {
    const [licenseStatus, setLicenseStatus] = (0, react_1.useState)(null);
    const [devices, setDevices] = (0, react_1.useState)([]);
    const [activateKey, setActivateKey] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [activating, setActivating] = (0, react_1.useState)(false);
    const load = async () => {
        try {
            const [status, devs] = await Promise.all([
                api_1.licensesApi.status(),
                api_1.licensesApi.devices(),
            ]);
            setLicenseStatus(status?.data || status);
            setDevices(devs?.data || []);
        }
        catch { }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const handleActivate = async (e) => {
        e.preventDefault();
        if (!activateKey.trim())
            return;
        setActivating(true);
        try {
            const fingerprint = (0, utils_1.generateDeviceFingerprint)();
            const deviceName = navigator.userAgent.substring(0, 50);
            await api_1.licensesApi.activate(activateKey, fingerprint, deviceName);
            react_hot_toast_1.default.success('تم تفعيل الترخيص بنجاح');
            setActivateKey('');
            load();
        }
        catch { }
        setActivating(false);
    };
    const handleDeactivate = async (deviceId) => {
        if (!confirm('هل تريد إلغاء تفعيل هذا الجهاز؟'))
            return;
        try {
            await api_1.licensesApi.deactivate(deviceId);
            react_hot_toast_1.default.success('تم إلغاء التفعيل');
            load();
        }
        catch { }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5 max-w-2xl", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-black text-gray-900 dark:text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "text-brand-500", size: 24 }), "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0631\u062E\u064A\u0635"] }), licenseStatus && ((0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold text-gray-900 dark:text-white mb-4", children: "\u0627\u0644\u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u062D\u0627\u0644\u064A" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-3 text-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-2xl p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: "\u0627\u0644\u0646\u0648\u0639" }), (0, jsx_runtime_1.jsx)("p", { className: "font-black text-brand-500 mt-1", children: licenseStatus.type })] }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-2xl p-3 ${licenseStatus.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`, children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: "\u0627\u0644\u062D\u0627\u0644\u0629" }), (0, jsx_runtime_1.jsx)("p", { className: `font-black mt-1 ${licenseStatus.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`, children: licenseStatus.status === 'ACTIVE' ? 'نشط' : licenseStatus.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-2xl p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400", children: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629" }), (0, jsx_runtime_1.jsxs)("p", { className: "font-black text-gray-900 dark:text-white mt-1", children: [licenseStatus.activeDevices, "/", licenseStatus.maxDevices] })] })] }), licenseStatus.expiresAt && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-3 text-sm text-center text-gray-500", children: ["\u064A\u0646\u062A\u0647\u064A \u0641\u064A: ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: new Date(licenseStatus.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) })] }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Key, { size: 18, className: "text-brand-500" }), "\u062A\u0641\u0639\u064A\u0644 \u062A\u0631\u062E\u064A\u0635 \u062C\u062F\u064A\u062F"] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleActivate, className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)("input", { className: "input flex-1 font-mono uppercase", placeholder: "XXX-XXXX-XXXX-XXXX", value: activateKey, onChange: (e) => setActivateKey(e.target.value.toUpperCase()), dir: "ltr" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: activating || !activateKey.trim(), className: "btn-brand px-5 disabled:opacity-60 flex-shrink-0", children: activating ? (0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : 'تفعيل' })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400 mt-2", children: "\u0633\u064A\u062A\u0645 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0631\u062E\u064A\u0635 \u0628\u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u062D\u0627\u0644\u064A \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "card p-5", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Monitor, { size: 18, className: "text-brand-500" }), "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u0641\u0639\u0651\u0644\u0629"] }), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: Array.from({ length: 3 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" }, i)) })) : devices.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-center text-gray-400 py-6 text-sm", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062C\u0647\u0632\u0629 \u0645\u0641\u0639\u0651\u0644\u0629" })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: devices.map((device) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-3 p-3 rounded-xl border ${device.isActive ? 'border-green-100 dark:border-green-800 bg-green-50 dark:bg-green-950' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 opacity-60'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Monitor, { size: 18, className: device.isActive ? 'text-green-500' : 'text-gray-400' }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: device.deviceName || 'جهاز غير معروف' }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400", children: ["\u0622\u062E\u0631 \u0638\u0647\u0648\u0631: ", (0, utils_2.formatDate)(device.lastSeenAt)] })] }), device.isActive ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 16, className: "text-green-500 flex-shrink-0" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { size: 16, className: "text-gray-400 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDeactivate(device.id), className: "p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 14 }) })] }, device.id))) }))] })] }));
}
//# sourceMappingURL=page.js.map