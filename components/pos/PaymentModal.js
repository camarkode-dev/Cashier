'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModal = PaymentModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const utils_1 = require("@/lib/utils");
const pos_store_1 = require("@/stores/pos.store");
const lucide_react_1 = require("lucide-react");
const utils_2 = require("@/lib/utils");
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const PAYMENT_METHODS = [
    { id: 'CASH', label: 'نقدي', icon: lucide_react_1.Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
    { id: 'CARD', label: 'بطاقة', icon: lucide_react_1.CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { id: 'MOBILE', label: 'محفظة', icon: lucide_react_1.Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
    { id: 'QR', label: 'QR', icon: lucide_react_1.QrCode, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
];
function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }) {
    const { setPaymentMethod, paymentMethod } = (0, pos_store_1.usePOSStore)();
    const [paid, setPaid] = (0, react_1.useState)(total.toFixed(2));
    const inputRef = (0, react_1.useRef)(null);
    const paidNum = parseFloat(paid) || 0;
    const change = Math.max(0, paidNum - total);
    (0, react_1.useEffect)(() => {
        inputRef.current?.select();
        inputRef.current?.focus();
    }, []);
    // Keyboard support: Enter to confirm
    (0, react_1.useEffect)(() => {
        const onKey = (e) => {
            if (e.key === 'Enter' && !isProcessing)
                onConfirm(paidNum);
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [paidNum, isProcessing]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-scale-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0641\u0639" }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5 space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center py-4 bg-brand-50 dark:bg-brand-950 rounded-2xl", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-brand-600 dark:text-brand-400 font-medium mb-1", children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629" }), (0, jsx_runtime_1.jsx)("p", { className: "text-4xl font-black text-brand-500", children: (0, utils_1.formatCurrency)(total, currency) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label text-sm mb-2", children: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-4 gap-2", children: PAYMENT_METHODS.map((m) => {
                                        const Icon = m.icon;
                                        return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setPaymentMethod(m.id), className: (0, utils_2.cn)('flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-semibold text-xs', paymentMethod === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : `border-gray-100 dark:border-gray-800 ${m.color}`), children: [(0, jsx_runtime_1.jsx)(Icon, { size: 20 }), m.label] }, m.id));
                                    }) })] }), paymentMethod === 'CASH' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label text-sm", children: "\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062F\u0641\u0648\u0639" }), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "number", value: paid, onChange: (e) => setPaid(e.target.value), className: "input text-2xl font-black text-center py-4", dir: "ltr", min: total, step: "0.01" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setPaid(total.toFixed(2)), className: "px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 text-sm font-bold", children: "\u0627\u0644\u0645\u0628\u0644\u063A \u062A\u0645\u0627\u0645\u0627\u064B" }), QUICK_AMOUNTS.filter((a) => a >= total).slice(0, 4).map((a) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setPaid(a.toFixed(2)), className: "px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold", children: a }, a)))] }), change > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-green-700 dark:text-green-400 font-medium", children: "\u0627\u0644\u0628\u0627\u0642\u064A \u0644\u0644\u0639\u0645\u064A\u0644" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-600 font-black text-xl", children: (0, utils_1.formatCurrency)(change, currency) })] }))] })), (0, jsx_runtime_1.jsx)("button", { onClick: () => onConfirm(paymentMethod === 'CASH' ? paidNum : total), disabled: isProcessing || (paymentMethod === 'CASH' && paidNum < total), className: "w-full btn-brand py-4 text-lg rounded-2xl flex items-center justify-center gap-2 font-black disabled:opacity-60 disabled:cursor-not-allowed", children: isProcessing ? ((0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : '✓ تأكيد الدفع (Enter)' })] })] }) }));
}
//# sourceMappingURL=PaymentModal.js.map