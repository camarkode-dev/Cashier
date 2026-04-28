declare class SyncEngine {
    private syncing;
    private interval;
    private currentBranchId;
    private currentTenantId;
    start(branchId: string, tenantId: string): void;
    syncNow(): Promise<void> | undefined;
    stop(): void;
    sync(branchId: string, tenantId: string): Promise<void>;
    private syncProducts;
    private syncCustomers;
    private syncPendingSales;
    get isSyncing(): boolean;
}
export declare const syncEngine: SyncEngine;
export {};
//# sourceMappingURL=sync.d.ts.map