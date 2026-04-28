import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLocaleForCurrency } from '@/lib/currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EGP', locale?: string) {
  const resolvedLocale = locale || getLocaleForCurrency(currency);
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number, locale = 'ar-EG') {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatDate(date: string | Date, locale = 'ar-EG') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateOnly(date: string | Date, locale = 'ar-EG') {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

export function generateDeviceId(): string {
  const stored = localStorage.getItem('device_id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('device_id', id);
  return id;
}

export function generateDeviceFingerprint(): string {
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

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(str: string, maxLen: number) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

export function getRoleLabel(role: string, lang: 'ar' | 'en' = 'ar') {
  const labels: Record<string, { ar: string; en: string }> = {
    OWNER: { ar: 'مالك', en: 'Owner' },
    ADMIN: { ar: 'مدير', en: 'Manager' },
    CASHIER: { ar: 'كاشير', en: 'Cashier' },
    SUPER_ADMIN: { ar: 'مدير النظام', en: 'Super Admin' },
  };
  return labels[role]?.[lang] || role;
}

export function getPaymentMethodLabel(method: string, lang: 'ar' | 'en' = 'ar') {
  const labels: Record<string, { ar: string; en: string }> = {
    CASH: { ar: 'نقدي', en: 'Cash' },
    CARD: { ar: 'بطاقة', en: 'Card' },
    MOBILE: { ar: 'محفظة إلكترونية', en: 'Mobile Wallet' },
    QR: { ar: 'محفظة إلكترونية', en: 'E-Wallet' },
    SPLIT: { ar: 'دفع مقسم', en: 'Split Payment' },
    CREDIT: { ar: 'آجر', en: 'Credit' },
  };
  return labels[method]?.[lang] || method;
}
