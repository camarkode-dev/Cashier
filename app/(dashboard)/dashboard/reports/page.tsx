'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency } from '@/lib/utils';
import { resolveAppCurrency } from '@/lib/currency';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Percent, Package, RefreshCw, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

type Period = '7d' | '30d' | '90d' | 'custom';

export default function ReportsPage() {
  const { activeBranchId } = useSettingsStore();
  const { user, tenant } = useAuthStore();
  const { country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState('revenue');
  const [profit, setProfit] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, customFrom, customTo, groupBy, sortBy, activeBranchId]);

  const exportPdf = async () => {
    setExporting(true);
    const { from, to } = getDateRange();
    const summary = profit?.summary || {};
    const storeName = tenant?.nameAr || tenant?.name || 'نقطة البيع';

    // Build Arabic styled HTML div
    const div = document.createElement('div');
    div.style.cssText = [
      'position:absolute',
      'left:-9999px',
      'top:0',
      'width:794px',
      'background:#ffffff',
      'padding:40px 44px',
      'font-family:Cairo,Arial,sans-serif',
      'direction:rtl',
      'text-align:right',
      'color:#111827',
      'line-height:1.5',
    ].join(';');

    const fmt = (n: number) => n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    div.innerHTML = `
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #f97316;padding-bottom:18px;margin-bottom:24px;">
        <div>
          <h1 style="font-size:24px;font-weight:900;color:#f97316;margin:0 0 4px">${storeName}</h1>
          <h2 style="font-size:16px;font-weight:700;color:#374151;margin:0">تقرير الأرباح والمبيعات</h2>
          <p style="color:#6b7280;font-size:12px;margin:4px 0 0">الفترة من <strong>${from}</strong> إلى <strong>${to}</strong></p>
        </div>
        <div style="text-align:left;color:#9ca3af;font-size:11px;padding-top:4px;">
          <p style="margin:0">تاريخ الإنشاء</p>
          <p style="margin:2px 0 0;font-weight:700;color:#374151">${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <!-- Summary cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">
        <div style="background:#fff7ed;border-radius:14px;padding:18px 16px;border:1px solid #fed7aa;">
          <p style="color:#ea580c;font-size:11px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em">الإيرادات</p>
          <p style="font-size:19px;font-weight:900;color:#c2410c;margin:0">${fmt(summary.revenue || 0)}</p>
          <p style="font-size:11px;color:#fb923c;margin:4px 0 0">${cur}</p>
        </div>
        <div style="background:#f0fdf4;border-radius:14px;padding:18px 16px;border:1px solid #bbf7d0;">
          <p style="color:#16a34a;font-size:11px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em">صافي الربح</p>
          <p style="font-size:19px;font-weight:900;color:#15803d;margin:0">${fmt(summary.profit || 0)}</p>
          <p style="font-size:11px;color:#4ade80;margin:4px 0 0">${cur}</p>
        </div>
        <div style="background:#eff6ff;border-radius:14px;padding:18px 16px;border:1px solid #bfdbfe;">
          <p style="color:#2563eb;font-size:11px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em">عدد الفواتير</p>
          <p style="font-size:19px;font-weight:900;color:#1d4ed8;margin:0">${(summary.salesCount || 0).toLocaleString('ar-EG')}</p>
          <p style="font-size:11px;color:#60a5fa;margin:4px 0 0">فاتورة</p>
        </div>
        <div style="background:#faf5ff;border-radius:14px;padding:18px 16px;border:1px solid #e9d5ff;">
          <p style="color:#7c3aed;font-size:11px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em">هامش الربح</p>
          <p style="font-size:19px;font-weight:900;color:#6d28d9;margin:0">${(summary.profitMargin || 0).toFixed(1)}%</p>
          <p style="font-size:11px;color:#a78bfa;margin:4px 0 0">نسبة مئوية</p>
        </div>
      </div>

      <!-- Secondary stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;">
        <div style="background:#f9fafb;border-radius:12px;padding:14px 16px;border:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">إجمالي الخصومات</p>
          <p style="font-weight:800;font-size:16px;color:#111827;margin:0">${fmt(summary.discount || 0)} ${cur}</p>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:14px 16px;border:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">إجمالي الضرائب</p>
          <p style="font-weight:800;font-size:16px;color:#111827;margin:0">${fmt(summary.tax || 0)} ${cur}</p>
        </div>
      </div>

      ${topProducts.length > 0 ? `
      <!-- Top products table -->
      <div>
        <h3 style="font-size:15px;font-weight:800;margin:0 0 14px;color:#111827;padding-bottom:10px;border-bottom:2px solid #f3f4f6;">
          أفضل المنتجات مبيعاً
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:11px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb;width:40px">#</th>
              <th style="padding:11px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb;">المنتج</th>
              <th style="padding:11px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb;">الكمية المباعة</th>
              <th style="padding:11px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb;">الإيرادات</th>
              <th style="padding:11px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb;">الربح</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map((p, i) => `
            <tr style="border-bottom:1px solid #f3f4f6;${i % 2 === 1 ? 'background:#fafafa;' : ''}">
              <td style="padding:10px 14px;color:#9ca3af;font-weight:700;">${i + 1}</td>
              <td style="padding:10px 14px;font-weight:600;color:#111827;">${p.nameAr || p.name}</td>
              <td style="padding:10px 14px;color:#374151;">${(p.quantity || 0).toLocaleString('ar-EG')} وحدة</td>
              <td style="padding:10px 14px;font-weight:700;color:#f97316;">${fmt(p.revenue || 0)} ${cur}</td>
              <td style="padding:10px 14px;font-weight:700;color:#22c55e;">${fmt(p.profit || 0)} ${cur}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:11px;">
        <span>نقطة البيع الذكية — تقرير آلي</span>
        <span>${storeName}</span>
      </div>
    `;

    document.body.appendChild(div);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(div, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      document.body.removeChild(div);

      const { jsPDF } = await import('jspdf');
      const pageW = 210;
      const pageH = 297;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/png', 1.0);

      if (imgH <= pageH) {
        doc.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      } else {
        let yOffset = 0;
        let remaining = imgH;
        while (remaining > 0) {
          if (yOffset > 0) doc.addPage();
          doc.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
          yOffset += pageH;
          remaining -= pageH;
        }
      }

      doc.save(`تقرير-${from}-${to}.pdf`);
    } catch {
      if (document.body.contains(div)) document.body.removeChild(div);
    } finally {
      setExporting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">تقارير الأرباح</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d', 'custom'] as Period[]).map((value) => (
            <button key={value} onClick={() => setPeriod(value)} className={cn('px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors', period === value ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
              {value === '7d' ? '7 أيام' : value === '30d' ? '30 يوم' : value === '90d' ? '3 أشهر' : 'مخصص'}
            </button>
          ))}
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={15} className={cn('text-gray-500', loading && 'animate-spin')} />
          </button>
          <button onClick={exportPdf} disabled={exporting || loading} className="btn-brand flex items-center gap-2 px-4 py-2 disabled:opacity-60">
            <FileDown size={16} className={exporting ? 'animate-bounce' : ''} />
            {exporting ? 'جارٍ التصدير...' : 'تصدير PDF'}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الإيرادات', value: profit?.summary?.revenue || 0, icon: DollarSign, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'صافي الربح', value: profit?.summary?.profit || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'عدد الفواتير', value: profit?.summary?.salesCount || 0, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', raw: true },
          { label: 'هامش الربح', value: profit?.summary?.profitMargin || 0, icon: Percent, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', isPercent: true },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', stat.bg)}>
                  <Icon size={18} className={stat.color} />
                </div>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              {loading
                ? <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                : <p className={cn('text-2xl font-black', stat.color)}>
                    {(stat as any).isPercent
                      ? `${stat.value.toFixed(1)}%`
                      : (stat as any).raw
                        ? stat.value.toLocaleString('ar-EG')
                        : formatCurrency(stat.value, cur)}
                  </p>
              }
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">الإيرادات والأرباح</h3>
          <div className="flex gap-1.5">
            {(['day', 'week', 'month'] as const).map((value) => (
              <button key={value} onClick={() => setGroupBy(value)} className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors', groupBy === value ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                {value === 'day' ? 'يومي' : value === 'week' ? 'أسبوعي' : 'شهري'}
              </button>
            ))}
          </div>
        </div>
        {loading ? <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" /> : (
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
            {topProducts.map((product, index) => {
              const value = sortBy === 'quantity' ? product.quantity : sortBy === 'profit' ? product.profit : product.revenue;
              const maxValue = sortBy === 'quantity' ? topProducts[0]?.quantity : sortBy === 'profit' ? topProducts[0]?.profit : topProducts[0]?.revenue;
              const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-500 text-xs font-black flex items-center justify-center flex-shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.nameAr || product.name}</p>
                      <p className="text-sm font-bold text-brand-500 flex-shrink-0 ms-2">{sortBy === 'quantity' ? `${product.quantity} وحدة` : formatCurrency(value, cur)}</p>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
