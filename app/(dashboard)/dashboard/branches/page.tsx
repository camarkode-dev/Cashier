'use client';
import { useState, useEffect } from 'react';
import { branchesApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';
import { Plus, GitBranch, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BranchesPage() {
  const { activeBranchId, setActiveBranch } = useSettingsStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nameAr: '', address: '', phone: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await branchesApi.list();
      setBranches(res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await branchesApi.create(form); toast.success('تم إضافة الفرع'); setShowForm(false); setForm({ name: '', nameAr: '', address: '', phone: '' }); load(); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الفروع</h2>
        <button onClick={() => setShowForm(true)} className="btn-brand flex items-center gap-2"><Plus size={18} /> إضافة فرع</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-28" />) :
        branches.map((b: any) => (
          <div key={b.id} onClick={() => setActiveBranch(b.id)} className={`card p-4 cursor-pointer transition-all hover:shadow-md border-2 ${activeBranchId === b.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500"><GitBranch size={18} /></div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{b.nameAr || b.name}</p>
                  {b.isMain && <span className="text-xs text-brand-500 font-semibold">الفرع الرئيسي</span>}
                </div>
              </div>
              {activeBranchId === b.id && <Check size={18} className="text-brand-500" />}
            </div>
            {b.address && <p className="text-xs text-gray-400">{b.address}</p>}
            {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
            <div className="flex gap-3 text-xs text-gray-400 mt-2">
              <span>{b._count?.users || 0} مستخدم</span>
              <span>{b._count?.sales || 0} فاتورة</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">إضافة فرع جديد</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">اسم الفرع (عربي) *</label><input className="input" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} required /></div>
              <div><label className="label">اسم الفرع (إنجليزي)</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">العنوان</label><input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div><label className="label">الهاتف</label><input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" className="flex-1 btn-brand py-3">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
