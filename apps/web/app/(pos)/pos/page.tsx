'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '@/stores/pos.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { productsApi } from '@/lib/api';
import { db } from '@/lib/db';
import { formatCurrency, debounce } from '@/lib/utils';
import { thermalPrinter } from '@/lib/printing';
import { BarcodeScanner } from '@/components/pos/BarcodeScanner';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Logo } from '@/components/common/Logo';
import toast from 'react-hot-toast';
import {
  Search, ScanLine, ArrowRight, LayoutDashboard, Wifi, WifiOff,
  ShoppingCart, Package, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function POSPage() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const { activeBranchId, isOnline, autoPrint, printerType, printerIp, paperSize } = useSettingsStore();
  const posStore = usePOSStore();
  const { addItem, cart } = posStore;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const branchId = activeBranchId || user?.branchId || '';

  // Load products (online or offline)
  const loadProducts = useCallback(async () => {
    try {
      if (isOnline) {
        const res: any = await productsApi.list({ limit: 500, branchId });
        const data = res?.data || [];
        setProducts(data);
        // Extract categories
        const cats = Array.from(new Map(
          data.filter((p: any) => p.category).map((p: any) => [p.categoryId, p.category])
        ).values());
        setCategories(cats as any[]);
      } else {
        const offline = await db.products.where('tenantId').equals(user?.tenantId || '').toArray();
        setProducts(offline.map((p) => ({ ...p, inventory: [{ quantity: p.stock }] })));
      }
    } catch {}
    setLoading(false);
  }, [isOnline, branchId, user?.tenantId]);

  useEffect(() => {
    loadProducts();
    // Auto-focus search
    setTimeout(() => searchRef.current?.focus(), 300);
  }, [loadProducts]);

  // Keyboard shortcut: F2 = barcode scanner, Escape = clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setScanning(true); }
      if (e.key === 'Escape') { setScanning(false); setSearch(''); searchRef.current?.focus(); }
      if (e.key === 'F10') { e.preventDefault(); if (cart.length) setShowPayment(true); }
      if (e.key === 'F5') { e.preventDefault(); loadProducts(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.length, loadProducts]);

  const handleBarcodeScanned = async (barcode: string) => {
    setScanning(false);
    try {
      let product: any;
      if (isOnline) {
        const res: any = await productsApi.byBarcode(barcode, branchId);
        product = res?.data || res;
      } else {
        product = await db.getProductByBarcode(user?.tenantId || '', barcode);
      }
      if (product) {
        addItem(product);
        toast.success(`تمت الإضافة: ${product.nameAr || product.name}`, { duration: 1500 });
      } else {
        toast.error('المنتج غير موجود', { duration: 2000 });
      }
    } catch {
      toast.error('خطأ في قراءة الباركود');
    }
  };

  const handleSearch = debounce(async (q: string) => {
    if (!q.trim()) { loadProducts(); return; }
    try {
      if (isOnline) {
        const res: any = await productsApi.list({ search: q, branchId, limit: 50 });
        setProducts(res?.data || []);
      } else {
        const results = await db.searchProducts(user?.tenantId || '', q);
        setProducts(results.map((p) => ({ ...p, inventory: [{ quantity: p.stock }] })));
      }
    } catch {}
  }, 200);

  const filteredProducts = products.filter((p) =>
    activeCategory === 'all' || p.categoryId === activeCategory
  );

  const handleCheckout = async (paidAmount: number) => {
    try {
      const sale = await posStore.checkout(paidAmount, user?.tenantId || '', branchId, user!.id);
      setLastSale(sale);
      setShowPayment(false);

      if (autoPrint && sale) {
        await thermalPrinter.printReceipt({
          storeName: tenant?.name || '',
          storeNameAr: tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية',
          invoiceNumber: sale.invoiceNumber || sale.offlineId || '',
          date: new Date().toLocaleString('ar-EG'),
          cashierName: `${user?.firstName} ${user?.lastName}`,
          items: (sale.items || []).map((i: any) => ({
            name: i.name, nameAr: i.nameAr, quantity: i.quantity,
            unitPrice: i.unitPrice, total: i.total, discountAmount: i.discountAmount,
          })),
          subtotal: sale.subtotal,
          discountAmount: sale.discountAmount || 0,
          taxAmount: sale.taxAmount || 0,
          total: sale.total,
          paidAmount,
          changeAmount: sale.changeAmount || 0,
          paymentMethod: sale.paymentMethod || 'CASH',
          currency: tenant?.currency || 'EGP',
          paperSize,
        });
      } else {
        setShowReceipt(true);
      }
    } catch (err: any) {
      toast.error(err?.message || 'فشل في إتمام عملية البيع');
    }
  };

  const cur = tenant?.currency || 'EGP';

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Products panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* POS Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Logo size="xs" variant="horizontal" />
          <div className="flex-1 relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="ابحث عن منتج أو اسم... (F2 للباركود)"
              className="w-full ps-9 pe-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 border-0"
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleSearch(e.target.value); }}
            />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-500 hover:bg-brand-100 transition-colors"
            title="مسح باركود (F2)"
          >
            <ScanLine size={20} />
          </button>
          <button
            onClick={loadProducts}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="تحديث (F5)"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="لوحة التحكم"
          >
            <LayoutDashboard size={18} />
          </button>
          <div className="flex items-center gap-1 text-xs">
            {isOnline ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-amber-500" />}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-50 dark:border-gray-800 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn('flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all', activeCategory === 'all' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}
          >
            الكل ({products.length})
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn('flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5', activeCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
              {cat.nameAr || cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredProducts.map((product: any) => {
                const stock = product.inventory?.[0]?.quantity ?? product.stock ?? 0;
                const inCart = cart.find((i) => i.productId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (stock <= 0) { toast.error('نفذ المخزون'); return; }
                      addItem({ ...product, stock });
                      toast.success(`+1 ${product.nameAr || product.name}`, { duration: 800, icon: '✓' });
                    }}
                    className={cn(
                      'group relative flex flex-col items-center justify-between p-2.5 rounded-2xl border-2 transition-all duration-150 active:scale-95 text-center min-h-[100px]',
                      stock <= 0 ? 'opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900' :
                      inCart ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 shadow-md' :
                      'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-300 hover:shadow-md',
                    )}
                  >
                    {/* In-cart badge */}
                    {inCart && (
                      <span className="absolute top-1.5 start-1.5 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Product image or icon */}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-contain rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: product.category?.color + '20' || '#f9731620' }}>
                        <Package size={22} style={{ color: product.category?.color || '#f97316' }} />
                      </div>
                    )}

                    {/* Name + price */}
                    <div className="w-full">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                        {product.nameAr || product.name}
                      </p>
                      <p className="text-sm font-black text-brand-500 mt-0.5">
                        {formatCurrency(product.price, cur)}
                      </p>
                      {stock <= 5 && stock > 0 && (
                        <p className="text-xs text-amber-500 font-medium">باقي {stock}</p>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && !loading && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                  <Package size={48} className="mb-3 opacity-40" />
                  <p className="font-medium">لا توجد منتجات</p>
                  <p className="text-sm mt-1">{search ? 'جرب كلمة بحث مختلفة' : 'أضف منتجاتك من لوحة التحكم'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 text-xs text-gray-400 overflow-x-auto">
          <span>F2 = باركود</span>
          <span>F5 = تحديث</span>
          <span>F10 = دفع</span>
          <span>Esc = إلغاء</span>
        </div>
      </div>

      {/* Right: Cart panel */}
      <CartPanel
        currency={cur}
        onCheckout={() => setShowPayment(true)}
        branchId={branchId}
        tenantId={user?.tenantId || ''}
      />

      {/* Barcode scanner modal */}
      {scanning && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          total={posStore.total()}
          currency={cur}
          onConfirm={handleCheckout}
          onClose={() => setShowPayment(false)}
          isProcessing={posStore.isProcessing}
        />
      )}

      {/* Receipt modal */}
      {showReceipt && lastSale && (
        <ReceiptModal
          sale={lastSale}
          tenant={tenant}
          cashierName={`${user?.firstName} ${user?.lastName}`}
          currency={cur}
          onClose={() => { setShowReceipt(false); setLastSale(null); }}
          onPrint={() => {
            thermalPrinter.printReceipt({
              storeName: tenant?.name || '',
              storeNameAr: tenant?.nameAr || 'أولاد أيمن للأدوات المنزلية',
              invoiceNumber: lastSale.invoiceNumber || '',
              date: new Date(lastSale.createdAt).toLocaleString('ar-EG'),
              cashierName: `${user?.firstName} ${user?.lastName}`,
              items: lastSale.items || [],
              subtotal: lastSale.subtotal,
              discountAmount: lastSale.discountAmount,
              taxAmount: lastSale.taxAmount,
              total: lastSale.total,
              paidAmount: lastSale.paidAmount,
              changeAmount: lastSale.changeAmount,
              paymentMethod: lastSale.paymentMethod,
              currency: cur,
              paperSize,
            });
          }}
        />
      )}
    </div>
  );
}
