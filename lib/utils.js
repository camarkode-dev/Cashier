"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatNumber = formatNumber;
exports.formatDate = formatDate;
exports.formatDateOnly = formatDateOnly;
exports.generateDeviceId = generateDeviceId;
exports.generateDeviceFingerprint = generateDeviceFingerprint;
exports.debounce = debounce;
exports.truncate = truncate;
exports.getRoleLabel = getRoleLabel;
exports.getPaymentMethodLabel = getPaymentMethodLabel;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount, currency = 'EGP', locale = 'ar-EG') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}
function formatNumber(n, locale = 'ar-EG') {
    return new Intl.NumberFormat(locale).format(n);
}
function formatDate(date, locale = 'ar-EG') {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(date));
}
function formatDateOnly(date, locale = 'ar-EG') {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}
function generateDeviceId() {
    const stored = localStorage.getItem('device_id');
    if (stored)
        return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
    return id;
}
function generateDeviceFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
    ];
    // Simple hash
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.substring(0, maxLen) + '...';
}
function getRoleLabel(role, lang = 'ar') {
    const labels = {
        OWNER: { ar: 'مالك', en: 'Owner' },
        MANAGER: { ar: 'مدير', en: 'Manager' },
        CASHIER: { ar: 'كاشير', en: 'Cashier' },
        SUPER_ADMIN: { ar: 'مدير النظام', en: 'Super Admin' },
    };
    return labels[role]?.[lang] || role;
}
function getPaymentMethodLabel(method, lang = 'ar') {
    const labels = {
        CASH: { ar: 'نقدي', en: 'Cash' },
        CARD: { ar: 'بطاقة', en: 'Card' },
        MOBILE: { ar: 'محفظة إلكترونية', en: 'Mobile Wallet' },
        QR: { ar: 'رمز QR', en: 'QR Code' },
        SPLIT: { ar: 'دفع مقسم', en: 'Split Payment' },
        CREDIT: { ar: 'آجل', en: 'Credit' },
    };
    return labels[method]?.[lang] || method;
}
//# sourceMappingURL=utils.js.map