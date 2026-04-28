'use client';
import { useState } from 'react';
import { usePOSStore } from '@/stores/pos.store';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingCart, User, Percent, DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartPanelProps {
  currency: string;
  onCheckout: () => void;
  branchId: string;
  tenantId: string;
}

export function CartPanel({ currency, onCheckout, branchId, tenantId }: CartPanelProps) {
  const {
    cart, removeItem, updateQuantity, setItemDiscount, setInvoiceDiscount,
    setCustomer, clearCart, subtotal, totalTax, totalDiscount, total,
    customerId, customerName, invoiceDiscount, invoiceDiscountType,
  } = usePOSStore();

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput) || 0;
    setInvoiceDiscount(val, discountType);
    setShowDiscount(false);
  };

  return (
    <div className="w-full lg:w-96 flex flex-col bg-gray-50 dark:bg-gray-900 border-s border-gray-200 dark:border-gray-800 h-full">
      {/* Cart header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-brand-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">السلة</h2>
          {cart.length > 0 && (
            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Customer */}
      <div className="px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <User size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500 flex-1">{customerName || 'بدون عميل'}</span>
          {customerId && (
            <button onClick={() => setCustomer(null, null)} className="text-gray-400 hover:text-red-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600">
            <ShoppingCart size={56} className="mb-3 opacity-40" />
            <p className="font-medium text-gray-400">السلة فارغة</p>
            <p className="text-sm text-gray-300 mt-1">اضغط على منتج لإضافته</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.nameAr || item.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatCurrency(item.unitPrice, currency)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-brand-500 flex-shrink-0">
                  {formatCurrency(item.total, currency)}
                </p>
                <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    className="w-10 text-center text-sm font-bold bg-transparent focus:outline-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Item discount */}
                {item.discountAmount > 0 && (
                  <span className="text-xs text-green-500 font-medium">
                    خصم -{formatCurrency(item.discountAmount, currency)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & checkout */}
      {cart.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
          {/* Discount row */}
          {showDiscount ? (
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <button onClick={() => setDiscountType('amount')} className={cn('px-2 py-1.5 text-xs font-semibold transition-colors', discountType === 'amount' ? 'bg-brand-500 text-white' : 'text-gray-500')}>
                  <DollarSign size={14} />
                </button>
                <button onClick={() => setDiscountType('percent')} className={cn('px-2 py-1.5 text-xs font-semibold transition-colors', discountType === 'percent' ? 'bg-brand-500 text-white' : 'text-gray-500')}>
                  <Percent size={14} />
                </button>
              </div>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder={discountType === 'percent' ? '%' : currency}
                className="flex-1 input py-1.5 text-sm"
                autoFocus
              />
              <button onClick={handleApplyDiscount} className="btn-brand px-3 py-1.5 text-sm">تطبيق</button>
              <button onClick={() => setShowDiscount(false)} className="p-1.5 text-gray-400 hover:text-red-400">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowDiscount(true)} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors py-1">
              <Percent size={15} />
              {invoiceDiscount > 0 ? `خصم الفاتورة: ${formatCurrency(invoiceDiscount, currency)}` : 'إضافة خصم على الفاتورة'}
            </button>
          )}

          {/* Summary lines */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>المجموع الجزئي</span>
              <span>{formatCurrency(subtotal(), currency)}</span>
            </div>
            {totalDiscount() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم</span>
                <span>-{formatCurrency(totalDiscount(), currency)}</span>
              </div>
            )}
            {totalTax() > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>الضريبة</span>
                <span>{formatCurrency(totalTax(), currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>الإجمالي</span>
              <span className="text-brand-500">{formatCurrency(total(), currency)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            onClick={onCheckout}
            className="w-full btn-brand py-4 text-base rounded-2xl flex items-center justify-center gap-2 font-black"
          >
            <ShoppingCart size={20} />
            إتمام الدفع (F10)
          </button>
        </div>
      )}
    </div>
  );
}
