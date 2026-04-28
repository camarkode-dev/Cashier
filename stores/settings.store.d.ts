interface SettingsState {
    language: 'ar' | 'en';
    theme: 'light' | 'dark' | 'system';
    currency: string;
    printerType: 'browser' | 'usb' | 'network' | 'bridge';
    printerIp?: string;
    paperSize: '58mm' | '80mm';
    autoPrint: boolean;
    activeBranchId: string | null;
    isOnline: boolean;
    pendingSyncCount: number;
    setLanguage: (lang: 'ar' | 'en') => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setPrinterConfig: (type: string, ip?: string, size?: '58mm' | '80mm') => void;
    setAutoPrint: (v: boolean) => void;
    setActiveBranch: (id: string) => void;
    setOnline: (v: boolean) => void;
    setPendingSyncCount: (n: number) => void;
}
export declare const useSettingsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<SettingsState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<SettingsState, SettingsState>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: SettingsState) => void) => () => void;
        onFinishHydration: (fn: (state: SettingsState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<SettingsState, SettingsState>>;
    };
}>;
export {};
//# sourceMappingURL=settings.store.d.ts.map