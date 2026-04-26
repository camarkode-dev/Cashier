'use client';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/stores/pos.store';
import { X, Banknote, CreditCard, Smartphone, QrCode, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  total: number;
  currency: string;
  onConfirm: (paidAmount: number) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const PAYMENT_METHODS = [
  { id: 'CASH', label: 'نقدي', icon: Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { id: 'CARD', label: 'بطاقة', icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { id: 'MOBILE', label: 'محفظة', icon: Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { id: 'QR', label: 'QR', icon: QrCode, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
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

  // Keyboard support: Enter to confirm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isProcessing) onConfirm(paidNum);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paidNum, isProcessing]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الدفع</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total display */}
          <div className="text-center py-4 bg-brand-50 dark:bg-brand-950 rounded-2xl">
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-1">إجمالي الفاتورة</p>
            <p className="text-4xl font-black text-brand-500">{formatCurrency(total, currency)}</p>
          </div>

          {/* Payment method */}
          <div>
            <label className="label text-sm mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-semibold text-xs',
                      paymentMethod === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600' : `border-gray-100 dark:border-gray-800 ${m.color}`,
                    )}
                  >
                    <Icon size={20} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount paid */}
          {paymentMethod === 'CASH' && (
            <>
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

              {/* Quick amount buttons */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setPaid(total.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 text-sm font-bold">
                  المبلغ تماماً
                </button>
                {QUICK_AMOUNTS.filter((a) => a >= total).slice(0, 4).map((a) => (
                  <button key={a} onClick={() => setPaid(a.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    {a}
                  </button>
                ))}
              </div>

              {/* Change */}
              {change > 0 && (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3">
                  <span className="text-green-700 dark:text-green-400 font-medium">الباقي للعميل</span>
                  <span className="text-green-600 font-black text-xl">{formatCurrency(change, currency)}</span>
                </div>
              )}
            </>
          )}

          {/* Confirm button */}
          <button
            onClick={() => onConfirm(paymentMethod === 'CASH' ? paidNum : total)}
            disabled={isProcessing || (paymentMethod === 'CASH' && paidNum < total)}
            className="w-full btn-brand py-4 text-lg rounded-2xl flex items-center justify-center gap-2 font-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : '✓ تأكيد الدفع (Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
}
