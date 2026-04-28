'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UsersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const auth_store_1 = require("@/stores/auth.store");
const settings_store_1 = require("@/stores/settings.store");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const utils_1 = require("@/lib/utils");
const api_1 = require("@/lib/api");
const ROLES = [
    { id: 'MANAGER', label: 'مدير', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { id: 'CASHIER', label: 'كاشير', color: 'text-green-600 bg-green-50 dark:bg-green-950' },
];
const ROLE_LABEL = {
    OWNER: 'مالك',
    MANAGER: 'مدير',
    CASHIER: 'كاشير',
};
const ROLE_COLOR = {
    OWNER: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    MANAGER: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    CASHIER: 'text-green-600 bg-green-50 dark:bg-green-950',
};
function UsersPage() {
    const { user: currentUser } = (0, auth_store_1.useAuthStore)();
    const { activeBranchId } = (0, settings_store_1.useSettingsStore)();
    const [users, setUsers] = (0, react_1.useState)([]);
    const [branches, setBranches] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showForm, setShowForm] = (0, react_1.useState)(false);
    const [editUser, setEditUser] = (0, react_1.useState)(null);
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [form, setForm] = (0, react_1.useState)({ firstName: '', lastName: '', email: '', password: '', role: 'CASHIER', branchId: activeBranchId || '' });
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [showResetPwd, setShowResetPwd] = (0, react_1.useState)(null);
    const [newPassword, setNewPassword] = (0, react_1.useState)('');
    const load = async () => {
        setLoading(true);
        try {
            const [usersRes, branchesRes] = await Promise.all([
                api_1.apiClient.get('/users'),
                api_1.apiClient.get('/branches'),
            ]);
            setUsers(usersRes?.data || []);
            setBranches(branchesRes?.data || []);
        }
        catch {
            react_hot_toast_1.default.error('فشل تحميل المستخدمين');
        }
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const openAdd = () => {
        setEditUser(null);
        setForm({ firstName: '', lastName: '', email: '', password: '', role: 'CASHIER', branchId: activeBranchId || '' });
        setShowForm(true);
    };
    const openEdit = (u) => {
        setEditUser(u);
        setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, branchId: u.branchId || '' });
        setShowForm(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editUser) {
                const payload = { firstName: form.firstName, lastName: form.lastName, role: form.role, branchId: form.branchId };
                await api_1.apiClient.patch(`/users/${editUser.id}`, payload);
                react_hot_toast_1.default.success('تم تحديث المستخدم');
            }
            else {
                await api_1.apiClient.post('/users', form);
                react_hot_toast_1.default.success('تم إضافة المستخدم');
            }
            setShowForm(false);
            load();
        }
        catch (err) {
            react_hot_toast_1.default.error(err?.message || 'فشل الحفظ');
        }
        setSubmitting(false);
    };
    const handleToggleActive = async (u) => {
        try {
            await api_1.apiClient.patch(`/users/${u.id}`, { isActive: !u.isActive });
            react_hot_toast_1.default.success(u.isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
            load();
        }
        catch {
            react_hot_toast_1.default.error('فشل التعديل');
        }
    };
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            react_hot_toast_1.default.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        try {
            await api_1.apiClient.patch(`/users/${showResetPwd.id}/password`, { password: newPassword });
            react_hot_toast_1.default.success('تم تغيير كلمة المرور');
            setShowResetPwd(null);
            setNewPassword('');
        }
        catch {
            react_hot_toast_1.default.error('فشل تغيير كلمة المرور');
        }
    };
    const isOwner = currentUser?.role === 'OWNER';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" }), isOwner && ((0, jsx_runtime_1.jsxs)("button", { onClick: openAdd, className: "btn-brand flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 18 }), " \u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062A\u062E\u062F\u0645"] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
                    { label: 'إجمالي المستخدمين', value: users.length, color: 'text-brand-500' },
                    { label: 'نشطون', value: users.filter((u) => u.isActive).length, color: 'text-green-500' },
                    { label: 'مديرون', value: users.filter((u) => u.role === 'MANAGER').length, color: 'text-blue-500' },
                    { label: 'كاشيرون', value: users.filter((u) => u.role === 'CASHIER').length, color: 'text-amber-500' },
                ].map((s) => ((0, jsx_runtime_1.jsxs)("div", { className: "card p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)('text-3xl font-black', s.color), children: s.value }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400 mt-1", children: s.label })] }, s.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "card overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase", children: [(0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" }), (0, jsx_runtime_1.jsx)("th", { className: "text-start p-4 font-semibold", children: "\u0627\u0644\u0641\u0631\u0639" }), (0, jsx_runtime_1.jsx)("th", { className: "text-center p-4 font-semibold", children: "\u0627\u0644\u062D\u0627\u0644\u0629" }), isOwner && (0, jsx_runtime_1.jsx)("th", { className: "text-center p-4 font-semibold", children: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: loading ? (Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)("tr", { children: Array.from({ length: isOwner ? 6 : 5 }).map((_, j) => ((0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" }) }, j))) }, i)))) : users.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsxs)("td", { colSpan: isOwner ? 6 : 5, className: "py-16 text-center text-gray-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 40, className: "mx-auto mb-3 opacity-40" }), (0, jsx_runtime_1.jsx)("p", { children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646" })] }) })) : (users.map((u) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-9 h-9 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500 font-bold text-sm", children: [u.firstName[0], u.lastName[0]] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "font-semibold text-gray-900 dark:text-white text-sm", children: [u.firstName, " ", u.lastName] }), u.id === currentUser?.id && (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-brand-500", children: "\u0623\u0646\u062A" })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4 text-sm text-gray-500 dir-ltr", children: u.email }), (0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)('px-2.5 py-1 rounded-lg text-xs font-bold', ROLE_COLOR[u.role]), children: ROLE_LABEL[u.role] }) }), (0, jsx_runtime_1.jsx)("td", { className: "p-4 text-sm text-gray-500", children: u.branch?.nameAr || u.branch?.name || '—' }), (0, jsx_runtime_1.jsx)("td", { className: "p-4 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)('px-2.5 py-1 rounded-lg text-xs font-bold', u.isActive ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'), children: u.isActive ? 'نشط' : 'موقوف' }) }), isOwner && ((0, jsx_runtime_1.jsx)("td", { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => openEdit(u), disabled: u.id === currentUser?.id, className: "p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors", title: "\u062A\u0639\u062F\u064A\u0644", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 15 }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { setShowResetPwd(u); setNewPassword(''); }, disabled: u.id === currentUser?.id, className: "p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors", title: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", children: (0, jsx_runtime_1.jsx)(lucide_react_1.KeyRound, { size: 15 }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleToggleActive(u), disabled: u.id === currentUser?.id || u.role === 'OWNER', className: (0, utils_1.cn)('p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed', u.isActive ? 'hover:bg-red-50 dark:hover:bg-red-950 text-red-400' : 'hover:bg-green-50 dark:hover:bg-green-950 text-green-500'), title: u.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب', children: (0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { size: 15 }) })] }) }))] }, u.id)))) })] }) }) }), showForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { size: 18, className: "text-brand-500" }), editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowForm(false), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "p-5 space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0648\u0644 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.firstName, onChange: (e) => setForm((f) => ({ ...f, firstName: e.target.value })), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u062E\u064A\u0631 *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: form.lastName, onChange: (e) => setForm((f) => ({ ...f, lastName: e.target.value })), required: true })] })] }), !editUser && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A *" }), (0, jsx_runtime_1.jsx)("input", { className: "input", type: "email", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), required: true, dir: "ltr" })] })), !editUser && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 *" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { className: "input pe-10", type: showPassword ? 'text' : 'password', value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })), required: true, minLength: 6, dir: "ltr" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword((v) => !v), className: "absolute end-3 top-1/2 -translate-y-1/2 text-gray-400", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 16 }) })] })] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 *" }), (0, jsx_runtime_1.jsx)("select", { className: "input", value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), required: true, children: ROLES.map((r) => (0, jsx_runtime_1.jsx)("option", { value: r.id, children: r.label }, r.id)) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0627\u0644\u0641\u0631\u0639 *" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: form.branchId, onChange: (e) => setForm((f) => ({ ...f, branchId: e.target.value })), required: true, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\u0627\u062E\u062A\u0631 \u0641\u0631\u0639\u0627\u064B..." }), branches.map((b) => (0, jsx_runtime_1.jsx)("option", { value: b.id, children: b.nameAr || b.name }, b.id))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: submitting, className: "flex-1 btn-brand py-3 disabled:opacity-60", children: submitting ? 'جاري الحفظ...' : (editUser ? 'حفظ' : 'إضافة') })] })] })] }) })), showResetPwd && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold", children: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowResetPwd(null), className: "p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleResetPassword, className: "p-5 space-y-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500", children: ["\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631: ", (0, jsx_runtime_1.jsxs)("strong", { children: [showResetPwd.firstName, " ", showResetPwd.lastName] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "label", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 *" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { className: "input pe-10", type: showPassword ? 'text' : 'password', value: newPassword, onChange: (e) => setNewPassword(e.target.value), required: true, minLength: 6, dir: "ltr", autoFocus: true }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword((v) => !v), className: "absolute end-3 top-1/2 -translate-y-1/2 text-gray-400", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 16 }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowResetPwd(null), className: "flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold", children: "\u0625\u0644\u063A\u0627\u0621" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "flex-1 btn-brand py-3", children: "\u062A\u063A\u064A\u064A\u0631" })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map