'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useShopStore } from '@/stores/shop.store';
import { CheckoutModal } from '@/components/shop/checkout-modal';
import { AuthModal } from '@/components/shop/auth-modal';
import { cn, formatCurrency } from '@/lib/utils';
import { BrandMark } from '@/components/common/BrandMark';
import {
  ArrowUpDown,
  Crown,
  Filter,
  Images,
  LayoutDashboard,
  Minus,
  Moon,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

type CatalogCategory = {
  id: string;
  name: string;
  nameAr?: string | null;
  color?: string | null;
  icon?: string | null;
  _count?: { products: number };
};

type CatalogProduct = {
  id: string;
  name: string;
  nameAr?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  taxRate?: number | null;
  image?: string | null;
  galleryImages?: Array<string | { url?: string; src?: string }> | null;
  description?: string | null;
  stock?: number;
  categoryId?: string | null;
  category?: CatalogCategory | null;
  createdAt: string;
};

type CatalogResponse = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  topProducts: Array<{ productId: string; quantity: number; name: string; nameAr?: string | null }>;
};

const SORT_OPTIONS = [
  { value: 'latest', label: 'الأحدث' },
  { value: 'price', label: 'السعر' },
  { value: 'top', label: 'الأكثر مبيعاً' },
  { value: 'name', label: 'الاسم' },
] as const;

const DASHBOARD_ROLES = new Set(['OWNER', 'ADMIN', 'CASHIER']);

function normalizeImages(product: CatalogProduct) {
  const gallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const images = gallery
    .map((image) => {
      if (typeof image === 'string') return image;
      if (image && typeof image === 'object') return image.url || image.src || '';
      return '';
    })
    .filter(Boolean);
  return [product.image, ...images].filter(Boolean) as string[];
}

function productTitle(product: CatalogProduct) {
  return product.nameAr || product.name;
}

function priceInfo(product: CatalogProduct) {
  const current = product.price;
  const original = product.compareAtPrice && product.compareAtPrice > current ? product.compareAtPrice : null;
  return { current, original };
}

export function ShopStorefront() {
  const { theme, setTheme } = useTheme();
  const { user, initialize } = useAuthStore();
  const { currency } = useSettingsStore();
  const { cart, addItem, updateQuantity, removeItem, clearCart } = useShopStore();
  const [catalog, setCatalog] = useState<CatalogResponse>({ categories: [], products: [], topProducts: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<'latest' | 'price' | 'top' | 'name'>('latest');
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const loadCatalogRef = useRef<(withSpinner?: boolean) => void>(() => {});

  const loadCatalog = useCallback(async (withSpinner = false) => {
    try {
      if (withSpinner) setLoading(true);
      else setRefreshing(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryId) params.set('categoryId', categoryId);
      if (sort) params.set('sort', sort);
      params.set('limit', '200');
      const res = await fetch(`/api/shop/catalog?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setCatalogUnavailable(true);
          setCatalog({ categories: [], products: [], topProducts: [] });
          return;
        }
        throw new Error(json?.error || 'تعذر تحميل المتجر');
      }
      setCatalogUnavailable(false);
      setCatalog(json?.data || json);
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحميل المتجر');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, search, sort]);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    loadCatalogRef.current = loadCatalog;
  }, [loadCatalog]);

  useEffect(() => {
    loadCatalog(false);
  }, [sort]);

  useEffect(() => {
    if (!search.trim() && !categoryId) return;
    const timer = window.setTimeout(() => {
      loadCatalog(false);
    }, search.trim() || categoryId ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [categoryId, loadCatalog, search]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('shop-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Product' }, () => loadCatalogRef.current(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Category' }, () => loadCatalogRef.current(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Inventory' }, () => loadCatalogRef.current(false))
      .subscribe();

    const interval = window.setInterval(() => loadCatalogRef.current(false), 30000);

    return () => {
      channel.unsubscribe();
      window.clearInterval(interval);
    };
  }, [loadCatalog]);

  const visibleProducts = useMemo(() => catalog.products, [catalog.products]);
  const renderedCart = mounted ? cart : [];
  const renderedCurrency = mounted ? currency : 'EGP';
  const cartCount = renderedCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = renderedCart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const canAccessDashboard = !!user?.isActive && DASHBOARD_ROLES.has(user.role);
  const isDark = theme === 'dark';
  const selectedImages = selectedProduct ? normalizeImages(selectedProduct) : [];
  const selectedPrice = selectedProduct ? priceInfo(selectedProduct) : null;
  const selectedInCart = selectedProduct ? renderedCart.find((item) => item.productId === selectedProduct.id) : null;

  const onAddToCart = (product: CatalogProduct) => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr || null,
        image: normalizeImages(product)[0] || null,
        price: product.price,
        compareAtPrice: product.compareAtPrice || null,
        taxRate: product.taxRate || 0,
      },
      1,
    );
    toast.success('تمت الإضافة إلى السلة', { duration: 1200 });
  };

  const onBuyNow = (product: CatalogProduct) => {
    onAddToCart(product);
    if (!user) {
      setPendingCheckout(true);
      setAuthOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  const openProductDetails = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const handleCheckoutClick = () => {
    if (!cart.length) {
      toast.error('السلة فارغة');
      return;
    }
    if (!user) {
      setPendingCheckout(true);
      setAuthOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingCheckout) {
      setCheckoutOpen(true);
      setPendingCheckout(false);
    }
  };

  const topRank = new Map(catalog.topProducts.map((item, index) => [item.productId, index + 1]));

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-[20px] border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={56} title="أولاد أيمن" />
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">أولاد أيمن للأدوات المنزلية</h1>
                <p className="text-sm text-gray-500">اختيارات منزلية عملية بتصميم عصري، جودة موثوقة، وتجربة شراء سهلة لكل احتياجات البيت اليومية.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canAccessDashboard && (
                <Link href="/dashboard" className="btn-brand flex items-center gap-2">
                  <LayoutDashboard size={16} />
                  لوحة التحكم
                </Link>
              )}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-xl border border-gray-200 bg-white p-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-600 transition-colors hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300"
              >
                <ShoppingCart size={16} />
                السلة
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]">
            <div className="relative">
              <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج، باركود، أو SKU"
                className="input pe-10"
                dir="rtl"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input pe-10">
                <option value="">كل التصنيفات</option>
                {catalog.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <ArrowUpDown size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input pe-10">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryId('');
                setSort('latest');
              }}
              className="btn-ghost flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800"
            >
              <X size={16} />
              إعادة الضبط
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {catalogUnavailable ? (
              <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                الكتالوج غير متاح حالياً من الخادم. يمكنك تصفح الواجهة، وسيظهر المحتوى تلقائياً عندما تعود قاعدة البيانات للعمل.
              </div>
            ) : null}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                    <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : visibleProducts.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => {
                  const { current, original } = priceInfo(product);
                  const images = normalizeImages(product);
                  const inCart = renderedCart.find((item) => item.productId === product.id);

                  return (
                    <article
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openProductDetails(product)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openProductDetails(product);
                        }
                      }}
                      className="cursor-pointer overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                        <img
                          src={images[0] || '/placeholder.png'}
                          alt={productTitle(product)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {images.length > 1 ? (
                          <div className="absolute start-3 bottom-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
                            <Images size={13} />
                            {images.length}
                          </div>
                        ) : null}
                        {original ? (
                          <div className="absolute start-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                            خصم
                          </div>
                        ) : null}
                        {typeof product.stock === 'number' ? (
                          <div className={cn('absolute end-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold', product.stock > 0 ? 'bg-white/90 text-gray-900' : 'bg-red-500 text-white')}>
                            {product.stock > 0 ? `متاح ${product.stock}` : 'غير متوفر'}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-gray-900 dark:text-white">{productTitle(product)}</h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                              {product.description || 'وصف مختصر غير متوفر حالياً'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500 dark:bg-gray-800">
                            {product.category?.nameAr || product.category?.name || 'عام'}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-brand-600 dark:text-brand-300">
                            {formatCurrency(current, renderedCurrency)}
                          </span>
                          {original ? (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(original, renderedCurrency)}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAddToCart(product);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <Plus size={15} />
                            إضافة للسلة
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onBuyNow(product);
                            }}
                            className="btn-brand flex items-center gap-2 px-4 py-2.5"
                          >
                            شراء الآن
                          </button>
                        </div>

                        {typeof product.stock === 'number' ? (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>التوفر</span>
                            <span className={cn(product.stock > 0 ? 'text-emerald-600' : 'text-red-500')}>{product.stock > 0 ? 'متوفر' : 'نفد المخزون'}</span>
                          </div>
                        ) : null}

                        {topRank.has(product.id) ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <Crown size={13} />
                            الأكثر مبيعاً #{topRank.get(product.id)}
                          </div>
                        ) : null}

                        {inCart ? (
                          <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                            <span>داخل السلة</span>
                            <span>{inCart.quantity} قطعة</span>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-800 dark:bg-gray-900">
                <ShoppingBag size={34} className="mx-auto text-gray-300" />
                <p className="mt-4 text-base font-bold text-gray-900 dark:text-white">لا توجد أدوات منزلية مطابقة</p>
                <p className="mt-1 text-sm text-gray-500">جرّب اسم منتج، باركود، أو تصنيف مختلف من كتالوج أولاد أيمن</p>
              </div>
            )}
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-4 rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-brand-500" />
                  <h2 className="font-black text-gray-900 dark:text-white">السلة</h2>
                </div>
                {renderedCart.length > 0 ? (
                  <button onClick={clearCart} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-4">
                {renderedCart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
                    <ShoppingCart size={32} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-500">السلة فارغة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {renderedCart.map((item) => (
                      <div key={item.productId} className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                        <div className="flex gap-3">
                          <img src={item.image || '/placeholder.png'} alt={item.nameAr || item.name} className="h-14 w-14 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{item.nameAr || item.name}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(item.price, renderedCurrency)} × {item.quantity}</p>
                          </div>
                          <button type="button" onClick={() => removeItem(item.productId)} className="rounded-lg text-gray-300 hover:text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="rounded-lg bg-gray-100 p-1.5 dark:bg-gray-800">
                            <Minus size={12} />
                          </button>
                          <span className="min-w-7 text-center text-sm font-black">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="rounded-lg bg-gray-100 p-1.5 dark:bg-gray-800">
                            <Plus size={12} />
                          </button>
                          <span className="ms-auto text-sm font-black text-brand-600 dark:text-brand-300">
                            {formatCurrency(item.price * item.quantity, renderedCurrency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>عدد القطع</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الإجمالي</span>
                    <span>{formatCurrency(cartSubtotal, renderedCurrency)}</span>
                  </div>
                </div>
                <button onClick={handleCheckoutClick} className="btn-brand mt-4 flex w-full items-center justify-center gap-2 py-3">
                  إتمام الطلب
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-4 start-4 end-4 z-20 flex items-center justify-between gap-2 rounded-[18px] border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur xl:hidden dark:border-gray-800 dark:bg-gray-900/95">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">السلة</p>
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(cartSubtotal, renderedCurrency)}</p>
        </div>
        <button onClick={handleCheckoutClick} className="btn-brand flex items-center gap-2">
          <ShoppingCart size={16} />
          إتمام الطلب
        </button>
      </div>

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={productTitle(selectedProduct)}
            className="max-h-[92dvh] w-full max-w-5xl overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-600 dark:text-brand-300">تفاصيل المنتج</p>
                <h2 className="truncate text-xl font-black text-gray-900 dark:text-white">{productTitle(selectedProduct)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-[calc(92dvh-73px)] overflow-y-auto lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-3 bg-gray-50 p-4 dark:bg-gray-950/40">
                <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                    <img
                      src={selectedImages[selectedImageIndex] || selectedProduct.image || '/placeholder.png'}
                      alt={productTitle(selectedProduct)}
                      className="h-full w-full object-cover"
                    />
                    {selectedPrice?.original ? (
                      <div className="absolute start-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                        خصم متاح
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {(selectedImages.length ? selectedImages : ['/placeholder.png']).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        'aspect-square overflow-hidden rounded-xl border-2 bg-white transition-colors dark:bg-gray-900',
                        selectedImageIndex === index ? 'border-brand-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700',
                      )}
                    >
                      <img src={image} alt={`${productTitle(selectedProduct)} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {selectedProduct.category?.nameAr || selectedProduct.category?.name || 'عام'}
                    </span>
                    {typeof selectedProduct.stock === 'number' ? (
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold', selectedProduct.stock > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-red-50 text-red-500 dark:bg-red-950')}>
                        {selectedProduct.stock > 0 ? `متاح ${selectedProduct.stock}` : 'غير متوفر'}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{productTitle(selectedProduct)}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    {selectedProduct.description || 'لا يوجد وصف تفصيلي لهذا المنتج حالياً.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/40">
                  <span className="text-3xl font-black text-brand-600 dark:text-brand-300">
                    {formatCurrency(selectedPrice?.current || 0, renderedCurrency)}
                  </span>
                  {selectedPrice?.original ? (
                    <span className="text-base text-gray-400 line-through">
                      {formatCurrency(selectedPrice.original, renderedCurrency)}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">SKU</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selectedProduct.sku || 'غير محدد'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">الباركود</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selectedProduct.barcode || 'غير محدد'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">الضريبة</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selectedProduct.taxRate || 0}%</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">الخصم</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">
                      {selectedProduct.discountPercent ? `${selectedProduct.discountPercent}%` : selectedPrice?.original ? 'سعر مخفض' : 'لا يوجد'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">تاريخ الإضافة</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">
                      {new Date(selectedProduct.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400">داخل السلة</p>
                    <p className="mt-1 font-bold text-gray-900 dark:text-white">{selectedInCart?.quantity || 0} قطعة</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => onAddToCart(selectedProduct)}
                    className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800"
                  >
                    <Plus size={16} />
                    إضافة للسلة
                  </button>
                  <button
                    type="button"
                    onClick={() => onBuyNow(selectedProduct)}
                    className="btn-brand flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    شراء الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} currency={renderedCurrency} />
    </>
  );
}
