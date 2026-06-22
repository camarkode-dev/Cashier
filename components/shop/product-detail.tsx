'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useShopStore } from '@/stores/shop.store';
import { CheckoutModal } from '@/components/shop/checkout-modal';
import { AuthModal } from '@/components/shop/auth-modal';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

type ProductDetailResponse = {
  product: {
    id: string;
    name: string;
    nameAr?: string | null;
    price: number;
    compareAtPrice?: number | null;
    discountPercent?: number | null;
    taxRate?: number | null;
    image?: string | null;
    galleryImages?: Array<string | { url?: string; src?: string }> | null;
    description?: string | null;
    stock?: number;
    category?: { id: string; name: string; nameAr?: string | null } | null;
  };
  related: Array<{
    id: string;
    name: string;
    nameAr?: string | null;
    price: number;
    compareAtPrice?: number | null;
    image?: string | null;
    stock?: number;
  }>;
};

function productLabel(product: { name: string; nameAr?: string | null }) {
  return product.nameAr || product.name;
}

function normalizeImages(images?: Array<string | { url?: string; src?: string }> | null) {
  return (images || [])
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.url || item.src || '';
      return '';
    })
    .filter(Boolean);
}

export function ProductDetail({ productId }: { productId: string }) {
  const { user, initialize } = useAuthStore();
  const { currency } = useSettingsStore();
  const { addItem, cart } = useShopStore();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/shop/products/${productId}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 503) {
            setDatabaseUnavailable(true);
            setData(null);
            return;
          }
          throw new Error(json?.error || 'تعذر تحميل المنتج');
        }
        setDatabaseUnavailable(false);
        setData(json?.data || json);
      } catch (error: any) {
        toast.error(error?.message || 'تعذر تحميل المنتج');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const images = useMemo(() => normalizeImages(data?.product.galleryImages), [data]);
  const product = data?.product;
  const renderedCart = mounted ? cart : [];
  const renderedCurrency = mounted ? currency : 'EGP';
  const currentCart = renderedCart.find((item) => item.productId === productId);

  const addProduct = () => {
    if (!product) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr || null,
        image: images[0] || product.image || null,
        price: product.price,
        compareAtPrice: product.compareAtPrice || null,
        taxRate: product.taxRate || 0,
      },
      1,
    );
    toast.success('تمت الإضافة إلى السلة');
  };

  const buyNow = () => {
    if (!product) return;
    addProduct();
    if (!user) {
      setPendingBuyNow(true);
      setAuthOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingBuyNow) {
      setCheckoutOpen(true);
      setPendingBuyNow(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="h-[420px] animate-pulse rounded-[20px] bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-40 animate-pulse rounded-[20px] bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!product) {
    if (databaseUnavailable) {
      return (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-lg font-black text-amber-700 dark:text-amber-300">المنتج غير متاح حالياً من الخادم</p>
          <p className="mt-2 text-sm text-amber-700/80 dark:text-amber-300/80">يمكنك العودة للمتجر أو إعادة المحاولة لاحقاً.</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-gray-900 dark:text-amber-300">
            <ArrowRight size={16} />
            العودة إلى المتجر
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-[20px] border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-lg font-bold text-gray-900 dark:text-white">المنتج غير موجود</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300">
          <ArrowRight size={16} />
          العودة إلى المتجر
        </Link>
      </div>
    );
  }

  const original = product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const stockLabel = typeof product.stock === 'number' ? (product.stock > 0 ? `متوفر ${product.stock}` : 'غير متوفر') : 'غير محدد';

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <ArrowRight size={16} />
            العودة
          </Link>
          <div className="text-sm text-gray-500">داخل السلة: {currentCart?.quantity || 0}</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                <img
                  src={images[selectedImage] || product.image || '/placeholder.png'}
                  alt={productLabel(product)}
                  className="h-full w-full object-cover"
                />
                {original ? (
                  <div className="absolute start-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                    خصم متاح
                  </div>
                ) : null}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 p-4">
                  {images.map((image, index) => (
                    <button
                      key={image + index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        'overflow-hidden rounded-2xl border-2 transition-colors',
                        selectedImage === index ? 'border-brand-500' : 'border-transparent',
                      )}
                    >
                      <img src={image} alt={`${productLabel(product)} ${index + 1}`} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-brand-600">
                <Sparkles size={14} />
                تفاصيل المنتج
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{productLabel(product)}</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">{product.description || 'وصف المنتج غير متوفر حالياً'}</p>

              <div className="mt-5 flex items-end gap-3">
                <span className="text-3xl font-black text-brand-600 dark:text-brand-300">{formatCurrency(product.price, renderedCurrency)}</span>
                {original ? <span className="text-lg text-gray-400 line-through">{formatCurrency(original, renderedCurrency)}</span> : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-400">التوفر</p>
                  <p className={cn('mt-1 text-sm font-bold', typeof product.stock === 'number' && product.stock > 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {stockLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs text-gray-400">التصنيف</p>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.category?.nameAr || product.category?.name || 'عام'}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={addProduct} className="btn-ghost flex items-center gap-2 border border-gray-200 dark:border-gray-800">
                  <ShoppingCart size={16} />
                  إضافة للسلة
                </button>
                <button onClick={buyNow} className="btn-brand flex items-center gap-2">
                  شراء الآن
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <Clock3 size={16} className="text-brand-500" />
                الشراء المباشر يفتح نافذة تسجيل الدخول إذا لم يكن المستخدم مسجلاً.
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-black text-gray-900 dark:text-white">منتجات مشابهة</h2>
              <div className="grid gap-3">
                {data.related.length ? (
                  data.related.map((item) => {
                    const itemOriginal = item.compareAtPrice && item.compareAtPrice > item.price ? item.compareAtPrice : null;
                    return (
                      <Link
                        href={`/product/${item.id}`}
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                      >
                        <img src={item.image || '/placeholder.png'} alt={productLabel(item)} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{productLabel(item)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.price, renderedCurrency)}</p>
                        </div>
                        {itemOriginal ? <span className="text-xs text-gray-400 line-through">{formatCurrency(itemOriginal, renderedCurrency)}</span> : null}
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">لا توجد منتجات مشابهة حالياً</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} currency={renderedCurrency} />
    </>
  );
}
