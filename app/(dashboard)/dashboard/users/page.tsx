'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Users, Plus, Edit2, Shield, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER';
  isActive: boolean;
  branch?: { name: string; nameAr?: string };
  branchId?: string;
}

const ROLES = [
  { id: 'ADMIN', label: 'مدير', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { id: 'CASHIER', label: 'كاشير', color: 'text-green-600 bg-green-50 dark:bg-green-950' },
];

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'مالك',
  ADMIN: 'مدير',
  CASHIER: 'كاشير',
};

const ROLE_COLOR: Record<string, string> = {
  OWNER: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  ADMIN: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  CASHIER: 'text-green-600 bg-green-50 dark:bg-green-950',
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { activeBranchId } = useSettingsStore();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'CASHIER', branchId: activeBranchId || '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes]: any[] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/branches'),
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes?.data || []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : branchesRes?.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'CASHIER', branchId: activeBranchId || '' });
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role, branchId: user.branchId || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        await apiClient.patch(`/users/${editUser.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          branchId: form.branchId || undefined,
        });
      } else {
        await apiClient.post('/users', {
          ...form,
          branchId: form.branchId || undefined,
        });
      }

      toast.success('تم الحفظ');
      setShowForm(false);
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'فشل الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await apiClient.patch(`/users/${user.id}`, { isActive: !user.isActive });
      toast.success('تم الحفظ');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'فشل التعديل');
    }
  };

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة المستخدمين</h2>
        {isOwner && (
          <button onClick={openAdd} className="btn-brand flex items-center gap-2">
            <Plus size={18} /> إضافة مستخدم
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المستخدمين', value: users.length, color: 'text-brand-500' },
          { label: 'نشطون', value: users.filter((u) => u.isActive).length, color: 'text-green-500' },
          { label: 'مديرون', value: users.filter((u) => u.role === 'ADMIN').length, color: 'text-blue-500' },
          { label: 'كاشيرون', value: users.filter((u) => u.role === 'CASHIER').length, color: 'text-amber-500' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <p className={cn('text-3xl font-black', stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase">
                <th className="text-start p-4 font-semibold">المستخدم</th>
                <th className="text-start p-4 font-semibold">البريد الإلكتروني</th>
                <th className="text-start p-4 font-semibold">الصلاحية</th>
                <th className="text-start p-4 font-semibold">الفرع</th>
                <th className="text-center p-4 font-semibold">الحالة</th>
                {isOwner && <th className="text-center p-4 font-semibold">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isOwner ? 6 : 5 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 6 : 5} className="py-16 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-40" />
                    <p>لا يوجد مستخدمون</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500 font-bold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.firstName} {user.lastName}</p>
                          {user.id === currentUser?.id && <span className="text-xs text-brand-500">أنت</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dir-ltr">{user.email}</td>
                    <td className="p-4">
                      <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', ROLE_COLOR[user.role])}>{ROLE_LABEL[user.role]}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{user.branch?.nameAr || user.branch?.name || '—'}</td>
                    <td className="p-4 text-center">
                      <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', user.isActive ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'text-gray-400 bg-gray-100 dark:bg-gray-800')}>{user.isActive ? 'نشط' : 'موقوف'}</span>
                    </td>
                    {isOwner && (
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(user)} disabled={user.id === currentUser?.id} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="تعديل">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleToggleActive(user)} disabled={user.id === currentUser?.id || user.role === 'OWNER'} className={cn('p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed', user.isActive ? 'hover:bg-red-50 dark:hover:bg-red-950 text-red-400' : 'hover:bg-green-50 dark:hover:bg-green-950 text-green-500')} title={user.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}>
                            <UserCheck size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold flex items-center gap-2">
                <Shield size={18} className="text-brand-500" />
                {editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">الاسم الأول *</label><input className="input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required /></div>
                <div><label className="label">الاسم الأخير *</label><input className="input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required /></div>
              </div>
              {!editUser && (
                <div><label className="label">البريد الإلكتروني *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required dir="ltr" /></div>
              )}
              {!editUser && (
                <div>
                  <label className="label">كلمة المرور *</label>
                  <div className="relative">
                    <input className="input pe-10" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} dir="ltr" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="label">الصلاحية *</label>
                <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required>
                  {ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الفرع *</label>
                <select className="input" value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))} required>
                  <option value="">اختر فرعًا...</option>
                  {branches.map((branch: any) => <option key={branch.id} value={branch.id}>{branch.nameAr || branch.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-brand py-3 disabled:opacity-60">{submitting ? 'جارٍ الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
