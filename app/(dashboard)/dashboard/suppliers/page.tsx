'use client';
import { useState, useEffect } from 'react';
import { suppliersApi } from '@/lib/api';
import { Plus, Truck, Edit2, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', taxNumber: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await suppliersApi.list({ limit: 100 });
      setSuppliers(res?.data?.data || res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await suppliersApi.update(editing.id, form); toast.success('تم التحديث'); }
      else { await suppliersApi.create(form); toast.success('تم الإضافة'); }
      setShowForm(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', taxNumber: '', notes: '' }); load();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الموردون</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-brand flex items-center gap-2"><Plus size={18} /> إضافة مورد</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-28" />) :
        suppliers.map((s: any) => (
          <div key={s.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-500">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                  {s.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{s.phone}</p>}
                  {s.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{s.email}</p>}
                </div>
              </div>
              <button onClick={() => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', taxNumber: s.taxNumber || '', notes: s.notes || '' }); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-brand-500">
                <Edit2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!loading && suppliers.length === 0 && <div className="col-span-full text-center py-16 text-gray-400"><Truck size={48} className="mx-auto mb-3 opacity-30" /><p>لا يوجد موردون</p></div>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">{editing ? 'تعديل مورد' : 'إضافة مورد'}</h3>
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
