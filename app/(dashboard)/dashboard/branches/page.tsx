'use client';
import { useEffect, useState } from 'react';
import { branchesApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, GitBranch, Check, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', nameAr: '', address: '', phone: '' };

export default function BranchesPage() {
  const { activeBranchId, setActiveBranch } = useSettingsStore();
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await branchesApi.list();
      setBranches(Array.isArray(data) ? data : data?.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditBranch(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (branch: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditBranch(branch);
    setForm({ name: branch.name || '', nameAr: branch.nameAr || '', address: branch.address || '', phone: branch.phone || '' });
    setShowForm(true);
  };

  const handleDelete = async (branch: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (branch.isMain) { toast.error('لا يمكن حذف الفرع الرئيسي'); return; }
    if (!confirm(`حذف فرع "${branch.nameAr || branch.name}"؟`)) return;
    try {
      await branchesApi.delete(branch.id);
      toast.success('تم حذف الفرع');
      if (activeBranchId === branch.id) setActiveBranch('');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حذف الفرع');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editBranch) {
        await branchesApi.update(editBranch.id, {
          name: form.name.trim() || form.nameAr.trim(),
          nameAr: form.nameAr.trim() || undefined,
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
      } else {
        await branchesApi.create({
          name: form.name.trim() || form.nameAr.trim(),
          nameAr: form.nameAr.trim() || undefined,
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
        });
      }
      toast.success('تم الحفظ');
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ الفرع');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الفروع</h2>
        {isOwner && (
          <button onClick={openAdd} className="btn-brand flex items-center gap-2"><Plus size={18} /> إضافة فرع</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-28" />) : branches.map((branch: any) => (
          <div key={branch.id} onClick={() => setActiveBranch(branch.id)} className={`card p-4 cursor-pointer transition-all hover:shadow-md border-2 ${activeBranchId === branch.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500"><GitBranch size={18} /></div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{branch.nameAr || branch.name}</p>
                  {branch.isMain && <span className="text-xs text-brand-500 font-semibold">الفرع الرئيسي</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeBranchId === branch.id && <Check size={18} className="text-brand-500" />}
                {isOwner && (
                  <>
                    <button
                      onClick={(e) => openEdit(branch, e)}
                      className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-500 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!branch.isMain && (
                      <button
                        onClick={(e) => handleDelete(branch, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {branch.address && <p className="text-xs text-gray-400">{branch.address}</p>}
            {branch.phone && <p className="text-xs text-gray-400">{branch.phone}</p>}
            <div className="flex gap-3 text-xs text-gray-400 mt-2">
              <span>{branch._count?.users || 0} مستخدم</span>
              <span>{branch._count?.sales || 0} فاتورة</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">{editBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">اسم الفرع (عربي) *</label><input className="input" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} required /></div>
              <div><label className="label">اسم الفرع (إنجليزي)</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">العنوان</label><input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div><label className="label">الهاتف</label><input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
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
