import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type SupportedCountry, getRegionalConfig } from '@/lib/currency';

export type PrinterConnectionType = 'bluetooth' | 'usb' | 'network';

export interface PrinterConfig {
  isEnabled: boolean;
  connectionType: PrinterConnectionType;
  deviceName: string;
  deviceId: string;
  deviceAddress: string;
  ip: string;
  port: number;
  paperWidth: '58mm' | '80mm';
  fontScale: number;
  retryAttempts: number;
  lastConnected?: string;
}

export const DEFAULT_CASHIER_PRINTER: PrinterConfig = {
  isEnabled: true,
  connectionType: 'usb',
  deviceName: '',
  deviceId: '',
  deviceAddress: '',
  ip: '',
  port: 3002,
  paperWidth: '80mm',
  fontScale: 1,
  retryAttempts: 2,
};

interface SettingsState {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  country: SupportedCountry;
  currency: string;
  printerType: 'browser' | 'usb' | 'network' | 'bridge';
  printerIp?: string;
  paperSize: '58mm' | '80mm';
  cashierPrinter: PrinterConfig;
  autoPrint: boolean;
  activeBranchId: string | null;
  isOnline: boolean;
  pendingSyncCount: number;

  setLanguage: (lang: 'ar' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCountry: (country: SupportedCountry) => void;
  setCurrency: (currency: string) => void;
  setRegionalSettings: (country: SupportedCountry, currency?: string) => void;
  setPrinterConfig: (type: string, ip?: string, size?: '58mm' | '80mm') => void;
  updateCashierPrinter: (patch: Partial<PrinterConfig>) => void;
  setAutoPrint: (v: boolean) => void;
  setActiveBranch: (id: string) => void;
  setOnline: (v: boolean) => void;
  setPendingSyncCount: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      theme: 'light',
      country: 'EG',
      currency: getRegionalConfig('EG').currency,
      printerType: 'browser',
      paperSize: '80mm',
      cashierPrinter: DEFAULT_CASHIER_PRINTER,
      autoPrint: true,
      activeBranchId: null,
      isOnline: true,
      pendingSyncCount: 0,

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setCountry: (country) => set({ country, currency: getRegionalConfig(country).currency }),
      setCurrency: (currency) => set({ currency }),
      setRegionalSettings: (country, currency) =>
        set({
          country,
          currency: currency || getRegionalConfig(country).currency,
        }),
      setPrinterConfig: (printerType: any, printerIp, paperSize) =>
        set((state) => ({
          printerType,
          printerIp,
          paperSize: paperSize || '80mm',
          cashierPrinter: {
            ...state.cashierPrinter,
            connectionType:
              printerType === 'network' || printerType === 'usb'
                ? printerType
                : state.cashierPrinter.connectionType,
            ip: printerIp || state.cashierPrinter.ip,
            paperWidth: paperSize || state.cashierPrinter.paperWidth,
          },
        })),
      updateCashierPrinter: (patch) =>
        set((state) => ({
          cashierPrinter: {
            ...state.cashierPrinter,
            ...patch,
          },
          paperSize: patch.paperWidth || state.paperSize,
          printerIp: typeof patch.ip === 'string' ? patch.ip : state.printerIp,
          printerType:
            patch.connectionType === 'network' || patch.connectionType === 'usb'
              ? patch.connectionType
              : state.printerType,
        })),
      setAutoPrint: (autoPrint) => set({ autoPrint }),
      setActiveBranch: (activeBranchId) => set({ activeBranchId }),
      setOnline: (isOnline) => set({ isOnline }),
      setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
    }),
    {
      name: 'pos-settings',
      version: 3,
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;

        const withRegion = version < 2 ? {
          ...persistedState,
          country: 'EG',
          currency: getRegionalConfig('EG').currency,
        } : persistedState;

        if (version >= 3 && withRegion.cashierPrinter) return withRegion;

        const legacyConnection =
          withRegion.printerType === 'network'
            ? 'network'
            : withRegion.printerType === 'usb'
              ? 'usb'
              : DEFAULT_CASHIER_PRINTER.connectionType;
        const oldCashier = withRegion.printers?.cashier;

        return {
          ...withRegion,
          cashierPrinter: {
            ...DEFAULT_CASHIER_PRINTER,
            ...oldCashier,
            isEnabled: oldCashier?.isEnabled ?? true,
            connectionType: oldCashier?.connectionType || legacyConnection,
            ip: oldCashier?.ip || withRegion.printerIp || '',
            paperWidth: oldCashier?.paperWidth || withRegion.paperSize || '80mm',
          },
        };
      },
    },
  ),
);
