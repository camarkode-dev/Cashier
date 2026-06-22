'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Ban, CreditCard, Filter, PlusCircle, Search, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditInvoicesApi } from '@/lib/api';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils';
import { resolveAppCurrency } from '@/lib/currency';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

export default function CreditInvoicesPage() {
  const { tenant } = useAuthStore();
  const { country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'MOBILE' | 'QR'>('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currency = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await creditInvoicesApi.list({ search, status });
      setData(res?.data?.data || res?.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل فواتير الآجل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, status]);

  const summary = useMemo(() => ({
    total: data.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    remaining: data.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
  }), [data]);

  const openPayment = (invoice: any) => {
    setPaymentInvoice(invoice);
    setAmount(invoice.remainingAmount.toFixed(2));
    setMethod('CASH');
    setNotes('');
  };

  const handlePayment = async () => {
    if (!paymentInvoice) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('أدخل مبلغًا صحيحًا');
      return;
    }
    setSubmitting(true);
    try {
      await creditInvoicesApi.addPayment(paymentInvoice.id, {
        amount: parsedAmount,
        method,
        notes: notes || undefined,
      });
      toast.success('تم تسجيل السداد');
      setPaymentInvoice(null);
      load();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تسجيل السداد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">فواتير الآجل</h1>
          <p className="text-sm text-gray-500">متابعة الديون والسداد والرصيد المتبقي</p>
        </div>
        <Link href="/dashboard/customers" className="btn-brand inline-flex items-center gap-2 px-4 py-2">
          <PlusCircle size={16} />
          العملاء
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">إجمالي الفواتير</p>
          <p className="mt-2 text-2xl font-black text-brand-500">{formatCurrency(summary.total, currency)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">الرصيد المتبقي</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.remaining, currency)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">عدد الفواتير</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{data.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input ps-9" placeholder="ابحث برقم الفاتورة أو اسم العميل..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          {['', 'UNPAID', 'PARTIAL', 'PAID'].map((value) => (
            <button
              key={value || 'all'}
              onClick={() => setStatus(value)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${status === value ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
            >
              {value === '' ? 'الكل' : value === 'UNPAID' ? 'غير مسدد' : value === 'PARTIAL' ? 'جزئي' : 'مسدد'}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-brand inline-flex items-center gap-2 px-4 py-2">
          <Filter size={16} />
          تحديث
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-start">رقم الفاتورة</th>
                <th className="px-4 py-3 text-start">العميل</th>
                <th className="px-4 py-3 text-start">الإجمالي</th>
                <th className="px-4 py-3 text-start">المدفوع</th>
                <th className="px-4 py-3 text-start">المتبقي</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">التاريخ</th>
                <th className="px-4 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 8 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /></td>
                  ))}
                </tr>
              )) : data.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{invoice.customer?.nameAr || invoice.customer?.name}</p>
                      <p className="text-xs text-gray-400">{invoice.customer?.phone || 'لا يوجد هاتف'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-500">{formatCurrency(invoice.totalAmount, currency)}</td>
                  <td className="px-4 py-3 text-green-600">{formatCurrency(invoice.paidAmount, currency)}</td>
                  <td className="px-4 py-3 text-red-500">{formatCurrency(invoice.remainingAmount, currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      invoice.status === 'PAID'
                        ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                        : invoice.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {invoice.status === 'PAID' ? 'مسدد بالكامل' : invoice.status === 'PARTIAL' ? 'مسدد جزئيًا' : 'غير مسدد'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(invoice.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openPayment(invoice)}
                        disabled={invoice.remainingAmount <= 0}
                        className="rounded-xl p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-500 disabled:opacity-40"
                        title="تسجيل سداد"
                      >
                        <CreditCard size={15} />
                      </button>
                      <Link href={`/dashboard/customers/${invoice.customer?.id}`} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900" title="كشف الحساب">
                        <ShieldAlert size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Ban size={44} className="mx-auto mb-3 opacity-30" />
              لا توجد فواتير آجل
            </div>
          )}
        </div>
      </div>

      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">سداد فاتورة آجل</h3>
                <p className="text-xs text-gray-400">{paymentInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPaymentInvoice(null)} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                ×
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                الرصيد المتبقي: <span className="font-black">{formatCurrency(paymentInvoice.remainingAmount, currency)}</span>
              </div>
              <div>
                <label className="label text-sm">مبلغ السداد</label>
                <input className="input text-center text-2xl font-black" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" dir="ltr" />
              </div>
              <div>
                <label className="label text-sm">طريقة السداد</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'نقدي' },
                    { id: 'MOBILE', label: 'فودافون كاش' },
                    { id: 'QR', label: 'إنستا باي' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id as any)}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
                        method === item.id ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950' : 'border-gray-200 text-gray-500 dark:border-gray-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label text-sm">ملاحظات</label>
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
              </div>
              <button onClick={handlePayment} disabled={submitting} className="btn-brand w-full rounded-2xl py-3 font-bold disabled:opacity-50">
                {submitting ? 'جارٍ الحفظ...' : 'تأكيد السداد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
