'use client';

import { createClient } from './supabase/client';

// ─── Thin fetch wrapper ──────────────────────────────────────────────────────
// Calls our own Next.js API routes (same origin). Cookies are sent automatically.

async function request<T = any>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const { params, ...init } = options;

  let url = path.startsWith('http') ? path : `/api${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    const q = qs.toString();
    if (q) url += `?${q}`;
  }

  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  const json = await res.json().catch(() => null);

  if (res.status === 401) {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new Error('انتهت الجلسة. يرجى تسجيل الدخول مجدداً.');
  }

  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json?.data ?? json;
}

const get = <T = any>(path: string, params?: Record<string, any>) =>
  request<T>(path, { method: 'GET', params });

const post = <T = any>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

const put = <T = any>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });

const patch = <T = any>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

const del = <T = any>(path: string) => request<T>(path, { method: 'DELETE' });

// ─── Typed API modules ───────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, deviceId?: string) =>
    post('/auth/login', { email, password, deviceId }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
};

export const tenantApi = {
  settings: () => get('/tenants/settings'),
  update: (data: any) => put('/tenants/settings', data),
  stats: () => get('/tenants/stats'),
};

export const licensesApi = {
  status: () => get('/licenses/status'),
  activate: (key: string, fingerprint: string, deviceName?: string) =>
    post('/licenses/activate', { key, fingerprint, deviceName }),
  devices: () => get('/licenses/devices'),
  deactivate: (id: string) => del(`/licenses/devices/${id}`),
  offlineRequest: (fingerprint: string) => post('/licenses/offline-request', { fingerprint }),
};

export const productsApi = {
  list: (params?: any) => get('/products', params),
  get: (id: string) => get(`/products/${id}`),
  byBarcode: (barcode: string, branchId?: string) => get(`/products/barcode/${encodeURIComponent(barcode)}`, { branchId }),
  create: (data: any) => post('/products', data),
  update: (id: string, data: any) => put(`/products/${id}`, data),
  delete: (id: string) => del(`/products/${id}`),
  qr: (id: string, format: 'svg' | 'png' | 'dataurl' = 'dataurl') => get(`/products/${id}/qr`, { format }),
  transferStock: (data: any) => post('/stock-transfers', data),
};

export const categoriesApi = {
  list: () => get('/categories'),
  create: (data: any) => post('/categories', data),
  update: (id: string, data: any) => put(`/categories/${id}`, data),
  delete: (id: string) => del(`/categories/${id}`),
};

export const salesApi = {
  list: (params?: any) => get('/sales', params),
  get: (id: string) => get(`/sales/${id}`),
  create: (data: any) => post('/sales', data),
  refund: (id: string) => patch(`/sales/${id}`, { action: 'refund' }),
  void: (id: string) => patch(`/sales/${id}`, { action: 'void' }),
  syncOffline: (sales: any[]) => post('/sales/sync', { sales }),
};

export const customersApi = {
  list: (params?: any) => get('/customers', params),
  get: (id: string) => get(`/customers/${id}`),
  byPhone: (phone: string) => get('/customers', { phone }),
  create: (data: any) => post('/customers', data),
  update: (id: string, data: any) => put(`/customers/${id}`, data),
  delete: (id: string) => del(`/customers/${id}`),
};

export const reportsApi = {
  dashboard: (branchId?: string) => get('/reports/dashboard', { branchId }),
  salesChart: (period: 'daily' | 'weekly' | 'monthly' = 'daily', branchId?: string) => 
    get('/reports/sales-chart', { period, branchId }),
  profit: (params?: any) => get('/reports/profit', params),
  topProducts: (params?: any) => get('/reports/top-products', params),
};

export const branchesApi = {
  list: () => get('/branches'),
  create: (data: any) => post('/branches', data),
  update: (id: string, data: any) => put(`/branches/${id}`, data),
  delete: (id: string) => del(`/branches/${id}`),
};

export const notificationsApi = {
  list: (params?: any) => get('/notifications', params),
  unreadCount: () => get('/notifications', { unreadOnly: true, limit: 1, countOnly: true }),
  markRead: (id: string) => patch(`/notifications/${id}`),
  markAllRead: () => patch('/notifications/read-all'),
  delete: (id: string) => del(`/notifications/${id}`),
  deleteAll: () => del('/notifications'),
};

export const usersApi = {
  list: (params?: any) => get('/users', params),
  get: (id: string) => get(`/users/${id}`),
  create: (data: any) => post('/users', data),
  update: (id: string, data: any) => patch(`/users/${id}`, data),
  deactivate: (id: string) => del(`/users/${id}`),
};

export const inventoryApi = {
  list: (params?: any) => get('/inventory', params),
  update: (data: any) => patch('/inventory', data),
};

export const expensesApi = {
  list: (params?: any) => get('/expenses', params),
  summary: () => get('/expenses/summary'),
  create: (data: any) => post('/expenses', data),
  delete: (id: string) => del(`/expenses/${id}`),
};

export const suppliersApi = {
  list: (params?: any) => get('/suppliers', params),
  create: (data: any) => post('/suppliers', data),
  update: (id: string, data: any) => put(`/suppliers/${id}`, data),
};

export const auditApi = {
  list: (params?: any) => get('/audit-logs', params),
};

// Legacy default export for backward compat
export const apiClient = { get, post, put, patch, delete: del };
