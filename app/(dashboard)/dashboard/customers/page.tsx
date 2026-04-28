'use client';
import { useState, useEffect } from 'react';
import { customersApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Users, Edit2, Trash2, Star, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

export default function CustomersPage() {
  const { tenant } = useAuthStore();
  const { currency: settingsCurrency } = useSettingsStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const cur = resolveAppCurrency(tenant?.currency, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await customersApi.list({ search, limit: 100 });
      setCustomers(res?.data?.data || res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await customersApi.update(editing.id, form); toast.success('تم التحديث'); }
      else { await customersApi.create(form); toast.success('تم الإضافة'); }
      setShowForm(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); load();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">العملاء</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-brand flex items-center gap-2"><Plus size={18} /> إضافة عميل</button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input ps-9 max-w-xs" placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-28" />) :
        customers.map((c: any) => (
          <div key={c.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500 font-bold text-lg">
                  {c.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{c.name}</p>
                  {c.phone && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} />{c.phone}</p>}
                </div>
              </div>
              <button onClick={() => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-brand-500">
                <Edit2 size={15} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-sm">
              <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star size={13} /> {c.loyaltyPoints} نقطة</span>
              <span className="text-gray-500">{formatCurrency(c.totalPurchases, cur)} إجمالي</span>
            </div>
          </div>
        ))}
        {!loading && customers.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد عملاء</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">{editing ? 'تعديل عميل' : 'إضافة عميل'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">الاسم *</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">الهاتف</label><input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">البريد الإلكتروني</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">العنوان</label><input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" className="flex-1 btn-brand py-3">{editing ? 'حفظ' : 'إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
