'use client';
import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/stores/pos.store';
import { X, Banknote, CreditCard, QrCode, Clock3, Upload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  total: number;
  currency: string;
  onConfirm: (paidAmount: number, paymentNotes?: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const PAYMENT_METHODS = [
  { id: 'CASH',   label: 'نقدي',             icon: Banknote,    color: 'text-green-600 bg-green-50 dark:bg-green-950',   available: true  },
  { id: 'CARD',   label: 'بطاقة',            icon: CreditCard,  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',      available: false },
  { id: 'QR',     label: 'محفظة إلكترونية', icon: QrCode,      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950', available: true  },
  { id: 'CREDIT', label: 'آجر',              icon: Clock3,      color: 'text-red-600 bg-red-50 dark:bg-red-950',         available: true  },
];

export function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }: PaymentModalProps) {
  const { setPaymentMethod, paymentMethod } = usePOSStore();
  const [paid, setPaid] = useState(total.toFixed(2));
  const [qrRef, setQrRef] = useState('');
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [qrImageName, setQrImageName] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const paidNum = parseFloat(paid) || 0;
  const change = Math.max(0, paidNum - total);

  // Extra notes to attach to the sale
  const buildExtraNotes = (): string | undefined => {
    if (paymentMethod === 'QR') {
      const parts: string[] = [];
      if (qrRef.trim()) parts.push(`مرجع التحويل: ${qrRef.trim()}`);
      if (qrImageName) parts.push(`إيصال: ${qrImageName}`);
      return parts.length ? `[محفظة إلكترونية] ${parts.join(' | ')}` : undefined;
    }
    if (paymentMethod === 'CREDIT') {
      return creditReason.trim() ? `[آجر] ${creditReason.trim()}` : undefined;
    }
    return undefined;
  };

  // Whether the confirm button can be pressed
  const canConfirm = (() => {
    if (isProcessing) return false;
    if (paymentMethod === 'QR') {
      // Either reference number or receipt image must be provided
      const hasRef = qrRef.trim().length > 0;
      const hasReceipt = !!qrImagePreview;
      return (hasRef || hasReceipt) && paidNum >= total;
    }
    if (paymentMethod === 'CREDIT') return creditReason.trim().length > 0;
    return paidNum >= total;
  })();

  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canConfirm) onConfirm(paidNum, buildExtraNotes());
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paidNum, canConfirm, onClose, onConfirm]); // eslint-disable-line

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setQrImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMethodChange = (id: string) => {
    setPaymentMethod(id);
    setQrRef('');
    setQrImagePreview(null);
    setQrImageName('');
    setCreditReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-scale-in max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الدفع</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="text-center py-4 bg-brand-50 dark:bg-brand-950 rounded-2xl">
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-1">إجمالي الفاتورة</p>
            <p className="text-4xl font-black text-brand-500">{formatCurrency(total, currency)}</p>
          </div>

          {/* Payment methods */}
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
                    onClick={() => method.available && handleMethodChange(method.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-semibold text-xs',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                        : `border-gray-100 dark:border-gray-800 ${method.color}`,
                      !method.available && 'opacity-50 cursor-not-allowed',
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

          {/* ── محفظة إلكترونية extra section ── */}
          {paymentMethod === 'QR' && (
            <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 p-4 space-y-3">
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <QrCode size={15} /> بيانات المحفظة الإلكترونية
              </p>

              {/* Reference number — required (or receipt image) */}
              <div>
                <label className="label text-xs">رقم المرجع / التحويل <span className="text-red-500">*</span></label>
                <input
                  className={cn(
                    'input font-mono text-sm',
                    !qrRef.trim() && !qrImagePreview && 'border-orange-300 dark:border-orange-700 focus:border-orange-500',
                  )}
                  placeholder="مثال: 123456789"
                  value={qrRef}
                  onChange={(e) => setQrRef(e.target.value)}
                  dir="ltr"
                  autoComplete="off"
                />
                {!qrRef.trim() && !qrImagePreview && (
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">مطلوب إدخال رقم المرجع أو رفع صورة الإيصال للمتابعة</p>
                )}
              </div>

              {/* Receipt image — optional */}
              <div>
                <label className="label text-xs">صورة الإيصال (اختياري)</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {qrImagePreview ? (
                  <div className="relative mt-1">
                    <img
                      src={qrImagePreview}
                      alt="إيصال الدفع"
                      className="w-full max-h-40 object-contain rounded-xl border border-orange-200 dark:border-orange-700 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => { setQrImagePreview(null); setQrImageName(''); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute top-2 end-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                    >✕</button>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 size={12} /> تم رفع الإيصال
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <Upload size={14} /> ارفع صورة الإيصال
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── آجر extra section ── */}
          {paymentMethod === 'CREDIT' && (
            <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 space-y-3">
              <p className="text-sm font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                <Clock3 size={15} /> بيانات الآجر
              </p>
              <div>
                <label className="label text-xs">سبب الآجر <span className="text-red-500">*</span></label>
                <textarea
                  className={cn(
                    'input resize-none text-sm',
                    !creditReason.trim() && 'border-red-300 dark:border-red-700 focus:border-red-500',
                  )}
                  rows={3}
                  placeholder="مثال: سيدفع نهاية الأسبوع — أحمد محمد"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                />
                {!creditReason.trim() && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">مطلوب كتابة سبب التأجيل للمتابعة</p>
                )}
              </div>
            </div>
          )}

          {/* Paid amount (hide for CREDIT — they owe the full amount) */}
          {paymentMethod !== 'CREDIT' && (
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

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setPaid(total.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-600 text-sm font-bold">
                  المبلغ تمامًا
                </button>
                {QUICK_AMOUNTS.filter((a) => a >= total).slice(0, 4).map((a) => (
                  <button key={a} onClick={() => setPaid(a.toFixed(2))} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    {a}
                  </button>
                ))}
              </div>

              {change > 0 && (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3">
                  <span className="text-green-700 dark:text-green-400 font-medium">الباقي للعميل</span>
                  <span className="text-green-600 font-black text-xl">{formatCurrency(change, currency)}</span>
                </div>
              )}
            </>
          )}

          {/* آجر: show full amount as deferred */}
          {paymentMethod === 'CREDIT' && (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950 rounded-2xl px-4 py-3">
              <span className="text-red-700 dark:text-red-400 font-medium">مبلغ الآجر</span>
              <span className="text-red-600 font-black text-xl">{formatCurrency(total, currency)}</span>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={() => onConfirm(paymentMethod === 'CREDIT' ? total : paidNum, buildExtraNotes())}
            disabled={!canConfirm}
            className="w-full btn-brand py-4 text-lg rounded-2xl flex items-center justify-center gap-2 font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'تأكيد الدفع (Enter)'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
