import { NextResponse } from 'next/server';
export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER';
type AuthLookupResult = {
    user: any | null;
    dbUser: any | null;
    error?: 'DB_UNAVAILABLE';
};
export declare function isDatabaseUnavailableError(error: unknown): boolean;
export declare function getAuthUser(minRole?: UserRole): Promise<AuthLookupResult>;
export declare function audit(userId: string, action: string, entity: string, entityId?: string, metadata?: object): Promise<void>;
export declare function ok<T>(data: T, status?: number): NextResponse<{
    success: boolean;
    data: T;
}>;
export declare function created<T>(data: T): NextResponse<{
    success: boolean;
    data: T;
}>;
export declare function noContent(): NextResponse<unknown>;
export declare function err(message: string, status?: number, details?: unknown): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function unauthorized(message?: string): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function forbidden(message?: string): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function notFound(entity?: string): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function serviceUnavailable(message?: string): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function serverError(error?: unknown): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function handleError(error: unknown, context?: string): NextResponse<{
    success: boolean;
    error: string;
    details: unknown;
}>;
export declare function requireRole(dbUser: {
    role: string;
} | null, minRole: UserRole): boolean;
export declare function generateInvoiceNumber(branchId?: string): Promise<string>;
export {};
//# sourceMappingURL=api-utils.d.ts.map