'use client';
import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Percent, Package, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

type Period = '7d' | '30d' | '90d' | 'custom';

export default function ReportsPage() {
  const { activeBranchId } = useSettingsStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState('revenue');
  const [profit, setProfit] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const cur = 'EGP';

  const getDateRange = () => {
    const to = dayjs().format('YYYY-MM-DD');
    if (period === '7d') return { from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), to };
    if (period === '30d') return { from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), to };
    if (period === '90d') return { from: dayjs().subtract(90, 'day').format('YYYY-MM-DD'), to };
    return { from: customFrom, to: customTo };
  };

  const load = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const branchId = activeBranchId || undefined;
      const [profitRes, topRes]: any[] = await Promise.all([
        reportsApi.profit({ from, to, branchId, groupBy }),
        reportsApi.topProducts({ from, to, branchId, sortBy, limit: 10 }),
      ]);
      setProfit(profitRes);
      setTopProducts(Array.isArray(topRes) ? topRes : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [period, customFrom, customTo, groupBy, sortBy, activeBranchId]);

  if (user?.role === 'CASHIER') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <TrendingUp size={48} className="mb-4 opacity-40" />
        <p className="font-medium">لا يمكن الوصول للتقارير</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">تقارير الأرباح</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d', 'custom'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors',
                period === p ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
              {p === '7d' ? '7 أيام' : p === '30d' ? '30 يوم' : p === '90d' ? '3 أشهر' : 'مخصص'}
            </button>
          ))}
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={15} className={cn('text-gray-500', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">من</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input py-2" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">إلى</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input py-2" />
          </div>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="input py-2 w-32">
            <option value="day">يومي</option>
            <option value="week">أسبوعي</option>
            <option value="month">شهري</option>
          </select>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الإيرادات', value: profit?.summary?.revenue || 0, icon: DollarSign, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'صافي الربح', value: profit?.summary?.profit || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'عدد الفواتير', value: profit?.summary?.salesCount || 0, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', raw: true },
          { label: 'هامش الربح', value: profit?.summary?.profitMargin || 0, icon: Percent, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', isPercent: true },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', s.bg)}>
                  <Icon size={18} className={s.color} />
                </div>
                <span className="text-sm text-gray-500">{s.label}</span>
              </div>
              {loading ? (
                <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
              ) : (
                <p className={cn('text-2xl font-black', s.color)}>
                  {(s as any).isPercent ? `${s.value.toFixed(1)}%` : (s as any).raw ? s.value.toLocaleString('ar-EG') : formatCurrency(s.value, cur)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue & Profit chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">الإيرادات والأرباح</h3>
          <div className="flex gap-1.5">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                  groupBy === g ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                {g === 'day' ? 'يومي' : g === 'week' ? 'أسبوعي' : 'شهري'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={profit?.chart || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v, cur), name === 'revenue' ? 'الإيرادات' : 'الربح']} />
              <Legend formatter={(v) => (v === 'revenue' ? 'الإيرادات' : 'الربح')} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#profGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={18} className="text-brand-500" />
            أفضل المنتجات
          </h3>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input py-1.5 text-sm w-36">
            <option value="revenue">حسب الإيرادات</option>
            <option value="profit">حسب الربح</option>
            <option value="quantity">حسب الكمية</option>
          </select>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : topProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><Package size={36} className="mx-auto mb-3 opacity-40" /><p>لا توجد بيانات</p></div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, idx) => {
              const value = sortBy === 'quantity' ? p.quantity : sortBy === 'profit' ? p.profit : p.revenue;
              const maxVal = sortBy === 'quantity' ? topProducts[0]?.quantity : sortBy === 'profit' ? topProducts[0]?.profit : topProducts[0]?.revenue;
              const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
              return (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-500 text-xs font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.nameAr || p.name}</p>
                      <p className="text-sm font-bold text-brand-500 flex-shrink-0 ms-2">
                        {sortBy === 'quantity' ? `${p.quantity} وحدة` : formatCurrency(value, cur)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الخصومات', value: profit?.summary?.discount || 0, color: 'text-red-500' },
          { label: 'إجمالي الضرائب', value: profit?.summary?.tax || 0, color: 'text-amber-500' },
          { label: 'متوسط قيمة الفاتورة', value: profit?.summary?.salesCount > 0 ? (profit.summary.revenue / profit.summary.salesCount) : 0, color: 'text-blue-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            {loading ? <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24 mx-auto" /> : (
              <p className={cn('text-xl font-black', s.color)}>{formatCurrency(s.value, cur)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
