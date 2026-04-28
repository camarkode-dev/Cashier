interface AuthTenant {
    id: string;
    name: string;
    nameAr?: string | null;
    slug?: string;
    currency?: string | null;
    taxRate?: number | null;
    logo?: string | null;
    license?: {
        type: string;
        status: string;
        expiresAt?: string | null;
        maxDevices?: number | null;
        maxUsers?: number | null;
    } | null;
}
interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'ADMIN' | 'CASHIER';
    branchId?: string | null;
    avatarUrl?: string | null;
    isActive: boolean;
    branch?: {
        id: string;
        name: string;
        nameAr?: string | null;
    } | null;
    tenant?: AuthTenant | null;
    tenantId?: string | null;
}
interface AuthState {
    user: AuthUser | null;
    tenant: AuthTenant | null;
    isLoading: boolean;
    isInitialized: boolean;
    isAuthenticated: boolean;
    needsSetup: boolean;
    initialize: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: (user: AuthUser | null) => void;
    updateTenant: (data: Partial<AuthTenant>) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=auth.store.d.ts.map