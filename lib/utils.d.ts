import { type ClassValue } from 'clsx';
export declare function cn(...inputs: ClassValue[]): string;
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
export declare function formatNumber(n: number, locale?: string): string;
export declare function formatDate(date: string | Date, locale?: string): string;
export declare function formatDateOnly(date: string | Date, locale?: string): string;
export declare function generateDeviceId(): string;
export declare function generateDeviceFingerprint(): string;
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function truncate(str: string, maxLen: number): string;
export declare function getRoleLabel(role: string, lang?: 'ar' | 'en'): string;
export declare function getPaymentMethodLabel(method: string, lang?: 'ar' | 'en'): string;
//# sourceMappingURL=utils.d.ts.map