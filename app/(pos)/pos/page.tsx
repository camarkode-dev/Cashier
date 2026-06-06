'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  LayoutDashboard,
  Package,
  RefreshCw,
  ScanLine,
  Search,
  ShoppingCart,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { categoriesApi, productsApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { db } from '@/lib/db';
import { thermalPrinter, type ReceiptData } from '@/lib/printing';
import { cn, formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { BarcodeScanner } from '@/components/pos/BarcodeScanner';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { useAuthStore } from '@/stores/auth.store';
import { usePOSStore } from '@/stores/pos.store';
import { useSettingsStore } from '@/stores/settings.store';

const INITIAL_PRODUCTS_LIMIT = 120;

export default function POSPage() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const {
    activeBranchId,
    autoPrint,
    cashierPrinter,
    country: settingsCountry,
    currency: settingsCurrency,
    isOnline,
  } = useSettingsStore();
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
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const productsCountRef = useRef(0);

  const branchId = activeBranchId || user?.branchId || '';
  const tenantId = user?.tenantId || tenant?.id || '';
  const currency = resolveAppCurrency(tenant?.currency, settingsCountry, settingsCurrency);

  useEffect(() => {
    productsCountRef.current = products.length;
  }, [products.length]);

  const hydrateCategories = (items: any[]) => {
    const unique = Array.from(
      new Map(items.filter((item: any) => item.category).map((item: any) => [item.categoryId, item.category])).values(),
    );
    setCategories(unique as any[]);
  };

  const loadProducts = useCallback(
    async (showBusyState = true) => {
      if (!user?.id || !tenantId) {
        setLoading(false);
        return;
      }

      if (showBusyState) {
        if (productsCountRef.current === 0) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }

      setLoadError(null);

      try {
        if (isOnline) {
          const [productResult, categoryResult] = await Promise.allSettled([
            productsApi.list({ limit: INITIAL_PRODUCTS_LIMIT, branchId, withInventory: true }),
            categoriesApi.list(),
          ]);

          if (productResult.status === 'rejected') {
            throw productResult.reason;
          }

          const productRes = productResult.value;
          const categoryRes = categoryResult.status === 'fulfilled' ? categoryResult.value : [];

          const loadedProducts = Array.isArray((productRes as any)?.data)
            ? (productRes as any).data
            : Array.isArray(productRes)
              ? productRes
              : [];
          const loadedCategories = Array.isArray(categoryRes)
            ? categoryRes
            : Array.isArray((categoryRes as any)?.data)
              ? (categoryRes as any).data
              : [];

          setProducts(loadedProducts);
          setCategories(loadedCategories.length ? loadedCategories : []);
          if (!loadedCategories.length) {
            hydrateCategories(loadedProducts);
          }
        } else {
          const offlineProducts = await db.products.where('tenantId').equals(tenantId).toArray();
          const shapedProducts = offlineProducts.map((product) => ({
            ...product,
            inventory: [{ quantity: product.stock ?? 0 }],
          }));
          setProducts(shapedProducts);
          hydrateCategories(shapedProducts);
        }
      } catch (error: any) {
        setLoadError(error?.message || 'تعذر تحميل بيانات البيع الآن');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId, isOnline, tenantId, user?.id],
  );

  useEffect(() => {
    if (!user?.id) return;
    loadProducts();
    const timer = window.setTimeout(() => searchRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, [loadProducts, user?.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        setScanning(true);
      }
      if (event.key === 'Escape') {
        setScanning(false);
        setSearch('');
        searchRef.current?.focus();
      }
      if (event.key === 'F10') {
        event.preventDefault();
        if (cart.length) setShowPayment(true);
      }
      if (event.key === 'F5') {
        event.preventDefault();
        loadProducts();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.length, loadProducts]);

  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      setScanning(false);

      try {
        let product: any = null;

        if (isOnline) {
          const result = await productsApi.byBarcode(barcode, branchId);
          product = (result as any)?.data || result;
        } else {
          product = await db.getProductByBarcode(tenantId, barcode);
        }

        if (!product) {
          toast.error('لم يتم العثور على منتج بهذا الباركود');
          return;
        }

        const stock = product.inventory?.[0]?.quantity ?? product.stock ?? 0;
        if (stock <= 0) {
          toast.error('المنتج غير متاح في المخزون حاليًا');
          return;
        }

        addItem({ ...product, stock });
        toast.success(`تمت إضافة ${product.nameAr || product.name}`, { duration: 1400 });
      } catch {
        toast.error('حدث خطأ أثناء قراءة الباركود');
      }
    },
    [addItem, branchId, isOnline, tenantId],
  );

  useEffect(() => {
    if (!user?.id || !tenantId) return;

    const timer = window.setTimeout(async () => {
      if (!search.trim()) {
        await loadProducts(false);
        return;
      }

      try {
        if (isOnline) {
          const result = await productsApi.list({
            search,
            categoryId: activeCategory === 'all' ? undefined : activeCategory,
            branchId,
            withInventory: true,
            limit: 60,
          });
          const loadedProducts = Array.isArray((result as any)?.data)
            ? (result as any).data
            : Array.isArray(result)
              ? result
              : [];
          setProducts(loadedProducts);
        } else {
          const results = await db.searchProducts(tenantId, search, 60);
          const shapedProducts = results.map((product) => ({
            ...product,
            inventory: [{ quantity: product.stock ?? 0 }],
          }));
          setProducts(
            activeCategory === 'all'
              ? shapedProducts
              : shapedProducts.filter((product) => product.categoryId === activeCategory),
          );
        }
      } catch {
        setLoadError('تعذر تنفيذ البحث الآن');
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activeCategory, branchId, isOnline, loadProducts, search, tenantId, user?.id]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.nameAr?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter((p: any) => p.categoryId === activeCategory);
    }
    return filtered;
  }, [products, search, activeCategory]);

  const handleSearchKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const q = search.trim();
      if (!q) return;

      if (filteredProducts.length === 1) {
        const product = filteredProducts[0];
        const stock = product.inventory?.[0]?.quantity ?? product.stock ?? 0;
        if (stock <= 0) {
          toast.error('المنتج غير متاح في المخزون');
          return;
        }
        addItem({ ...product, stock });
        toast.success(`+1 ${product.nameAr || product.name}`, { duration: 900 });
        setSearch('');
        return;
      }

      if (filteredProducts.length === 0) {
        await handleBarcodeScanned(q);
        setSearch('');
      }
    },
    [filteredProducts, search, addItem, handleBarcodeScanned],
  );

  const buildReceiptData = (sale: any, paidAmount?: number): ReceiptData => ({
    storeName: tenant?.name || '',
    storeNameAr: tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية',
    logoUrl: tenant?.logo || '/logo-mark.png',
    invoiceNumber: sale.invoiceNumber || sale.offlineId || '',
    date: sale.createdAt ? new Date(sale.createdAt).toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG'),
    cashierName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    branchName: sale.branch?.nameAr || sale.branch?.name,
    customerName: sale.customer?.nameAr || sale.customer?.name,
    customerPhone: sale.customer?.phone,
    items: (sale.items || []).map((item: any) => ({
      name: item.name,
      nameAr: item.nameAr,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      discountAmount: item.discountAmount,
      returnDays: item.returnDays,
    })),
    subtotal: sale.subtotal || 0,
    discountAmount: sale.discountAmount || 0,
    taxAmount: sale.taxAmount || 0,
    total: sale.total || 0,
    paidAmount: sale.paidAmount ?? paidAmount ?? 0,
    changeAmount: sale.changeAmount || 0,
    paymentMethod: sale.paymentMethod || 'CASH',
    remainingAmount:
      sale.status === 'PARTIAL' || (sale.paymentMethod === 'CREDIT' && (sale.paidAmount || 0) < (sale.total || 0))
        ? Math.max(0, (sale.total || 0) - (sale.paidAmount || 0))
        : undefined,
    currency,
    paperSize: cashierPrinter.paperWidth,
  });

  const handleCheckout = async (paidAmount: number, paymentNotes?: string) => {
    if (!user?.id) {
      toast.error('بيانات المستخدم غير مكتملة. أعد تسجيل الدخول ثم حاول مرة أخرى.');
      return;
    }

    if (paymentNotes) posStore.setNotes(paymentNotes);

    try {
      const sale = await posStore.checkout(paidAmount, tenantId, branchId, user!.id);
      setLastSale(sale);
      setShowPayment(false);

      if (autoPrint && sale) {
        const printResult = await thermalPrinter.printReceipt(buildReceiptData(sale, paidAmount), cashierPrinter);
        if (printResult.ok) {
          toast.success(printResult.message);
        } else {
          toast.error(printResult.message);
          setShowReceipt(true);
        }
      } else {
        setShowReceipt(true);
      }
    } catch (error: any) {
      toast.error(error?.message || 'تعذر إتمام عملية البيع');
    }
  };

  if (!user?.id) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-sm font-medium text-gray-500">جاري تجهيز بيانات نقطة البيع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <Logo size="xs" variant="horizontal" />

          <div className="relative flex-1">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="ابحث باسم المنتج أو الباركود"
              className="w-full rounded-2xl border-0 bg-gray-100 py-2 ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <button
            onClick={() => setScanning(true)}
            className="rounded-xl bg-brand-50 p-2.5 text-brand-500 transition-colors hover:bg-brand-100 dark:bg-brand-950"
            title="مسح باركود"
          >
            <ScanLine size={20} />
          </button>
          <button
            onClick={() => loadProducts()}
            className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            title="تحديث"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            title="لوحة التحكم"
          >
            <LayoutDashboard size={18} />
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isOnline ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-amber-500" />}
          </div>
        </div>

        {loadError && (
          <div className="border-b border-gray-50 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span className="flex-1">{loadError}</span>
              <button onClick={() => loadProducts()} className="font-bold text-amber-800 dark:text-amber-200">
                إعادة التحميل
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-gray-50 px-4 py-2 scrollbar-hide dark:border-gray-800">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
              activeCategory === 'all'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            الكل ({products.length})
          </button>
          {categories.map((category: any) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
                activeCategory === category.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
              {category.nameAr || category.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 18 }).map((_, index) => (
                <div key={index} className="aspect-[0.95] rounded-3xl bg-gray-100 animate-pulse dark:bg-gray-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredProducts.map((product: any) => {
                const stock = product.inventory?.[0]?.quantity ?? product.stock ?? 0;
                const inCart = cart.find((item) => item.productId === product.id);
                const categoryColor = product.category?.color || '#f97316';
                const categoryLabel = product.category?.nameAr || product.category?.name || 'بدون فئة';
                const productLabel = product.nameAr || product.name;
                const stockLabel = stock <= 0 ? 'نفد' : stock <= 5 ? `قليل: ${stock}` : `متاح: ${stock}`;

                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (stock <= 0) {
                        toast.error('المنتج غير متاح في المخزون');
                        return;
                      }

                      addItem({ ...product, stock });
                      toast.success(`+1 ${product.nameAr || product.name}`, { duration: 900 });
                    }}
                    className={cn(
                      'group relative flex min-h-[190px] flex-col overflow-hidden rounded-2xl border-2 bg-white text-start transition-all duration-150 active:scale-[0.98] dark:bg-gray-900',
                      stock <= 0
                        ? 'cursor-not-allowed border-gray-100 opacity-55 dark:border-gray-800'
                        : inCart
                          ? 'border-brand-500 shadow-md ring-2 ring-brand-100 dark:ring-brand-950'
                          : 'border-gray-100 hover:border-brand-300 hover:shadow-md dark:border-gray-800',
                    )}
                  >
                    {inCart && (
                      <span className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="relative h-24 bg-gray-50 dark:bg-gray-800">
                      {product.image ? (
                        <img src={product.image} alt={productLabel} className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ background: `${categoryColor}18` }}
                        >
                          <Package size={32} style={{ color: categoryColor }} />
                        </div>
                      )}

                      <span
                        className={cn(
                          'absolute end-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm',
                          stock <= 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                            : stock <= 5
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300',
                        )}
                      >
                        {stockLabel}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-3">
                      <p className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-gray-900 dark:text-white">
                        {productLabel}
                      </p>
                      <p className="mt-2 text-lg font-black text-brand-500">
                        {formatCurrency(product.price, currency)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                        <span className="truncate">{categoryLabel}</span>
                        <span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 font-mono dark:bg-gray-800">{product.barcode || product.sku || 'بدون باركود'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && !loading && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 py-16 text-center text-gray-400 dark:border-gray-800">
                  <Package size={48} className="mb-3 opacity-40" />
                  <p className="font-medium">لا توجد منتجات مطابقة</p>
                  <p className="mt-1 text-sm">{search ? 'جرّب كلمة بحث أو باركود مختلف.' : 'أضف منتجاتك أولًا من لوحة التحكم.'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900">
          <span>F2 = ماسح باركود</span>
          <span>F5 = تحديث المنتجات</span>
          <span>F10 = إنهاء الدفع</span>
          <span>Esc = إلغاء سريع</span>
        </div>
      </div>

      {/* Mobile floating cart button */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="lg:hidden fixed bottom-6 end-6 z-40 flex items-center gap-2 bg-brand-500 text-white rounded-2xl px-4 py-3 shadow-xl font-bold text-sm"
      >
        <ShoppingCart size={20} />
        {cart.length > 0 && (
          <span className="bg-white text-brand-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">
            {cart.length}
          </span>
        )}
        السلة
      </button>

      <CartPanel
        currency={currency}
        onCheckout={() => { setShowMobileCart(false); setShowPayment(true); }}
        branchId={branchId}
        tenantId={tenantId}
        isMobileOpen={showMobileCart}
        onMobileClose={() => setShowMobileCart(false)}
      />

      {scanning && <BarcodeScanner autoStart onScan={handleBarcodeScanned} onClose={() => setScanning(false)} />}

      {showPayment && (
        <PaymentModal
          total={posStore.total()}
          currency={currency}
          onConfirm={handleCheckout}
          onClose={() => setShowPayment(false)}
          isProcessing={posStore.isProcessing}
        />
      )}

      {showReceipt && lastSale && (
        <ReceiptModal
          sale={lastSale}
          tenant={tenant}
          cashierName={`${user?.firstName} ${user?.lastName}`}
          currency={currency}
          onClose={() => {
            setShowReceipt(false);
            setLastSale(null);
          }}
          onPrint={async () => {
            const printResult = await thermalPrinter.printReceipt(buildReceiptData(lastSale), cashierPrinter);
            if (printResult.ok) toast.success(printResult.message);
            else toast.error(printResult.message);
          }}
        />
      )}
    </div>
  );
}
