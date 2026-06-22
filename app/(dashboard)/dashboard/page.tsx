'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, ShoppingCart, Store } from 'lucide-react';
import Link from 'next/link';

interface DashStats {
  today: { revenue: number; transactions: number };
  month: { revenue: number; transactions: number };
  year: { revenue: number; transactions: number };
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  recentSales: any[];
}

export default function DashboardPage() {
  const { tenant } = useAuthStore();
  const { activeBranchId, country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [chart, setChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          reportsApi.dashboard(activeBranchId || undefined),
          reportsApi.salesChart('daily', activeBranchId || undefined),
        ]);
        setStats((statsRes as any)?.data || statsRes as any);
        setChart((chartRes as any)?.data || chartRes as any || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [activeBranchId]);

  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome + quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">لوحة التحكم</h2>
          <p className="text-sm text-gray-500">{tenant?.nameAr || tenant?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800">
            <Store size={18} />
            <span className="hidden sm:inline">المتجر</span>
          </Link>
          <Link href="/pos" className="btn-brand flex items-center gap-2">
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">بدء البيع</span>
          </Link>
        </div>
      </div>

      {/* Low stock alert */}
      {(stats?.lowStockCount || 0) > 0 && (
        <Link href="/dashboard/products?lowStock=true" className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{stats?.lowStockCount} منتج على وشك النفاد</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">انقر لعرض المنتجات المنخفضة</p>
          </div>
          <ArrowUpRight size={16} className="text-amber-500" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="مبيعات اليوم"
          value={formatCurrency(stats?.today.revenue || 0, cur)}
          sub={`${stats?.today.transactions || 0} معاملة`}
          icon={TrendingUp}
          color="bg-brand-50 dark:bg-brand-950 text-brand-500"
        />
        <StatCard
          label="مبيعات الشهر"
          value={formatCurrency(stats?.month.revenue || 0, cur)}
          sub={`${stats?.month.transactions || 0} معاملة`}
          icon={ShoppingBag}
          color="bg-blue-50 dark:bg-blue-950 text-blue-500"
        />
        <StatCard
          label="العملاء"
          value={stats?.totalCustomers?.toLocaleString('ar-EG') || '0'}
          icon={Users}
          color="bg-green-50 dark:bg-green-950 text-green-500"
        />
        <StatCard
          label="المنتجات"
          value={stats?.totalProducts?.toLocaleString('ar-EG') || '0'}
          icon={Package}
          color="bg-purple-50 dark:bg-purple-950 text-purple-500"
        />
      </div>

      {/* Sales chart */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">المبيعات (آخر 30 يوماً)</h3>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val, cur), 'المبيعات']}
                contentStyle={{ fontFamily: 'Cairo, sans-serif', borderRadius: 12, border: '1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#salesGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات مبيعات بعد</div>
        )}
      </div>

      {/* Recent sales */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">آخر المبيعات</h3>
          <Link href="/dashboard/sales" className="text-brand-500 text-sm font-medium hover:text-brand-600">
            عرض الكل
          </Link>
        </div>
        <div className="space-y-2">
          {(stats?.recentSales || []).slice(0, 5).map((sale: any) => (
            <div key={sale.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-500">
                <ShoppingBag size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {sale.customer?.name || 'عميل عام'}
                </p>
                <p className="text-xs text-gray-400">{sale.invoiceNumber}</p>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(sale.total, cur)}</p>
                <p className="text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
              </div>
            </div>
          ))}
          {!stats?.recentSales?.length && (
            <p className="text-center text-gray-400 text-sm py-8">لا توجد مبيعات بعد. ابدأ البيع الآن!</p>
          )}
        </div>
      </div>
    </div>
  );
}
