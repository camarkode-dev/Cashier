'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import { Loader2, Search, Eye, CheckCircle2, XCircle, Download, Image as ImageIcon, ClipboardList, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShopOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  paymentMethod: string;
  status: string;
  paymentReviewStatus: string;
  subtotalBeforeInstallment: number;
  installmentPercentage: number;
  installmentAmount: number;
  totalAfterInstallment: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  reviewerNotes?: string | null;
  paymentReceiptImages?: Array<{ path?: string; publicUrl?: string; url?: string; name?: string; contentType?: string }>;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    nameAr?: string | null;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  branch?: { id: string; name: string; nameAr?: string | null } | null;
  customer?: { id: string; name: string; nameAr?: string | null; email?: string | null; phone?: string | null } | null;
  reviewer?: { id: string; firstName: string; lastName: string } | null;
};

const statusColors: Record<string, string> = {
  PENDING_PAYMENT_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PAYMENT_REVIEWED: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function receiptUrl(image: any) {
  return image?.publicUrl || image?.url || '';
}

export default function AppOrdersPage() {
  const { currency } = useSettingsStore();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [selected, setSelected] = useState<ShopOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (reviewStatus) params.set('reviewStatus', reviewStatus);
      const res = await fetch(`/api/app-orders?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'تعذر تحميل الطلبات');
      setOrders(json?.data || json);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => orders, [orders]);

  const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/app-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'تعذر تحديث الطلب');
      toast.success(action === 'approve' ? 'تم قبول الطلب' : 'تم رفض الطلب');
      setNotes('');
      setSelected(null);
      await loadOrders();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحديث الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const openReceipt = (url: string) => {
    if (!url) return;
    setPreviewImage(url);
  };

  const closePreview = () => setPreviewImage(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">طلبات التطبيق</h1>
          <p className="text-sm text-gray-500">طلبات المتجر الإلكتروني وإيصالات الدفع والتحقق اليدوي</p>
        </div>
        <button onClick={loadOrders} className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800">
          <ClipboardList size={16} />
          تحديث
        </button>
      </div>

      <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_180px]">
          <div className="relative">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الطلب أو اسم العميل"
              className="input pe-10"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input pe-10">
              <option value="">كل الحالات</option>
              <option value="PENDING_PAYMENT_REVIEW">Pending Payment Review</option>
              <option value="PAYMENT_REVIEWED">Payment Reviewed</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="input pe-10">
              <option value="">كل مراجعات الدفع</option>
              <option value="PENDING_PAYMENT_REVIEW">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button onClick={loadOrders} className="btn-brand flex items-center justify-center gap-2">
            <Search size={16} />
            بحث
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Loader2 className="mx-auto animate-spin text-brand-500" size={24} />
          <p className="mt-3 text-sm text-gray-500">جارٍ تحميل الطلبات...</p>
        </div>
      ) : filteredOrders.length ? (
        <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">رقم الطلب</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">المنتجات</th>
                  <th className="px-4 py-3">الإجمالي</th>
                  <th className="px-4 py-3">طريقة الدفع</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4">
                      <p className="font-black text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{order.paymentReviewStatus}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{order.items.length} منتج</td>
                    <td className="px-4 py-4 font-black text-gray-900 dark:text-white">{formatCurrency(order.totalAmount, currency)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{getPaymentMethodLabel(order.paymentMethod)}</td>
                    <td className="px-4 py-4">
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold', statusColors[order.status] || statusColors.PENDING_PAYMENT_REVIEW)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => setSelected(order)} className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800">
                        <Eye size={16} />
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-500">لا توجد طلبات مطابقة</p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92dvh] w-full max-w-5xl overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{selected.orderNumber}</h2>
                <p className="text-xs text-gray-500">{selected.customerName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                ×
              </button>
            </div>

            <div className="grid max-h-[calc(92dvh-72px)] grid-cols-1 lg:grid-cols-[1fr_380px]">
              <div className="overflow-y-auto p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs text-gray-400">العميل</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selected.customerName}</p>
                    <p className="text-xs text-gray-500">{selected.customerEmail}</p>
                    {selected.customerPhone ? <p className="text-xs text-gray-500" dir="ltr">{selected.customerPhone}</p> : null}
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs text-gray-400">الحالة / الدفع</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selected.status}</p>
                    <p className="text-xs text-gray-500">{getPaymentMethodLabel(selected.paymentMethod)}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <h3 className="mb-3 font-black text-gray-900 dark:text-white">المنتجات</h3>
                  <div className="space-y-3">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.nameAr || item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice, currency)}</p>
                        </div>
                        <p className="font-black text-gray-900 dark:text-white">{formatCurrency(item.totalAmount, currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs text-gray-400">إجمالي قبل التقسيط</p>
                    <p className="mt-1 font-black text-gray-900 dark:text-white">{formatCurrency(selected.subtotalBeforeInstallment, currency)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs text-gray-400">نسبة التقسيط</p>
                    <p className="mt-1 font-black text-gray-900 dark:text-white">{selected.installmentPercentage}%</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs text-gray-400">قيمة التقسيط</p>
                    <p className="mt-1 font-black text-gray-900 dark:text-white">{formatCurrency(selected.installmentAmount, currency)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs text-gray-400">الإجمالي النهائي</p>
                    <p className="mt-1 font-black text-brand-600 dark:text-brand-300">{formatCurrency(selected.totalAfterInstallment, currency)}</p>
                  </div>
                </div>

                {selected.notes ? (
                  <div className="mt-5 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs text-gray-400">ملاحظات العميل</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selected.notes}</p>
                  </div>
                ) : null}

                {selected.paymentReceiptImages?.length ? (
                  <div className="mt-5 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="mb-3 font-black text-gray-900 dark:text-white">إيصالات الدفع</h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selected.paymentReceiptImages.map((image, index) => {
                        const url = receiptUrl(image);
                        return (
                          <button key={url || index} type="button" onClick={() => openReceipt(url)} className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                            <img src={url} alt={`receipt-${index + 1}`} className="h-32 w-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/70 lg:border-t-0 lg:border-s">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-950">
                    <p className="text-xs text-gray-400">إجراءات المراجعة</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ملاحظات للعميل أو للمتابعة"
                      className="input mt-3 min-h-28"
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAction(selected.id, 'approve')}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        قبول
                      </button>
                      <button
                        onClick={() => handleAction(selected.id, 'reject')}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                        رفض
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-950">
                    <p className="text-xs text-gray-400">بيانات إضافية</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>طريقة الدفع: {getPaymentMethodLabel(selected.paymentMethod)}</p>
                      <p>الفرع: {selected.branch?.nameAr || selected.branch?.name || 'غير محدد'}</p>
                      <p>تاريخ الطلب: {formatDate(selected.createdAt)}</p>
                      {selected.reviewer ? <p>تمت المراجعة بواسطة: {selected.reviewer.firstName} {selected.reviewer.lastName}</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[92dvh] w-full max-w-5xl overflow-hidden rounded-[20px] bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">معاينة الإيصال</p>
              <div className="flex items-center gap-2">
                <a href={previewImage} download className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800">
                  <Download size={16} />
                  تنزيل
                </a>
                <button onClick={closePreview} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  ×
                </button>
              </div>
            </div>
            <div className="bg-black p-3">
              <img src={previewImage} alt="preview" className="max-h-[80dvh] w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
