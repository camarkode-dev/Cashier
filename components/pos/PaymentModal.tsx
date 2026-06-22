'use client';

import { useEffect, useRef, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, Landmark, PlusCircle, Smartphone, Upload, X } from 'lucide-react';
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
  { id: 'CASH', label: 'نقدي', icon: Banknote },
  { id: 'MOBILE', label: 'فودافون كاش', icon: Smartphone },
  { id: 'QR', label: 'إنستا باي', icon: Landmark },
  { id: 'CREDIT', label: 'آجل', icon: CreditCard },
] as const;

const needsReceipt = (method: string) => method === 'MOBILE' || method === 'QR';
const transferLabel = (method: string) => (method === 'MOBILE' ? 'فودافون كاش' : 'إنستا باي');

export function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }: PaymentModalProps) {
  const { setPaymentMethod, paymentMethod, setSplitPayments } = usePOSStore();
  const [paid, setPaid] = useState(total.toFixed(2));
  const [transferRef, setTransferRef] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [splitRows, setSplitRows] = useState<Array<{ method: string; amount: string }>>([
    { method: 'CASH', amount: total.toFixed(2) },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSplitMode(false);
    setSplitPayments([]);
    setPaymentMethod('CASH');
    onClose();
  };

  const paidNum = parseFloat(paid) || 0;
  const splitTotal = splitRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const change = Math.max(0, paidNum - total);
  const requiresReceipt = !splitMode && needsReceipt(paymentMethod);
  const canConfirm = !isProcessing && (
    splitMode
      ? splitRows.length > 0 && splitTotal >= total
      : paymentMethod === 'CREDIT'
        ? true
        : paidNum >= total
  ) && (!requiresReceipt || !!receiptPreview || transferRef.trim().length > 0);

  const buildExtraNotes = (): string | undefined => {
    if (splitMode) {
      const summary = splitRows
        .map((row) => `${row.method}: ${parseFloat(row.amount || '0').toFixed(2)}`)
        .join(' | ');
      return summary ? `[SPLIT] ${summary}` : undefined;
    }
    if (!requiresReceipt) return undefined;
    const parts: string[] = [];
    if (transferRef.trim()) parts.push(`رقم المرجع: ${transferRef.trim()}`);
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
      if (event.key === 'Enter' && canConfirm) {
        if (splitMode) {
          setSplitPayments(splitRows.map((row) => ({ method: row.method, amount: parseFloat(row.amount) || 0 })));
        }
        onConfirm(paymentMethod === 'CREDIT' ? 0 : (splitMode ? splitTotal : paidNum), buildExtraNotes());
      }
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [buildExtraNotes, canConfirm, handleClose, onConfirm, paidNum, paymentMethod, setSplitPayments, splitMode, splitRows, splitTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetReceiptFields = () => {
    setTransferRef('');
    setReceiptPreview(null);
    setReceiptName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleMethodChange = (id: string) => {
    setSplitMode(false);
    setSplitPayments([]);
    setPaymentMethod(id);
    resetReceiptFields();
    if (id === 'CREDIT') {
      setPaid('0');
    } else {
      setPaid(total.toFixed(2));
    }
  };

  const startSplitMode = () => {
    setSplitMode(true);
    setPaymentMethod('SPLIT');
    setSplitPayments([]);
    resetReceiptFields();
    setSplitRows([{ method: 'CASH', amount: total.toFixed(2) }]);
    setPaid(total.toFixed(2));
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
      resetReceiptFields();
      alert(error?.message || 'تعذر رفع صورة الإيصال');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الدفع</h2>
          <button onClick={handleClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
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
                const isSelected = paymentMethod === method.id && !splitMode;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleMethodChange(method.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                        : 'border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400',
                    )}
                  >
                    <Icon size={20} />
                    {method.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={startSplitMode}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition-all',
                splitMode
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                  : 'border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 dark:border-gray-800',
              )}
            >
              <PlusCircle size={16} />
              دفع مقسم
            </button>
          </div>

          {splitMode && (
            <div className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/40">
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300">طرق الدفع المقسمة</p>
              <div className="space-y-2">
                {splitRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-2">
                    <select
                      value={row.method}
                      onChange={(event) => {
                        const next = [...splitRows];
                        next[index] = { ...next[index], method: event.target.value };
                        setSplitRows(next);
                      }}
                      className="input py-2 text-sm"
                    >
                      <option value="CASH">نقدي</option>
                      <option value="MOBILE">فودافون كاش</option>
                      <option value="QR">إنستا باي</option>
                    </select>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.amount}
                      onChange={(event) => {
                        const next = [...splitRows];
                        next[index] = { ...next[index], amount: event.target.value };
                        setSplitRows(next);
                      }}
                      className="input py-2 text-center font-mono text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setSplitRows(splitRows.filter((_, i) => i !== index))}
                      className="rounded-xl bg-white/80 text-gray-500 transition-colors hover:text-red-500 dark:bg-gray-900/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700 dark:text-brand-300">المجموع</span>
                <span className="font-black text-brand-700 dark:text-brand-300">{formatCurrency(splitTotal, currency)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSplitRows([...splitRows, { method: 'CASH', amount: '0.00' }])}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-brand-600"
                >
                  إضافة سطر
                </button>
                <button
                  type="button"
                  onClick={() => setSplitRows([{ method: 'CASH', amount: total.toFixed(2) }])}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-500"
                >
                  إعادة التعيين
                </button>
              </div>
            </div>
          )}

          {!splitMode && requiresReceipt && (
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
                      onClick={() => resetReceiptFields()}
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

          {!splitMode && paymentMethod !== 'CREDIT' && (
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
          )}

          {!splitMode && paymentMethod === 'CREDIT' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              سيتم حفظ الفاتورة كآجل وربطها بالعميل المحدد من السلة.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!splitMode && paymentMethod !== 'CREDIT' && (
              <button
                onClick={() => setPaid(total.toFixed(2))}
                className="rounded-xl bg-brand-100 px-3 py-1.5 text-sm font-bold text-brand-600 dark:bg-brand-900"
              >
                المبلغ تمامًا
              </button>
            )}
            {!splitMode && paymentMethod !== 'CREDIT' && QUICK_AMOUNTS.filter((amount) => amount >= total).slice(0, 4).map((amount) => (
              <button
                key={amount}
                onClick={() => setPaid(amount.toFixed(2))}
                className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {amount}
              </button>
            ))}
          </div>

          {!splitMode && change > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3 dark:bg-green-950">
              <span className="font-medium text-green-700 dark:text-green-400">الباقي للعميل</span>
              <span className="text-xl font-black text-green-600">{formatCurrency(change, currency)}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (splitMode) {
                setSplitPayments(splitRows.map((row) => ({ method: row.method, amount: parseFloat(row.amount) || 0 })));
                onConfirm(splitTotal, buildExtraNotes());
                return;
              }
              onConfirm(paymentMethod === 'CREDIT' ? 0 : paidNum, buildExtraNotes());
            }}
            disabled={!canConfirm}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : splitMode ? (
              'حفظ الدفع المقسم'
            ) : paymentMethod === 'CREDIT' ? (
              'حفظ كآجل'
            ) : (
              'تأكيد الدفع (Enter)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
