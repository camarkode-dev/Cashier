'use client';

import { useEffect, useRef, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, Landmark, Smartphone, Upload, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePOSStore } from '@/stores/pos.store';
import { cn } from '@/lib/utils';
import { appendPaymentReceiptImage } from '@/lib/payment-receipt';

interface PaymentModalProps {
  total: number;
  currency: string;
  onConfirm: (paidAmount: number, paymentNotes?: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'نقدي', icon: Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { id: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { id: 'MOBILE', label: 'Vodafone Cash', icon: Smartphone, color: 'text-red-600 bg-red-50 dark:bg-red-950' },
  { id: 'QR', label: 'InstaPay', icon: Landmark, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
] as const;

const needsReceipt = (method: string) => method === 'MOBILE' || method === 'QR';
const transferLabel = (method: string) => (method === 'MOBILE' ? 'Vodafone Cash' : 'InstaPay');

export function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }: PaymentModalProps) {
  const { setPaymentMethod, paymentMethod } = usePOSStore();
  const [paid, setPaid] = useState(total.toFixed(2));
  const [transferRef, setTransferRef] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const paidNum = parseFloat(paid) || 0;
  const change = Math.max(0, paidNum - total);
  const requiresReceipt = needsReceipt(paymentMethod);
  const canConfirm = !isProcessing && paidNum >= total && (!requiresReceipt || !!receiptPreview || transferRef.trim().length > 0);

  const buildExtraNotes = (): string | undefined => {
    if (!requiresReceipt) return undefined;
    const parts: string[] = [];
    if (transferRef.trim()) parts.push(`مرجع التحويل: ${transferRef.trim()}`);
    if (receiptName) parts.push(`إيصال: ${receiptName}`);
    const notes = parts.length ? `[${transferLabel(paymentMethod)}] ${parts.join(' | ')}` : undefined;
    return appendPaymentReceiptImage(notes, receiptPreview);
  };

  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && canConfirm) onConfirm(paidNum, buildExtraNotes());
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canConfirm, paidNum, onClose, onConfirm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMethodChange = (id: string) => {
    setPaymentMethod(id);
    setTransferRef('');
    setReceiptPreview(null);
    setReceiptName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const resizeReceiptImage = (file: File) =>
    new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('يرجى اختيار صورة إيصال صالحة'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('حجم صورة الإيصال يجب ألا يزيد عن 5 ميجابايت'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 900;
          const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const width = Math.max(1, Math.round(image.width * ratio));
          const height = Math.max(1, Math.round(image.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('تعذر تجهيز صورة الإيصال'));
            return;
          }

          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.onerror = () => reject(new Error('تعذر قراءة صورة الإيصال'));
        image.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('تعذر قراءة صورة الإيصال'));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await resizeReceiptImage(file);
      setReceiptName(file.name);
      setReceiptPreview(image);
    } catch (error: any) {
      setReceiptName('');
      setReceiptPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      alert(error?.message || 'تعذر رفع صورة الإيصال');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الدفع</h2>
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl bg-brand-50 py-4 text-center dark:bg-brand-950">
            <p className="mb-1 text-sm font-medium text-brand-600 dark:text-brand-400">إجمالي الفاتورة</p>
            <p className="text-4xl font-black text-brand-500">{formatCurrency(total, currency)}</p>
          </div>

          <div>
            <label className="label mb-2 text-sm">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleMethodChange(method.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                        : `border-gray-100 dark:border-gray-800 ${method.color}`,
                    )}
                  >
                    <Icon size={20} />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {requiresReceipt && (
            <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/40">
              <p className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-300">
                <Upload size={15} /> بيانات {transferLabel(paymentMethod)}
              </p>
              <div>
                <label className="label text-xs">رقم المرجع / التحويل</label>
                <input
                  className={cn(
                    'input font-mono text-sm',
                    !transferRef.trim() && !receiptPreview && 'border-orange-300 focus:border-orange-500 dark:border-orange-700',
                  )}
                  placeholder="مثال: 123456789"
                  value={transferRef}
                  onChange={(event) => setTransferRef(event.target.value)}
                  dir="ltr"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="label text-xs">صورة الإيصال</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {receiptPreview ? (
                  <div className="relative mt-1">
                    <img
                      src={receiptPreview}
                      alt="إيصال الدفع"
                      className="max-h-40 w-full rounded-xl border border-orange-200 bg-white object-contain dark:border-orange-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptPreview(null);
                        setReceiptName('');
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      x
                    </button>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 size={12} /> تم رفع الإيصال
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 py-2.5 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30"
                  >
                    <Upload size={14} /> ارفع صورة الإيصال
                  </button>
                )}
                {!transferRef.trim() && !receiptPreview && (
                  <p className="mt-1 text-[11px] text-orange-600 dark:text-orange-400">مطلوب رقم المرجع أو صورة الإيصال للمتابعة</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="label text-sm">المبلغ المدفوع</label>
            <input
              ref={inputRef}
              type="number"
              value={paid}
              onChange={(event) => setPaid(event.target.value)}
              className="input py-4 text-center text-2xl font-black"
              dir="ltr"
              min={total}
              step="0.01"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPaid(total.toFixed(2))} className="rounded-xl bg-brand-100 px-3 py-1.5 text-sm font-bold text-brand-600 dark:bg-brand-900">
              المبلغ تمامًا
            </button>
            {QUICK_AMOUNTS.filter((amount) => amount >= total).slice(0, 4).map((amount) => (
              <button
                key={amount}
                onClick={() => setPaid(amount.toFixed(2))}
                className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {amount}
              </button>
            ))}
          </div>

          {change > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3 dark:bg-green-950">
              <span className="font-medium text-green-700 dark:text-green-400">الباقي للعميل</span>
              <span className="text-xl font-black text-green-600">{formatCurrency(change, currency)}</span>
            </div>
          )}

          <button
            onClick={() => onConfirm(paidNum, buildExtraNotes())}
            disabled={!canConfirm}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'تأكيد الدفع (Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
}
