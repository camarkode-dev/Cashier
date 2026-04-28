"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingsStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useSettingsStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    language: 'ar',
    theme: 'light',
    currency: 'EGP',
    printerType: 'browser',
    paperSize: '80mm',
    autoPrint: true,
    activeBranchId: null,
    isOnline: true,
    pendingSyncCount: 0,
    setLanguage: (language) => set({ language }),
    setTheme: (theme) => set({ theme }),
    setPrinterConfig: (printerType, printerIp, paperSize) => set({ printerType, printerIp, paperSize: paperSize || '80mm' }),
    setAutoPrint: (autoPrint) => set({ autoPrint }),
    setActiveBranch: (activeBranchId) => set({ activeBranchId }),
    setOnline: (isOnline) => set({ isOnline }),
    setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
}), { name: 'pos-settings' }));
//# sourceMappingURL=settings.store.js.map