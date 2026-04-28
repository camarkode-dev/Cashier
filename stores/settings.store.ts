import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type SupportedCountry, getRegionalConfig } from '@/lib/currency';

interface SettingsState {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  country: SupportedCountry;
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
  setCountry: (country: SupportedCountry) => void;
  setCurrency: (currency: string) => void;
  setRegionalSettings: (country: SupportedCountry, currency?: string) => void;
  setPrinterConfig: (type: string, ip?: string, size?: '58mm' | '80mm') => void;
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
      setPrinterConfig: (printerType: any, printerIp, paperSize) => set({ printerType, printerIp, paperSize: paperSize || '80mm' }),
      setAutoPrint: (autoPrint) => set({ autoPrint }),
      setActiveBranch: (activeBranchId) => set({ activeBranchId }),
      setOnline: (isOnline) => set({ isOnline }),
      setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
    }),
    { name: 'pos-settings' },
  ),
);
