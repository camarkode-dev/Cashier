'use client';
import { useState, useEffect } from 'react';
import { expensesApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, DollarSign, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

const CATEGORIES = ['إيجار', 'كهرباء', 'مياه', 'رواتب', 'نقل', 'صيانة', 'تسويق', 'أخرى'];

export default function ExpensesPage() {
  const { tenant } = useAuthStore();
  const { currency: settingsCurrency } = useSettingsStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'أخرى', notes: '', paymentMethod: 'CASH' });
  const cur = resolveAppCurrency(tenant?.currency, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const [exp, sum] = await Promise.all([expensesApi.list({ limit: 50 }) as any, expensesApi.summary() as any]);
      setExpenses(exp?.data?.data || exp?.data || []);
      setSummary(sum?.data || sum);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesApi.create({ ...form, amount: parseFloat(form.amount) });
      toast.success('تم إضافة المصروف');
      setShowForm(false); setForm({ title: '', amount: '', category: 'أخرى', notes: '', paymentMethod: 'CASH' }); load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا المصروف؟')) return;
    try { await expensesApi.delete(id); toast.success('تم الحذف'); load(); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">المصروفات</h2>
        <button onClick={() => setShowForm(true)} className="btn-brand flex items-center gap-2"><Plus size={18} /> إضافة مصروف</button>
      </div>

      {summary && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">ملخص المصروفات</h3>
            <p className="text-xl font-black text-red-500">{formatCurrency(summary.totalAmount, cur)}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(summary.byCategory || []).map((c: any) => (
              <div key={c.category} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm">
                <p className="text-gray-400 text-xs">{c.category}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(c._sum.amount, cur)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">البيان</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">الفئة</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">المبلغ</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
              )) : expenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{e.titleAr || e.title}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">{e.category}</span></td>
                  <td className="px-4 py-3 font-bold text-red-500">{formatCurrency(e.amount, cur)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">إضافة مصروف</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">البيان *</label><input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
              <div><label className="label">المبلغ *</label><input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required dir="ltr" /></div>
              <div><label className="label">الفئة</label>
                <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">طريقة الدفع</label>
                <select className="input" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة</option>
                  <option value="TRANSFER">تحويل</option>
                </select>
              </div>
              <div><label className="label">ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
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
