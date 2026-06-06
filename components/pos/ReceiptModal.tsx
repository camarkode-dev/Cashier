'use client';
import { useRef } from 'react';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils';
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
      await navigator.share({ title: `فاتورة ${sale.invoiceNumber}`, text: `إجمالي الفاتورة: ${formatCurrency(sale.total, currency)}` });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 animate-scale-in flex flex-col max-h-[90vh]">
        {/* Actions bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">تمت العملية ✓</h2>
          <div className="flex gap-2">
            <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 text-sm font-semibold hover:bg-brand-100 transition-colors">
              <Printer size={15} /> طباعة
            </button>
            {typeof navigator.share !== 'undefined' && (
              <button onClick={handleShare} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <Share2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="overflow-y-auto flex-1">
          <div ref={receiptRef} className="receipt p-5 font-mono text-xs" dir="rtl">
            {/* Store header */}
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                {tenant?.logo ? (
                  <img src={tenant.logo} alt="لوجو المتجر" className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <Logo size="sm" variant="icon" />
                )}
              </div>
              <p className="font-black text-base">{tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية'}</p>
              {tenant?.address && <p className="text-gray-500">{tenant.address}</p>}
              {tenant?.phone && <p className="text-gray-500">هاتف: {tenant.phone}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Invoice meta */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between"><span className="text-gray-500">رقم الفاتورة:</span><span className="font-bold">{sale.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">التاريخ:</span><span>{formatDate(sale.createdAt || new Date())}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">الكاشير:</span><span>{cashierName}</span></div>
              {sale.customer?.name && <div className="flex justify-between"><span className="text-gray-500">العميل:</span><span>{sale.customer.name}</span></div>}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="space-y-2 mb-3">
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

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Totals */}
            <div className="space-y-1 mb-2">
              {sale.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>-{formatCurrency(sale.discountAmount, currency)}</span></div>}
              {sale.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>الضريبة</span><span>{formatCurrency(sale.taxAmount, currency)}</span></div>}
              <div className="flex justify-between font-black text-base"><span>الإجمالي</span><span>{formatCurrency(sale.total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">المدفوع ({getPaymentMethodLabel(sale.paymentMethod)})</span><span>{formatCurrency(sale.paidAmount, currency)}</span></div>
              {sale.changeAmount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>الباقي للعميل</span><span>{formatCurrency(sale.changeAmount, currency)}</span></div>}
              {(sale.status === 'PARTIAL' || (sale.paymentMethod === 'CREDIT' && sale.paidAmount < sale.total)) && (
                <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-gray-300 pt-1 mt-1">
                  <span>المتبقي على العميل</span>
                  <span>{formatCurrency(sale.total - sale.paidAmount, currency)}</span>
                </div>
              )}
              {sale.loyaltyEarned > 0 && <div className="flex justify-between text-brand-500"><span>نقاط مكتسبة</span><span>+{sale.loyaltyEarned} نقطة</span></div>}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />
            <p className="text-center text-gray-400 font-sans">شكراً لتسوقكم معنا</p>

            {sale.offline && (
              <p className="text-center text-amber-500 text-xs mt-2">⚠ تم الحفظ offline — سيتم مزامنتها تلقائياً</p>
            )}
          </div>
        </div>

        {/* New sale button */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="w-full btn-brand py-3 flex items-center justify-center gap-2 font-bold">
            <ShoppingCart size={18} />
            بيع جديد
          </button>
        </div>
      </div>
    </div>
  );
}
