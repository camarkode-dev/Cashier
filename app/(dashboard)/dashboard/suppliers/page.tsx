'use client';
import { useEffect, useMemo, useState } from 'react';
import { suppliersApi } from '@/lib/api';
import { Plus, Truck, Edit2, Phone, Mail, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await suppliersApi.list({ limit: 200 });
      setSuppliers(Array.isArray(data) ? data : data?.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل الموردين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editing) {
        await suppliersApi.update(editing.id, payload);
      } else {
        await suppliersApi.create(payload);
      }

      toast.success('تم الحفظ');
      setShowForm(false);
      resetForm();
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ المورد');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الموردون</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-brand flex items-center gap-2">
          <Plus size={18} /> إضافة مورد
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input ps-9 w-full"
          placeholder="بحث بالاسم أو الهاتف أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-28" />)
          : filtered.map((supplier: any) => (
            <div key={supplier.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-500">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{supplier.name}</p>
                    {supplier.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{supplier.phone}</p>}
                    {supplier.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{supplier.email}</p>}
                    {supplier.address && <p className="text-xs text-gray-400 mt-0.5">{supplier.address}</p>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditing(supplier);
                    setForm({
                      name: supplier.name || '',
                      phone: supplier.phone || '',
                      email: supplier.email || '',
                      address: supplier.address || '',
                      notes: supplier.notes || '',
                    });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <Edit2 size={15} />
                </button>
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Truck size={48} className="mx-auto mb-3 opacity-30" />
            <p>{search ? 'لا توجد نتائج' : 'لا يوجد موردون'}</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">{editing ? 'تعديل مورد' : 'إضافة مورد'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">الاسم *</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">الهاتف</label><input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">البريد الإلكتروني</label><input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">العنوان</label><input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div><label className="label">ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" className="flex-1 btn-brand py-3">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
