'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallPrompt = InstallPrompt;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const BrandMark_1 = require("@/components/common/BrandMark");
function detectPlatform() {
    if (typeof window === 'undefined')
        return null;
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/.test(ua);
    if (isIOS)
        return 'ios';
    if (isAndroid)
        return 'android';
    return 'desktop';
}
function isInStandaloneMode() {
    return (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true);
}
const STORAGE_KEY = 'pwa-install-dismissed';
function InstallPrompt() {
    const [platform, setPlatform] = (0, react_1.useState)(null);
    const [deferredPrompt, setDeferredPrompt] = (0, react_1.useState)(null);
    const [visible, setVisible] = (0, react_1.useState)(false);
    const [showIOSGuide, setShowIOSGuide] = (0, react_1.useState)(false);
    const dismiss = () => {
        setVisible(false);
        setShowIOSGuide(false);
        sessionStorage.setItem(STORAGE_KEY, '1');
    };
    (0, react_1.useEffect)(() => {
        if (isInStandaloneMode())
            return;
        if (sessionStorage.getItem(STORAGE_KEY))
            return;
        const currentPlatform = detectPlatform();
        setPlatform(currentPlatform);
        const onPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setTimeout(() => setVisible(true), 2500);
        };
        const onInstalled = () => dismiss();
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        if (currentPlatform === 'ios') {
            setTimeout(() => setVisible(true), 3000);
        }
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);
    const install = async () => {
        if (platform === 'ios') {
            setShowIOSGuide(true);
            return;
        }
        if (!deferredPrompt)
            return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted')
            dismiss();
    };
    if (!visible || (!deferredPrompt && platform !== 'ios'))
        return null;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 animate-slide-up", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0", children: (0, jsx_runtime_1.jsx)(BrandMark_1.BrandMark, { size: 48, title: "\u0623\u0648\u0644\u0627\u062F \u0623\u064A\u0645\u0646" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold text-gray-900 dark:text-white text-sm", children: "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: platform === 'ios'
                                        ? 'أضف التطبيق إلى الشاشة الرئيسية بنفس الشعار'
                                        : 'ثبّت التطبيق ليفتح كتطبيق مستقل وليس داخل صفحة المتصفح' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: install, className: "flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors", children: [platform === 'ios' ? (0, jsx_runtime_1.jsx)(lucide_react_1.Share, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 14 }), platform === 'ios' ? 'الخطوات' : 'تثبيت'] }), (0, jsx_runtime_1.jsx)("button", { onClick: dismiss, className: "p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", "aria-label": "\u0625\u063A\u0644\u0627\u0642", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 16 }) })] })] }) }), showIOSGuide && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-5", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-black text-gray-900 dark:text-white", children: "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629" }), (0, jsx_runtime_1.jsx)("button", { onClick: dismiss, className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400", "aria-label": "\u0625\u063A\u0644\u0627\u0642", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 18 }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: [
                                {
                                    step: '1',
                                    text: 'اضغط زر المشاركة',
                                    sub: 'الزر الموجود في شريط الأدوات السفلي',
                                    icon: ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "w-5 h-5 text-brand-500", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13", strokeLinecap: "round", strokeLinejoin: "round" }) })),
                                },
                                {
                                    step: '2',
                                    text: 'اختر إضافة إلى الشاشة الرئيسية',
                                    sub: 'مرر لأسفل داخل قائمة الخيارات حتى تجدها',
                                    icon: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "w-5 h-5 text-brand-500", children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 8v8M8 12h8", strokeLinecap: "round" })] })),
                                },
                                {
                                    step: '3',
                                    text: 'اضغط إضافة',
                                    sub: 'سيظهر التطبيق على الشاشة الرئيسية بنفس الأيقونة',
                                    icon: ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: "w-5 h-5 text-brand-500", children: (0, jsx_runtime_1.jsx)("path", { d: "M20 6L9 17l-5-5", strokeLinecap: "round", strokeLinejoin: "round" }) })),
                                },
                            ].map(({ step, text, sub, icon }) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0 font-bold text-brand-600 text-sm", children: step }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [icon, (0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-gray-900 dark:text-white text-sm", children: text })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400 mt-0.5", children: sub })] })] }, step))) }), (0, jsx_runtime_1.jsx)("button", { onClick: dismiss, className: "w-full mt-6 btn-brand py-3 text-sm font-semibold", children: "\u0641\u0647\u0645\u062A\u060C \u0634\u0643\u0631\u064B\u0627" })] }) }))] }));
}
//# sourceMappingURL=InstallPrompt.js.map