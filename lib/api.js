'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.auditApi = exports.suppliersApi = exports.expensesApi = exports.inventoryApi = exports.usersApi = exports.notificationsApi = exports.branchesApi = exports.reportsApi = exports.customersApi = exports.salesApi = exports.categoriesApi = exports.productsApi = exports.licensesApi = exports.tenantApi = exports.authApi = void 0;
const client_1 = require("./supabase/client");
// ─── Thin fetch wrapper ──────────────────────────────────────────────────────
// Calls our own Next.js API routes (same origin). Cookies are sent automatically.
async function request(path, options = {}) {
    const { params, ...init } = options;
    let url = path.startsWith('http') ? path : `/api${path}`;
    if (params) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== '')
                qs.set(k, String(v));
        }
        const q = qs.toString();
        if (q)
            url += `?${q}`;
    }
    const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers },
    });
    const json = await res.json().catch(() => null);
    if (res.status === 401) {
        const supabase = (0, client_1.createClient)();
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
const get = (path, params) => request(path, { method: 'GET', params });
const post = (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const put = (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
const patch = (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
const del = (path) => request(path, { method: 'DELETE' });
// ─── Typed API modules ───────────────────────────────────────────────────────
exports.authApi = {
    login: (email, password, deviceId) => post('/auth/login', { email, password, deviceId }),
    logout: () => post('/auth/logout'),
    me: () => get('/auth/me'),
};
exports.tenantApi = {
    settings: () => get('/tenants/settings'),
    update: (data) => put('/tenants/settings', data),
    stats: () => get('/tenants/stats'),
};
exports.licensesApi = {
    status: () => get('/licenses/status'),
    activate: (key, fingerprint, deviceName) => post('/licenses/activate', { key, fingerprint, deviceName }),
    devices: () => get('/licenses/devices'),
    deactivate: (id) => del(`/licenses/devices/${id}`),
    offlineRequest: (fingerprint) => post('/licenses/offline-request', { fingerprint }),
};
exports.productsApi = {
    list: (params) => get('/products', params),
    get: (id) => get(`/products/${id}`),
    byBarcode: (barcode, branchId) => get(`/products/barcode/${encodeURIComponent(barcode)}`, { branchId }),
    create: (data) => post('/products', data),
    update: (id, data) => put(`/products/${id}`, data),
    delete: (id) => del(`/products/${id}`),
    qr: (id, format = 'dataurl') => get(`/products/${id}/qr`, { format }),
    transferStock: (data) => post('/stock-transfers', data),
};
exports.categoriesApi = {
    list: () => get('/categories'),
    create: (data) => post('/categories', data),
    update: (id, data) => put(`/categories/${id}`, data),
    delete: (id) => del(`/categories/${id}`),
};
exports.salesApi = {
    list: (params) => get('/sales', params),
    get: (id) => get(`/sales/${id}`),
    create: (data) => post('/sales', data),
    refund: (id) => patch(`/sales/${id}`, { action: 'refund' }),
    void: (id) => patch(`/sales/${id}`, { action: 'void' }),
    syncOffline: (sales) => post('/sales/sync', { sales }),
};
exports.customersApi = {
    list: (params) => get('/customers', params),
    get: (id) => get(`/customers/${id}`),
    byPhone: (phone) => get('/customers', { phone }),
    create: (data) => post('/customers', data),
    update: (id, data) => put(`/customers/${id}`, data),
    delete: (id) => del(`/customers/${id}`),
};
exports.reportsApi = {
    dashboard: (branchId) => get('/reports/dashboard', { branchId }),
    salesChart: (period = 'daily', branchId) => get('/reports/sales-chart', { period, branchId }),
    profit: (params) => get('/reports/profit', params),
    topProducts: (params) => get('/reports/top-products', params),
};
exports.branchesApi = {
    list: () => get('/branches'),
    create: (data) => post('/branches', data),
    update: (id, data) => put(`/branches/${id}`, data),
    delete: (id) => del(`/branches/${id}`),
};
exports.notificationsApi = {
    list: (params) => get('/notifications', params),
    unreadCount: () => get('/notifications', { unreadOnly: true, limit: 1, countOnly: true }),
    markRead: (id) => patch(`/notifications/${id}`),
    markAllRead: () => patch('/notifications/read-all'),
    delete: (id) => del(`/notifications/${id}`),
    deleteAll: () => del('/notifications'),
};
exports.usersApi = {
    list: (params) => get('/users', params),
    get: (id) => get(`/users/${id}`),
    create: (data) => post('/users', data),
    update: (id, data) => patch(`/users/${id}`, data),
    deactivate: (id) => del(`/users/${id}`),
};
exports.inventoryApi = {
    list: (params) => get('/inventory', params),
    update: (data) => patch('/inventory', data),
};
exports.expensesApi = {
    list: (params) => get('/expenses', params),
    summary: () => get('/expenses/summary'),
    create: (data) => post('/expenses', data),
    delete: (id) => del(`/expenses/${id}`),
};
exports.suppliersApi = {
    list: (params) => get('/suppliers', params),
    create: (data) => post('/suppliers', data),
    update: (id, data) => put(`/suppliers/${id}`, data),
};
exports.auditApi = {
    list: (params) => get('/audit-logs', params),
};
// Legacy default export for backward compat
exports.apiClient = { get, post, put, patch, delete: del };
//# sourceMappingURL=api.js.map