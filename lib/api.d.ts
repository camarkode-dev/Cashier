export declare const authApi: {
    login: (email: string, password: string, deviceId?: string) => Promise<any>;
    logout: () => Promise<any>;
    me: () => Promise<any>;
};
export declare const tenantApi: {
    settings: () => Promise<any>;
    update: (data: any) => Promise<any>;
    stats: () => Promise<any>;
};
export declare const licensesApi: {
    status: () => Promise<any>;
    activate: (key: string, fingerprint: string, deviceName?: string) => Promise<any>;
    devices: () => Promise<any>;
    deactivate: (id: string) => Promise<any>;
    offlineRequest: (fingerprint: string) => Promise<any>;
};
export declare const productsApi: {
    list: (params?: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    byBarcode: (barcode: string, branchId?: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    qr: (id: string, format?: "svg" | "png" | "dataurl") => Promise<any>;
    transferStock: (data: any) => Promise<any>;
};
export declare const categoriesApi: {
    list: () => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
};
export declare const salesApi: {
    list: (params?: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    refund: (id: string) => Promise<any>;
    void: (id: string) => Promise<any>;
    syncOffline: (sales: any[]) => Promise<any>;
};
export declare const customersApi: {
    list: (params?: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    byPhone: (phone: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
};
export declare const reportsApi: {
    dashboard: (branchId?: string) => Promise<any>;
    salesChart: (period?: "daily" | "weekly" | "monthly", branchId?: string) => Promise<any>;
    profit: (params?: any) => Promise<any>;
    topProducts: (params?: any) => Promise<any>;
};
export declare const branchesApi: {
    list: () => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
};
export declare const notificationsApi: {
    list: (params?: any) => Promise<any>;
    unreadCount: () => Promise<any>;
    markRead: (id: string) => Promise<any>;
    markAllRead: () => Promise<any>;
    delete: (id: string) => Promise<any>;
    deleteAll: () => Promise<any>;
};
export declare const usersApi: {
    list: (params?: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    deactivate: (id: string) => Promise<any>;
};
export declare const inventoryApi: {
    list: (params?: any) => Promise<any>;
    update: (data: any) => Promise<any>;
};
export declare const expensesApi: {
    list: (params?: any) => Promise<any>;
    summary: () => Promise<any>;
    create: (data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
};
export declare const suppliersApi: {
    list: (params?: any) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
};
export declare const auditApi: {
    list: (params?: any) => Promise<any>;
};
export declare const apiClient: {
    get: <T = any>(path: string, params?: Record<string, any>) => Promise<T>;
    post: <T = any>(path: string, body?: unknown) => Promise<T>;
    put: <T = any>(path: string, body?: unknown) => Promise<T>;
    patch: <T = any>(path: string, body?: unknown) => Promise<T>;
    delete: <T = any>(path: string) => Promise<T>;
};
//# sourceMappingURL=api.d.ts.map