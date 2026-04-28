'use client';
import { useEffect, useMemo, useState } from 'react';
import { expensesApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { formatCurrency } from '@/lib/utils';
import { Plus, DollarSign, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

const CATEGORIES = ['إيجار', 'كهرباء', 'مياه', 'رواتب', 'نقل', 'صيانة', 'تسويق', 'أخرى'];
const emptyForm = { title: '', amount: '', category: 'أخرى', notes: '', paymentMethod: 'CASH' };

function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (dateStr === todayKey) return 'اليوم';
  if (dateStr === yesterdayKey) return 'أمس';
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

function toDateKey(date: string | Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const { tenant } = useAuthStore();
  const { country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const [expenseList, summaryData] = await Promise.all([
        expensesApi.list({ limit: 200 }) as any,
        expensesApi.summary() as any,
      ]);
      setExpenses(Array.isArray(expenseList?.data) ? expenseList.data : Array.isArray(expenseList) ? expenseList : expenseList?.data || []);
      setSummary(summaryData?.data || summaryData);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل المصروفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (q && !((e.titleAr || e.title || '').toLowerCase().includes(q))) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      const key = toDateKey(e.date || e.createdAt);
      if (dateFrom && key < dateFrom) return false;
      if (dateTo && key > dateTo) return false;
      return true;
    });
  }, [expenses, search, filterCategory, dateFrom, dateTo]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of filtered) {
      const key = toDateKey(e.date || e.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const toggleDay = (key: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesApi.create({
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        notes: form.notes.trim() || undefined,
        paymentMethod: form.paymentMethod,
      });
      toast.success('تم الحفظ');
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ المصروف');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا المصروف؟')) return;
    try {
      await expensesApi.delete(id);
      toast.success('تم الحذف');
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حذف المصروف');
    }
  };

  const hasFilters = search || filterCategory || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">المصروفات</h2>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-brand flex items-center gap-2">
          <Plus size={18} /> إضافة مصروف
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input ps-9 w-full"
            placeholder="بحث في المصروفات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">كل الفئات</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" className="input w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="من تاريخ" />
        <input type="date" className="input w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="إلى تاريخ" />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setDateFrom(''); setDateTo(''); }}
            className="px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {summary && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">ملخص المصروفات</h3>
            <p className="text-xl font-black text-red-500">{formatCurrency(summary.totalAmount || 0, cur)}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(summary.byCategory || []).map((category: any) => (
              <div key={category.category} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm">
                <p className="text-gray-400 text-xs">{category.category}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(category._sum?.amount || 0, cur)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : grouped.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
          <p>{hasFilters ? 'لا توجد نتائج' : 'لا توجد مصروفات'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([dayKey, items]) => {
            const collapsed = collapsedDays.has(dayKey);
            const dayTotal = items.reduce((s: number, e: any) => s + (e.amount || 0), 0);
            return (
              <div key={dayKey} className="card overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => toggleDay(dayKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {collapsed ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronUp size={15} className="text-gray-400" />}
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{formatDayLabel(dayKey)}</span>
                    <span className="text-xs text-gray-400">{items.length} مصروف</span>
                  </div>
                  <span className="font-black text-red-500 text-sm">{formatCurrency(dayTotal, cur)}</span>
                </button>

                {!collapsed && (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {items.map((expense: any) => (
                        <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{expense.titleAr || expense.title}</p>
                            {expense.notes && <p className="text-xs text-gray-400 mt-0.5">{expense.notes}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-red-500">{formatCurrency(expense.amount, cur)}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(expense.date || expense.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">إضافة مصروف</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div><label className="label">البيان *</label><input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
              <div><label className="label">المبلغ *</label><input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required dir="ltr" /></div>
              <div>
                <label className="label">الفئة</label>
                <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label className="label">طريقة الدفع</label>
                <select className="input" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة</option>
                  <option value="TRANSFER">تحويل</option>
                </select>
              </div>
              <div><label className="label">ملاحظات</label><input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold">إلغاء</button>
                <button type="submit" className="flex-1 btn-brand py-3">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
