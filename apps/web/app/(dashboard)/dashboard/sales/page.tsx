'use client';
import { useState, useEffect } from 'react';
import { salesApi } from '@/lib/api';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils';
import { Search, ReceiptText, Eye, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const { tenant } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const cur = tenant?.currency || 'EGP';

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await salesApi.list({ from: dateFrom, to: dateTo, limit: 50 });
      setSales(res?.data?.data || res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const handleRefund = async (saleId: string) => {
    if (!confirm('هل تريد استرداد هذه الفاتورة؟')) return;
    try { await salesApi.refund(saleId); toast.success('تم الاسترداد'); load(); } catch {}
  };

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    REFUNDED: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    VOID: 'bg-gray-50 text-gray-500',
  };
  const statusLabels: Record<string, string> = { COMPLETED: 'مكتملة', REFUNDED: 'مستردة', VOID: 'ملغاة' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">المبيعات</h2>
        <div className="flex gap-2 text-sm">
          <input type="date" className="input py-2 w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input py-2 w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">رقم الفاتورة</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">العميل</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">الإجمالي</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">الدفع</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">الحالة</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">التاريخ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
              )) : sales.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ReceiptText size={16} className="text-brand-400" />
                      <span className="font-mono text-xs font-semibold">{s.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{s.customer?.name || 'عميل عام'}</td>
                  <td className="px-4 py-3 font-bold text-brand-500">{formatCurrency(s.total, cur)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">{getPaymentMethodLabel(s.paymentMethod)}</td>
                  <td className="px-4 py-3"><span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', statusColors[s.status] || '')}>{statusLabels[s.status] || s.status}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {s.status === 'COMPLETED' && (
                      <button onClick={() => handleRefund(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors" title="استرداد">
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sales.length === 0 && <div className="text-center py-16 text-gray-400"><ReceiptText size={48} className="mx-auto mb-3 opacity-30" /><p>لا توجد مبيعات</p></div>}
        </div>
      </div>

      {/* Sale detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold">فاتورة: {selected.invoiceNumber}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400">العميل</p><p className="font-semibold">{selected.customer?.name || 'عميل عام'}</p></div>
                <div><p className="text-gray-400">الكاشير</p><p className="font-semibold">{selected.user?.firstName} {selected.user?.lastName}</p></div>
                <div><p className="text-gray-400">طريقة الدفع</p><p className="font-semibold">{getPaymentMethodLabel(selected.paymentMethod)}</p></div>
                <div><p className="text-gray-400">التاريخ</p><p className="font-semibold">{formatDate(selected.createdAt)}</p></div>
              </div>
              <div className="space-y-2">
                {selected.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800">
                    <div><p className="font-semibold">{item.nameAr || item.name}</p><p className="text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice, cur)}</p></div>
                    <p className="font-bold">{formatCurrency(item.total, cur)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                {selected.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>-{formatCurrency(selected.discountAmount, cur)}</span></div>}
                {selected.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>الضريبة</span><span>{formatCurrency(selected.taxAmount, cur)}</span></div>}
                <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100 dark:border-gray-800"><span>الإجمالي</span><span className="text-brand-500">{formatCurrency(selected.total, cur)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
