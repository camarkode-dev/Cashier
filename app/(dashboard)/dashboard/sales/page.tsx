'use client';
import { useState, useEffect } from 'react';
import { salesApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils';
import { ReceiptText, RotateCcw, Printer, PlusCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/stores/settings.store';
import { thermalPrinter } from '@/lib/printing';
import { apiClient } from '@/lib/api';

export default function SalesPage() {
  const { tenant, user } = useAuthStore();
  const { country: settingsCountry, currency: settingsCurrency, paperSize } = useSettingsStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [printing, setPrinting] = useState<string | null>(null);
  const [paymentSale, setPaymentSale] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const cur = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const canManage = user?.role === 'OWNER' || user?.role === 'ADMIN';

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

  const handlePrint = async (s: any) => {
    setPrinting(s.id);
    try {
      await thermalPrinter.printReceipt({
        storeName: tenant?.name || '',
        storeNameAr: tenant?.nameAr || tenant?.name || '',
        invoiceNumber: s.invoiceNumber || '',
        date: new Date(s.createdAt).toLocaleString('ar-EG'),
        cashierName: s.user ? `${s.user.firstName} ${s.user.lastName}` : (user ? `${user.firstName} ${user.lastName}` : ''),
        branchName: s.branch?.nameAr || s.branch?.name || undefined,
        customerName: s.customer?.name || s.customer?.nameAr || undefined,
        items: (s.items || []).map((item: any) => ({
          name: item.name,
          nameAr: item.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          discountAmount: item.discountAmount || 0,
        })),
        subtotal: s.subtotal,
        discountAmount: s.discountAmount || 0,
        taxAmount: s.taxAmount || 0,
        total: s.total,
        paidAmount: s.paidAmount || s.total,
        changeAmount: s.changeAmount || 0,
        paymentMethod: s.paymentMethod || 'CASH',
        currency: cur,
        paperSize: paperSize as any,
      });
    } catch {
      toast.error('تعذرت الطباعة');
    } finally {
      setPrinting(null);
    }
  };

  const openPayment = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = s.total - (s.paidAmount || 0);
    setPaymentSale(s);
    setPayAmount(remaining.toFixed(2));
    setPayMethod('CASH');
    setPayNotes('');
  };

  const handleAddPayment = async () => {
    if (!paymentSale) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setPaySubmitting(true);
    try {
      const res: any = await apiClient.post(`/sales/${paymentSale.id}/payments`, {
        amount,
        method: payMethod,
        notes: payNotes || undefined,
      });
      const updated = res?.data || res;
      toast.success(updated.status === 'COMPLETED' ? 'تم سداد الفاتورة بالكامل ✓' : 'تم تسجيل الدفعة');
      setPaymentSale(null);
      // Re-print updated receipt
      await handlePrint(updated);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تسجيل الدفعة');
    } finally {
      setPaySubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    PARTIAL: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    REFUNDED: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    VOID: 'bg-gray-50 text-gray-500',
  };
  const statusLabels: Record<string, string> = {
    COMPLETED: 'مكتملة',
    PARTIAL: 'آجر جزئي',
    REFUNDED: 'مستردة',
    VOID: 'ملغاة',
  };

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
                <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
              )) : sales.map((s: any) => (
                <tr
                  key={s.id}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
                    s.status === 'PARTIAL' && 'bg-amber-50/30 dark:bg-amber-950/10',
                  )}
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ReceiptText size={16} className="text-brand-400" />
                      <span className="font-mono text-xs font-semibold">{s.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{s.customer?.name || 'عميل عام'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-brand-500">{formatCurrency(s.total, cur)}</span>
                      {s.status === 'PARTIAL' && (
                        <p className="text-xs text-red-500 mt-0.5">متبقي: {formatCurrency(s.total - s.paidAmount, cur)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">{getPaymentMethodLabel(s.paymentMethod)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', statusColors[s.status] || '')}>
                      {statusLabels[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handlePrint(s)}
                        disabled={printing === s.id}
                        className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                        title="طباعة الفاتورة"
                      >
                        {printing === s.id
                          ? <div className="w-3.5 h-3.5 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
                          : <Printer size={15} />
                        }
                      </button>

                      {s.status === 'PARTIAL' && canManage && (
                        <button
                          onClick={(e) => openPayment(s, e)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-gray-400 hover:text-amber-600 transition-colors"
                          title="إضافة دفعة"
                        >
                          <PlusCircle size={15} />
                        </button>
                      )}

                      {s.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleRefund(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors"
                          title="استرداد"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sales.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ReceiptText size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد مبيعات</p>
            </div>
          )}
        </div>
      </div>

      {/* Sale detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold">فاتورة: {selected.invoiceNumber}</h3>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold mt-1 inline-block', statusColors[selected.status] || '')}>
                  {statusLabels[selected.status] || selected.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(selected)}
                  disabled={printing === selected.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500 text-sm font-semibold hover:bg-brand-100 transition-colors disabled:opacity-50"
                >
                  <Printer size={14} />
                  طباعة
                </button>
                {selected.status === 'PARTIAL' && canManage && (
                  <button
                    onClick={(e) => { setSelected(null); openPayment(selected, e); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 text-sm font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <PlusCircle size={14} />
                    دفعة جديدة
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
              </div>
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
                    <div>
                      <p className="font-semibold">{item.nameAr || item.name}</p>
                      <p className="text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice, cur)}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(item.total, cur)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                {selected.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>-{formatCurrency(selected.discountAmount, cur)}</span></div>}
                {selected.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>الضريبة</span><span>{formatCurrency(selected.taxAmount, cur)}</span></div>}
                <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>الإجمالي</span>
                  <span className="text-brand-500">{formatCurrency(selected.total, cur)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>المدفوع</span>
                  <span>{formatCurrency(selected.paidAmount || 0, cur)}</span>
                </div>
                {(selected.changeAmount || 0) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>الباقي للعميل</span>
                    <span>{formatCurrency(selected.changeAmount, cur)}</span>
                  </div>
                )}
                {selected.status === 'PARTIAL' && (
                  <div className="flex justify-between text-red-600 font-bold bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2 mt-1">
                    <span>المتبقي على العميل</span>
                    <span>{formatCurrency(selected.total - (selected.paidAmount || 0), cur)}</span>
                  </div>
                )}
              </div>
              {selected.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs text-gray-500">
                  <span className="font-semibold">ملاحظات: </span>{selected.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add payment modal */}
      {paymentSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold">��ضافة دفعة</h3>
                <p className="text-xs text-gray-400 mt-0.5">{paymentSale.invoiceNumber}</p>
              </div>
              <button onClick={() => setPaymentSale(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 dark:bg-red-950 rounded-2xl px-4 py-3 flex justify-between text-sm">
                <span className="text-red-600 font-medium">المتبقي على العميل</span>
                <span className="text-red-600 font-black">{formatCurrency(paymentSale.total - (paymentSale.paidAmount || 0), cur)}</span>
              </div>
              <div>
                <label className="label text-sm">المبلغ المدفوع الآن</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="input text-2xl font-black text-center py-4"
                  dir="ltr"
                  min={0.01}
                  max={paymentSale.total - (paymentSale.paidAmount || 0)}
                  step="0.01"
                  autoFocus
                />
              </div>
              <div>
                <label className="label text-sm">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'CASH', label: 'نقدي' }, { id: 'QR', label: 'محفظة' }, { id: 'CREDIT', label: 'آجر' }].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                        payMethod === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-gray-100 dark:border-gray-800 text-gray-500',
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label text-sm">ملاحظة (اختياري)</label>
                <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="input text-sm" />
              </div>
              <button
                onClick={handleAddPayment}
                disabled={paySubmitting || !parseFloat(payAmount)}
                className="w-full btn-brand py-3 font-bold rounded-2xl disabled:opacity-50"
              >
                {paySubmitting ? 'جارٍ التسجيل...' : 'تأكيد الدفعة وطباعة إيصال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
