'use client';

import { useRef } from 'react';
import { formatCurrency, formatDate, getPaymentMethodLabel, summarizePaymentMethods } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { X, Printer, Share2, ShoppingCart } from 'lucide-react';

interface ReceiptModalProps {
  sale: any;
  tenant: any;
  cashierName: string;
  currency: string;
  onClose: () => void;
  onPrint: () => void;
}

export function ReceiptModal({ sale, tenant, cashierName, currency, onClose, onPrint }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `فاتورة ${sale.invoiceNumber}`,
        text: `إجمالي الفاتورة: ${formatCurrency(sale.total, currency)}`,
      });
    }
  };

  const paymentLabel = sale.payments?.length
    ? summarizePaymentMethods(sale.payments)
    : sale.creditInvoice
      ? 'آجل'
      : getPaymentMethodLabel(sale.paymentMethod);

  const remainingAmount = sale.creditInvoice?.remainingAmount ?? Math.max(0, (sale.total || 0) - (sale.paidAmount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">تمت العملية ✓</h2>
          <div className="flex gap-2">
            <button onClick={onPrint} className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900">
              <Printer size={15} /> طباعة
            </button>
            {typeof navigator.share !== 'undefined' && (
              <button onClick={handleShare} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Share2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div ref={receiptRef} className="receipt p-5 font-mono text-xs" dir="rtl">
            <div className="mb-4 text-center">
              <div className="mb-2 flex justify-center">
                {tenant?.logo ? (
                  <img src={tenant.logo} alt="شعار المتجر" className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <Logo size="sm" variant="icon" />
                )}
              </div>
              <p className="font-black text-base">{tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية'}</p>
              {tenant?.address && <p className="text-gray-500">{tenant.address}</p>}
              {tenant?.phone && <p className="text-gray-500">هاتف: {tenant.phone}</p>}
            </div>

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="mb-3 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">رقم الفاتورة:</span><span className="font-bold">{sale.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">التاريخ:</span><span>{formatDate(sale.createdAt || new Date())}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">الكاشير:</span><span>{cashierName}</span></div>
              {sale.customer?.name && <div className="flex justify-between"><span className="text-gray-500">العميل:</span><span>{sale.customer.name}</span></div>}
            </div>

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="mb-3 space-y-2">
              {(sale.items || []).map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <span className="flex-1 font-semibold">{item.nameAr || item.name}</span>
                    <span className="font-bold">{formatCurrency(item.total, currency)}</span>
                  </div>
                  <div className="text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice, currency)}</div>
                  {item.discountAmount > 0 && <div className="text-green-500">خصم: -{formatCurrency(item.discountAmount, currency)}</div>}
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="mb-2 space-y-1">
              {sale.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>-{formatCurrency(sale.discountAmount, currency)}</span></div>}
              {sale.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>الضريبة</span><span>{formatCurrency(sale.taxAmount, currency)}</span></div>}
              <div className="flex justify-between text-base font-black"><span>الإجمالي</span><span>{formatCurrency(sale.total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">المدفوع ({paymentLabel})</span><span>{formatCurrency(sale.paidAmount, currency)}</span></div>
              {sale.changeAmount > 0 && <div className="flex justify-between font-bold text-green-600"><span>الباقي للعميل</span><span>{formatCurrency(sale.changeAmount, currency)}</span></div>}
              {(sale.creditInvoice || sale.status === 'PARTIAL' || (sale.paymentMethod === 'CREDIT' && sale.paidAmount < sale.total)) && (
                <div className="mt-1 flex justify-between border-t border-dashed border-gray-300 pt-1 font-bold text-red-600">
                  <span>المتبقي على العميل</span>
                  <span>{formatCurrency(remainingAmount, currency)}</span>
                </div>
              )}
              {sale.loyaltyEarned > 0 && <div className="flex justify-between text-brand-500"><span>نقاط مكتسبة</span><span>+{sale.loyaltyEarned} نقطة</span></div>}
            </div>

            <div className="my-3 border-t border-dashed border-gray-300" />
            <p className="text-center font-sans text-gray-400">شكرًا لتسوقكم معنا</p>

            {sale.offline && (
              <p className="mt-2 text-center text-xs text-amber-500">⚠ تم الحفظ offline — سيتم مزامنتها تلقائيًا</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          <button onClick={onClose} className="btn-brand flex w-full items-center justify-center gap-2 py-3 font-bold">
            <ShoppingCart size={18} />
            بيع جديد
          </button>
        </div>
      </div>
    </div>
  );
}
