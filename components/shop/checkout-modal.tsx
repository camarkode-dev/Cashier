'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useShopStore, type ShopCartItem } from '@/stores/shop.store';
import { CheckCircle2, Camera, Copy, CreditCard, Landmark, Loader2, Minus, Plus, ReceiptText, Smartphone, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'INSTAPAY' | 'VODAFONE_CASH' | 'CREDIT';

type ReceiptFileItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (order: any) => void;
  currency: string;
};

const TRANSFER_METHODS: PaymentMethod[] = ['BANK_TRANSFER', 'INSTAPAY', 'VODAFONE_CASH'];

const transferDetails = {
  BANK_TRANSFER: {
    label: 'تحويل بنكي / تحويل إلكتروني',
    accountName: 'Mar Kode',
    phone: '01090886364',
    email: 'ca.markode@gmail.com',
  },
  INSTAPAY: {
    label: 'إنستاباي',
    accountName: 'Mar Kode',
    phone: '01090886364',
    email: 'ca.markode@gmail.com',
  },
  VODAFONE_CASH: {
    label: 'فودافون كاش',
    accountName: 'Mar Kode',
    phone: '01090886364',
    email: 'ca.markode@gmail.com',
  },
} as const;

function sanitizeFiles(files: FileList | File[]) {
  return Array.from(files).filter((file) => {
    if (!file.type.startsWith('image/')) return false;
    return file.size <= 7 * 1024 * 1024;
  });
}

export function CheckoutModal({ open, onClose, onSuccess, currency }: CheckoutModalProps) {
  const { user } = useAuthStore();
  const { cart, updateQuantity, removeItem, clearCart } = useShopStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [installmentPercentage, setInstallmentPercentage] = useState('0');
  const [receiptFiles, setReceiptFiles] = useState<ReceiptFileItem[]>([]);

  const grossSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const reference = item.compareAtPrice && item.compareAtPrice > item.price ? item.compareAtPrice : item.price;
        return sum + reference * item.quantity;
      }, 0),
    [cart],
  );
  const discountAmount = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const reference = item.compareAtPrice && item.compareAtPrice > item.price ? item.compareAtPrice : item.price;
        return sum + Math.max(0, (reference - item.price) * item.quantity);
      }, 0),
    [cart],
  );
  const taxAmount = useMemo(
    () => cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity * (item.taxRate || 0)) / 100, 0),
    [cart],
  );
  const baseTotal = Math.max(0, grossSubtotal - discountAmount + taxAmount);
  const installmentValue =
    paymentMethod === 'CREDIT'
      ? (baseTotal * Math.min(100, Math.max(0, Number(installmentPercentage) || 0))) / 100
      : 0;
  const total = baseTotal + installmentValue;

  useEffect(() => {
    if (!open) return;
    if (user) {
      setCustomerName((current) => current || `${user.firstName} ${user.lastName}`.trim());
      setCustomerEmail((current) => current || user.email);
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      receiptFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setReceiptFiles([]);
      setNotes('');
      setPaymentMethod('CASH');
      setInstallmentPercentage('0');
    }
  }, [open, receiptFiles]);

  const requiredTransfer = TRANSFER_METHODS.includes(paymentMethod);

  const canSubmit =
    cart.length > 0 &&
    customerName.trim().length >= 2 &&
    customerEmail.trim().length > 3 &&
    (!requiredTransfer || receiptFiles.length > 0) &&
    (!paymentMethod || paymentMethod !== 'CREDIT' || (Number(installmentPercentage) >= 0 && Number(installmentPercentage) <= 100));

  const handleFiles = (files: FileList | File[]) => {
    const valid = sanitizeFiles(files);
    if (valid.length !== files.length) {
      toast.error('تأكد من أن الملفات صور وبحجم لا يتجاوز 7 ميجابايت');
    }

    setReceiptFiles((current) => [
      ...current,
      ...valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeReceipt = (id: string) => {
    setReceiptFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم النسخ');
    } catch {
      toast.error('تعذر النسخ');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('يرجى استكمال البيانات المطلوبة');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append(
        'payload',
        JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          paymentMethod,
          installmentPercentage: paymentMethod === 'CREDIT' ? Math.min(100, Math.max(0, Number(installmentPercentage) || 0)) : 0,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          notes: notes.trim() || undefined,
        }),
      );

      receiptFiles.forEach((item) => {
        formData.append('receiptFiles', item.file, item.file.name);
      });

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        throw new Error('يجب تسجيل الدخول قبل إتمام الطلب');
      }
      if (!res.ok) {
        throw new Error(json?.error || 'تعذر إنشاء الطلب');
      }

      clearCart();
      receiptFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setReceiptFiles([]);
      onSuccess?.(json?.data?.order ?? json?.data ?? json);
      toast.success('تم إرسال الطلب بنجاح');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'تعذر إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">إتمام الطلب</h2>
            <p className="text-xs text-gray-500">يتم حفظ الطلب بحالة Pending Payment Review</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid max-h-[calc(92dvh-73px)] grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-y-auto p-5">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">اسم العميل</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input type="email" dir="ltr" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="input" />
                </div>
              </div>

              <div>
                <label className="label">رقم الهاتف</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="input" dir="ltr" />
              </div>

              <div>
                <label className="label">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  {([
                    { id: 'CASH', label: 'نقدي', icon: CreditCard },
                    { id: 'BANK_TRANSFER', label: 'تحويل', icon: Landmark },
                    { id: 'INSTAPAY', label: 'إنستا باي', icon: Smartphone },
                    { id: 'VODAFONE_CASH', label: 'فودافون كاش', icon: Smartphone },
                    { id: 'CREDIT', label: 'آجل', icon: ReceiptText },
                  ] as const).map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all',
                          active
                            ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800',
                        )}
                      >
                        <Icon size={16} />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'CREDIT' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                  <label className="label">نسبة التقسيط %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={installmentPercentage}
                    onChange={(e) => setInstallmentPercentage(e.target.value.replace(/[^\d]/g, ''))}
                    className="input"
                    dir="ltr"
                  />
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    النسبة تُضاف إلى إجمالي الطلب مباشرة ويتم حفظها داخل الفاتورة والتقرير.
                  </p>
                </div>
              )}

              {requiredTransfer && (
                <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/40">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-300">
                    <Landmark size={16} />
                    {transferDetails[paymentMethod as keyof typeof transferDetails].label}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button type="button" onClick={() => copyText(transferDetails[paymentMethod as keyof typeof transferDetails].phone)} className="rounded-2xl bg-white px-3 py-3 text-start text-sm shadow-sm dark:bg-gray-900">
                      <span className="block text-xs text-gray-400">Instapay / Vodafone</span>
                      <span className="block font-bold text-gray-900 dark:text-white">01090886364</span>
                    </button>
                    <button type="button" onClick={() => copyText(transferDetails[paymentMethod as keyof typeof transferDetails].accountName)} className="rounded-2xl bg-white px-3 py-3 text-start text-sm shadow-sm dark:bg-gray-900">
                      <span className="block text-xs text-gray-400">صاحب الحساب</span>
                      <span className="block font-bold text-gray-900 dark:text-white">Mar Kode</span>
                    </button>
                    <button type="button" onClick={() => copyText(transferDetails[paymentMethod as keyof typeof transferDetails].email)} className="rounded-2xl bg-white px-3 py-3 text-start text-sm shadow-sm dark:bg-gray-900">
                      <span className="block text-xs text-gray-400">البريد الرئيسي</span>
                      <span className="block truncate font-bold text-gray-900 dark:text-white">ca.markode@gmail.com</span>
                    </button>
                  </div>
                </div>
              )}

              {requiredTransfer && (
                <div className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">إيصالات الدفع</h3>
                      <p className="text-xs text-gray-500">يمكنك رفع صورة واحدة أو عدة صور، من الكاميرا أو المعرض.</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files?.length) handleFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-brand flex items-center gap-2 py-2.5"
                    >
                      <Upload size={16} />
                      رفع إيصال الدفع
                    </button>
                  </div>

                  {receiptFiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {receiptFiles.map((item) => (
                        <div key={item.id} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                          <img src={item.previewUrl} alt={item.file.name} className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReceipt(item.id)}
                            className="absolute end-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                          >
                            <X size={13} />
                          </button>
                          <div className="border-t border-gray-200 px-2 py-1 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            {item.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 px-4 py-8 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950/30"
                    >
                      <Camera size={16} />
                      اختر صور الإيصال
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="label">ملاحظات</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-28" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-900/60 lg:border-t-0 lg:border-s">
            <div className="sticky top-0 space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm dark:bg-gray-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">الملخص</span>
                  <span className="text-xs font-semibold text-gray-400">{cart.length} منتج</span>
                </div>

                <div className="space-y-3">
                  {cart.map((item: ShopCartItem) => (
                    <div key={item.productId} className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.nameAr || item.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{item.nameAr || item.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price, currency)} × {item.quantity}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="rounded-lg bg-gray-100 p-1.5 text-gray-600 dark:bg-gray-800">
                            <Minus size={12} />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="rounded-lg bg-gray-100 p-1.5 text-gray-600 dark:bg-gray-800">
                            <Plus size={12} />
                          </button>
                          <button type="button" onClick={() => removeItem(item.productId)} className="ms-auto rounded-lg bg-red-50 p-1.5 text-red-500 dark:bg-red-950">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm dark:bg-gray-950">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الإجمالي قبل التقسيط</span>
                    <span>{formatCurrency(baseTotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الخصم</span>
                    <span>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الضريبة</span>
                    <span>{formatCurrency(taxAmount, currency)}</span>
                  </div>
                  {paymentMethod === 'CREDIT' && (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>التقسيط</span>
                      <span>{formatCurrency(installmentValue, currency)}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-lg font-black text-gray-900 dark:border-gray-800 dark:text-white">
                    <span>الإجمالي النهائي</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                  className="btn-brand mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  إتمام الطلب
                </button>
                <p className="mt-2 text-center text-xs text-gray-400">
                  عند الإرسال سيتم إنشاء طلب جديد بحالة Pending Payment Review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
