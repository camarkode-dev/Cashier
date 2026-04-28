'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  LayoutDashboard,
  Package,
  RefreshCw,
  Receipt,
  ScanBarcode,
  ScanLine,
  Search,
  ShoppingCart,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { categoriesApi, productsApi } from '@/lib/api';
import { resolveAppCurrency } from '@/lib/currency';
import { db } from '@/lib/db';
import { thermalPrinter } from '@/lib/printing';
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

const workflowSteps = [
  { title: '1. ابحث أو امسح', description: 'استخدم البحث أو الباركود للوصول للمنتج بسرعة.' },
  { title: '2. أضف للسلة', description: 'اضغط على المنتج، والكمية تتحدث فورًا.' },
  { title: '3. راجع الفاتورة', description: 'الخصومات والضرائب تظهر مباشرة في السلة.' },
  { title: '4. أنهِ الدفع', description: 'ادفع واطبع الإيصال من نفس الشاشة.' },
];

export default function POSPage() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const {
    activeBranchId,
    autoPrint,
    country: settingsCountry,
    currency: settingsCurrency,
    isOnline,
    paperSize,
  } = useSettingsStore();
  const posStore = usePOSStore();
  const { addItem, cart } = posStore;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [quickBarcode, setQuickBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
            productsApi.list({ limit: INITIAL_PRODUCTS_LIMIT, branchId }),
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
        setQuickBarcode('');
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

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((product) => product.categoryId === activeCategory);

  const submitQuickBarcode = async (event?: FormEvent) => {
    event?.preventDefault();
    const code = quickBarcode.trim();
    if (!code) return;
    setQuickBarcode('');
    await handleBarcodeScanned(code);
    searchRef.current?.focus();
  };

  const handleCheckout = async (paidAmount: number) => {
    if (!user?.id) {
      toast.error('بيانات المستخدم غير مكتملة. أعد تسجيل الدخول ثم حاول مرة أخرى.');
      return;
    }

    try {
      const sale = await posStore.checkout(paidAmount, tenantId, branchId, user!.id);
      setLastSale(sale);
      setShowPayment(false);

      if (autoPrint && sale) {
        await thermalPrinter.printReceipt({
          storeName: tenant?.name || '',
          storeNameAr: tenant?.nameAr || tenant?.name || 'أولاد أيمن للأدوات المنزلية',
          invoiceNumber: sale.invoiceNumber || sale.offlineId || '',
          date: new Date().toLocaleString('ar-EG'),
          cashierName: `${user?.firstName} ${user?.lastName}`,
          items: (sale.items || []).map((item: any) => ({
            name: item.name,
            nameAr: item.nameAr,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            discountAmount: item.discountAmount,
          })),
          subtotal: sale.subtotal,
          discountAmount: sale.discountAmount || 0,
          taxAmount: sale.taxAmount || 0,
          total: sale.total,
          paidAmount,
          changeAmount: sale.changeAmount || 0,
          paymentMethod: sale.paymentMethod || 'CASH',
          currency,
          paperSize,
        });
      } else {
        setShowReceipt(true);
      }
    } catch (error: any) {
      toast.error(error?.message || 'تعذر إتمام عملية البيع');
    }
  };

  const dashboardCards = useMemo(
    () => [
      {
        label: 'المنتجات المعروضة',
        value: filteredProducts.length.toLocaleString('ar-EG'),
        hint: activeCategory === 'all' ? 'من كل الفئات' : 'ضمن الفئة المختارة',
        icon: Package,
        tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950',
      },
      {
        label: 'عناصر السلة',
        value: cart.length.toLocaleString('ar-EG'),
        hint: cart.length ? 'جاهزة للدفع' : 'ابدأ بإضافة المنتجات',
        icon: ShoppingCart,
        tone: 'bg-brand-50 text-brand-600 dark:bg-brand-950',
      },
      {
        label: 'إجمالي الفاتورة',
        value: formatCurrency(posStore.total(), currency),
        hint: 'يتحدث لحظيًا',
        icon: Receipt,
        tone: 'bg-green-50 text-green-600 dark:bg-green-950',
      },
    ],
    [activeCategory, cart.length, currency, filteredProducts.length, posStore],
  );

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

        <div className="border-b border-gray-50 px-4 py-3 dark:border-gray-800">
          <div className="grid gap-3 xl:grid-cols-[1.2fr,1fr]">
            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Workflow</p>
                  <h2 className="mt-2 text-lg font-black">مسار بيع سريع وواضح</h2>
                  <p className="mt-1 text-sm text-white/70">
                    صفحة البيع أصبحت تعرض الخطوات الأساسية والباركود السريع من أول نظرة.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ScanBarcode size={22} />
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {workflowSteps.map((step) => (
                  <div key={step.title} className="rounded-2xl bg-white/8 px-3 py-3">
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/70">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">باركود سريع</p>
                  <p className="mt-1 text-xs text-gray-400">أدخل الرقم يدويًا أو استخدم ماسح USB أو الكاميرا.</p>
                </div>
                <button
                  onClick={() => setScanning(true)}
                  className="rounded-2xl bg-brand-50 p-3 text-brand-500 transition-colors hover:bg-brand-100 dark:bg-brand-950"
                >
                  <ScanLine size={18} />
                </button>
              </div>

              <form onSubmit={submitQuickBarcode} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={quickBarcode}
                  onChange={(event) => setQuickBarcode(event.target.value)}
                  placeholder="أدخل الباركود ثم اضغط Enter"
                  className="input flex-1 text-sm font-mono"
                  dir="ltr"
                />
                <button type="submit" className="btn-brand px-4 py-2.5 text-sm">
                  إضافة
                </button>
              </form>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {dashboardCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className={cn('rounded-xl p-2', card.tone)}>
                          <Icon size={16} />
                        </div>
                        <p className="text-xs text-gray-400">{card.label}</p>
                      </div>
                      <p className="mt-3 text-sm font-black text-gray-900 dark:text-white">{card.value}</p>
                      <p className="mt-1 text-xs text-gray-400">{card.hint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span className="flex-1">{loadError}</span>
              <button onClick={() => loadProducts()} className="font-bold text-amber-800 dark:text-amber-200">
                إعادة التحميل
              </button>
            </div>
          )}
        </div>

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
                      'group relative flex min-h-[156px] flex-col justify-between rounded-3xl border-2 p-3 text-start transition-all duration-150 active:scale-[0.98]',
                      stock <= 0
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50 dark:border-gray-800 dark:bg-gray-900'
                        : inCart
                          ? 'border-brand-500 bg-brand-50 shadow-md dark:bg-brand-950'
                          : 'border-gray-100 bg-white hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900',
                    )}
                  >
                    {inCart && (
                      <span className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ background: `${product.category?.color || '#f97316'}20` }}
                        >
                          <Package size={22} style={{ color: product.category?.color || '#f97316' }} />
                        </div>
                      )}

                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-bold',
                          stock <= 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                            : stock <= 5
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300',
                        )}
                      >
                        {stock <= 0 ? 'نفد' : `المخزون ${stock}`}
                      </span>
                    </div>

                    <div>
                      <p className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">
                        {product.nameAr || product.name}
                      </p>
                      <p className="mt-1 text-lg font-black text-brand-500">
                        {formatCurrency(product.price, currency)}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                        <span>{product.category?.nameAr || product.category?.name || 'بدون فئة'}</span>
                        <span className="font-mono">{product.barcode || 'No barcode'}</span>
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

      <CartPanel
        currency={currency}
        onCheckout={() => setShowPayment(true)}
        branchId={branchId}
        tenantId={tenantId}
      />

      {scanning && <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setScanning(false)} />}

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
              currency,
              paperSize,
            });
          }}
        />
      )}
    </div>
  );
}
