'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, CreditCard, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { resolveAppCurrency } from '@/lib/currency';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

export default function CustomerStatementPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tenant, user } = useAuthStore();
  const { country: settingsCountry, currency: settingsCurrency } = useSettingsStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const currency = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await customersApi.statement(params.id, { from, to });
      setData(res?.data || res);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل كشف الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    load();
  }, [params.id, from, to]);

  const transactions = useMemo(() => data?.transactions || [], [data]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowRight size={16} />
          العودة
        </button>
        <div className="flex items-center gap-2">
          <input type="date" className="input py-2 w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input py-2 w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} className="btn-brand px-4 py-2 inline-flex items-center gap-2">
            <Printer size={16} />
            تحديث
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">الرصيد الحالي</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(data?.summary?.currentBalance || 0, currency)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">إجمالي الديون</p>
          <p className="mt-2 text-2xl font-black text-amber-500">{formatCurrency(data?.summary?.totalDebt || 0, currency)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">إجمالي السداد</p>
          <p className="mt-2 text-2xl font-black text-green-500">{formatCurrency(data?.summary?.totalPayments || 0, currency)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{data?.customer?.nameAr || data?.customer?.name || 'كشف حساب العميل'}</h1>
            <p className="text-sm text-gray-500">{data?.customer?.phone || 'لا يوجد رقم هاتف'}</p>
          </div>
          <div className="text-sm text-gray-500">
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{tx.notes || tx.type}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(tx.createdAt)}</span>
                    <span>{tx.cashierId ? 'تم بواسطة كاشير' : 'بدون كاشير'}</span>
                  </div>
                </div>
                <div className="text-end">
                  <p className={tx.credit > 0 ? 'font-black text-green-500' : 'font-black text-red-500'}>
                    {tx.credit > 0 ? `+${formatCurrency(tx.credit, currency)}` : `-${formatCurrency(tx.debit, currency)}`}
                  </p>
                  <p className="text-xs text-gray-400">الرصيد: {formatCurrency(tx.balanceAfter, currency)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400">
              <CreditCard size={40} className="mx-auto mb-2 opacity-40" />
              لا توجد حركات
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
