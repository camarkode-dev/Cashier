import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { getCountryByCurrency, getRegionalConfig } from '@/lib/currency';
import { useSettingsStore } from '@/stores/settings.store';

interface AuthTenant {
  id: string;
  name: string;
  nameAr?: string | null;
  slug?: string;
  phone?: string | null;
  country?: string | null;
  currency?: string | null;
  taxRate?: number | null;
  logo?: string | null;
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
  branch?: { id: string; name: string; nameAr?: string | null } | null;
  tenant?: AuthTenant | null;
  tenantId?: string | null;
}

type RefreshUserStatus = 'ok' | 'unauthorized' | 'unavailable';

interface AuthState {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  needsSetup: boolean;
  authIssue: 'none' | 'unavailable';
  initialize: (force?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<RefreshUserStatus>;
  setUser: (user: AuthUser | null) => void;
  updateTenant: (data: Partial<AuthTenant>) => void;
}

function syncRegionalSettings(tenant: AuthTenant | null) {
  const settings = useSettingsStore.getState();
  const preferredCountry = settings.country || getCountryByCurrency(tenant?.currency);
  const preferredCurrency = getRegionalConfig(preferredCountry).currency;
  settings.setRegionalSettings(preferredCountry, preferredCurrency);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isLoading: false,
  isInitialized: false,
  needsSetup: false,
  authIssue: 'none',

  get isAuthenticated() {
    return !!get().user;
  },

  initialize: async (force = false) => {
    if (get().isInitialized && !force) return;
    set({ isLoading: true, authIssue: 'none' });

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const status = await get().refreshUser();

        if (status === 'unavailable') {
          set({ authIssue: 'unavailable' });
        }

        if (!get().user) {
          try {
            const res = await fetch('/api/setup/status', { cache: 'no-store' });
            const json = await res.json();
            const { needsSetup, currentUserProvisioned } = json?.data ?? {};
            if (needsSetup || !currentUserProvisioned) {
              set({ needsSetup: true });
            }
          } catch {
            set({ needsSetup: true });
          }
        }
      } else {
        set({ user: null, tenant: null, needsSetup: false });
      }
    } catch {
      set({ user: null, tenant: null, authIssue: 'unavailable' });
    }

    set({ isLoading: false, isInitialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      const status = await get().refreshUser();
      if (status !== 'ok' || !get().user) {
        await supabase.auth.signOut();
        throw new Error(
          status === 'unavailable'
            ? 'تعذر الوصول إلى بيانات الحساب الآن. حاول مرة أخرى بعد قليل.'
            : 'تعذر تحميل بيانات الحساب. تحقق من إعداد المستخدم في قاعدة البيانات.',
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Registration failed');
      await get().refreshUser();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({ user: null, tenant: null, authIssue: 'none', needsSetup: false });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });

      if (res.status === 401) {
        set({ user: null, tenant: null, authIssue: 'none' });
        return 'unauthorized';
      }

      if (res.status === 503) {
        set({ authIssue: 'unavailable' });
        return 'unavailable';
      }

      if (!res.ok) {
        set({ authIssue: 'unavailable' });
        return 'unavailable';
      }

      const json = await res.json();
      if (json?.data) {
        const tenant = json.data.tenant || null;
        set({ user: json.data, tenant, authIssue: 'none', needsSetup: false });
        syncRegionalSettings(tenant);
        return 'ok';
      }

      set({ user: null, tenant: null, authIssue: 'none' });
      return 'unauthorized';
    } catch {
      set({ authIssue: 'unavailable' });
      return 'unavailable';
    }
  },

  setUser: (user) => set({ user }),

  updateTenant: (data) =>
    set((state) => {
      const tenant = state.tenant ? { ...state.tenant, ...data } : null;
      syncRegionalSettings(tenant);
      return { tenant };
    }),
}));
