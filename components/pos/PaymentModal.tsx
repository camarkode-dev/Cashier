'use client';
import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/stores/pos.store';
import { X, Banknote, CreditCard, Smartphone, QrCode, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  total: number;
  currency: string;
  onConfirm: (paidAmount: number) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const PAYMENT_METHODS = [
  { id: 'CASH', label: 'نقدي', icon: Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-950', available: true },
  { id: 'CARD', label: 'بطاقة', icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', available: false },
  { id: 'MOBILE', label: 'بالهاتف', icon: Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950', available: false },
  { id: 'QR', label: 'QR', icon: QrCode, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950', available: false },
];

export function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }: PaymentModalProps) {
  const { setPaymentMethod, paymentMethod } = usePOSStore();
  const [paid, setPaid] = useState(total.toFixed(2));
  const inputRef = useRef<HTMLInputElement>(null);

  const paidNum = parseFloat(paid) || 0;
  const change = Math.max(0, paidNum - total);

  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isProcessing) onConfirm(paidNum);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paidNum, isProcessing, onClose, onConfirm]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الدفع</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-center py-4 bg-brand-50 dark:bg-brand-950 rounded-2xl">
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-1">إجمالي الفاتورة</p>
            <p className="text-4xl font-black text-brand-500">{formatCurrency(total, currency)}</p>
          </div>

          <div>
            <label className="label text-sm mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      if (!method.available) {
                        toast('متاح قريبًا', { icon: '⏳' });
                        return;
                      }
                      setPaymentMethod(method.id);
                    }}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-semibold text-xs',
                      isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : `border-gray-100 dark:border-gray-800 ${method.color}`,
                      !method.available && 'opacity-70',
                    )}
                  >
                    <Icon size={20} />
                    {method.label}
                    {!method.available && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        متاح قريبًا
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-2">
            <Clock3 size={16} />
            الدفع بالبطاقة أو الهاتف سيصبح متاحًا قريبًا. المتاح الآن: نقدي.
          </div>

          <div>
            <label className="label text-sm">المبلغ المدفوع</label>
            <input
              ref={inputRef}
              type="number"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              className="input text-2xl font-black text-center py-4"
              dir="ltr"
              min={total}
              step="0.01"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPaid(total.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 text-sm font-bold">
              المبلغ تمامًا
            </button>
            {QUICK_AMOUNTS.filter((amount) => amount >= total).slice(0, 4).map((amount) => (
              <button key={amount} onClick={() => setPaid(amount.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                {amount}
              </button>
            ))}
          </div>

          {change > 0 && (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3">
              <span className="text-green-700 dark:text-green-400 font-medium">الباقي للعميل</span>
              <span className="text-green-600 font-black text-xl">{formatCurrency(change, currency)}</span>
            </div>
          )}

          <button
            onClick={() => onConfirm(paidNum)}
            disabled={isProcessing || paidNum < total}
            className="w-full btn-brand py-4 text-lg rounded-2xl flex items-center justify-center gap-2 font-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'تأكيد الدفع (Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
}
