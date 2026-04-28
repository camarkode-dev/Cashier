import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

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
  branch?: { id: string; name: string; nameAr?: string | null } | null;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isLoading: false,
  isInitialized: false,
  needsSetup: false,

  get isAuthenticated() {
    return !!get().user;
  },

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await get().refreshUser();
        if (!get().user) {
          // Supabase auth OK, but no Prisma record — provisioning gap, not an auth error
          // Keep the session alive; check provisioning state separately
          try {
            const res = await fetch('/api/setup/status');
            const json = await res.json();
            const { needsSetup, currentUserProvisioned } = json?.data ?? {};
            if (needsSetup || !currentUserProvisioned) {
              set({ needsSetup: true });
            }
          } catch {
            set({ needsSetup: true });
          }
        }
      }
    } catch {
      set({ user: null, tenant: null });
    }

    set({ isLoading: false, isInitialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      await get().refreshUser();
      if (!get().user) {
        await supabase.auth.signOut();
        throw new Error('تعذر تحميل بيانات الحساب. تحقق من اتصال قاعدة البيانات.');
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
      set({ user: null, tenant: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        set({ user: null, tenant: null });
        return;
      }

      const json = await res.json();
      if (json?.data) {
        set({ user: json.data, tenant: json.data.tenant || null });
      } else {
        set({ user: null, tenant: null });
      }
    } catch {
      set({ user: null, tenant: null });
    }
  },

  setUser: (user) => set({ user }),

  updateTenant: (data) =>
    set((state) => ({ tenant: state.tenant ? { ...state.tenant, ...data } : null })),
}));
