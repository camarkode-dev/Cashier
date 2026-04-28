'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RegisterPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const Logo_1 = require("@/components/common/Logo");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const lucide_react_1 = require("lucide-react");
// ─── Contact Admin View ───────────────────────────────────────────────────────
function ContactAdminView() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-brand-50 dark:bg-brand-950 rounded-2xl flex items-center justify-center mx-auto mb-5", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 32, className: "text-brand-500" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-black text-gray-900 dark:text-white mb-2", children: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0645\u0648\u062C\u0628 \u0625\u0630\u0646 \u0645\u0633\u0628\u0642" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8", children: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628\u0627\u062A \u0628\u0634\u0643\u0644 \u0645\u0633\u062A\u0642\u0644. \u064A\u062A\u0648\u0644\u0649 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u062A\u062D\u062F\u064A\u062F \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0643\u0644 \u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0641\u0642\u0627\u064B \u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0639\u0645\u0644." }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3 text-start mb-8", children: [
                    { icon: lucide_react_1.Phone, text: 'تواصل مع مدير النظام أو المسؤول المختص في مؤسستك.' },
                    { icon: lucide_react_1.UserPlus, text: 'سيقوم المدير بإنشاء حسابك وتحديد صلاحياتك المناسبة.' },
                    { icon: lucide_react_1.Mail, text: 'ستصلك بيانات الدخول مباشرةً منه عبر البريد الإلكتروني.' },
                ].map(({ icon: Icon, text }, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0 mt-0.5", children: (0, jsx_runtime_1.jsx)(Icon, { size: 14, className: "text-brand-500" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 dark:text-gray-300 leading-relaxed", children: text })] }, i))) }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/login", className: "w-full btn-brand py-3 flex items-center justify-center gap-2 text-sm font-semibold", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 18, className: "rotate-180" }), "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"] })] }));
}
// ─── Initial Setup Form ───────────────────────────────────────────────────────
function SetupForm() {
    const router = (0, navigation_1.useRouter)();
    const [step, setStep] = (0, react_1.useState)(1);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [done, setDone] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({
        storeName: '',
        firstName: '', lastName: '',
        email: '', password: '', phone: '',
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const nextStep = () => {
        if (!form.storeName.trim()) {
            react_hot_toast_1.default.error('اسم المتجر مطلوب');
            return;
        }
        setStep(2);
    };
    const submit = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName) {
            react_hot_toast_1.default.error('الاسم الكامل مطلوب');
            return;
        }
        if (!form.email) {
            react_hot_toast_1.default.error('البريد الإلكتروني مطلوب');
            return;
        }
        if (form.password.length < 8) {
            react_hot_toast_1.default.error('كلمة المرور 8 أحرف على الأقل');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error(json?.error || 'فشل الإعداد');
            setDone({ message: json.data.message, confirmEmail: json.data.emailConfirmationRequired });
        }
        catch (err) {
            react_hot_toast_1.default.error(err.message || 'حدث خطأ');
        }
        setLoading(false);
    };
    if (done) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-green-50 dark:bg-green-950 rounded-2xl flex items-center justify-center mx-auto mb-5", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 32, className: "text-green-500" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white mb-2", children: "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0638\u0627\u0645" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-sm leading-relaxed mb-6", children: done.message }), done.confirmEmail && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 text-start", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-amber-700 dark:text-amber-300 font-semibold mb-1", children: "\u062A\u0646\u0628\u064A\u0647: \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-amber-600 dark:text-amber-400 leading-relaxed", children: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0627\u0636\u063A\u0637 \u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u0641\u0639\u064A\u0644\u060C \u062B\u0645 \u0639\u062F \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644. \u0623\u0648 \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u0637\u064A\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Supabase \u2192 Authentication \u2192 Email \u2192 Confirm email." })] })), (0, jsx_runtime_1.jsxs)("button", { onClick: () => router.replace('/login'), className: "w-full btn-brand py-3 flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 18, className: "rotate-180" }), "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-brand-50 dark:bg-brand-950 rounded-2xl flex items-center justify-center mx-auto mb-5", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Store, { size: 32, className: "text-brand-500" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-black text-gray-900 dark:text-white text-center mb-1", children: "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0638\u0627\u0645" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-center text-sm mb-6", children: step === 1 ? 'أدخل اسم متجرك لبدء الإعداد الأولي' : 'بيانات حساب المالك' }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-3 justify-center mb-6", children: [
                    { n: 1, label: 'المتجر', icon: lucide_react_1.Store },
                    { n: 2, label: 'المالك', icon: lucide_react_1.User },
                ].map(({ n, label, icon: Icon }, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= n ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`, children: (0, jsx_runtime_1.jsx)(Icon, { size: 14 }) }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-medium ${step === n ? 'text-brand-500' : 'text-gray-400'}`, children: label }), i === 0 && (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-px bg-gray-200 dark:bg-gray-700" })] }, n))) }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: step === 1 ? (e) => { e.preventDefault(); nextStep(); } : submit, className: "space-y-4", children: [step === 1 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", placeholder: "\u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646 \u0644\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629", value: form.storeName, onChange: e => set('storeName', e.target.value), autoFocus: true })] })), step === 2 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0648\u0644 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", placeholder: "\u0623\u064A\u0645\u0646", value: form.firstName, onChange: e => set('firstName', e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u062E\u064A\u0631 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", placeholder: "\u0645\u062D\u0645\u062F", value: form.lastName, onChange: e => set('lastName', e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "email", placeholder: "admin@store.com", value: form.email, onChange: e => set('email', e.target.value), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "password", placeholder: "8 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644", value: form.password, onChange: e => set('password', e.target.value), dir: "ltr" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "tel", placeholder: "+201001234567", value: form.phone, onChange: e => set('phone', e.target.value), dir: "ltr" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-1", children: [step === 2 && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setStep(1), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all", children: "\u0627\u0644\u0633\u0627\u0628\u0642" })), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading, className: "flex-1 btn-brand py-3 flex items-center justify-center gap-2 disabled:opacity-60", children: loading
                                    ? (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { size: 18, className: "animate-spin" })
                                    : step === 1
                                        ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0627\u0644\u062A\u0627\u0644\u064A" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 18 })] })
                                        : (0, jsx_runtime_1.jsx)("span", { children: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0646\u0638\u0627\u0645" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 text-center text-sm text-gray-500", children: ["\u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628\u061F", ' ', (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "text-brand-500 hover:text-brand-600 font-semibold", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" })] })] }));
}
// ─── Page ─────────────────────────────────────────────────────────────────────
function RegisterPage() {
    const [status, setStatus] = (0, react_1.useState)('loading');
    (0, react_1.useEffect)(() => {
        fetch('/api/setup/status')
            .then(r => r.json())
            .then(d => setStatus(d?.data?.setupRequired ? 'setup' : 'contact'))
            .catch(() => setStatus('contact'));
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 opacity-5", style: {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                } }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md relative", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-center mb-6", children: (0, jsx_runtime_1.jsx)(Logo_1.Logo, { size: "md", variant: "full" }) }), status === 'loading' && ((0, jsx_runtime_1.jsx)("div", { className: "flex justify-center py-12", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { size: 32, className: "animate-spin text-brand-500" }) })), status === 'setup' && (0, jsx_runtime_1.jsx)(SetupForm, {}), status === 'contact' && (0, jsx_runtime_1.jsx)(ContactAdminView, {})] }), (0, jsx_runtime_1.jsx)("p", { className: "text-center text-gray-500 text-xs mt-4", children: "\u0646\u0638\u0627\u0645 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064A\u0639 v1.0 \u00B7 \u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646 \u0644\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629" })] })] }));
}
//# sourceMappingURL=page.js.map